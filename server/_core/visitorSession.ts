import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { parse } from "cookie";
import { TRPCError } from "@trpc/server";
import { getUserByOpenId, upsertUser } from "../db";
import type { TrpcContext } from "./context";
import type { User } from "../../drizzle/schema";

export const VISITOR_COOKIE = "ltc_visitor";
const TTL = 30 * 24 * 60 * 60 * 1000;
export function signVisitor(id: string, secret: string, now = Date.now()) {
  const body = `${id}.${now + TTL}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}
export function readVisitor(token: string | undefined, secret: string, now = Date.now()): string | null {
  if (!token) return null;
  const [id, expiry, signature, extra] = token.split(".");
  if (extra || !/^[a-f0-9-]{36}$/.test(id ?? "") || !/^\d+$/.test(expiry ?? "") || !signature) return null;
  const expires = Number(expiry);
  if (!Number.isSafeInteger(expires) || expires <= now || expires > now + TTL) return null;
  const expected = createHmac("sha256", secret).update(`${id}.${expiry}`).digest("base64url");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
const pending = new WeakMap<TrpcContext, Promise<User>>();
export async function getVisitor(ctx: TrpcContext): Promise<User> {
  if (ctx.user) return ctx.user;
  let result = pending.get(ctx);
  if (!result) {
    result = (async () => {
      const secret = process.env.JWT_SECRET ?? "";
      if (secret.length < 32 || !process.env.DATABASE_URL) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Private saving is not configured. Your form remains on this device. Please contact the office." });
      }
      const cookies = parse(ctx.req.headers.cookie ?? "");
      const known = readVisitor(cookies[VISITOR_COOKIE], secret);
      const id = known ?? randomUUID();
      const openId = `guest:${id}`;
      let user = await getUserByOpenId(openId);
      if (!user) {
        await upsertUser({ openId, loginMethod: "visitor", role: "user", name: "Your profile" });
        user = await getUserByOpenId(openId);
      }
      if (!user) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Unable to establish a private session." });
      if (!known) ctx.res.cookie(VISITOR_COOKIE, signVisitor(id, secret), {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL,
      });
      return user;
    })();
    pending.set(ctx, result);
  }
  return result;
}
