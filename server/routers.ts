import { TRPCError } from "@trpc/server";
import { submitEmail, submitWebhook } from "./_core/delivery";
import { smsPreferencesSchema } from "../shared/notificationPreferences";
import { updatePreferences } from "./preferences";
import { authRouter } from "./routers/auth";
import { documentsRouter } from "./routers/documents";
import { requireOwnedPolicy, requireOwnedStrategy, requireOwnedContact } from "./_core/ownership";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createPolicy, updatePolicy, getPolicyByUserId, getPolicyById,
  createStrategy, getStrategyByPolicyId, getStrategyById, updateStrategy, getStrategyByUserId,
  saveChatMessage, getChatHistory,
  createUserContact, getUserContacts, updateUserContact, deleteUserContact,
  saveTaskCompletion, getTaskCompletions, getTaskCompletion,
  createSaveLink, getSaveLinkByToken, markSaveLinkUsed,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut, getSignedStorageUrl } from "./storage";
import { nanoid } from "nanoid";
import { policyFormRouter } from "./routers/policyForm";
import { ENV } from "./_core/env";
import { pdfDeliveryRouter, canonicalCareInputsSchema } from './routers/pdfDelivery';
import { getSavedCareScenario, saveOwnedCareScenario } from "./careScenarioPersistence";
import { chatRouter } from './routers/chat';
import { generatePhysicianLetter } from "./physicianLetterGenerator";
import {
  recordClaimMilestone, listClaimMilestones, hasDocumentedCarrierApproval,
} from "./claimMilestones";

