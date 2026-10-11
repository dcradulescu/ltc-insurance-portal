import { updatePreferences } from "../preferences";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { parse } from "cookie";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";
import { hashPassword, verifyPassword } from "../_core/password";
import { getSessionCookieOptions } from "../_core/cookies";
import { getAccount, recordFailedLogin, createLoginSession, revokeSession, getAccountByUserId, changeAccountPassword } from "../authStore";
import { getDb } from "../db";

const SESSION_MS = 8 * 60 * 60 * 1000;
const defaults = { notifyOnNewPolicy: true, notifyOnStrategyGenerated: true, notifyOnContactForm: true };
let verifying = 0;
export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),
  login: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      if (verifying >= 2) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait and try again" });
      verifying++;
      try {
        if (ENV.cookieSecret.length < 64) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sign-in is not configured" });
        const result = await getAccount(input.email.toLowerCase());
        const correct = await verifyPassword(input.password, result?.account.passwordHash);
        const locked = !!result?.account.lockedUntil && result.account.lockedUntil > new Date();
        if (!result || !correct || !result.account.active || locked) {
          if (result && !locked) await recordFailedLogin(result.user.id);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Unable to sign in. Check your details or contact the office." });
        }
        const sessionId = randomBytes(32).toString("hex");
        const token = await sdk.signSession({ openId: result.user.openId, appId: ENV.appId,
          name: result.user.name || "User", sessionId }, { expiresInMs: SESSION_MS });
        await createLoginSession(result.user.id, sessionId, new Date(Date.now() + SESSION_MS), result.account.passwordHash);
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_MS });
        return { success: true };
      } finally { verifying--; }
    }),
  changePassword: protectedProcedure.input(z.object({
    currentPassword: z.string().min(1).max(128), newPassword: z.string().min(15).max(128),
  })).mutation(async ({ ctx, input }) => {
    if (verifying >= 2) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait and try again" });
    verifying++;
    try {
      const account = await getAccountByUserId(ctx.user.id);
      if (!account?.active) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in again to change your password." });
      if (account.lockedUntil && account.lockedUntil > new Date()) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Wait 15 minutes or contact the office." });
      if (!await verifyPassword(input.currentPassword, account.passwordHash)) {
        await recordFailedLogin(ctx.user.id);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Your current password is incorrect." });
      }
      if (input.currentPassword === input.newPassword) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a different new password." });
      const token = parse(ctx.req.headers.cookie || "")[COOKIE_NAME];
      const session = await sdk.verifySession(token);
      if (!session?.sessionId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in again to change your password." });
      const passwordHash = await hashPassword(input.newPassword);
      if (!await changeAccountPassword(ctx.user.id, account.passwordHash, passwordHash, session.sessionId)) {
        throw new TRPCError({ code: "CONFLICT", message: "Your account or session changed. Sign in again before retrying." });
      }
      ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
      return { success: true, signInRequired: true };
    } finally { verifying--; }
  }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const token = parse(ctx.req.headers.cookie || "")[COOKIE_NAME];
      const payload = await sdk.verifySession(token);
      if (payload?.sessionId) await revokeSession(payload.sessionId);
    } finally {
      ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
    }
    return { success: true } as const;
  }),
  getProfile: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id, name: ctx.user.name || "", email: ctx.user.email || "",
    notificationPreferences: { ...defaults, ...(ctx.user.notificationPreferences as object || {}) } })),
  updateProfile: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(255).optional(),
    notificationPreferences: z.object({ notifyOnNewPolicy: z.boolean().optional(), notifyOnStrategyGenerated: z.boolean().optional(), notifyOnContactForm: z.boolean().optional() }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (input.notificationPreferences) await updatePreferences(ctx.user.id, input.notificationPreferences);
    if (input.name !== undefined) await db.update(users).set({ name: input.name }).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});
