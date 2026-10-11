import { getSignedStorageUrl } from "../storage";
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateStrategyPdf } from "../strategyPdfGenerator";
import { submitEmail } from "../_core/delivery";
import { TRPCError } from "@trpc/server";

import { canonicalCareInputsSchema } from "../../shared/careScenarioSchema";
export { canonicalCareInputsSchema } from "../../shared/careScenarioSchema";

// Full schema matching PdfData interface
export const pdfInputSchema = z.object({
  // Insured
  insuredName: z.string(),
  insuredDob: z.string().optional(),
  insuredPhone: z.string().optional(),
  insuredEmail: z.string().optional(),
  insuredAddress: z.string().optional(),
  // Policy
  policyNumber: z.string(),
  claimNumber: z.string().optional(),
  carrierName: z.string().min(1, "Carrier name is required"),
  carrierPhone: z.string().optional(),
  // Coverage
  eliminationPeriod: z.string().optional(),
  dailyMaximum: z.number().default(0),
  monthlyMaximum: z.number().default(0),
  lifetimeMaximum: z.number().default(0),
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
  // Extra
  careRecommendations: z.string().optional(),
  strategyContent: z.string().optional(),
  diagnosis: z.string().optional(),
  caseManagerName: z.string().optional(),
  thirdPartyAssessmentRequired: z.string().optional(),
  careInputs: canonicalCareInputsSchema.optional(),
  issueDate: z.string().max(32).optional(),
  policyStatus: z.string().max(100).optional(),
  benefitPeriod: z.string().max(100).optional(),
  inflationRate: z.number().min(0).max(20).optional(),
  claimsAddress1: z.string().max(255).optional(),
  claimsAddress2: z.string().max(255).optional(),
  claimsCityStateZip: z.string().max(255).optional(),
  claimsFax: z.string().max(40).optional(),
});

export const pdfDeliveryRouter = router({
  // Generate PDF and upload to S3
  generatePdf: protectedProcedure
    .input(pdfInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await generateStrategyPdf(input, ctx.user.id);
        return {
          success: true,
          url: result.url,
          key: result.key,
          message: "PDF generated successfully",
        };
      } catch (error) {
        console.error("PDF generation error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PDF could not be generated. Please try again or contact the office." });
      }
    }),

  // Send PDF via email using Zapier webhook
  sendPdfByEmail: protectedProcedure
    .input(
      pdfInputSchema.extend({
        recipientEmail: z.string().email("Invalid email address"),
        recipientName: z.string().min(1, "Recipient name is required"),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pdfResult = await generateStrategyPdf(input, ctx.user.id);
      const emailUrl = await getSignedStorageUrl(pdfResult.key, 3600);
      const delivery = await submitEmail({ recipients: [input.recipientEmail],
        subject: "Your LTC Insurance Strategy",
        text: `Hi ${input.recipientName},\n\n${input.message || "Your strategy PDF is ready."}\n\nDownload your PDF (link expires in one hour): ${emailUrl}`,
        payload: { type: "strategy_email", recipientEmail: input.recipientEmail, recipientName: input.recipientName,
          insuredName: "", policyNumber: input.policyNumber, carrierName: input.carrierName,
          pdfUrl: emailUrl, personalMessage: input.message || "" } });
      return { ...delivery, message: `Email service accepted the request for ${input.recipientEmail}. Inbox delivery is not confirmed. The PDF link expires in one hour.`, pdfUrl: pdfResult.url };
    }),

  // Validate email before sending
  validateEmail: protectedProcedure
    .input(z.object({ email: z.string().email("Invalid email address") }))
    .query(async ({ input, ctx }) => {
      return {
        valid: true,
        email: input.email,
        message: "Email is valid",
      };
    }),
});
