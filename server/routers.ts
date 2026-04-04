import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createPolicy, getPolicyById, getLatestPolicy, updatePolicyById as updatePolicy,
  createStrategy, getStrategyByPolicyIdNoAuth as getStrategyByPolicyId, getStrategyById, updateStrategy, getLatestStrategy,
  saveChatMessage,
  createDocumentUpload, getAllDocuments, getDocumentsByTaskIdNoAuth as getDocumentsByTaskId, deleteDocumentById as deleteDocument,
  createUserContact, getAllUserContacts, updateUserContactById as updateUserContact, deleteUserContactById as deleteUserContact,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Fixed guest ID used for all DB operations since auth is removed
const GUEST_USER_ID = 1;

export const appRouter = router({
  system: systemRouter,
  policy: router({
    get: publicProcedure.query(async () => {
      return getLatestPolicy();
    }),
    save: publicProcedure
      .input(z.object({
        id: z.number().optional(),
        insuredFullName: z.string().optional(),
        insuredDob: z.string().optional(),
        insuredMailingAddress: z.string().optional(),
        insuredSsn: z.string().optional(),
        insuredMedicareNumber: z.string().optional(),
        insuredMedicaidNumber: z.string().optional(),
        powerOfAttorneyPresent: z.string().optional(),
        carrierName: z.string().optional(),
        carrierAddress1: z.string().optional(),
        carrierAddress2: z.string().optional(),
        carrierCityStateZip: z.string().optional(),
        carrierPhone: z.string().optional(),
        carrierFax: z.string().optional(),
        policyNumber: z.string().optional(),
        claimPreClaimNumber: z.string().optional(),
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
        caseManagerName: z.string().optional(),
        thirdPartyAssessmentRequired: z.string().optional(),
        thirdPartyAssessmentWho: z.string().optional(),
        cognitiveImpairmentTrigger: z.string().optional(),
        planOfCareStatus: z.string().optional(),
        ltcCoordinatorAssigned: z.string().optional(),
        primaryCarePhysician: z.any().optional(),
        otherProviders: z.any().optional(),
        facilitiesUsed: z.any().optional(),
        dischargeDocumentation: z.string().optional(),
        currentCareNeeds: z.string().optional(),
        diagnosisOrCondition: z.string().optional(),
        adlLimitations: z.array(z.string()).optional(),
        preferredCareType: z.string().optional(),
        additionalNotes: z.string().optional(),
        fillerRelationship: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (id) {
          await updatePolicy(id, data);
          return { id };
        } else {
          const newId = await createPolicy({ ...data, userId: GUEST_USER_ID });
          return { id: newId };
        }
      }),
  }),
  strategy: router({
    getByPolicy: publicProcedure
      .input(z.object({ policyId: z.number() }))
      .query(async ({ input }) => {
        return getStrategyByPolicyId(input.policyId);
      }),
    getMine: publicProcedure.query(async () => {
      return getLatestStrategy();
    }),
    updateTasks: publicProcedure
      .input(z.object({
        strategyId: z.number(),
        stage: z.enum(["stage1Tasks", "stage2Tasks", "stage3Tasks"]),
        tasks: z.any(),
        currentStage: z.number().optional(),
        claimStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        const policy = await getPolicyById(input.policyId);
        if (!policy) throw new Error("Policy not found");
        const adlList = Array.isArray(policy.adlLimitations) ? (policy.adlLimitations as string[]).join(", ") : "Not specified";
        const stage1Tasks = buildStage1Tasks(policy);
        const stage2Tasks = buildStage2Tasks(policy);
        const stage3Tasks = buildStage3Tasks(policy);
        const systemPrompt = `You are an expert long-term care insurance claims advisor. Generate a comprehensive, personalized strategy document in clean HTML. The strategy MUST include: 1. Executive Summary, 2. Policy Analysis, 3. Eligibility Assessment, 4. Stage 1: Prior to Claim, 5. Stage 2: Filing the Claim, 6. Stage 3: Post-Approval Management, 7. Third-Party Evaluation Preparation, 8. Denial Prevention Strategy, 9. Appeal Strategy, 10. Important Contacts & Resources. ${policy.assignmentOfBenefits === "yes" ? "IMPORTANT: This policy uses Assignment of Benefits." : "IMPORTANT: This policy does NOT use Assignment of Benefits."} ${policy.thirdPartyAssessmentRequired === "yes" ? "IMPORTANT: A third-party assessment IS required." : ""} Format in clean HTML with h2, h3, paragraphs, and lists.`;
        const userPrompt = `Generate a personalized LTC insurance claim strategy:\n**Insured:** ${policy.insuredFullName || "Not provided"}\n**DOB:** ${policy.insuredDob || "Not provided"}\n**Carrier:** ${policy.carrierName || "Not provided"}\n**Policy #:** ${policy.policyNumber || "Not provided"}\n**Claim/Pre-Claim #:** ${policy.claimPreClaimNumber || "Not provided"}\n**Elimination Period:** ${policy.eliminationPeriod || "Not provided"}\n**Daily Maximum:** ${policy.dailyMaximum || "Not provided"}\n**Monthly Maximum:** ${policy.monthlyMaximum || "Not provided"}\n**Lifetime Maximum:** ${policy.lifetimeMaximum || "Not provided"}\n**Min ADLs Required:** ${policy.minAdlsRequired || "Not provided"}\n**Waiver of Premium:** ${policy.waiverOfPremium || "Not provided"}\n**CNA Required:** ${policy.cnaRequired || "Not provided"}\n**Care Notes Required:** ${policy.careNotesRequired || "Not provided"}\n**Payment Cycle:** ${policy.paymentCycle || "Not provided"}\n**Assignment of Benefits:** ${policy.assignmentOfBenefits || "Not provided"}\n**Case Manager:** ${policy.caseManagerName || "Not assigned"}\n**Third Party Assessment:** ${policy.thirdPartyAssessmentRequired || "Not provided"}\n**Cognitive Impairment Trigger:** ${policy.cognitiveImpairmentTrigger || "Not provided"}\n**Plan of Care Status:** ${policy.planOfCareStatus || "Not provided"}\n**Current Care Needs:** ${policy.currentCareNeeds || "Not provided"}\n**Diagnosis/Condition:** ${policy.diagnosisOrCondition || "Not provided"}\n**ADL Limitations:** ${adlList}\n**Preferred Care Type:** ${policy.preferredCareType || "Not provided"}\n**Power of Attorney:** ${policy.powerOfAttorneyPresent || "Not provided"}\n**Additional Notes:** ${policy.additionalNotes || "Not provided"}`;
        const result = await invokeLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
        const content = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
        const existing = await getStrategyByPolicyId(input.policyId);
        let strategyId: number;
        if (existing) {
          await updateStrategy(existing.id, { strategyContent: content, strategyHtml: content, stage1Tasks, stage2Tasks, stage3Tasks, currentStage: 1, claimStatus: "not_started", generatedAt: new Date() });
          strategyId = existing.id;
        } else {
          strategyId = await createStrategy({ userId: GUEST_USER_ID, policyId: input.policyId, strategyContent: content, strategyHtml: content, stage1Tasks, stage2Tasks, stage3Tasks, currentStage: 1, claimStatus: "not_started" });
        }
        await notifyOwner({ title: "New LTC Strategy Generated", content: `A strategy was generated for policy #${policy.policyNumber || input.policyId}.` }).catch(() => {});
        return { id: strategyId, content, stage1Tasks, stage2Tasks, stage3Tasks };
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const strategy = await getStrategyById(input.id);
        if (!strategy) throw new Error("Strategy not found");
        return strategy;
      }),
  }),
  documents: router({
    upload: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(),
        mimeType: z.string(),
        category: z.string(),
        taskId: z.string().optional(),
        policyId: z.number().optional(),
        strategyId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `guest-docs/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const docId = await createDocumentUpload({ userId: GUEST_USER_ID, policyId: input.policyId ?? null, strategyId: input.strategyId ?? null, taskId: input.taskId ?? null, category: input.category, fileName: input.fileName, fileUrl: url, fileKey, mimeType: input.mimeType, fileSize: buffer.length });
        return { id: docId, url, fileName: input.fileName };
      }),
    list: publicProcedure.query(async () => getAllDocuments()),
    listByTask: publicProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ input }) => getDocumentsByTaskId(input.taskId)),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteDocument(input.id); return { success: true }; }),
  }),
  contacts: router({
    list: publicProcedure.query(async () => getAllUserContacts()),
    add: publicProcedure
      .input(z.object({ name: z.string(), email: z.string().email(), relationship: z.string().optional(), receiveCcEmails: z.number().optional() }))
      .mutation(async ({ input }) => { const id = await createUserContact({ ...input, userId: GUEST_USER_ID }); return { id }; }),
    update: publicProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), email: z.string().email().optional(), relationship: z.string().optional(), receiveCcEmails: z.number().optional() }))
      .mutation(async ({ input }) => { const { id, ...data } = input; await updateUserContact(id, data); return { success: true }; }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteUserContact(input.id); return { success: true }; }),
  }),
  chat: router({
    send: publicProcedure
      .input(z.object({
        messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })),
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const lastUserMsg = input.messages.filter(m => m.role === "user").pop();
        if (lastUserMsg) await saveChatMessage({ userId: null, sessionId: input.sessionId, role: "user", content: lastUserMsg.content });
        const systemMessage = { role: "system" as const, content: `You are an expert LTC insurance claims advisor for LTC Navigator. Help families navigate long-term care insurance claims. Key terms: Elimination Period (days you pay before policy pays), ADLs (Activities of Daily Living - need 2-3 deficits to qualify), Assignment of Benefits (AOB - payment goes directly to provider), Case Manager (assigned by LTC company), Third Party Assessment (independent RN evaluation). Stages: Stage 1 (gather docs, do NOT initiate claim yet), Stage 2 (submit all docs in ONE packet), Stage 3 (post-approval management). Be empathetic and supportive.` };
        const messagesForLLM = [systemMessage, ...input.messages.filter(m => m.role !== "system")];
        const result = await invokeLLM({ messages: messagesForLLM });
        const assistantContent = typeof result.choices[0].message.content === "string" ? result.choices[0].message.content : JSON.stringify(result.choices[0].message.content);
        await saveChatMessage({ userId: null, sessionId: input.sessionId, role: "assistant", content: assistantContent });
        return assistantContent;
      }),
  }),
  email: router({
    sendStrategy: publicProcedure
      .input(z.object({ strategyId: z.number(), recipients: z.array(z.string().email()) }))
      .mutation(async ({ input }) => {
        const strategy = await getStrategyById(input.strategyId);
        if (!strategy) throw new Error("Strategy not found");
        await notifyOwner({ title: "Strategy Email Request", content: `LTC strategy (ID: ${input.strategyId}) requested to be emailed to: ${input.recipients.join(", ")}` }).catch(() => {});
        return { success: true, message: `Strategy has been queued for delivery to ${input.recipients.length} recipient(s).` };
      }),
    sendPageContent: publicProcedure
      .input(z.object({ pageName: z.string(), content: z.string(), recipients: z.array(z.string().email()) }))
      .mutation(async ({ input }) => {
        await notifyOwner({ title: `Page Content Email: ${input.pageName}`, content: `${input.pageName} content requested to be emailed to: ${input.recipients.join(", ")}` }).catch(() => {});
        return { success: true, message: `Content has been queued for delivery.` };
      }),
    sendContactForm: publicProcedure
      .input(z.object({ name: z.string(), email: z.string().email(), phone: z.string().optional(), subject: z.string(), message: z.string() }))
      .mutation(async ({ input }) => {
        await notifyOwner({ title: `Contact Form: ${input.subject}`, content: `From: ${input.name} (${input.email}${input.phone ? ", " + input.phone : ""})\n\n${input.message}` }).catch(() => {});
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;

// ---- Strategy task builders ----
type StrategyTask = { id: string; label: string; completed: boolean; category: string; critical?: boolean; uploadRequired?: boolean; };

function buildStage1Tasks(policy: any): StrategyTask[] {
  return [
    { id: "s1-1", label: "Contact carrier claims department: " + (policy.carrierPhone || "see policy"), completed: false, category: "carrier-contact" },
    { id: "s1-2", label: "Request claims packet (do NOT initiate claim yet)", completed: false, category: "carrier-contact", critical: true },
    { id: "s1-3", label: "Request Assignment of Benefits (AOB) form if applicable", completed: false, category: "carrier-contact" },
    { id: "s1-4", label: "Schedule independent medical evaluation", completed: false, category: "medical-evaluation" },
    { id: "s1-5", label: "Document all ADL deficits with physician", completed: false, category: "medical-evaluation" },
    { id: "s1-6", label: "Obtain physician's statement of medical necessity", completed: false, category: "medical-evaluation", uploadRequired: true },
    { id: "s1-7", label: "Research and select qualified home care provider", completed: false, category: "provider-setup" },
    { id: "s1-8", label: "Verify provider meets CNA requirements: " + (policy.cnaRequired === "yes" ? "CNA REQUIRED" : "verify with carrier"), completed: false, category: "provider-setup" },
    { id: "s1-9", label: "Obtain provider license documentation", completed: false, category: "provider-setup", uploadRequired: true },
    { id: "s1-10", label: "Establish Plan of Care with provider", completed: false, category: "provider-setup", uploadRequired: true },
    { id: "s1-11", label: "Set up care log / logsheet system", completed: false, category: "provider-setup" },
    { id: "s1-12", label: "Confirm payment cycle: " + (policy.paymentCycle || "verify with carrier"), completed: false, category: "provider-setup" },
    { id: "s1-13", label: "Gather all policy documents", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-14", label: "Obtain medical records from primary care physician", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-15", label: "Obtain medical records from specialists", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-16", label: "Gather hospital/facility records (if applicable)", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-17", label: "Understand elimination period: " + (policy.eliminationPeriod || "check policy") + " — plan finances accordingly", completed: false, category: "elimination-period" },
    { id: "s1-18", label: "Collect personal identifiers (SSN, Medicare/Medicaid #)", completed: false, category: "personal-info" },
    { id: "s1-19", label: "Obtain Power of Attorney documentation (if applicable)", completed: false, category: "personal-info", uploadRequired: true },
    { id: "s1-20", label: "Collect insurance declaration page", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-21", label: "Gather discharge paperwork (if applicable)", completed: false, category: "documents", uploadRequired: true },
  ];
}

function buildStage2Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s2-1", label: "Complete the claim packet thoroughly", completed: false, category: "claim-packet" },
    { id: "s2-2", label: "Create document index listing all attachments", completed: false, category: "claim-packet" },
    { id: "s2-3", label: "Attach Power of Attorney (POA)", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-4", label: "Attach privacy authorization form", completed: false, category: "claim-packet", uploadRequired: true },
  ];
  if (policy.assignmentOfBenefits === "yes") tasks.push({ id: "s2-5", label: "Attach signed Assignment of Benefits (AOB) form", completed: false, category: "claim-packet", uploadRequired: true });
  tasks.push(
    { id: "s2-6", label: "Attach provider license", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-7", label: "Attach insurance declaration page", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-8", label: "Attach Plan of Care", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-9", label: "Attach all Stage 1 supporting documentation", completed: false, category: "claim-packet" },
    { id: "s2-10", label: "VERIFY: Policy number appears on EVERY page", completed: false, category: "verification", critical: true },
    { id: "s2-11", label: "SUBMIT: Send ALL documents in ONE complete packet", completed: false, category: "submission", critical: true },
  );
  if (policy.thirdPartyAssessmentRequired === "yes") tasks.push(
    { id: "s2-12", label: "Prepare for third-party nurse evaluation", completed: false, category: "evaluation" },
    { id: "s2-13", label: "Review ADL demonstration expectations", completed: false, category: "evaluation" },
    { id: "s2-14", label: "Review mobility demonstration expectations", completed: false, category: "evaluation" },
    { id: "s2-15", label: "Prepare for cognitive questioning (if applicable)", completed: false, category: "evaluation" },
    { id: "s2-16", label: "Understand: inconsistencies may lead to denial", completed: false, category: "evaluation", critical: true },
  );
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
    tasks.push({ id: "s3-6", label: "Provider submits claims directly to insurance company", completed: false, category: "aob-flow" }, { id: "s3-7", label: "Verify provider is receiving direct payments", completed: false, category: "aob-flow" });
  } else {
    tasks.push({ id: "s3-6", label: "Pay provider directly for services", completed: false, category: "reimbursement-flow" }, { id: "s3-7", label: "Submit paid invoices and documentation to insurance company", completed: false, category: "reimbursement-flow" }, { id: "s3-8", label: "Track reimbursement payments from insurance company", completed: false, category: "reimbursement-flow" });
  }
  tasks.push({ id: "s3-9", label: "Maintain ongoing communication with case manager", completed: false, category: "ongoing" }, { id: "s3-10", label: "Keep all records organized for potential audits", completed: false, category: "ongoing" });
  return tasks;
}
