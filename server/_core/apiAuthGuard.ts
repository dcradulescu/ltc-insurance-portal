import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./sdk";

const PUBLIC_PATH_PREFIXES = [
  "/api/auth/local",
  "/api/oauth",
  "/api/trpc/system.health",
  "/api/trpc/auth.me",
  "/api/trpc/auth.logout",
];

function isAuthRequired(): boolean {
  return (process.env.REQUIRE_AUTH_FOR_API || "false").toLowerCase() === "true";
}

function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

function getCookieValue(req: Request, cookieName: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  const parts = header.split(";").map(part => part.trim());
  for (const part of parts) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    const name = part.slice(0, separatorIndex);
    const value = part.slice(separatorIndex + 1);
    if (name === cookieName) return decodeURIComponent(value);
  }

  return undefined;
}

export async function requireApiSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!isAuthRequired()) return next();
  if (!req.path.startsWith("/api/")) return next();
  if (isPublicPath(req.path)) return next();

  try {
    const sessionCookie = getCookieValue(req, COOKIE_NAME);
    const session = await sdk.verifySession(sessionCookie);
    if (session) return next();
  } catch {
    // Fall through to 401.
  }

  res.status(401).json({ error: "Authentication required" });
}
