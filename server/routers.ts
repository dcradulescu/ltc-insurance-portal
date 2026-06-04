import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createPolicy, updatePolicy, getPolicyByUserId, getPolicyById,
  createStrategy, getStrategyByPolicyId, getStrategyById, updateStrategy, getStrategyByUserId,
  saveChatMessage, getChatHistory,
  createUserContact, getUserContacts, updateUserContact, deleteUserContact,
  saveTaskCompletion, getTaskCompletions, getTaskCompletion,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { policyFormRouter } from "./routers/policyForm";
import { ENV } from "./_core/env";
import { pdfDeliveryRouter } from './routers/pdfDelivery';
import { chatRouter } from './routers/chat';
import { generatePhysicianLetter } from "./physicianLetterGenerator";

export const appRouter = router({
  system: systemRouter,
  policyForm: policyFormRouter,
  pdfDelivery: pdfDeliveryRouter,
  chat: chatRouter,
  
  physicianLetter: router({
    generate: publicProcedure
      .input(z.object({
        patientFullName: z.string(),
        patientDob: z.string(),
        diagnosis: z.string(),
        lastVisitDate: z.string().optional(),
        physicianName: z.string().optional(),
        physicianCredentials: z.string().optional(),
        practiceName: z.string().optional(),
        streetAddress: z.string().optional(),
        cityStateZip: z.string().optional(),
        phone: z.string().optional(),
        fax: z.string().optional(),
        adlLimitations: z.array(z.string()),
        cognitiveImpairmentTrigger: z.boolean(),
        cognitiveRisks: z.array(z.string()).optional(),
        minAdlsRequired: z.number(),
        prognosis: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const letter = generatePhysicianLetter(input);
        return {
          html: letter.html,
          text: letter.text,
          markdown: letter.markdown,
        };
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    getProfile: publicProcedure.query(async () => {
      const db = await (await import('./db')).getDb();
      const defaultPrefs = { notifyOnNewPolicy: true, notifyOnStrategyGenerated: true, notifyOnContactForm: true };
      if (!db) return { id: 1, name: 'Portal Operator', email: '', notificationPreferences: defaultPrefs };
      const { users } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const result = await db.select().from(users).where(eq(users.id, 1)).limit(1);
      const user = result[0];
      const prefs = (user?.notificationPreferences as typeof defaultPrefs | null) ?? defaultPrefs;
      return {
        id: user?.id ?? 1,
        name: user?.name ?? 'Portal Operator',
        email: user?.email ?? '',
        notificationPreferences: { ...defaultPrefs, ...prefs },
      };
    }),
    updateProfile: publicProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        notificationPreferences: z.object({
          notifyOnNewPolicy: z.boolean().optional(),
          notifyOnStrategyGenerated: z.boolean().optional(),
          notifyOnContactForm: z.boolean().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await (await import('./db')).getDb();
        if (!db) return { success: false };
        const { users } = await import('../drizzle/schema');
        const { eq, sql } = await import('drizzle-orm');
        // Upsert: try update first, insert if no row exists
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, 1)).limit(1);
        if (existing.length === 0) {
          // Create the operator profile row with a synthetic openId
          await db.insert(users).values({
            id: 1,
            openId: 'portal-operator',
            name: input.name ?? 'Portal Operator',
            email: input.email ?? null,
            lastSignedIn: new Date(),
            notificationPreferences: input.notificationPreferences ?? null,
          } as any);
        } else {
          const updateData: Record<string, unknown> = {};
          if (input.name !== undefined) updateData.name = input.name;
          if (input.email !== undefined) updateData.email = input.email;
          if (input.notificationPreferences !== undefined) {
            // Merge with existing prefs
            const currentResult = await db.select({ prefs: users.notificationPreferences }).from(users).where(eq(users.id, 1)).limit(1);
            const currentPrefs = (currentResult[0]?.prefs as Record<string, boolean> | null) ?? {};
            updateData.notificationPreferences = { ...currentPrefs, ...input.notificationPreferences };
          }
          if (Object.keys(updateData).length > 0) {
            await db.update(users).set(updateData as any).where(eq(users.id, 1));
          }
        }
        return { success: true };
      }),
  }),

  policy: router({
    get: publicProcedure.query(async ({ ctx }) => {
      // Allow public access - return first policy for public user
      const policy = await getPolicyById(1);
      if (policy) return policy;
      // Return empty policy object if none exists
      return { id: 0 } as any;
    }),

    save: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        // Insured Person
        insuredFullName: z.string().optional(),
        insuredDob: z.string().optional(),
        insuredMailingAddress: z.string().optional(),

        insuredMedicareNumber: z.string().optional(),
        insuredMedicaidNumber: z.string().optional(),
        powerOfAttorneyPresent: z.string().optional(),
        // Carrier Info
        carrierName: z.string().optional(),
        carrierAddress1: z.string().optional(),
        carrierAddress2: z.string().optional(),
        carrierCityStateZip: z.string().optional(),
        carrierPhone: z.string().optional(),
        carrierFax: z.string().optional(),
        // Policy Identifiers
        policyNumber: z.string().optional(),
        claimPreClaimNumber: z.string().optional(),
        // Coverage Details
        eliminationPeriod: z.string().optional(),
        dailyMaximum: z.string().optional(),
        monthlyMaximum: z.string().optional(),
        lifetimeMaximum: z.string().optional(),
        minAdlsRequired: z.string().optional(),
        waiverOfPremium: z.string().optional(),
        cnaRequired: z.string().optional(),
        careNotesRequired: z.string().optional(),
        paymentCycle: z.string().optional(),
        assignmentOfBenefits: z.string().optional(),
        // Medical / Administrative
        caseManagerName: z.string().optional(),
        thirdPartyAssessmentRequired: z.string().optional(),
        thirdPartyAssessmentWho: z.string().optional(),
        cognitiveImpairmentTrigger: z.string().optional(),
        planOfCareStatus: z.string().optional(),
        ltcCoordinatorAssigned: z.string().optional(),
        // Medical Providers
        primaryCarePhysician: z.any().optional(),
        otherProviders: z.any().optional(),
        facilitiesUsed: z.any().optional(),
        dischargeDocumentation: z.string().optional(),
        // Care Needs
        currentCareNeeds: z.string().optional(),
        diagnosisOrCondition: z.string().optional(),
        adlLimitations: z.array(z.string()).optional(),
        preferredCareType: z.string().optional(),
        additionalNotes: z.string().optional(),
        fillerRelationship: z.string().optional(),
        // Additional form fields
        insuredEmail: z.string().optional(),
        insuredPhone: z.string().optional(),
        poa_name: z.string().optional(),
        poa_relationship: z.string().optional(),
        lookBackPeriodEnabled: z.boolean().optional(),
        lookBackPeriodDays: z.string().optional(),
        careCoordinatorReductionEnabled: z.boolean().optional(),
        careCoordinatorReducedToDays: z.string().optional(),
        reductionInCareProvidedEnabled: z.boolean().optional(),
        reductionInCareDaysCountedAs7: z.string().optional(),
        qualifyingAdls: z.array(z.string()).optional(),
        approvedAgencyRequired: z.string().optional(),
        numberOfDaysUntilPayment: z.string().optional(),
        equipmentAllowanceEnabled: z.boolean().optional(),
        equipmentAllowanceAmount: z.string().optional(),
        equipmentAllowanceCoverage: z.string().optional(),
        equipmentAllowanceDeductedFromLifetime: z.string().optional(),
        equipmentAllowanceRelatedAdls: z.array(z.string()).optional(),
        equipmentNeeds: z.array(z.string()).optional(),
        equipmentAllowanceNotes: z.string().optional(),
        inflationAdjustmentEnabled: z.boolean().optional(),
        inflationType: z.string().optional(),
        inflationPercentagePerYear: z.string().optional(),
        inflationContinuesAfterBenefits: z.boolean().optional(),
        caseManagerAssigned: z.string().optional(),
        careNeeds: z.array(z.string()).optional(),
        careNotes: z.string().optional(),
        diagnosisCheckboxes: z.array(z.string()).optional(),
        diagnosisNotes: z.string().optional(),
        primaryDiagnosis: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        // Use a default userId for public access
        const userId = 1; // Default public user
        
        // Strip form-only fields that don't exist in the database
        const {
          poa_name, poa_relationship,
          lookBackPeriodEnabled, lookBackPeriodDays,
          careCoordinatorReductionEnabled, careCoordinatorReducedToDays,
          reductionInCareProvidedEnabled, reductionInCareDaysCountedAs7,
          qualifyingAdls,
          approvedAgencyRequired, numberOfDaysUntilPayment,
          equipmentAllowanceEnabled, equipmentAllowanceAmount, equipmentAllowanceCoverage,
          equipmentAllowanceDeductedFromLifetime, equipmentAllowanceRelatedAdls,
          equipmentNeeds, equipmentAllowanceNotes,
          inflationAdjustmentEnabled, inflationType, inflationPercentagePerYear,
          inflationContinuesAfterBenefits,
          caseManagerAssigned,
          careNeeds, careNotes,
          diagnosisCheckboxes, diagnosisNotes,
          ...dbData
        } = data as any;
        
        // Store form-only fields as JSON in equipmentAllowance for strategy generator
        const metadata = JSON.stringify({
          poa_name, poa_relationship,
          lookBackPeriodEnabled, lookBackPeriodDays,
          careCoordinatorReductionEnabled, careCoordinatorReducedToDays,
          reductionInCareProvidedEnabled, reductionInCareDaysCountedAs7,
          qualifyingAdls,
          approvedAgencyRequired, numberOfDaysUntilPayment,
          equipmentAllowanceEnabled, equipmentAllowanceAmount, equipmentAllowanceCoverage,
          equipmentAllowanceDeductedFromLifetime, equipmentAllowanceRelatedAdls,
          equipmentNeeds, equipmentAllowanceNotes,
          inflationAdjustmentEnabled, inflationType, inflationPercentagePerYear,
          inflationContinuesAfterBenefits,
          caseManagerAssigned,
          careNeeds, careNotes,
          diagnosisCheckboxes, diagnosisNotes,
        });
        
        const saveData = { ...dbData, equipmentAllowance: metadata };
        
        if (id) {
          await updatePolicy(id, userId, saveData);
          return { id };
        } else {
          const newId = await createPolicy({ ...saveData, userId });
          return { id: newId };
        }
      }),
  }),

  strategy: router({
    getByPolicy: publicProcedure
      .input(z.object({ policyId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Allow public access
        return getStrategyByPolicyId(input.policyId, 1);
      }),

    getMine: publicProcedure.query(async ({ ctx }) => {
      // Allow public access
      return getStrategyByUserId(1);
    }),

    getTaskCompletions: publicProcedure
      .input(z.object({ strategyId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Allow public access
        return getTaskCompletions(1, input.strategyId);
      }),

    saveTaskCompletion: publicProcedure
      .input(z.object({
        strategyId: z.number(),
        taskId: z.string(),
        taskTitle: z.string(),
        stage: z.number(),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Allow public access
        await saveTaskCompletion(
          1,
          input.strategyId,
          input.taskId,
          input.taskTitle,
          input.stage,
          input.completed
        );
        return { success: true };
      }),

    updateTasks: publicProcedure
      .input(z.object({
        strategyId: z.number(),
        stage: z.enum(["stage1Tasks", "stage2Tasks", "stage3Tasks"]),
        tasks: z.any(),
        currentStage: z.number().optional(),
        claimStatus: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategy = await getStrategyById(input.strategyId);
        if (!strategy) throw new Error("Strategy not found");
        const updateData: Record<string, any> = { [input.stage]: input.tasks };
        if (input.currentStage) updateData.currentStage = input.currentStage;
        if (input.claimStatus) updateData.claimStatus = input.claimStatus;
        await updateStrategy(input.strategyId, updateData);
        return { success: true };
      }),

    generate: publicProcedure
      .input(z.object({ policyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const policy = await getPolicyById(input.policyId);
        if (!policy) throw new Error("Policy not found");

        const adlList = Array.isArray(policy.adlLimitations) ? (policy.adlLimitations as string[]).join(", ") : "Not specified";

        // Build the 3-stage task lists based on policy data
        const stage1Tasks = buildStage1Tasks(policy);
        const stage2Tasks = buildStage2Tasks(policy);
        const stage3Tasks = buildStage3Tasks(policy);

        const systemPrompt = `You are an expert long-term care insurance claims advisor. Generate a comprehensive, personalized strategy document in clean HTML.

The strategy MUST include:
1. **Executive Summary** - Overview of the claim situation
2. **Policy Analysis** - Analysis of their specific policy benefits, coverage limits, and key terms
3. **Eligibility Assessment** - Based on ADL limitations and care needs
4. **Stage 1: Prior to Claim** - Preparation steps before initiating the claim
5. **Stage 2: Filing the Claim** - Step-by-step claim filing guide with documentation requirements
6. **Stage 3: Post-Approval Management** - Ongoing claim maintenance and reimbursement
7. **Third-Party Evaluation Preparation** - How to prepare for independent nurse evaluation
8. **Denial Prevention Strategy** - Common pitfalls and how to avoid them
9. **Appeal Strategy** - What to do if denied
10. **Important Contacts & Resources**

${policy.assignmentOfBenefits === "yes" ? "IMPORTANT: This policy uses Assignment of Benefits - the provider will submit claims and be paid directly." : "IMPORTANT: This policy does NOT use Assignment of Benefits - the insured will pay the provider and submit for reimbursement."}

${policy.thirdPartyAssessmentRequired === "yes" ? "IMPORTANT: A third-party assessment IS required. Include detailed preparation guidance for the independent nurse evaluation." : ""}

Format in clean HTML with h2, h3, paragraphs, and lists. Be specific to their situation.`;

        const userPrompt = `Generate a personalized LTC insurance claim strategy:

**Insured:** ${policy.insuredFullName || "Not provided"}
**DOB:** ${policy.insuredDob || "Not provided"}
**Carrier:** ${policy.carrierName || "Not provided"}
**Policy #:** ${policy.policyNumber || "Not provided"}
**Claim/Pre-Claim #:** ${policy.claimPreClaimNumber || "Not provided"}

**Elimination Period:** ${policy.eliminationPeriod || "Not provided"}
**Daily Maximum:** ${policy.dailyMaximum || "Not provided"}
**Monthly Maximum:** ${policy.monthlyMaximum || "Not provided"}
**Lifetime Maximum:** ${policy.lifetimeMaximum || "Not provided"}
**Min ADLs Required:** ${policy.minAdlsRequired || "Not provided"}
**Waiver of Premium:** ${policy.waiverOfPremium || "Not provided"}
**CNA Required:** ${policy.cnaRequired || "Not provided"}
**Care Notes Required:** ${policy.careNotesRequired || "Not provided"}
**Payment Cycle:** ${policy.paymentCycle || "Not provided"}
**Assignment of Benefits:** ${policy.assignmentOfBenefits || "Not provided"}

**Case Manager:** ${policy.caseManagerName || "Not assigned"}
**Third Party Assessment:** ${policy.thirdPartyAssessmentRequired || "Not provided"}
**Cognitive Impairment Trigger:** ${policy.cognitiveImpairmentTrigger || "Not provided"}
**Plan of Care Status:** ${policy.planOfCareStatus || "Not provided"}

**Current Care Needs:** ${policy.currentCareNeeds || "Not provided"}
**Diagnosis/Condition:** ${policy.diagnosisOrCondition || "Not provided"}
**ADL Limitations:** ${adlList}
**Preferred Care Type:** ${policy.preferredCareType || "Not provided"}
**Power of Attorney:** ${policy.powerOfAttorneyPresent || "Not provided"}
**Additional Notes:** ${policy.additionalNotes || "Not provided"}`;

        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const content = typeof result.choices[0].message.content === "string"
          ? result.choices[0].message.content
          : JSON.stringify(result.choices[0].message.content);

        const userId = policy.userId; // Use the policy's userId
        const existing = await getStrategyByPolicyId(input.policyId, userId);
        let strategyId: number;

        if (existing) {
          await updateStrategy(existing.id, {
            strategyContent: content,
            strategyHtml: content,
            stage1Tasks,
            stage2Tasks,
            stage3Tasks,
            currentStage: 1,
            claimStatus: "not_started",
            generatedAt: new Date(),
          });
          strategyId = existing.id;
        } else {
          strategyId = await createStrategy({
            userId,
            policyId: input.policyId,
            strategyContent: content,
            strategyHtml: content,
            stage1Tasks,
            stage2Tasks,
            stage3Tasks,
            currentStage: 1,
            claimStatus: "not_started",
          });
        }

        await notifyOwner({
          title: "New LTC Strategy Generated",
          content: `Strategy generated for policy #${policy.policyNumber || input.policyId}.`,
        }).catch(() => {});

        return { id: strategyId, content, stage1Tasks, stage2Tasks, stage3Tasks };
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const strategy = await getStrategyById(input.id);
        if (!strategy) throw new Error("Strategy not found");
        return strategy;
      }),

    generatePhysicianLetter: publicProcedure
      .input(z.object({ policyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const policy = await getPolicyById(input.policyId);
        if (!policy) throw new Error("Policy not found");

        const adlLimitations = Array.isArray(policy.adlLimitations) ? policy.adlLimitations as string[] : [];
        const isCognitiveImpaired = String(policy.cognitiveImpairmentTrigger || "").toLowerCase() === "yes" || (policy.cognitiveImpairmentTrigger as any) === true;
        const cognitiveRisks = isCognitiveImpaired ? ["Severe memory loss", "Difficulty with decision-making", "Need for supervision"] : [];

        const letter = generatePhysicianLetter({
          patientFullName: policy.insuredFullName || "",
          patientDob: policy.insuredDob || "",
          diagnosis: policy.diagnosisOrCondition || policy.primaryDiagnosis || "",
          physicianName: typeof policy.primaryCarePhysician === "string" ? policy.primaryCarePhysician : "",
          adlLimitations,
          cognitiveImpairmentTrigger: isCognitiveImpaired,
          cognitiveRisks,
          minAdlsRequired: typeof policy.minAdlsRequired === "number" ? policy.minAdlsRequired : parseInt(String(policy.minAdlsRequired)) || 2,
          prognosis: policy.additionalNotes || undefined,
        });

        return {
          html: letter.html,
          text: letter.text,
          markdown: letter.markdown,
        };
      }),
  }),



  contacts: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return getUserContacts(1); // Default public user
    }),

    add: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        relationship: z.string().optional(),
        receiveCcEmails: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createUserContact({ ...input, userId: 1 }); // Default public user
        return { id };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        relationship: z.string().optional(),
        receiveCcEmails: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateUserContact(id, 1, data); // Default public user
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteUserContact(input.id, 1); // Default public user
        return { success: true };
      }),
  }),

  sms: router({
    sendNotification: publicProcedure
      .input(z.object({
        phoneNumber: z.string(),
        taskName: z.string(),
        taskDueDate: z.string(),
        reminderType: z.enum(["task_reminder", "milestone_alert", "deadline_warning"]),
        priority: z.enum(["low", "medium", "high"]),
        customMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Import SMS notification service
        const { sendSMSNotification } = await import("./smsNotification");
        const result = await sendSMSNotification(input);
        return result;
      }),

    sendBulk: publicProcedure
      .input(z.object({
        recipients: z.array(z.object({
          phoneNumber: z.string(),
          name: z.string(),
        })),
        taskName: z.string(),
        taskDueDate: z.string(),
        reminderType: z.enum(["task_reminder", "milestone_alert", "deadline_warning"]),
        priority: z.enum(["low", "medium", "high"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sendBulkSMSNotifications } = await import("./smsNotification");
        const results = await sendBulkSMSNotifications(input.recipients, {
          taskName: input.taskName,
          taskDueDate: input.taskDueDate,
          reminderType: input.reminderType,
          priority: input.priority,
        });
        return { success: true, results };
      }),

    savePreferences: publicProcedure
      .input(z.object({
        phoneNumber: z.string(),
        taskReminders: z.boolean(),
        milestoneAlerts: z.boolean(),
        deadlineWarnings: z.boolean(),
        reminderDaysBefore: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        // In production, save to database
        console.log("SMS preferences saved:", input);
        return { success: true, message: "SMS preferences saved successfully" };
      }),
  }),

  email: router({
    sendStrategy: publicProcedure
      .input(z.object({
        strategyId: z.number(),
        recipients: z.array(z.string().email()),
        policyData: z.object({
          // Insured
          insuredName: z.string(),
          insuredDob: z.string().optional(),
          insuredPhone: z.string().optional(),
          insuredEmail: z.string().optional(),
          insuredAddress: z.string().optional(),
          // Policy
          policyNumber: z.string(),
          claimNumber: z.string().optional(),
          carrierName: z.string(),
          carrierPhone: z.string().optional(),
          // Coverage
          eliminationPeriod: z.string().optional(),
          dailyMaximum: z.number(),
          monthlyMaximum: z.number(),
          lifetimeMaximum: z.number(),
          minAdlsRequired: z.number().optional(),
          waiverOfPremium: z.string().optional(),
          assignmentOfBenefits: z.string().optional(),
          // Qualifying
          adlLimitations: z.array(z.string()).default([]),
          diagnosisCheckboxes: z.array(z.string()).optional(),
          cognitiveImpairmentTrigger: z.string().optional(),
          // Tasks
          stage1Tasks: z.array(z.string()).default([]),
          stage2Tasks: z.array(z.string()).default([]),
          stage3Tasks: z.array(z.string()).default([]),
          // Extra
          careRecommendations: z.string().default(""),
          strategyContent: z.string().default(""),
          diagnosis: z.string().optional(),
          caseManagerName: z.string().optional(),
          thirdPartyAssessmentRequired: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategy = await getStrategyById(input.strategyId);
        if (!strategy) throw new Error("Strategy not found");

        // Generate PDF if policy data is provided
        let pdfUrl = "";
        if (input.policyData) {
          try {
            const { generateStrategyPdf } = await import("./strategyPdfGenerator");
            const pdfResult = await generateStrategyPdf(input.policyData);
            pdfUrl = pdfResult.url;
            console.log(`[Email] PDF generated: ${pdfUrl}`);
          } catch (pdfError) {
            console.error("[Email] PDF generation failed:", pdfError);
          }
        }

        // Send to Zapier webhook
        const zapierUrl = ENV.zapierWebhookUrl;
        if (zapierUrl) {
          try {
            const response = await fetch(zapierUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "strategy_email",
                strategyId: input.strategyId,
                recipients: input.recipients,
                pdfUrl,
                insuredName: input.policyData?.insuredName || "",
                policyNumber: input.policyData?.policyNumber || "",
                strategyContent: strategy.strategyContent,
                timestamp: new Date().toISOString(),
              }),
            });
            if (!response.ok) {
              console.error(`[Email] Zapier webhook error: ${response.status}`);
            } else {
              console.log("[Email] Strategy sent to Zapier successfully");
            }
          } catch (error) {
            console.error("[Email] Zapier submission error:", error);
          }
        }

        // Notify owner
        await notifyOwner({
          title: `Strategy Emailed: ${input.policyData?.insuredName || "Unknown"}`,
          content: `Strategy PDF sent to: ${input.recipients.join(", ")}${pdfUrl ? `\nPDF: ${pdfUrl}` : ""}`,
        }).catch(() => {});

        return { success: true, message: `Strategy has been sent to ${input.recipients.length} recipient(s).${pdfUrl ? " PDF is attached." : ""}` };
      }),

    sendPageContent: publicProcedure
      .input(z.object({
        pageName: z.string(),
        content: z.string(),
        recipients: z.array(z.string().email()),
      }))
      .mutation(async ({ ctx, input }) => {
        const recipientList = input.recipients.join(", ");
        await notifyOwner({
          title: `Page Content Email: ${input.pageName}`,
          content: `User requested ${input.pageName} content to be emailed to: ${recipientList}`,
        }).catch(() => {});
        return { success: true, message: `Content has been queued for delivery.` };
      }),

    sendContactForm: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        await notifyOwner({
          title: `Contact Form: ${input.subject}`,
          content: `From: ${input.name} (${input.email}${input.phone ? ", " + input.phone : ""})\n\n${input.message}`,
        }).catch(() => {});
        return { success: true };
      }),

    // Send a "Save & Return" magic link to the user's email
    sendSaveLink: publicProcedure
      .input(z.object({
        email: z.string().email(),
        insuredName: z.string().optional(),
        stepTitle: z.string().optional(),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const returnUrl = `${input.origin || "https://ltcinsurance.scvisitingangels.com"}/policy-form`;
        const zapierUrl = ENV.zapierWebhookUrl;
        if (zapierUrl) {
          try {
            await fetch(zapierUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "save_link",
                to: input.email,
                insuredName: input.insuredName || "there",
                stepTitle: input.stepTitle || "your current step",
                returnUrl,
                subject: "Your LTC Insurance Navigator — Saved Progress",
                body: `Hi ${input.insuredName || "there"},\n\nYour LTC Insurance Navigator progress has been saved. Click the link below to pick up right where you left off:\n\n${returnUrl}\n\nYour form data is stored in your browser — simply return to this link on the same device and browser to continue.\n\nIf you have any questions, please call us at (864) 244-6300 or reply to this email.\n\nWarm regards,\nSC Visiting Angels\n(864) 244-6300 | scvisitingangels.com`,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (err) {
            console.error("[SaveLink] Zapier error:", err);
          }
        }
        // Notify owner
        await notifyOwner({
          title: `Save Link Requested: ${input.insuredName || input.email}`,
          content: `User ${input.email} requested a save link at step: ${input.stepTitle || "unknown"}`,
        }).catch(() => {});
        return { success: true };
      }),

    // Notify owner when user advances a step (with full JSON payload)
    notifyStepProgress: publicProcedure
      .input(z.object({
        stepNumber: z.number(),
        stepTitle: z.string(),
        formData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        const zapierUrl = ENV.zapierWebhookUrl;
        if (zapierUrl) {
          try {
            await fetch(zapierUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "step_progress",
                stepNumber: input.stepNumber,
                stepTitle: input.stepTitle,
                insuredName: input.formData.insuredFullName || "Unknown",
                insuredEmail: input.formData.insuredEmail || "",
                insuredPhone: input.formData.insuredPhone || "",
                notifyEmail: "daniel@scvisitingangels.com",
                formData: input.formData,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch (err) {
            console.error("[StepProgress] Zapier error:", err);
          }
        }
        // Email owner notification
        const insuredName = (input.formData.insuredFullName as string) || "Unknown";
        await notifyOwner({
          title: `Form Progress: ${insuredName} completed Step ${input.stepNumber} — ${input.stepTitle}`,
          content: `Insured: ${insuredName}\nEmail: ${input.formData.insuredEmail || "N/A"}\nPhone: ${input.formData.insuredPhone || "N/A"}\nStep: ${input.stepNumber} — ${input.stepTitle}\n\nFull JSON:\n${JSON.stringify(input.formData, null, 2)}`,
        }).catch(() => {});
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ---- Strategy Task Builders ----

type StrategyTask = { id: string; label: string; completed: boolean; category: string; critical?: boolean; uploadRequired?: boolean };

function buildStage1Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s1-1", label: "Contact insurance company and request claims packet by mail", completed: false, category: "carrier-contact" },
    { id: "s1-2", label: "DO NOT initiate the claim yet — only request information", completed: false, category: "carrier-contact", critical: true },
    { id: "s1-3", label: "Request Assignment of Benefits (AOB) form from carrier", completed: false, category: "carrier-contact" },
    { id: "s1-4", label: "Evaluate long-term care need and identify physical/cognitive decline", completed: false, category: "medical-evaluation" },
    { id: "s1-5", label: "Identify ADL deficits (minimum " + (policy.minAdlsRequired || "2") + " ADLs required)", completed: false, category: "medical-evaluation" },
    { id: "s1-6", label: "Identify all healthcare providers (PCP, specialists, facilities)", completed: false, category: "provider-setup" },
    { id: "s1-7", label: "Notify all providers IN WRITING of intent to file LTC claim", completed: false, category: "provider-setup" },
    { id: "s1-8", label: "Request documented decline records from providers", completed: false, category: "provider-setup" },
    { id: "s1-9", label: "Schedule visit with PCP to document current condition", completed: false, category: "provider-setup" },
    { id: "s1-10", label: "Request chart documentation from all providers", completed: false, category: "provider-setup" },
    { id: "s1-11", label: "Secure home care provider with LTC insurance experience", completed: false, category: "provider-setup" },
    { id: "s1-12", label: "Confirm provider is familiar with LTC insurance requirements", completed: false, category: "provider-setup" },
    { id: "s1-13", label: "Collect provider license", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-14", label: "Obtain Plan of Care from provider", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-15", label: "Collect provider W-9", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-16", label: "Ensure invoicing and daily care log system is in place", completed: false, category: "documents" },
    { id: "s1-17", label: "Begin services to trigger elimination period (" + (policy.eliminationPeriod || "check policy") + ")", completed: false, category: "elimination-period" },
    { id: "s1-18", label: "Gather insured's personal identifiers (SSN, Medicare/Medicaid #)", completed: false, category: "personal-info" },
    { id: "s1-19", label: "Obtain Power of Attorney documentation (if applicable)", completed: false, category: "personal-info", uploadRequired: true },
    { id: "s1-20", label: "Collect insurance declaration page", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-21", label: "Gather discharge paperwork (if applicable)", completed: false, category: "documents", uploadRequired: true },
  ];
  return tasks;
}

function buildStage2Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s2-1", label: "Complete the claim packet thoroughly", completed: false, category: "claim-packet" },
    { id: "s2-2", label: "Create document index listing all attachments", completed: false, category: "claim-packet" },
    { id: "s2-3", label: "Attach Power of Attorney (POA)", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-4", label: "Attach privacy authorization form", completed: false, category: "claim-packet", uploadRequired: true },
  ];

  if (policy.assignmentOfBenefits === "yes") {
    tasks.push({ id: "s2-5", label: "Attach signed Assignment of Benefits (AOB) form", completed: false, category: "claim-packet", uploadRequired: true });
  }

  tasks.push(
    { id: "s2-6", label: "Attach provider license", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-7", label: "Attach insurance declaration page", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-8", label: "Attach Plan of Care", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-9", label: "Attach all Stage 1 supporting documentation", completed: false, category: "claim-packet" },
    { id: "s2-10", label: "VERIFY: Policy number appears on EVERY page", completed: false, category: "verification", critical: true },
    { id: "s2-11", label: "SUBMIT: Send ALL documents in ONE complete packet", completed: false, category: "submission", critical: true },
  );

  if (policy.thirdPartyAssessmentRequired === "yes") {
    tasks.push(
      { id: "s2-12", label: "Prepare for third-party nurse evaluation", completed: false, category: "evaluation" },
      { id: "s2-13", label: "Review ADL demonstration expectations", completed: false, category: "evaluation" },
      { id: "s2-14", label: "Review mobility demonstration expectations", completed: false, category: "evaluation" },
      { id: "s2-15", label: "Prepare for cognitive questioning (if applicable)", completed: false, category: "evaluation" },
      { id: "s2-16", label: "Understand: inconsistencies may lead to denial", completed: false, category: "evaluation", critical: true },
    );
  }

  tasks.push(
    { id: "s2-17", label: "Note: Expect 30-day review period after submission", completed: false, category: "post-submission" },
    { id: "s2-18", label: "Understand: Appeals have low success probability — get it right the first time", completed: false, category: "post-submission", critical: true },
  );

  return tasks;
}

function buildStage3Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s3-1", label: "Continue paying for services during elimination period", completed: false, category: "ongoing" },
    { id: "s3-2", label: "Organize and retain all paid invoices", completed: false, category: "ongoing" },
    { id: "s3-3", label: "Confirm care notes document minimum ADL assistance (" + (policy.minAdlsRequired || "2") + "+ ADLs)", completed: false, category: "ongoing" },
    { id: "s3-4", label: "Submit invoices and care logs per payment cycle (" + (policy.paymentCycle || "check policy") + ")", completed: false, category: "submission" },
    { id: "s3-5", label: "Ensure policy number appears on every submitted page", completed: false, category: "submission", critical: true },
  ];

  if (policy.assignmentOfBenefits === "yes") {
    tasks.push(
      { id: "s3-6", label: "Provider submits claims directly to insurance company", completed: false, category: "aob-flow" },
      { id: "s3-7", label: "Verify provider is receiving direct payments", completed: false, category: "aob-flow" },
    );
  } else {
    tasks.push(
      { id: "s3-6", label: "Pay provider directly for services", completed: false, category: "reimbursement-flow" },
      { id: "s3-7", label: "Submit paid invoices and documentation to insurance company", completed: false, category: "reimbursement-flow" },
      { id: "s3-8", label: "Track reimbursement payments from insurance company", completed: false, category: "reimbursement-flow" },
    );
  }

  tasks.push(
    { id: "s3-9", label: "Maintain ongoing communication with case manager", completed: false, category: "ongoing" },
    { id: "s3-10", label: "Keep all records organized for potential audits", completed: false, category: "ongoing" },
  );

  return tasks;
}
