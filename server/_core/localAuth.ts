import { timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const LOCAL_AUTH_OPEN_ID = "local-admin";

function getLocalAuthConfig() {
  return {
    enabled: (process.env.LOCAL_AUTH_ENABLED || "true").toLowerCase() === "true",
    email: process.env.LOCAL_ADMIN_EMAIL || "",
    password: process.env.LOCAL_ADMIN_PASSWORD || "",
    name: process.env.LOCAL_ADMIN_NAME || "Portal Administrator",
  };
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderLoginPage(errorMessage = ""): string {
  const errorHtml = errorMessage
    ? `<div style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;padding:12px;border-radius:8px;margin-bottom:16px;">${escapeHtml(errorMessage)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LTC Portal Login</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f8fafc; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    main { width:100%; max-width:420px; background:white; border:1px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 10px 30px rgba(15,23,42,.08); }
    h1 { margin:0 0 8px; color:#0f172a; font-size:26px; }
    p { color:#475569; line-height:1.5; }
    label { display:block; margin-top:16px; color:#334155; font-weight:700; }
    input { width:100%; box-sizing:border-box; margin-top:6px; padding:12px; border:1px solid #cbd5e1; border-radius:8px; font-size:16px; }
    button { width:100%; margin-top:22px; padding:12px 14px; border:0; border-radius:8px; background:#0f172a; color:white; font-size:16px; font-weight:700; cursor:pointer; }
    small { display:block; color:#64748b; margin-top:16px; line-height:1.4; }
  </style>
</head>
<body>
  <main>
    <h1>LTC Portal</h1>
    <p>Sign in to continue.</p>
    ${errorHtml}
    <form method="post" action="/api/auth/local/login">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
      <button type="submit">Sign in</button>
    </form>
    <small>This local login is intended for independent VPS hosting and can be replaced later with a full provider such as Clerk or Auth.js.</small>
  </main>
</body>
</html>`;
}

async function ensureLocalAdminUser(email: string, name: string) {
  const existing = await db.getUserByOpenId(LOCAL_AUTH_OPEN_ID);
  await db.upsertUser({
    openId: LOCAL_AUTH_OPEN_ID,
    name: existing?.name || name,
    email: existing?.email || email,
    loginMethod: existing?.loginMethod || "local",
    role: "admin",
    lastSignedIn: new Date(),
  });
}

export function registerLocalAuthRoutes(app: Express) {
  app.get("/login", (_req: Request, res: Response) => {
    res.status(200).type("html").send(renderLoginPage());
  });

  app.post("/api/auth/local/login", async (req: Request, res: Response) => {
    const config = getLocalAuthConfig();
    if (!config.enabled) {
      res.status(404).json({ error: "Local authentication is disabled" });
      return;
    }

    if (!config.email || !config.password) {
      res.status(500).type("html").send(renderLoginPage("Local authentication is not configured."));
      return;
    }

    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const emailMatches = safeCompare(email, config.email.toLowerCase());
    const passwordMatches = safeCompare(password, config.password);

    if (!emailMatches || !passwordMatches) {
      res.status(401).type("html").send(renderLoginPage("Invalid email or password."));
      return;
    }

    await ensureLocalAdminUser(config.email, config.name);
    const sessionToken = await sdk.createSessionToken(LOCAL_AUTH_OPEN_ID, {
      name: config.name,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  });
}
