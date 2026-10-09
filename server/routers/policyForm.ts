import { z } from "zod";
import { getTableColumns } from "drizzle-orm";
import { visitorProcedure, router } from "../_core/trpc";
import { postWebhook } from "../_core/delivery";
import { policies } from "../../drizzle/schema";
import { readPolicyMetadata } from "../../shared/policyMetadata";
import { applyTaskCompletions } from "../../shared/strategyState";
import { getPolicyByUserId, getStrategyByPolicyId, getDocumentsByUserId, getUserContacts, getTaskCompletions } from "../db";
import type { TrpcContext } from "../_core/context";

const policyKeys = Object.keys(getTableColumns(policies)).filter(key => !["userId", "equipmentAllowance"].includes(key));
function policyPayload(value: Record<string, unknown>, draft = false) {
  const fields = Object.fromEntries(policyKeys.filter(key => value[key] !== undefined && (!draft || !["id", "createdAt", "updatedAt"].includes(key))).map(key => [key, value[key]]));
  return { ...fields, ...readPolicyMetadata(value.equipmentAllowance), ...readPolicyMetadata(JSON.stringify(value)) };
}

type Handoff = { trigger: string; currentPage?: string; formStep?: number; sessionDurationSeconds?: number; unsavedFormData?: Record<string, unknown> };
async function sendHandoff(user: NonNullable<TrpcContext["user"]>, input: Handoff) {
  try {
    const policy = await getPolicyByUserId(user.id);
    const strategy = policy ? await getStrategyByPolicyId(policy.id, user.id) : undefined;
    const documents = await getDocumentsByUserId(user.id);
    const contacts = await getUserContacts(user.id);
    const completions = strategy ? await getTaskCompletions(user.id, strategy.id) : [];
    const payload = {
      _meta: { timestamp: new Date().toISOString(), trigger: input.trigger, currentPage: input.currentPage ?? null, formStep: input.formStep ?? null, sessionDurationSeconds: input.sessionDurationSeconds ?? null, portalVersion: "1.0" },
      user: { id: user.id, name: user.name, email: user.email, openId: user.openId, role: user.role, createdAt: user.createdAt, lastSignedIn: user.lastSignedIn },
      policyForm: policy ? policyPayload(policy) : null,
      unsavedFormData: input.unsavedFormData ? policyPayload(input.unsavedFormData, true) : null,
      strategy: strategy ? {
        id: strategy.id, policyId: strategy.policyId, currentStage: strategy.currentStage, claimStatus: strategy.claimStatus,
        strategyContent: strategy.strategyContent,
        stage1Tasks: applyTaskCompletions(Array.isArray(strategy.stage1Tasks) ? strategy.stage1Tasks : [], completions),
        stage2Tasks: applyTaskCompletions(Array.isArray(strategy.stage2Tasks) ? strategy.stage2Tasks : [], completions),
        stage3Tasks: applyTaskCompletions(Array.isArray(strategy.stage3Tasks) ? strategy.stage3Tasks : [], completions),
        generatedAt: strategy.generatedAt, createdAt: strategy.createdAt, updatedAt: strategy.updatedAt,
      } : null,
      documents: documents.map(document => ({ id: document.id, category: document.category, fileName: document.fileName, fileUrl: document.fileUrl, mimeType: document.mimeType, fileSize: document.fileSize, taskId: document.taskId, createdAt: document.createdAt })),
      contacts: contacts.map(contact => ({ id: contact.id, name: contact.name, email: contact.email, relationship: contact.relationship, receiveCcEmails: contact.receiveCcEmails })),
    };
    await postWebhook(payload);
    return { success: true, status: "accepted" as const, message: "Office handoff accepted by the receiving service. Email delivery is not confirmed." };
  } catch {
    return { success: false, status: "failed" as const, message: "Office handoff was not accepted. Please try again or contact the office." };
  }
}

export const policyFormRouter = router({
  sendComprehensiveToZapier: visitorProcedure.input(z.object({
    trigger: z.enum(["form_completed", "strategy_completed", "exit", "timeout"]),
    currentPage: z.string().max(100).optional(),
    formStep: z.number().int().min(0).max(5).optional(),
    sessionDurationSeconds: z.number().int().nonnegative().optional(),
    unsavedFormData: z.record(z.string(), z.unknown()).optional(),
  })).mutation(({ input, ctx }) => sendHandoff(ctx.user, input)),
  // Retain legacy trigger names while using exactly the same payload and transport.
  sendToZapier: visitorProcedure.input(z.object({
    formData: z.record(z.string(), z.unknown()).optional(),
    trigger: z.enum(["completed", "exit", "timeout", "save"]),
    currentStep: z.number().int().min(0).max(6).optional(),
    completionPercentage: z.number().min(0).max(100).optional(),
    sessionDurationSeconds: z.number().int().nonnegative().optional(),
  })).mutation(({ input, ctx }) => sendHandoff(ctx.user, {
    trigger: { completed: "form_completed", exit: "exit", timeout: "timeout", save: "exit" }[input.trigger],
    formStep: input.currentStep, sessionDurationSeconds: input.sessionDurationSeconds, unsavedFormData: input.formData,
  })),
});
