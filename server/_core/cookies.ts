import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(req: Request): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  // Host-only cookies avoid sharing sessions with sibling subdomains.
  return { httpOnly: true, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" || req.secure === true };
}
