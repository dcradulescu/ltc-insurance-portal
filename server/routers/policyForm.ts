import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

const formDataSchema = z.object({
  insuredFullName: z.string().optional().default(""),
  insuredDob: z.string().optional().default(""),
  insuredMailingAddress: z.string().optional().default(""),
  insuredSsn: z.string().optional().default(""),
  insuredMedicareNumber: z.string().optional().default(""),
  insuredMedicaidNumber: z.string().optional().default(""),
  powerOfAttorneyPresent: z.string().optional().default(""),
  carrierName: z.string().optional().default(""),
  carrierAddress1: z.string().optional().default(""),
  carrierAddress2: z.string().optional().default(""),
  carrierCityStateZip: z.string().optional().default(""),
  carrierPhone: z.string().optional().default(""),
  carrierFax: z.string().optional().default(""),
  policyNumber: z.string().optional().default(""),
  claimPreClaimNumber: z.string().optional().default(""),
  eliminationPeriod: z.string().optional().default(""),
  dailyMaximum: z.string().optional().default(""),
  monthlyMaximum: z.string().optional().default(""),
  lifetimeMaximum: z.string().optional().default(""),
  minAdlsRequired: z.string().optional().default(""),
  waiverOfPremium: z.string().optional().default(""),
  cnaRequired: z.string().optional().default(""),
  careNotesRequired: z.string().optional().default(""),
  paymentCycle: z.string().optional().default(""),
  assignmentOfBenefits: z.string().optional().default(""),
  caseManagerName: z.string().optional().default(""),
  thirdPartyAssessmentRequired: z.string().optional().default(""),
  thirdPartyAssessmentWho: z.string().optional().default(""),
  cognitiveImpairmentTrigger: z.string().optional().default(""),
  planOfCareStatus: z.string().optional().default(""),
  ltcCoordinatorAssigned: z.string().optional().default(""),
  currentCareNeeds: z.string().optional().default(""),
  diagnosisOrCondition: z.string().optional().default(""),
  adlLimitations: z.array(z.string()).optional().default([]),
  preferredCareType: z.string().optional().default(""),
  additionalNotes: z.string().optional().default(""),
  fillerRelationship: z.string().optional().default(""),
});

export const policyFormRouter = router({
  /**
   * Send the complete form JSON to Zapier webhook.
   * Called once when user completes, exits, or times out.
   */
  sendToZapier: publicProcedure
    .input(
      z.object({
        formData: formDataSchema,
        trigger: z.enum(["completed", "exit", "timeout", "save"]),
        currentStep: z.number().optional(),
        completionPercentage: z.number().optional(),
        sessionDurationSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const webhookUrl = ENV.zapierWebhookUrl;

        if (!webhookUrl) {
          console.warn("Zapier webhook URL not configured — skipping send");
          return { success: false, message: "Webhook URL not configured" };
        }

        // Build the complete payload
        const payload = {
          timestamp: new Date().toISOString(),
          trigger: input.trigger,
          currentStep: input.currentStep,
          completionPercentage: input.completionPercentage,
          sessionDurationSeconds: input.sessionDurationSeconds,
          user: ctx.user
            ? {
                id: ctx.user.id,
                name: ctx.user.name,
                email: ctx.user.email,
                openId: ctx.user.openId,
              }
            : { id: null, name: "Guest", email: null, openId: null },
          formData: input.formData,
        };

        console.log(`[Zapier] Sending form data (trigger: ${input.trigger}) to webhook`);
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log(`[Zapier] Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const responseText = await response.text();
          console.error("[Zapier] Webhook error:", responseText);
          return { success: false, message: "Webhook delivery failed" };
        }

        return { success: true, message: "Form data sent to Zapier" };
      } catch (error) {
        console.error("[Zapier] Send error:", error);
        // Non-blocking — don't throw, just return failure
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
