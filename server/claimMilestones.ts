import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { claimMilestoneEvents, documentUploads, strategies } from "../drizzle/schema";
import { getDb } from "./db";

export const ACTUAL_CLAIM_MILESTONE_KINDS = [
  "claim_notice", "claim_submitted", "care_started",
  "elimination_evidence_sent", "first_payment_received",
] as const;
export type ActualClaimMilestoneKind = (typeof ACTUAL_CLAIM_MILESTONE_KINDS)[number];
export type ClaimMilestoneKind = ActualClaimMilestoneKind | "carrier_approval";
export type ClaimMilestoneInput = {
  strategyId: number;
  kind: ClaimMilestoneKind;
  effectiveDate: string;
  carrierReference?: string | null;
  evidenceDocumentId?: number | null;
};

export function validActualMilestoneDate(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
  // Actual milestones cannot be future promises. One-day grace for timezone differences.
  return date.getTime() <= now.getTime() + 86400000;
}
export function validCarrierReference(value: string): boolean {
  return !!value.trim() && value.trim().length <= 128 && !/[\x00-\x1f\x7f]/.test(value);
}
const supportedEvidenceTypes = new Set([
  "application/pdf", "image/png", "image/jpeg",
]);

export async function listClaimMilestones(userId: number, strategyId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
  return db.select().from(claimMilestoneEvents)
    .where(and(eq(claimMilestoneEvents.userId, userId), eq(claimMilestoneEvents.strategyId, strategyId)))
    .orderBy(desc(claimMilestoneEvents.id));
}

export async function hasDocumentedCarrierApproval(userId: number, strategyId: number): Promise<boolean> {
  const events = await listClaimMilestones(userId, strategyId);
  // Only explicit evidence-backed entries unlock post-approval tasks. The
  // document is user-uploaded evidence, not independently carrier-verified.
  return events.some(e => e.kind === "carrier_approval" && e.evidenceDocumentId !== null
    && e.evidenceLevel === "user_submitted");
}

export async function isDocumentClaimEvidence(userId: number, documentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
  const rows = await db.select({ id: claimMilestoneEvents.id }).from(claimMilestoneEvents)
    .where(and(eq(claimMilestoneEvents.userId, userId), eq(claimMilestoneEvents.evidenceDocumentId, documentId)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Writes one append-only milestone. Carrier approval and stage transition occur
 * in the same database transaction under a strategy-row lock. No evidence is
 * inferred or verified by AI. The attesting user remains accountable for
 * confirming the document is an actual carrier decision.
 */
export async function recordClaimMilestone(userId: number, input: ClaimMilestoneInput) {
  if (!validActualMilestoneDate(input.effectiveDate)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Supply the actual, valid milestone date." });
  }
  if (input.carrierReference != null && input.carrierReference.length > 0 &&
    !validCarrierReference(input.carrierReference)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The claim reference contains invalid characters." });
  }
  if (input.kind === "carrier_approval") {
    if (!input.evidenceDocumentId || !validCarrierReference(input.carrierReference || "")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Carrier approval requires an uploaded decision letter and a carrier reference." });
    }
  } else if (!ACTUAL_CLAIM_MILESTONE_KINDS.includes(input.kind as ActualClaimMilestoneKind)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported milestone type." });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
  return db.transaction(async tx => {
    const rows = await tx.select({
      id: strategies.id, userId: strategies.userId, policyId: strategies.policyId,
      currentStage: strategies.currentStage,
    }).from(strategies)
      .where(and(eq(strategies.id, input.strategyId), eq(strategies.userId, userId)))
      .for("update");
    if (rows.length !== 1) throw new TRPCError({ code: "NOT_FOUND", message: "Strategy not found" });
    const strategy = rows[0];

    if (input.evidenceDocumentId) {
      const documents = await tx.select({
        id: documentUploads.id, policyId: documentUploads.policyId,
        strategyId: documentUploads.strategyId, fileKey: documentUploads.fileKey,
        mimeType: documentUploads.mimeType,
      }).from(documentUploads)
        .where(and(eq(documentUploads.id, input.evidenceDocumentId), eq(documentUploads.userId, userId)))
        .limit(1);
      const doc = documents[0];
      if (!doc || doc.policyId !== strategy.policyId ||
        (doc.strategyId !== null && doc.strategyId !== input.strategyId) ||
        !doc.fileKey.startsWith("users/" + userId + "/documents/") ||
        !supportedEvidenceTypes.has(doc.mimeType || "")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Select a PDF or image already uploaded for this policy." });
      }
    }

    if (input.kind === "carrier_approval") {
      const prior = await tx.select({ id: claimMilestoneEvents.id }).from(claimMilestoneEvents)
        .where(and(eq(claimMilestoneEvents.userId, userId),
          eq(claimMilestoneEvents.strategyId, input.strategyId),
          eq(claimMilestoneEvents.kind, "carrier_approval")))
        .limit(1);
      if (prior.length) throw new TRPCError({ code: "CONFLICT", message: "Carrier approval evidence has already been recorded." });
    }
    const [result] = await tx.insert(claimMilestoneEvents).values({
      userId,
      strategyId: input.strategyId,
      policyId: strategy.policyId,
      kind: input.kind,
      effectiveDate: input.effectiveDate,
      carrierReference: input.carrierReference?.trim() || null,
      evidenceDocumentId: input.evidenceDocumentId || null,
      approvalDedupeKey: input.kind === "carrier_approval" ?
        "approval:" + userId + ":" + input.strategyId : null,
      attestedByUserId: userId,
      evidenceLevel: "user_submitted",
    });
    if (input.kind === "carrier_approval") {
      await tx.update(strategies)
        .set({ currentStage: 3, claimStatus: "approved" })
        .where(and(eq(strategies.id, input.strategyId), eq(strategies.userId, userId)));
    }
    return {
      id: Number(result.insertId), kind: input.kind,
      effectiveDate: input.effectiveDate, evidenceLevel: "user_submitted" as const,
    };
  });
}
