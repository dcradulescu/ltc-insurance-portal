import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const policyFormRouter = router({
  submitForm: protectedProcedure
    .input(
      z.object({
        insuredFullName: z.string().min(1, "Insured name is required"),
        insuredDOB: z.string().optional(),
        insuredSSN: z.string().optional(),
        insuredMailingAddress: z.string().optional(),
        insuredCity: z.string().optional(),
        insuredState: z.string().optional(),
        insuredZip: z.string().optional(),
        carrierName: z.string().min(1, "Carrier name is required"),
        carrierAddress1: z.string().optional(),
        carrierAddress2: z.string().optional(),
        carrierCity: z.string().optional(),
        carrierState: z.string().optional(),
        carrierZip: z.string().optional(),
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
        logsheetsRequired: z.string().optional(),
        paymentCycle: z.string().optional(),
        assignmentOfBenefits: z.string().optional(),
        caseManagerName: z.string().optional(),
        thirdPartyAssessmentRequired: z.string().optional(),
        cognitiveImpairmentTrigger: z.string().optional(),
        planOfCareStatus: z.string().optional(),
        ltcCoordinatorAssigned: z.string().optional(),
        pcpName: z.string().optional(),
        pcpPhone: z.string().optional(),
        pcpLastVisitDate: z.string().optional(),
        otherProvidersInfo: z.string().optional(),
        medicareNumber: z.string().optional(),
        medicaidNumber: z.string().optional(),
        powerOfAttorneyPresent: z.string().optional(),
        facilitiesUsed: z.string().optional(),
        dischargeDocumentation: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const webhookUrl = process.env.VITE_ZAPIER_WEBHOOK_URL;

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
            id: ctx.user.id,
            name: ctx.user.name,
            email: ctx.user.email,
            openId: ctx.user.openId,
          },
          formData: input,
        };

        // Send to Zapier webhook
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error("Zapier webhook error:", response.status, response.statusText);
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
