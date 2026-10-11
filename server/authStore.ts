import { and, eq, gt } from "drizzle-orm";
import { createHash } from "node:crypto";
import { portalAccounts, portalSessions, users } from "../drizzle/schema";
import { getDb } from "./db";

export const sessionHash = (value: string) => createHash("sha256").update(value).digest("hex");
async function database() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}
export async function getAccount(email: string) {
  const db = await database();
  const rows = await db.select({ account: portalAccounts, user: users })
    .from(portalAccounts).innerJoin(users, eq(users.id, portalAccounts.userId))
    .where(eq(portalAccounts.email, email)).limit(1);
  return rows[0];
}
export async function getAccountByUserId(userId: number) {
  const db = await database();
  return (await db.select().from(portalAccounts).where(eq(portalAccounts.userId, userId)).limit(1))[0];
}
export async function changeAccountPassword(userId: number, expectedHash: string, passwordHash: string, sessionId: string) {
  const db = await database();
  return db.transaction(async tx => {
    const current = (await tx.select().from(portalAccounts).where(eq(portalAccounts.userId, userId)).limit(1).for("update"))[0];
    if (!current?.active || current.passwordHash !== expectedHash || (current.lockedUntil && current.lockedUntil > new Date())) return false;
    const session = (await tx.select().from(portalSessions).where(and(
      eq(portalSessions.tokenHash, sessionHash(sessionId)), eq(portalSessions.userId, userId), gt(portalSessions.expiresAt, new Date()),
    )).limit(1).for("update"))[0];
    if (!session) return false;
    await tx.update(portalAccounts).set({ passwordHash, failedAttempts: 0, lockedUntil: null }).where(eq(portalAccounts.userId, userId));
    await tx.delete(portalSessions).where(eq(portalSessions.userId, userId));
    return true;
  });
}
export async function recordFailedLogin(userId: number) {
  const db = await database();
  await db.transaction(async tx => {
    const current = (await tx.select().from(portalAccounts).where(eq(portalAccounts.userId, userId)).limit(1).for("update"))[0];
    const now = new Date();
    if (!current?.active || (current.lockedUntil && current.lockedUntil > now)) return;
    // Compute from the locked row: MySQL evaluates UPDATE assignments in order,
    // and the ORM emits schema-column order rather than object-property order.
    const attempts = (current.lockedUntil ? 0 : current.failedAttempts) + 1;
    await tx.update(portalAccounts).set({
      failedAttempts: attempts,
      lockedUntil: attempts >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null,
    }).where(eq(portalAccounts.userId, userId));
  });
}
export async function createLoginSession(userId: number, sessionId: string, expiresAt: Date, expectedPasswordHash: string) {
  const db = await database();
  await db.transaction(async tx => {
    const current = (await tx.select().from(portalAccounts).where(eq(portalAccounts.userId, userId)).limit(1).for("update"))[0];
    if (!current?.active || current.passwordHash !== expectedPasswordHash || (current.lockedUntil && current.lockedUntil > new Date())) {
      throw new Error("Account changed during sign-in; please try again");
    }
    await tx.update(portalAccounts).set({ failedAttempts: 0, lockedUntil: null }).where(eq(portalAccounts.userId, userId));
    await tx.insert(portalSessions).values({ tokenHash: sessionHash(sessionId), userId, expiresAt });
    await tx.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
  });
}
export async function hasActiveSession(sessionId: string, userId: number) {
  const db = await database();
  const rows = await db.select({ id: portalSessions.userId }).from(portalSessions)
    .innerJoin(portalAccounts, eq(portalAccounts.userId, portalSessions.userId))
    .where(and(eq(portalSessions.tokenHash, sessionHash(sessionId)), eq(portalSessions.userId, userId),
      gt(portalSessions.expiresAt, new Date()), eq(portalAccounts.active, true))).limit(1);
  return rows.length === 1;
}
export async function revokeSession(sessionId: string) {
  const db = await database();
  await db.delete(portalSessions).where(eq(portalSessions.tokenHash, sessionHash(sessionId)));
}
