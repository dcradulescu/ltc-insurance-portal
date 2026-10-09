import { deliver } from "../_core/delivery";
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateStrategyPdf } from "../strategyPdfGenerator";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

// Full schema matching PdfData interface
const pdfInputSchema = z.object({
  // Insured
  insuredName: z.string().min(1, "Insured name is required"),
  insuredDob: z.string().optional(),
  insuredPhone: z.string().optional(),
  insuredEmail: z.string().optional(),
  insuredAddress: z.string().optional(),
  // Policy
  policyNumber: z.string().min(1, "Policy number is required"),
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
  // Extra
  careRecommendations: z.string().optional(),
  strategyContent: z.string().optional(),
  diagnosis: z.string().optional(),
  caseManagerName: z.string().optional(),
  thirdPartyAssessmentRequired: z.string().optional(),
});

export const pdfDeliveryRouter = router({
  // Return directly to the requesting browser; do not publish policy data to object storage.
  generatePdf: publicProcedure.input(pdfInputSchema).mutation(async ({input}) => {
    const {generatePdfBuffer} = await import("../pdfConverter");
    return {success:true, base64:generatePdfBuffer(input).toString("base64"), message:"PDF generated"};
  }),
  sendPdfByEmail: publicProcedure.input(pdfInputSchema.extend({
    recipientEmail:z.string().email(),recipientName:z.string().min(1).max(200),message:z.string().max(4000).optional(),
  })).mutation(async ({input}) => {
    const {generatePdfBuffer} = await import("../pdfConverter");
    const attachment = generatePdfBuffer(input).toString("base64");
    return deliver({type:"strategy_email",recipientEmail:input.recipientEmail,recipientName:input.recipientName,subject:`LTC strategy for ${input.insuredName}`,personalMessage:input.message ?? "",attachmentBase64:attachment,attachmentFilename:"LTC-Strategy.pdf",attachmentContentType:"application/pdf"});
  }),

  // Validate email before sending
  validateEmail: publicProcedure
    .input(z.object({ email: z.string().email("Invalid email address") }))
    .query(async ({ input }) => {
      return {
        valid: true,
        email: input.email,
        message: "Email is valid",
      };
    }),
});
