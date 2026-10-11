import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { registerRequestSecurity } from "./_core/requestSecurity";
import { sdk } from "./_core/sdk";
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn().mockRejectedValue(new Error("unauthorized")) } }));
let server: Server; let base: string;
beforeAll(async () => {
  const app = express(); registerRequestSecurity(app); app.use((_req, res) => res.sendStatus(204));
  await new Promise<void>(resolve => { server = app.listen(0, "127.0.0.1", resolve); }); base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
const post = (path: string, verified = true) => fetch(base + "/api/trpc/" + path, { method: "POST", headers: verified ? { "x-ltc-request": "1" } : {} });
describe("HTTP request protections", () => {
  it("rejects unverified cross-site-form-style mutations", async () => { expect((await post("policy.save", false)).status).toBe(403); });
  it("rejects batched login attempts", async () => { expect((await post("auth.login,auth.login")).status).toBe(400); });
  it("rate-limits the eleventh login request", async () => {
    for (let i=0; i<10; i++) expect((await post("auth.login")).status).toBe(204);
    expect((await post("auth.login")).status).toBe(429);
  });
  it("rejects batched password changes", async () => { expect((await post("auth.changePassword,auth.changePassword")).status).toBe(400); });
  it("rate-limits the sixth password-change request independently of login", async () => {
    for (let i=0; i<5; i++) expect((await post("auth.changePassword")).status).toBe(204);
    expect((await post("auth.changePassword")).status).toBe(429);
  });
  it("authenticates uploads before parsing their body", async () => {
    expect((await post("documents.upload")).status).toBe(401);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 7 } as any);
    expect((await post("documents.upload")).status).toBe(204);
  });
});