export const appRouter = router({
  system: systemRouter,
  policyForm: policyFormRouter,
  pdfDelivery: pdfDeliveryRouter,
  chat: chatRouter,
  
  physicianLetter: router({
    generate: protectedProcedure
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

  auth: authRouter,
  documents: documentsRouter,

  policy: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const policy = await getPolicyByUserId(ctx.user.id);
      if (policy) return policy;
      // Return empty policy object if none exists
      return { id: 0 } as any;
    }),

    save: protectedProcedure
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
        // Use the authenticated account
        const userId = ctx.user.id;
        
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
          await requireOwnedPolicy(id, userId);
          await updatePolicy(id, userId, saveData);
          return { id };
        } else {
          const newId = await createPolicy({ ...saveData, userId });
          return { id: newId };
        }
      }),
  }),

  strategy: router({
    getByPolicy: protectedProcedure
      .input(z.object({ policyId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Account-scoped access
        await requireOwnedPolicy(input.policyId, ctx.user.id);
        return getStrategyByPolicyId(input.policyId, ctx.user.id);
      }),

    getMine: protectedProcedure.query(async ({ ctx }) => {
      // Account-scoped access
      const strategy = await getStrategyByUserId(ctx.user.id);
      if (strategy) await requireOwnedPolicy(strategy.policyId, ctx.user.id);
      return strategy;
    }),

    getTaskCompletions: protectedProcedure
      .input(z.object({ strategyId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Account-scoped access
        await requireOwnedStrategy(input.strategyId, ctx.user.id);
        return getTaskCompletions(ctx.user.id, input.strategyId);
      }),

    getCareScenario: protectedProcedure
      .input(z.object({ strategyId: z.number().int().positive() }))
      .query(async ({ctx,input}) => {
        await requireOwnedStrategy(input.strategyId,ctx.user.id);
        return getSavedCareScenario(ctx.user.id,input.strategyId);
      }),

    saveCareScenario: protectedProcedure
      .input(z.object({
        strategyId:z.number().int().positive(),
        inputs:canonicalCareInputsSchema,
      }))
      .mutation(async ({ctx,input}) => {
        await requireOwnedStrategy(input.strategyId,ctx.user.id);
        return saveOwnedCareScenario(ctx.user.id,input.strategyId,input.inputs);
      }),

    updateScheduleStartDate: protectedProcedure
      .input(z.object({
        strategyId: z.number().int().positive(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOwnedStrategy(input.strategyId, ctx.user.id);
        const [year, month, day] = input.startDate.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (
          year < 1900 || year > 2100 ||
          date.getUTCFullYear() !== year ||
          date.getUTCMonth() !== month - 1 ||
          date.getUTCDate() !== day
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid calendar date." });
        }
        await updateStrategy(input.strategyId, ctx.user.id, { scheduleStartDate: input.startDate });
        return { success: true, startDate: input.startDate };
      }),

    listClaimMilestones: protectedProcedure
      .input(z.object({ strategyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireOwnedStrategy(input.strategyId, ctx.user.id);
        return listClaimMilestones(ctx.user.id, input.strategyId);
      }),

    recordActualMilestone: protectedProcedure
      .input(z.object({
        strategyId: z.number().int().positive(),
        kind: z.enum(["claim_notice", "claim_submitted", "care_started", "elimination_evidence_sent", "first_payment_received"]),
        effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        carrierReference: z.string().trim().max(128).optional(),
        evidenceDocumentId: z.number().int().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOwnedStrategy(input.strategyId, ctx.user.id);
        return recordClaimMilestone(ctx.user.id, input);
      }),

    recordCarrierApproval: protectedProcedure
      .input(z.object({
        strategyId: z.number().int().positive(),
        effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        carrierReference: z.string().trim().min(1).max(128),
        evidenceDocumentId: z.number().int().positive(),
        attestationConfirmed: z.literal(true),
      }))
      .mutation(async ({ ctx, input }) => {
        await requireOwnedStrategy(input.strategyId, ctx.user.id);
        return recordClaimMilestone(ctx.user.id, {
          kind: "carrier_approval", strategyId: input.strategyId,
          effectiveDate: input.effectiveDate,
          carrierReference: input.carrierReference,
          evidenceDocumentId: input.evidenceDocumentId,
        });
      }),

    saveTaskCompletion: protectedProcedure
      .input(z.object({
        strategyId: z.number(),
        taskId: z.string(),
        taskTitle: z.string(),
        stage: z.number().int().min(1).max(3),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Both ownership and the canonical task definition are server-verified.
        const strategy = await requireOwnedStrategy(input.strategyId, ctx.user.id);
        const stageKey = ("stage" + input.stage + "Tasks") as "stage1Tasks" | "stage2Tasks" | "stage3Tasks";
        const currentTasks = strategy[stageKey];
        const canonical = (Array.isArray(currentTasks) ? currentTasks : [])
          .find((task: any) => task && task.id === input.taskId);
        if (!canonical || typeof canonical.label !== "string") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Task does not belong to this current strategy." });
        }
        if (input.stage === 3 && (strategy.currentStage !== 3 || strategy.claimStatus !== "approved" ||
          !await hasDocumentedCarrierApproval(ctx.user.id, input.strategyId))) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stage 3 requires recorded carrier approval before tasks can be completed." });
        }
        await saveTaskCompletion(
          ctx.user.id,
          input.strategyId,
          canonical.id,
          canonical.label,
          input.stage,
          input.completed
        );
        return { success: true };
      }),

    updateTasks: protectedProcedure
      .input(z.object({
        strategyId: z.number(),
        stage: z.enum(["stage1Tasks", "stage2Tasks", "stage3Tasks"]),
        tasks: z.any(),
        currentStage: z.number().int().min(1).max(3).optional(),
        carrierApprovalConfirmed: z.boolean().optional(),
        claimStatus: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategy = await requireOwnedStrategy(input.strategyId, ctx.user.id);
        if (strategy.currentStage === 3 && (
          (input.currentStage !== undefined && input.currentStage < 3) ||
          (input.claimStatus !== undefined && input.claimStatus !== "approved")
        )) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Recorded approval cannot be reversed through checklist updates." });
        }
        // The only path to Stage 3 is recording an actual uploaded carrier
        // approval letter plus reference; a boolean can no longer bypass it.
        if (input.currentStage === 3 || input.claimStatus === "approved") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Record carrier approval evidence using the approval form before entering Stage 3." });
        }
        const updateData: Record<string, any> = { [input.stage]: input.tasks };
        if (input.currentStage) updateData.currentStage = input.currentStage;
        if (input.claimStatus) updateData.claimStatus = input.claimStatus;
        await updateStrategy(input.strategyId, ctx.user.id, updateData);
        return { success: true };
      }),

    generate: protectedProcedure
      .input(z.object({ policyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const policy = await requireOwnedPolicy(input.policyId, ctx.user.id);

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

${policy.assignmentOfBenefits === "yes" ? "IMPORTANT: Intake indicates the policy may permit Assignment of Benefits. Confirm carrier acceptance, provider eligibility and signed instructions before assuming direct payment." : "IMPORTANT: Intake indicates Assignment of Benefits is not available. Confirm the carrier's actual reimbursement and payment procedures."}

${policy.thirdPartyAssessmentRequired === "yes" ? "IMPORTANT: Intake indicates a third-party assessment may be required. Confirm with the carrier and include detailed preparation guidance." : ""}

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
          await updateStrategy(existing.id, ctx.user.id, {
            strategyContent: content,
            strategyHtml: content,
            stage1Tasks,
            stage2Tasks,
            stage3Tasks,
            currentStage: existing.currentStage,
            claimStatus: existing.claimStatus,
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

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const strategy = await requireOwnedStrategy(input.id, ctx.user.id);
        return strategy;
      }),

    generatePhysicianLetter: protectedProcedure
      .input(z.object({ policyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const policy = await requireOwnedPolicy(input.policyId, ctx.user.id);

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
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserContacts(ctx.user.id); // Account owner
    }),

    add: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        relationship: z.string().optional(),
        receiveCcEmails: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createUserContact({ ...input, userId: ctx.user.id }); // Account owner
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        relationship: z.string().optional(),
        receiveCcEmails: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await requireOwnedContact(id, ctx.user.id);
        await updateUserContact(id, ctx.user.id, data); // Account owner
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await requireOwnedContact(input.id, ctx.user.id);
        await deleteUserContact(input.id, ctx.user.id); // Account owner
        return { success: true };
      }),
  }),

  sms: router({
    sendNotification: adminProcedure
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

    sendBulk: adminProcedure
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
        return { success: results.every(result => result.success), accepted: results.filter(result => result.success).length, failed: results.filter(result => !result.success).length, results };
      }),

    getPreferences: protectedProcedure.query(({ ctx }) => {
      const stored = (ctx.user.notificationPreferences as Record<string, unknown> | null)?.sms;
      const parsed = smsPreferencesSchema.safeParse(stored);
      return parsed.success ? parsed.data : null;
    }),
    savePreferences: protectedProcedure.input(smsPreferencesSchema)
      .mutation(async ({ ctx, input }) => {
        await updatePreferences(ctx.user.id, { sms: input });
        return { success: true, message: "Preferences saved. Automatic SMS scheduling is not enabled." };
      }),
  }),

  email: router({
    sendStrategy: protectedProcedure
      .input(z.object({
        strategyId: z.number(),
        recipients: z.array(z.string().email()).min(1).max(20),
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
          stage1TaskIds: z.array(z.string()).optional(),
          stage2TaskIds: z.array(z.string()).optional(),
          stage3TaskIds: z.array(z.string()).optional(),
          planStartDate: z.string().optional(),
          taskCompletionDates: z.array(z.object({
            taskId: z.string(), completed: z.boolean(), completedAt: z.string().nullable().optional(),
          })).optional(),
          careInputs: canonicalCareInputsSchema.optional(),
          issueDate: z.string().max(32).optional(),
          policyStatus: z.string().max(100).optional(),
          benefitPeriod: z.string().max(100).optional(),
          inflationRate: z.number().min(0).max(20).optional(),
          claimsAddress1: z.string().max(255).optional(),
          claimsAddress2: z.string().max(255).optional(),
          claimsCityStateZip: z.string().max(255).optional(),
          claimsFax: z.string().max(40).optional(),
          // Extra
          careRecommendations: z.string().default(""),
          strategyContent: z.string().default(""),
          diagnosis: z.string().optional(),
          caseManagerName: z.string().optional(),
          thirdPartyAssessmentRequired: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategy = await requireOwnedStrategy(input.strategyId, ctx.user.id);

        let pdfUrl = "";
        if (input.policyData) {
          const { generateStrategyPdf } = await import("./strategyPdfGenerator");
          const pdfResult = await generateStrategyPdf(input.policyData, ctx.user.id);
          pdfUrl = await getSignedStorageUrl(pdfResult.key, 3600);
        }
        const delivery = await submitEmail({
          recipients: input.recipients,
          subject: `Your LTC Insurance Strategy${input.policyData?.insuredName ? ` for ${input.policyData.insuredName}` : ""}`,
          text: `${strategy.strategyContent || "Your LTC Insurance Strategy"}${pdfUrl ? `\n\nPDF download (expires in one hour): ${pdfUrl}` : ""}`,
          payload: { type: "strategy_email", strategyId: input.strategyId, pdfUrl,
            insuredName: input.policyData?.insuredName || "", policyNumber: input.policyData?.policyNumber || "",
            strategyContent: strategy.strategyContent },
        });
        return { ...delivery, message: `Email service accepted the request for ${input.recipients.length} recipient(s). Inbox delivery is not confirmed.${pdfUrl ? " PDF download link expires in one hour." : ""}` };
      }),

    sendPageContent: protectedProcedure
      .input(z.object({
        pageName: z.string().min(1).max(200),
        content: z.string().min(1).max(500000),
        recipients: z.array(z.string().email()).min(1).max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const delivery = await submitEmail({ recipients: input.recipients, subject: input.pageName,
          text: input.content, payload: { type: "page_content", pageName: input.pageName, content: input.content } });
        return { ...delivery, message: `Email service accepted the request for ${input.recipients.length} recipient(s). Inbox delivery is not confirmed.` };
      }),

    sendContactForm: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(200), email: z.string().email().max(320),
        phone: z.string().max(40).optional(), subject: z.string().min(1).max(200),
        message: z.string().trim().min(1).max(10000),
      }))
      .mutation(async ({ input }) => {
        const accepted = await notifyOwner({
          title: `Contact Form: ${input.subject}`,
          content: `From: ${input.name} (${input.email}${input.phone ? ", " + input.phone : ""})\n\n${input.message}`,
        });
        if (!accepted) throw new TRPCError({ code: "BAD_GATEWAY", message: "Message submission could not be confirmed. Please call the office at (864) 244-6300." });
        return { success: true, status: "accepted" as const, message: "Your message was accepted by our email service. Please call if your request is urgent." };
      }),

    // Send a "Save & Return" magic link — stores form data server-side
    sendSaveLink: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        insuredName: z.string().optional(),
        stepTitle: z.string().optional(),
        origin: z.string().optional(),
        formData: z.record(z.string(), z.any()).optional(),
        currentStep: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const recipient = ctx.user.email;
        if (!recipient) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Your account needs an email address. Please contact the office." });
        await createSaveLink({ token, userId: ctx.user.id, email: recipient,
          insuredName: input.insuredName || null, formData: input.formData || {},
          currentStep: input.currentStep || 0, expiresAt });
        const resumePath = `/policy-form?resume=${token}`;
        try {
          if (!/^https?:\/\//.test(ENV.appPublicUrl)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Portal address is not configured." });
          const returnUrl = `${ENV.appPublicUrl}${resumePath}`;
          const text = `Hi ${input.insuredName || "there"},\n\nYour progress is saved. Sign in to your account to resume at Step ${(input.currentStep || 0) + 1}:\n\n${returnUrl}\n\nThis link expires in 30 days. Questions? Call (864) 244-6300.`;
          const delivery = await submitEmail({ recipients: [recipient], subject: "Your LTC Insurance Navigator — Saved Progress", text,
            payload: { type: "save_link", to: recipient, insuredName: input.insuredName || "there",
              stepTitle: input.stepTitle || "your current step", returnUrl } });
          return { ...delivery, saved: true as const, token, resumePath, recipient,
            message: `Progress saved. Email service accepted the resume-link request for ${recipient}. Inbox delivery is not confirmed.` };
        } catch (error) {
          return { success: false, saved: true as const, status: "unconfirmed" as const, token, resumePath, recipient,
            message: `Progress saved. ${error instanceof TRPCError ? error.message : "Email submission could not be confirmed."} You can copy the resume link below.` };
        }
      }),

    // Retrieve saved form data by resume token
    getResumeData: protectedProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input, ctx }) => {
        const link = await getSaveLinkByToken(input.token);
        if (!link || link.userId !== ctx.user.id) return { found: false } as const;
        if (link.expiresAt < new Date()) return { found: false, expired: true } as const;
        return {
          found: true,
          formData: link.formData as Record<string, any>,
          currentStep: link.currentStep,
          insuredName: link.insuredName,
          email: link.email,
        };
      }),

    // Notify owner when user advances a step (with full JSON payload)
    notifyStepProgress: protectedProcedure
      .input(z.object({
        stepNumber: z.number(),
        stepTitle: z.string(),
        formData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        const webhook = ENV.zapierWebhookUrl
          ? await submitWebhook({ type: "step_progress", stepNumber: input.stepNumber, stepTitle: input.stepTitle,
              formData: input.formData, timestamp: new Date().toISOString() }).then(() => true, () => false)
          : false;
        const owner = await notifyOwner({
          title: `Form Progress: Step ${input.stepNumber} — ${input.stepTitle}`,
          content: `Step: ${input.stepNumber} — ${input.stepTitle}\n\n${JSON.stringify(input.formData, null, 2)}`,
        }).catch(() => false);
        return { success: webhook || owner, webhookAccepted: webhook, ownerEmailAccepted: owner };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ---- Strategy Task Builders ----

type StrategyTask = { id: string; label: string; completed: boolean; category: string; critical?: boolean; uploadRequired?: boolean };

function buildStage1Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s1-1", label: "Contact insurance company and request claims packet by mail", completed: false, category: "carrier-contact" },
    { id: "s1-2", label: "Confirm claim-notice deadlines; promptly file any required notice while gathering documents", completed: false, category: "carrier-contact", critical: true },
    { id: "s1-3", label: "Confirm whether Assignment of Benefits (AOB) is permitted; request form only if applicable", completed: false, category: "carrier-contact" },
    { id: "s1-4", label: "Evaluate long-term care need and identify physical/cognitive decline", completed: false, category: "medical-evaluation" },
    { id: "s1-5", label: "Document applicable ADL limitations and review policy benefit trigger (" + (policy.minAdlsRequired || "2") + " ADLs noted; verify policy terms and cognitive alternatives)", completed: false, category: "medical-evaluation" },
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
    { id: "s1-17", label: "Verify what counts toward the elimination period before arranging qualifying care (" + (policy.eliminationPeriod || "check policy") + ")", completed: false, category: "elimination-period" },
    { id: "s1-18", label: "Identify carrier-required identifiers; collect sensitive numbers only when necessary through secure channels", completed: false, category: "personal-info" },
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
    { id: "s2-3", label: "Attach Power of Attorney (POA) only if applicable", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-4", label: "Attach carrier-required privacy authorizations, if applicable", completed: false, category: "claim-packet", uploadRequired: true },
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
    { id: "s2-11", label: "SUBMIT: File claim materials promptly; preserve proof of notice and supplement documents if needed", completed: false, category: "submission", critical: true },
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
    { id: "s2-17", label: "Verify the carrier's actual review deadlines and document each status update", completed: false, category: "post-submission" },
    { id: "s2-18", label: "Review denial and appeal rights, evidence requirements and applicable deadlines", completed: false, category: "post-submission", critical: true },
  );

  return tasks;
}

function buildStage3Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s3-1", label: "Confirm remaining elimination requirements and the insured's payment responsibilities", completed: false, category: "ongoing" },
    { id: "s3-2", label: "Organize and retain all paid invoices", completed: false, category: "ongoing" },
    { id: "s3-3", label: "Confirm care notes document minimum ADL assistance (" + (policy.minAdlsRequired || "2") + "+ ADLs)", completed: false, category: "ongoing" },
    { id: "s3-4", label: "Submit invoices and care logs per payment cycle (" + (policy.paymentCycle || "check policy") + ")", completed: false, category: "submission" },
    { id: "s3-5", label: "Ensure policy number appears on every submitted page", completed: false, category: "submission", critical: true },
  ];

  if (policy.assignmentOfBenefits === "yes") {
    tasks.push(
      { id: "s3-6", label: "Confirm accepted AOB and provider eligibility before submitting direct claims", completed: false, category: "aob-flow" },
      { id: "s3-7", label: "Track carrier direct payments only after AOB acceptance is confirmed", completed: false, category: "aob-flow" },
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
