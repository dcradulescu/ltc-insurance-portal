/**
 * Anonymous LTC education endpoints. These do not import or call the database,
 * persistent object storage or the legacy Zapier submission pipeline.
 * Strategy AI, support chat and explicitly requested mail are service calls.
 * PDF renders in server memory; no file is saved on the portal server.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { sendEmail, escapeHtml } from "../_core/email";
import { renderApprovedLtcReport } from "../canonicalReportPdf";
import { pdfInputSchema } from "./pdfDelivery";
import { buildStage1Tasks, buildStage2Tasks, buildStage3Tasks } from "../publicStrategyTasks";
import { PUBLIC_POLICY_FIELDS, publicPolicyForService } from "../../shared/publicLtcPolicy";

const allowedKeys = new Set<string>(PUBLIC_POLICY_FIELDS);
const policyValueSchema = z.union([
  z.string().max(1800), z.boolean(), z.array(z.string().max(160)).max(40),
]);
const anonymousPolicySchema = z.record(z.string(), policyValueSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 60) {
      context.addIssue({code:"custom", message:"Too many policy fields"});
    }
    for (const key of Object.keys(value)) {
      if (!allowedKeys.has(key)) context.addIssue({
        code:"custom", message:"Unapproved field in public policy input", path:[key],
      });
    }
  });

const limits = new Map<string, { count: number; expires: number }>();
function throttle(req: { socket?: { remoteAddress?: string } }, action: string, max: number) {
  const now = Date.now();
  if (limits.size > 3000) for (const [key, value] of limits) {
    if (value.expires < now) limits.delete(key);
  }
  const key = action + ":" + (req.socket?.remoteAddress || "unresolved");
  const record = limits.get(key);
  if (!record || record.expires < now) {
    limits.set(key, {count:1,expires:now+3600000});
    return;
  }
  if (record.count >= max) throw new TRPCError({
    code:"TOO_MANY_REQUESTS",message:"Please wait before trying again.",
  });
  record.count++;
}

function testBccEnabled() {
  // On during local QA; OFF by default in production unless explicitly enabled.
  return process.env.LTC_TEST_BCC_ENABLED === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.LTC_TEST_BCC_ENABLED !== "false");
}
const testBccAddress = "daniel@scvisitingangels.com";

// Deliberately never trust the browser to populate removed identifying fields.
function anonymousReport(report: z.infer<typeof pdfInputSchema>) {
  return {
    ...report,
    insuredName:"", insuredDob:"", insuredPhone:"", insuredEmail:"",
    insuredAddress:"", policyNumber:"", claimNumber:"", caseManagerName:"",
  };
}

async function renderGuestReport(report: z.infer<typeof pdfInputSchema>) {
  const safe = anonymousReport(report);
  const rendered = await renderApprovedLtcReport(safe);
  return rendered.buffer;
}

function plainTextAsSafeHtml(value: string): string {
  // Keep the original Strategy HTML container without allowing model-generated HTML.
  const withoutTags = value.replace(/<[^>]*>/g, " ").trim();
  return withoutTags.split(/\n\s*\n/).filter(Boolean)
    .map(part => "<p>" + escapeHtml(part).replace(/\n/g, "<br>") + "</p>").join("\n");
}

export const publicLtcRouter = router({
  mailConfig: publicProcedure.query(() => ({
    testingBccEnabled:testBccEnabled(),
    testingBccAddress:testBccEnabled() ? testBccAddress : null,
  })),

  generateStrategy: publicProcedure
    .input(z.object({policy: anonymousPolicySchema}))
    .mutation(async ({ctx,input}) => {
      throttle(ctx.req,"strategy",15);
      const policy = publicPolicyForService(input.policy);
      const carrier = String(policy.carrierName || "").trim();
      if (!carrier) throw new TRPCError({code:"BAD_REQUEST",message:"Please enter your insurance company."});
      const systemPrompt = [
        "You are an LTC educational advisor for SC Visiting Angels.",
        "Provide an accurate, step-by-step educational strategy; never promise claim approval.",
        "Respect cognitive-impairment benefit triggers as an alternative to ADL triggers when policy terms allow.",
        "Include policy benefits, elimination periods, documentation, timing, appeal rights and payment planning.",
        "Make no assumptions about unprovided policy numbers, dates of birth, names or contact information.",
        "Avoid requesting identifying information. Reply in readable plain text using short headings.",
      ].join(" ");
      const safeSummary = {
        carrier:policy.carrierName,
        carrierPhone:policy.carrierPhone,
        dailyMaximum:policy.dailyMaximum,
        monthlyMaximum:policy.monthlyMaximum,
        lifetimeMaximum:policy.lifetimeMaximum,
        eliminationPeriod:policy.eliminationPeriod,
        minAdlsRequired:policy.minAdlsRequired,
        qualifyingAdls:policy.qualifyingAdls,
        currentCareNeeds:policy.careNeeds,
        diagnosisTypes:policy.diagnosisCheckboxes,
        cognitiveImpairmentTrigger:policy.cognitiveImpairmentTrigger,
        waiverOfPremium:policy.waiverOfPremium,
        assignmentOfBenefits:policy.assignmentOfBenefits,
        thirdPartyAssessmentRequired:policy.thirdPartyAssessmentRequired,
        claimsInstructions:policy.howToSubmitClaimsPacket,
      };
      const reply = await invokeLLM({messages:[
        {role:"system",content:systemPrompt},
        {role:"user",content:"Build an educational three-stage LTC claim strategy for this anonymous scenario:\n"+
          JSON.stringify(safeSummary)},
      ]});
      const text = typeof reply.choices[0].message.content === "string"
        ? reply.choices[0].message.content : JSON.stringify(reply.choices[0].message.content);
      return {
        content:plainTextAsSafeHtml(text),
        stage1Tasks:buildStage1Tasks(policy),
        stage2Tasks:buildStage2Tasks(policy),
        stage3Tasks:buildStage3Tasks(policy),
      };
    }),

  generatePdf: publicProcedure.input(pdfInputSchema).mutation(async ({ctx,input}) => {
    throttle(ctx.req,"pdf",25);
    const buffer = await renderGuestReport(input);
    return {success:true, pdfBase64:buffer.toString("base64"), pageCount:18};
  }),

  emailPdf: publicProcedure
    .input(z.object({
      report:pdfInputSchema,
      recipients:z.array(z.string().email().max(320)).min(1).max(5),
      message:z.string().max(1500).optional(),
      acknowledgedBcc:z.literal(true),
    }))
    .mutation(async ({ctx,input}) => {
      throttle(ctx.req,"email",7);
      const buffer = await renderGuestReport(input.report);
      // SMTP only: attachments + BCC must be honored. No Zapier fallback or storage URL.
      const result = await sendEmail({
        to:input.recipients,
        bcc:testBccEnabled() ? [testBccAddress] : [],
        subject:"Your Visiting Angels LTC Insurance Strategy (18-page PDF)",
        html:"<p>Your requested 18-page educational LTC strategy PDF is attached.</p>"+
          "<p>This information is for educational use and does not establish claim eligibility.</p>"+
          (input.message ? "<p>Sender message: "+escapeHtml(input.message).replace(/\n/g,"<br>")+"</p>" : ""),
        attachments:[{filename:"Visiting-Angels-LTC-Strategy.pdf",
          content:buffer,contentType:"application/pdf"}],
      });
      return {...result,message:"Email service accepted the report. Inbox delivery is not confirmed."};
    }),

  chat:publicProcedure.input(z.object({
    message:z.string().trim().min(1).max(2000),
    history:z.array(z.object({
      role:z.enum(["user","assistant"]),content:z.string().max(2000),
    })).max(8).default([]),
  })).mutation(async ({ctx,input}) => {
    throttle(ctx.req,"chat",65);
    const reply=await invokeLLM({messages:[
      {role:"system",content:"You are the SC Visiting Angels LTC Support Assistant. "+
        "Answer educational questions about LTC benefits, care needs, claim eligibility, "+
        "elimination periods, documentation and coverage. Do not request names, "+
        "policy numbers or other identifiers. Do not imply this chat is a confidential "+
        "medical channel. Suggest (864) 244-6300 for private case-specific help."},
      ...input.history,
      {role:"user",content:input.message},
    ]});
    const result=reply.choices[0].message.content;
    return {content:typeof result==="string" ? result : JSON.stringify(result)};
  }),
});
