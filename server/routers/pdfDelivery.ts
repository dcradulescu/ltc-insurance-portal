import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { generateStrategyPdf } from "../strategyPdfGenerator";
import { sendEmail } from "../_core/email";

export const pdfDeliveryRouter = router({
  // Generate and download PDF
  generatePdf: publicProcedure
    .input(
      z.object({
        insuredName: z.string().min(1, "Insured name is required"),
        policyNumber: z.string().min(1, "Policy number is required"),
        carrierName: z.string().min(1, "Carrier name is required"),
        dailyMaximum: z.number().positive("Daily maximum must be positive"),
        monthlyMaximum: z.number().positive("Monthly maximum must be positive"),
        lifetimeMaximum: z.number().positive("Lifetime maximum must be positive"),
        diagnosis: z.string().min(1, "Diagnosis is required"),
        adlLimitations: z.array(z.string()).default([]),
        stage1Tasks: z.array(z.string()).default([]),
        stage2Tasks: z.array(z.string()).default([]),
        stage3Tasks: z.array(z.string()).default([]),
        careRecommendations: z.string().default(""),
        strategyContent: z.string().default(""),
      })
    )
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

  // Send PDF via email
  sendPdfByEmail: publicProcedure
    .input(
      z.object({
        recipientEmail: z.string().email("Invalid email address"),
        recipientName: z.string().min(1, "Recipient name is required"),
        insuredName: z.string().min(1, "Insured name is required"),
        policyNumber: z.string().min(1, "Policy number is required"),
        carrierName: z.string().min(1, "Carrier name is required"),
        dailyMaximum: z.number().positive("Daily maximum must be positive"),
        monthlyMaximum: z.number().positive("Monthly maximum must be positive"),
        lifetimeMaximum: z.number().positive("Lifetime maximum must be positive"),
        diagnosis: z.string().min(1, "Diagnosis is required"),
        adlLimitations: z.array(z.string()).default([]),
        stage1Tasks: z.array(z.string()).default([]),
        stage2Tasks: z.array(z.string()).default([]),
        stage3Tasks: z.array(z.string()).default([]),
        careRecommendations: z.string().default(""),
        strategyContent: z.string().default(""),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate PDF
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

        // Send email with PDF
        const emailSubject = `Your LTC Insurance Strategy for ${input.insuredName}`;
        const emailBody = `
Dear ${input.recipientName},

Please find attached your personalized LTC Insurance Claim Strategy Guide for ${input.insuredName}.

This document contains:
- Executive Summary of Benefits
- Policy Overview
- Care Recommendations
- Three-Stage Strategy (Prior to Claim, During Claim, Post-Approval)
- Home Care Options with Visiting Angels
- Important Legal Disclaimers

${input.message ? `\nAdditional Notes:\n${input.message}\n` : ""}

IMPORTANT LEGAL DISCLAIMER:
This document is provided for informational and educational purposes only. It is not legal advice, medical advice, or a guarantee of insurance benefits. Each situation is unique. Please consult with your insurance carrier directly to confirm all details specific to your policy.

For questions about home care services, please contact:
- Visiting Angels: www.visitingangels.com
- SC Visiting Angels: www.scvisitingangels.com

Best regards,
LTC Navigator
Powered by Visiting Angels
        `;

        // Send email (using existing email service)
        await sendEmail({
          to: input.recipientEmail,
          subject: emailSubject,
          html: emailBody,
          attachments: [
            {
              filename: `LTC-Strategy-${input.insuredName.replace(/\s+/g, "-")}.pdf`,
              path: pdfResult.url, // URL to PDF in S3
              contentType: "application/pdf",
            },
          ],
        });

        return {
          success: true,
          message: `Strategy PDF sent successfully to ${input.recipientEmail}`,
          pdfUrl: pdfResult.url,
        };
      } catch (error) {
        console.error("Email delivery error:", error);
        throw new Error(`Failed to send PDF: ${error}`);
      }
    }),

  // Validate email before sending
  validateEmail: publicProcedure
    .input(z.object({ email: z.string().email("Invalid email address") }))
    .query(async ({ input }) => {
      // Basic validation - in production, you might want to verify the email exists
      return {
        valid: true,
        email: input.email,
        message: "Email is valid",
      };
    }),
});
