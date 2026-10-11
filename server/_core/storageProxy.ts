import type { Express } from "express";
import { getSignedStorageUrl } from "../storage";
import { canReadFile } from "../db";
import { sdk } from "./sdk";

export function registerStorageProxy(app: Express) {
  app.get("/storage/*", async (req, res) => {
    res.set({ "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" });
    let user;
    try { user = await sdk.authenticateRequest(req); }
    catch { res.status(401).send("Sign in to download this file"); return; }
    const key = (req.params as Record<string, string>)[0];
    if (!key) { res.status(400).send("Missing storage key"); return; }
    try {
      if (!await canReadFile(key, user.id)) { res.status(404).send("File not found"); return; }
      const filename = typeof req.query.filename === "string" ? req.query.filename : "document";
      res.redirect(307, await getSignedStorageUrl(key, 60, filename));
    } catch {
      res.status(502).send("Storage backend unavailable");
    }
  });
}
