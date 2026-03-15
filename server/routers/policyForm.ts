import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import {
  getPolicyByUserId, getStrategyByUserId,
  getDocumentsByUserId, getUserContacts,
} from "../db";

/**
 * Gathers ALL user data (profile, policy form, strategy, documents, contacts)
 * into one comprehensive JSON payload and sends it to the Zapier webhook.
 *
 * Triggers:
 *  - "form_completed"    → user finishes the policy form
 *  - "strategy_completed"→ user finishes / generates their strategy (last step)
 *  - "exit"              → user navigates away or closes the tab
 *  - "timeout"           → user is inactive for 15 minutes
 */
export const policyFormRouter = router({
  /**
   * Send the COMPREHENSIVE JSON to Zapier webhook.
   * Called once when user completes strategy, exits, or times out.
   */
  sendComprehensiveToZapier: publicProcedure
    .input(
      z.object({
        trigger: z.enum(["form_completed", "strategy_completed", "exit", "timeout"]),
        currentPage: z.string().optional(),
        formStep: z.number().optional(),
        sessionDurationSeconds: z.number().optional(),
        // Allow passing current unsaved form data so we capture the latest state
        unsavedFormData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const webhookUrl = ENV.zapierWebhookUrl;

        if (!webhookUrl) {
          console.warn("[Zapier] Webhook URL not configured — skipping send");
          return { success: false, message: "Webhook URL not configured" };
        }

        // Default userId for public access
        const userId = 1;

        // ── 1. User Profile ──
        const userProfile = ctx.user
          ? {
              id: ctx.user.id,
              name: ctx.user.name,
              email: ctx.user.email,
              openId: ctx.user.openId,
              role: ctx.user.role,
              createdAt: ctx.user.createdAt,
              lastSignedIn: ctx.user.lastSignedIn,
            }
          : { id: null, name: "Guest", email: null, openId: null, role: null, createdAt: null, lastSignedIn: null };

        // ── 2. Policy Form Data ──
        const policy = await getPolicyByUserId(userId);
        const policyData = policy
          ? {
              id: policy.id,
              // Insured Person
              insuredFullName: policy.insuredFullName,
              insuredDob: policy.insuredDob,
              insuredMailingAddress: policy.insuredMailingAddress,
              insuredSsn: policy.insuredSsn,
              insuredMedicareNumber: policy.insuredMedicareNumber,
              insuredMedicaidNumber: policy.insuredMedicaidNumber,
              powerOfAttorneyPresent: policy.powerOfAttorneyPresent,
              // Carrier Info
              carrierName: policy.carrierName,
              carrierAddress1: policy.carrierAddress1,
              carrierAddress2: policy.carrierAddress2,
              carrierCityStateZip: policy.carrierCityStateZip,
              carrierPhone: policy.carrierPhone,
              carrierFax: policy.carrierFax,
              // Policy Identifiers
              policyNumber: policy.policyNumber,
              claimPreClaimNumber: policy.claimPreClaimNumber,
              // Coverage Details
              eliminationPeriod: policy.eliminationPeriod,
              dailyMaximum: policy.dailyMaximum,
              monthlyMaximum: policy.monthlyMaximum,
              lifetimeMaximum: policy.lifetimeMaximum,
              minAdlsRequired: policy.minAdlsRequired,
              waiverOfPremium: policy.waiverOfPremium,
              cnaRequired: policy.cnaRequired,
              careNotesRequired: policy.careNotesRequired,
              paymentCycle: policy.paymentCycle,
              assignmentOfBenefits: policy.assignmentOfBenefits,
              // Medical / Administrative
              caseManagerName: policy.caseManagerName,
              thirdPartyAssessmentRequired: policy.thirdPartyAssessmentRequired,
              thirdPartyAssessmentWho: policy.thirdPartyAssessmentWho,
              cognitiveImpairmentTrigger: policy.cognitiveImpairmentTrigger,
              planOfCareStatus: policy.planOfCareStatus,
              ltcCoordinatorAssigned: policy.ltcCoordinatorAssigned,
              // Medical Providers
              primaryCarePhysician: policy.primaryCarePhysician,
              otherProviders: policy.otherProviders,
              facilitiesUsed: policy.facilitiesUsed,
              dischargeDocumentation: policy.dischargeDocumentation,
              // Care Needs
              currentCareNeeds: policy.currentCareNeeds,
              diagnosisOrCondition: policy.diagnosisOrCondition,
              adlLimitations: policy.adlLimitations,
              preferredCareType: policy.preferredCareType,
              additionalNotes: policy.additionalNotes,
              fillerRelationship: policy.fillerRelationship,
              // Timestamps
              createdAt: policy.createdAt,
              updatedAt: policy.updatedAt,
            }
          : null;

        // ── 3. Strategy Data ──
        const strategy = await getStrategyByUserId(userId);
        const strategyData = strategy
          ? {
              id: strategy.id,
              policyId: strategy.policyId,
              currentStage: strategy.currentStage,
              claimStatus: strategy.claimStatus,
              strategyContent: strategy.strategyContent,
              stage1Tasks: strategy.stage1Tasks,
              stage2Tasks: strategy.stage2Tasks,
              stage3Tasks: strategy.stage3Tasks,
              generatedAt: strategy.generatedAt,
              createdAt: strategy.createdAt,
              updatedAt: strategy.updatedAt,
            }
          : null;

        // ── 4. Documents ──
        const documents = await getDocumentsByUserId(userId);
        const documentsData = documents.map((doc) => ({
          id: doc.id,
          category: doc.category,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          taskId: doc.taskId,
          createdAt: doc.createdAt,
        }));

        // ── 5. Contacts ──
        const contacts = await getUserContacts(userId);
        const contactsData = contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          relationship: c.relationship,
          receiveCcEmails: c.receiveCcEmails,
        }));

        // ── Build the comprehensive payload ──
        const payload = {
          _meta: {
            timestamp: new Date().toISOString(),
            trigger: input.trigger,
            currentPage: input.currentPage || null,
            formStep: input.formStep || null,
            sessionDurationSeconds: input.sessionDurationSeconds || null,
            portalVersion: "1.0",
          },
          user: userProfile,
          policyForm: policyData,
          unsavedFormData: input.unsavedFormData || null,
          strategy: strategyData,
          documents: documentsData,
          contacts: contactsData,
        };

        console.log(
          `[Zapier] Sending COMPREHENSIVE payload (trigger: ${input.trigger}) — ` +
            `user: ${userProfile.name}, policy: ${policyData?.id ?? "none"}, ` +
            `strategy: ${strategyData?.id ?? "none"}, docs: ${documentsData.length}, contacts: ${contactsData.length}`
        );

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

        return { success: true, message: "Comprehensive data sent to Zapier" };
      } catch (error) {
        console.error("[Zapier] Send error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Legacy endpoint kept for backward compatibility.
   * Redirects to the comprehensive sender.
   */
  sendToZapier: publicProcedure
    .input(
      z.object({
        formData: z.record(z.string(), z.any()).optional(),
        trigger: z.enum(["completed", "exit", "timeout", "save"]),
        currentStep: z.number().optional(),
        completionPercentage: z.number().optional(),
        sessionDurationSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Map old triggers to new triggers
      const triggerMap: Record<string, string> = {
        completed: "form_completed",
        exit: "exit",
        timeout: "timeout",
        save: "exit",
      };

      try {
        const webhookUrl = ENV.zapierWebhookUrl;
        if (!webhookUrl) {
          console.warn("[Zapier] Webhook URL not configured — skipping send");
          return { success: false, message: "Webhook URL not configured" };
        }

        const userId = 1;
        const policy = await getPolicyByUserId(userId);
        const strategy = await getStrategyByUserId(userId);
        const documents = await getDocumentsByUserId(userId);
        const contacts = await getUserContacts(userId);

        const payload = {
          _meta: {
            timestamp: new Date().toISOString(),
            trigger: triggerMap[input.trigger] || input.trigger,
            formStep: input.currentStep || null,
            sessionDurationSeconds: input.sessionDurationSeconds || null,
            portalVersion: "1.0",
          },
          user: ctx.user
            ? {
                id: ctx.user.id,
                name: ctx.user.name,
                email: ctx.user.email,
                openId: ctx.user.openId,
                role: ctx.user.role,
              }
            : { id: null, name: "Guest", email: null },
          policyForm: policy || null,
          unsavedFormData: input.formData || null,
          strategy: strategy
            ? {
                id: strategy.id,
                currentStage: strategy.currentStage,
                claimStatus: strategy.claimStatus,
                strategyContent: strategy.strategyContent,
                stage1Tasks: strategy.stage1Tasks,
                stage2Tasks: strategy.stage2Tasks,
                stage3Tasks: strategy.stage3Tasks,
                generatedAt: strategy.generatedAt,
              }
            : null,
          documents: documents.map((d) => ({
            id: d.id,
            category: d.category,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            mimeType: d.mimeType,
          })),
          contacts: contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            relationship: c.relationship,
          })),
        };

        console.log(`[Zapier] Sending comprehensive payload (trigger: ${input.trigger})`);
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error("[Zapier] Webhook error:", responseText);
          return { success: false, message: "Webhook delivery failed" };
        }

        return { success: true, message: "Comprehensive data sent to Zapier" };
      } catch (error) {
        console.error("[Zapier] Send error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
