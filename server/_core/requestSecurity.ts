import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { sdk } from "./sdk";

export function registerRequestSecurity(app: Express) {
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
  const passwordLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
  const heavyLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
  app.use("/api/trpc", (req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    if (req.method === "POST" && req.get("x-ltc-request") !== "1") {
      res.status(403).json({ error: "Missing request verification header" }); return;
    }
    const procedures = req.path.replace(/^\//, "").split(",");
    if (procedures.length > 10) { res.status(400).json({ error: "Too many operations in one request" }); return; }
    if (procedures.includes("auth.changePassword")) {
      if (procedures.length !== 1) { res.status(400).json({ error: "Password changes must be a separate request" }); return; }
      return passwordLimit(req, res, next);
    }
    if (procedures.includes("auth.login")) {
      if (procedures.length !== 1) { res.status(400).json({ error: "Sign-in must be a separate request" }); return; }
      return loginLimit(req, res, next);
    }
    if (req.method === "POST" && procedures.some(name => /^(email\.|pdfDelivery\.|policyForm\.|chat\.send$|publicLtc\.(generatePdf|emailPdf|generateStrategy|chat)$|strategy\.generate|documents\.upload$|sms\.)/.test(name))) {
      if (procedures.length !== 1) { res.status(400).json({ error: "This operation must be a separate request" }); return; }
      return heavyLimit(req, res, next);
    }
    next();
  });
  // Authenticate before accepting a large base64 upload body.
  app.use("/api/trpc/documents.upload", async (req, res, next) => {
    try { await sdk.authenticateRequest(req); next(); }
    catch { res.status(401).json({ error: "Sign in to upload a document" }); }
  });
}
