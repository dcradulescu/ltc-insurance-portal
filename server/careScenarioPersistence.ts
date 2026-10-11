import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { policies, strategies, type Policy } from "../drizzle/schema";
import { calculateCare, parseAmount, type CareInputs } from "../shared/careCalculator";
import { canonicalCareInputsSchema } from "../shared/careScenarioSchema";
import { getDb } from "./db";

const RECORD_VERSION = 1 as const;

export type CareScenarioRecord = {
  version: typeof RECORD_VERSION;
  policyId: number;
  policyFingerprint: string;
  savedAt: string;
  inputs: CareInputs;
};
export type CareScenarioResult = {
  status: "empty" | "saved_valid" | "needs_review";
  inputs: CareInputs | null;
  savedAt: string | null;
  reason: string | null;
  policyChanged: boolean;
};

/** A fingerprint of the actual saved funding/policy terms, never client input. */
export function fingerprintPolicy(policy: Policy): string {
  const fields = [
    policy.id, policy.policyNumber, policy.carrierName, policy.insuredFullName,
    policy.dailyMaximum, policy.monthlyMaximum, policy.lifetimeMaximum,
    policy.eliminationPeriod, policy.inflationProtection,
    policy.waiverOfPremium, policy.assignmentOfBenefits,
  ];
  return createHash("sha256").update(JSON.stringify(fields)).digest("hex");
}
function sameCents(value: string, stored: string | null): boolean {
  const n = parseAmount(value), p = stored ? parseAmount(stored) : null;
  return n !== null && p !== null && Math.round(n * 100) === Math.round(p * 100);
}
export function validateScenarioForPolicy(inputs: CareInputs, policy: Policy): {
  valid: boolean;
  reason: string | null;
} {
  const result = calculateCare(inputs);
  const errors = Object.keys(result.errors);
  if (errors.length || !result.result) {
    return { valid: false, reason: "Review calculator fields: " + errors.slice(0, 8).join(", ") };
  }
  if (inputs.eligibility !== "confirmed" || !inputs.termsConfirmed) {
    return { valid: false, reason: "Benefit eligibility and policy terms must be confirmed for the report." };
  }
  if (!sameCents(inputs.totalPool, policy.lifetimeMaximum)) {
    return { valid: false, reason: "Total benefit maximum does not match the saved policy." };
  }
  const remainder = parseAmount(inputs.remainingPool);
  const total = policy.lifetimeMaximum ? parseAmount(policy.lifetimeMaximum) : null;
  if (remainder === null || total === null || remainder > total) {
    return { valid: false, reason: "Remaining benefit pool requires confirmation." };
  }
  if (["daily", "both"].includes(inputs.capType) &&
      !sameCents(inputs.dailyMax, policy.dailyMaximum)) {
    return { valid: false, reason: "Daily limit does not match the saved policy." };
  }
  if (["monthly", "both"].includes(inputs.capType) &&
      !sameCents(inputs.monthlyMax, policy.monthlyMaximum)) {
    return { valid: false, reason: "Monthly limit does not match the saved policy." };
  }
  // The historical waiting-period total may have been partially satisfied.
  // Do not infer how days count; the user confirms the method and remaining days.
  const waiting = policy.eliminationPeriod?.trim();
  const totalWaiting = waiting && /^\d+$/.test(waiting) ? Number(waiting) : null;
  const daysLeft = parseAmount(inputs.eliminationRemaining);
  if (totalWaiting === null || !Number.isSafeInteger(totalWaiting) ||
      daysLeft === null || !Number.isInteger(daysLeft) || daysLeft > totalWaiting) {
    return { valid: false, reason: "Waiting-period balance is inconsistent with the saved policy." };
  }
  return { valid: true, reason: null };
}

