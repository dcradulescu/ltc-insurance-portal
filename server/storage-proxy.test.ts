import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { registerStorageProxy } from "./_core/storageProxy";
import { sdk } from "./_core/sdk";
import { canReadFile } from "./db";
import { getSignedStorageUrl } from "./storage";
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));
vi.mock("./db", () => ({ canReadFile: vi.fn() }));
vi.mock("./storage", () => ({ getSignedStorageUrl: vi.fn() }));
let server: Server; let base: string;
beforeAll(async () => {
  const app = express(); registerStorageProxy(app);
  await new Promise<void>(resolve => { server = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 7 } as any); vi.mocked(canReadFile).mockResolvedValue(false); });
describe("private storage downloads", () => {
  it("rejects anonymous requests before signing anything", async () => {
    vi.mocked(sdk.authenticateRequest).mockRejectedValue(new Error("unauthorized"));
    expect((await fetch(base + "/storage/users/7/file")).status).toBe(401);
    expect(getSignedStorageUrl).not.toHaveBeenCalled();
  });
  it("rejects another account's key even when the caller knows it", async () => {
    expect((await fetch(base + "/storage/users/2/private.pdf")).status).toBe(404);
    expect(canReadFile).toHaveBeenCalledWith("users/2/private.pdf", 7);
    expect(getSignedStorageUrl).not.toHaveBeenCalled();
  });
  it("signs an owned object for 60 seconds without caching the redirect", async () => {
    vi.mocked(canReadFile).mockResolvedValue(true); vi.mocked(getSignedStorageUrl).mockResolvedValue("https://storage.example.com/temporary");
    const res = await fetch(base + "/storage/users/7/file", { redirect: "manual" });
    expect(res.status).toBe(307); expect(res.headers.get("cache-control")).toContain("no-store");
    expect(getSignedStorageUrl).toHaveBeenCalledWith("users/7/file", 60, "document");
  });
});
