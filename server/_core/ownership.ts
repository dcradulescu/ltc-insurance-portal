import { TRPCError } from "@trpc/server";
import { getPolicyById, getStrategyById, getUserContacts } from "../db";

export function owned<T extends { userId: number }>(record: T | undefined, userId: number): T {
  if (!record || record.userId !== userId) throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
  return record;
}
export async function requireOwnedPolicy(id: number, userId: number) {
  return owned(await getPolicyById(id), userId);
}
export async function requireOwnedStrategy(id: number, userId: number) {
  const strategy = owned(await getStrategyById(id), userId);
  await requireOwnedPolicy(strategy.policyId, userId);
  return strategy;
}
export async function requireOwnedContact(id: number, userId: number) {
  return owned((await getUserContacts(userId)).find(contact => contact.id === id), userId);
}