export function readStoredCareScenario(
  record: unknown,
  policy: Policy,
): CareScenarioResult {
  if (record === null || record === undefined) {
    return {status:"empty", inputs:null, savedAt:null, reason:null, policyChanged:false};
  }
  if (!record || typeof record !== "object") {
    return {status:"needs_review",inputs:null,savedAt:null,
      reason:"Previously saved scenario is not in the supported format.",policyChanged:false};
  }
  const data = record as Partial<CareScenarioRecord>;
  if (data.version !== RECORD_VERSION || !Number.isInteger(data.policyId) ||
      typeof data.policyFingerprint !== "string" ||
      typeof data.savedAt !== "string") {
    return {status:"needs_review",inputs:null,savedAt:null,
      reason:"Previously saved scenario must be reviewed before reuse.",policyChanged:false};
  }
  const parsed = canonicalCareInputsSchema.safeParse(data.inputs);
  if (!parsed.success) {
    return {status:"needs_review",inputs:null,savedAt:data.savedAt,
      reason:"Saved scenario has an unsupported input format.",policyChanged:false};
  }
  const changed = data.policyId !== policy.id ||
    data.policyFingerprint !== fingerprintPolicy(policy);
  if (changed) {
    return {status:"needs_review",inputs:parsed.data,savedAt:data.savedAt,
      reason:"Saved policy terms changed. Reconfirm the calculator before generating projections.",
      policyChanged:true};
  }
  const assessment = validateScenarioForPolicy(parsed.data,policy);
  return {
    status: assessment.valid ? "saved_valid" : "needs_review",
    inputs: parsed.data,
    savedAt: data.savedAt,
    reason: assessment.reason,
    policyChanged: false,
  };
}

async function getOwnedStrategyAndPolicy(userId: number, strategyId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({code:"SERVICE_UNAVAILABLE",message:"Database unavailable"});
  const [strategy] = await db.select().from(strategies)
    .where(and(eq(strategies.id,strategyId),eq(strategies.userId,userId))).limit(1);
  if (!strategy) throw new TRPCError({code:"NOT_FOUND",message:"Strategy not found"});
  const [policy] = await db.select().from(policies)
    .where(and(eq(policies.id,strategy.policyId),eq(policies.userId,userId))).limit(1);
  if (!policy) throw new TRPCError({code:"NOT_FOUND",message:"Policy not found"});
  return {db,strategy,policy};
}

export async function getSavedCareScenario(userId: number, strategyId: number) {
  const {strategy,policy} = await getOwnedStrategyAndPolicy(userId,strategyId);
  return readStoredCareScenario(strategy.careScenario,policy);
}

export async function saveOwnedCareScenario(
  userId: number,
  strategyId: number,
  submitted: CareInputs,
): Promise<CareScenarioResult> {
  const parsed = canonicalCareInputsSchema.safeParse(submitted);
  if (!parsed.success) {
    throw new TRPCError({code:"BAD_REQUEST",message:"Unsupported care-scenario input fields."});
  }
  const db = await getDb();
  if (!db) throw new TRPCError({code:"SERVICE_UNAVAILABLE",message:"Database unavailable"});
  return db.transaction(async tx => {
    // Lock the owned strategy first to serialize concurrent saves.
    const [strategy] = await tx.select().from(strategies)
      .where(and(eq(strategies.id,strategyId),eq(strategies.userId,userId)))
      .for("update");
    if (!strategy) throw new TRPCError({code:"NOT_FOUND",message:"Strategy not found"});
    const [policy] = await tx.select().from(policies)
      .where(and(eq(policies.id,strategy.policyId),eq(policies.userId,userId)))
      .limit(1);
    if (!policy) throw new TRPCError({code:"NOT_FOUND",message:"Policy not found"});
    const snapshot: CareScenarioRecord = {
      version:RECORD_VERSION,
      policyId:policy.id,
      policyFingerprint:fingerprintPolicy(policy),
      savedAt:new Date().toISOString(),
      inputs:parsed.data,
    };
    const [updated] = await tx.update(strategies)
      .set({careScenario:snapshot})
      .where(and(eq(strategies.id,strategyId),eq(strategies.userId,userId)));
    if (updated.affectedRows !== 1) {
      throw new TRPCError({code:"CONFLICT",message:"Scenario could not be saved to this account."});
    }
    return readStoredCareScenario(snapshot,policy);
  });
}
