import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { NextFunction, Request, Response } from "express";
import { sdk } from "./sdk";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/",
  "/assets/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/uploaded-files/",
];

const PUBLIC_FILE_EXTENSIONS = [
  ".css",
  ".js",
  ".map",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
];

function isPageAuthRequired(): boolean {
  return (process.env.REQUIRE_AUTH_FOR_PAGES || "true").toLowerCase() === "true";
}

function isPublicPath(path: string): boolean {
  if (PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))) return true;
  return PUBLIC_FILE_EXTENSIONS.some(ext => path.endsWith(ext));
}

async function hasValidSession(req: Request): Promise<boolean> {
  const cookies = parseCookieHeader(req.headers.cookie || "");
  const sessionCookie = cookies[COOKIE_NAME];
  const session = await sdk.verifySession(sessionCookie);
  return Boolean(session);
}

export async function requirePageSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!isPageAuthRequired()) return next();
  if (req.method !== "GET") return next();
  if (isPublicPath(req.path)) return next();

  const acceptsHtml = req.headers.accept?.includes("text/html") ?? false;
  if (!acceptsHtml) return next();

  if (await hasValidSession(req)) return next();

  res.redirect(302, "/login");
}
