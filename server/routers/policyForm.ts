import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

export const policyFormRouter = router({
  submitForm: publicProcedure
    .input(
      z.object({
        insuredFullName: z.string().min(1, "Insured name is required"),
        insuredDob: z.string().optional(),
        insuredSsn: z.string().optional(),
        insuredMailingAddress: z.string().optional(),
        insuredMedicareNumber: z.string().optional(),
        insuredMedicaidNumber: z.string().optional(),
        powerOfAttorneyPresent: z.string().optional(),
        carrierName: z.string().min(1, "Carrier name is required"),
        carrierAddress1: z.string().optional(),
        carrierAddress2: z.string().optional(),
        carrierCityStateZip: z.string().optional(),
        carrierPhone: z.string().optional(),
        carrierFax: z.string().optional(),
        policyNumber: z.string().min(1, "Policy number is required"),
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
        currentCareNeeds: z.string().optional(),
        diagnosisOrCondition: z.string().optional(),
        adlLimitations: z.array(z.string()).optional(),
        preferredCareType: z.string().optional(),
        additionalNotes: z.string().optional(),
        fillerRelationship: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const webhookUrl = ENV.zapierWebhookUrl;

        if (!webhookUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Zapier webhook URL not configured",
          });
        }

        // Prepare the payload with user info and form data
        const payload = {
          timestamp: new Date().toISOString(),
          user: {
            id: 1, // Default public user
            name: "Guest",
            email: "guest@example.com",
            openId: null,
          },
          formData: input,
        };

        // Send to Zapier webhook
        console.log("Sending to Zapier:", webhookUrl);
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("Zapier response status:", response.status, response.statusText);
        const responseText = await response.text();
        console.log("Zapier response body:", responseText);

        if (!response.ok) {
          console.error("Zapier webhook error:", response.status, response.statusText, responseText);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to submit form to Zapier",
          });
        }

        return {
          success: true,
          message: "Form submitted successfully",
        };
      } catch (error) {
        console.error("Policy form submission error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }),
});
