import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerBodyParsers } from "./_core/bodyParsers";

let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  registerBodyParsers(app);
  app.post("*", (_req, res) => res.sendStatus(204));
  app.use((err: any, _req: any, res: any, _next: any) => res.sendStatus(err.status || 500));
  await new Promise<void>(resolve => { server = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); });
const send = (path: string, size = 2 * 1024 * 1024) => fetch(base + path, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: "x".repeat(size) }),
});
describe("delivery request limits", () => {
  it.each(["email.sendStrategy", "pdfDelivery.generate", "email.sendStrategy,pdfDelivery.generate"])(
    "accepts a 2 MB delivery payload at %s", async route => {
      expect((await send(`/api/trpc/${route}`)).status).toBe(204);
    }
  );
  it.each(["policy.save", "emailEvil.send", "email.sendStrategy,policy.save"])(
    "keeps the 1 MB limit at %s", async route => {
      expect((await send(`/api/trpc/${route}`)).status).toBe(413);
    }
  );
  it("rejects delivery payloads exceeding 10 MB", async () => {
    expect((await send("/api/trpc/email.sendStrategy", 11 * 1024 * 1024)).status).toBe(413);
  });
});
