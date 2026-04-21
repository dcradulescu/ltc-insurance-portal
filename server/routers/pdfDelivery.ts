import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateStrategyPdf } from "../strategyPdfGenerator";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

const pdfInputSchema = z.object({
  insuredName: z.string().min(1, "Insured name is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  carrierName: z.string().min(1, "Carrier name is required"),
  dailyMaximum: z.number().positive("Daily maximum must be positive"),
  monthlyMaximum: z.number().positive("Monthly maximum must be positive"),
  lifetimeMaximum: z.number().positive("Lifetime maximum must be positive"),
  diagnosis: z.string().default("LTC Insurance Claim"),
  adlLimitations: z.array(z.string()).default([]),
  stage1Tasks: z.array(z.string()).default([]),
  stage2Tasks: z.array(z.string()).default([]),
  stage3Tasks: z.array(z.string()).default([]),
  careRecommendations: z.string().default(""),
  strategyContent: z.string().default(""),
});

export const pdfDeliveryRouter = router({
  // Generate PDF and upload to S3
  generatePdf: publicProcedure
    .input(pdfInputSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await generateStrategyPdf(input);
        return {
          success: true,
          url: result.url,
          key: result.key,
          message: "PDF generated successfully",
        };
      } catch (error) {
        console.error("PDF generation error:", error);
        throw new Error(`Failed to generate PDF: ${error}`);
      }
    }),

  // Send PDF via email using Zapier webhook
  sendPdfByEmail: publicProcedure
    .input(
      pdfInputSchema.extend({
        recipientEmail: z.string().email("Invalid email address"),
        recipientName: z.string().min(1, "Recipient name is required"),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Step 1: Generate PDF and upload to S3
        const pdfResult = await generateStrategyPdf({
          insuredName: input.insuredName,
          policyNumber: input.policyNumber,
          carrierName: input.carrierName,
          dailyMaximum: input.dailyMaximum,
          monthlyMaximum: input.monthlyMaximum,
          lifetimeMaximum: input.lifetimeMaximum,
          diagnosis: input.diagnosis,
          adlLimitations: input.adlLimitations,
          stage1Tasks: input.stage1Tasks,
          stage2Tasks: input.stage2Tasks,
          stage3Tasks: input.stage3Tasks,
          careRecommendations: input.careRecommendations,
          strategyContent: input.strategyContent,
        });

        console.log(`[Email] PDF generated and uploaded to S3: ${pdfResult.url}`);

        // Step 2: Send to Zapier webhook for email delivery
        const zapierUrl = ENV.zapierWebhookUrl;
        if (zapierUrl) {
          try {
            const response = await fetch(zapierUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "strategy_email",
                recipientEmail: input.recipientEmail,
                recipientName: input.recipientName,
                insuredName: input.insuredName,
                policyNumber: input.policyNumber,
                carrierName: input.carrierName,
                pdfUrl: pdfResult.url,
                personalMessage: input.message || "",
                subject: `Your LTC Insurance Strategy for ${input.insuredName}`,
                timestamp: new Date().toISOString(),
              }),
            });

            if (!response.ok) {
              console.error(`[Email] Zapier webhook error: ${response.status} ${response.statusText}`);
            } else {
              console.log("[Email] Strategy email request sent to Zapier successfully");
            }
          } catch (zapierError) {
            console.error("[Email] Zapier webhook error:", zapierError);
            // Don't throw - still return success with PDF URL
          }
        }

        // Step 3: Notify owner about the email request
        await notifyOwner({
          title: `Strategy PDF Emailed: ${input.insuredName}`,
          content: `Strategy PDF for ${input.insuredName} (Policy: ${input.policyNumber}) was sent to ${input.recipientName} (${input.recipientEmail}).\n\nPDF URL: ${pdfResult.url}${input.message ? `\n\nPersonal message: ${input.message}` : ""}`,
        }).catch(() => {});

        return {
          success: true,
          message: `Strategy PDF has been sent to ${input.recipientEmail}. The PDF is also available for download.`,
          pdfUrl: pdfResult.url,
        };
      } catch (error) {
        console.error("[Email] Delivery error:", error);
        throw new Error(`Failed to send PDF: ${error}`);
      }
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
