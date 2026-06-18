import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { NextFunction, Request, Response } from "express";
import { sdk } from "./sdk";

const PUBLIC_TRPC_PATHS = new Set([
  "/auth.me",
  "/system.health",
  "/api/trpc/auth.me",
  "/api/trpc/system.health",
]);

function isAuthRequired(): boolean {
  return (process.env.REQUIRE_AUTH_FOR_API || "true").toLowerCase() === "true";
}

function hasPublicPathPrefix(path: string): boolean {
  if (PUBLIC_TRPC_PATHS.has(path)) return true;

  return Array.from(PUBLIC_TRPC_PATHS).some(publicPath =>
    path.startsWith(`${publicPath}/`)
  );
}

export async function requireApiSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!isAuthRequired()) return next();
  if (hasPublicPathPrefix(req.path)) return next();

  const cookies = parseCookieHeader(req.headers.cookie || "");
  const sessionCookie = cookies[COOKIE_NAME];
  const session = await sdk.verifySession(sessionCookie);

  if (!session) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  next();
}
