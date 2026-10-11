import { calculateCare, parseAmount, type CareInputs } from "@shared/careCalculator";

/** Only validation and persistence routing change; calculation formulas are untouched. */
export function validateLocalCareScenario(inputs: CareInputs, policy: Record<string, any>) {
  const result = calculateCare(inputs);
  const errors = Object.keys(result.errors);
  if (errors.length || !result.result) return { status: "needs_review" as const,
    reason: "Review calculator fields: " + errors.slice(0, 8).join(", ") };
  if (inputs.eligibility !== "confirmed" || !inputs.termsConfirmed)
    return {status:"needs_review" as const,reason:"Please confirm eligibility and policy terms for report projections."};
  const sameMoney = (a: string, b: unknown) => {
    const x = parseAmount(a), y = parseAmount(String(b || ""));
    return x !== null && y !== null && Math.round(x * 100) === Math.round(y * 100);
  };
  if (!sameMoney(inputs.totalPool, policy.lifetimeMaximum))
    return {status:"needs_review" as const,reason:"The lifetime pool does not match the policy."};
  const pool = parseAmount(inputs.totalPool), remaining = parseAmount(inputs.remainingPool);
  if (remaining === null || pool === null || remaining > pool)
    return {status:"needs_review" as const,reason:"Confirm the remaining lifetime benefit pool."};
  if (["daily","both"].includes(inputs.capType) && !sameMoney(inputs.dailyMax,policy.dailyMaximum))
    return {status:"needs_review" as const,reason:"Daily benefit does not match the policy."};
  if (["monthly","both"].includes(inputs.capType) && !sameMoney(inputs.monthlyMax,policy.monthlyMaximum))
    return {status:"needs_review" as const,reason:"Monthly benefit does not match the policy."};
  const allowedWaiting = Number(policy.eliminationPeriod);
  const waiting = parseAmount(inputs.eliminationRemaining);
  if (!/^(0|[1-9][0-9]*)$/.test(String(policy.eliminationPeriod || "")) ||
      waiting === null || !Number.isInteger(waiting) || waiting > allowedWaiting)
    return {status:"needs_review" as const,reason:"Waiting-period balance must agree with policy terms."};
  return {status:"saved_valid" as const,reason:null};
}
