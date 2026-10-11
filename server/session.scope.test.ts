import { describe, expect, it, vi } from "vitest";
vi.mock("./_core/env", () => ({ ENV: {
  appId: "ltc-insurance-portal", cookieSecret: "test-session-secret".repeat(4),
} }));
import { sdk } from "./_core/sdk";

describe("session application scope", () => {
  it("accepts an unexpired portal session", async () => {
    const token = await sdk.createSessionToken("client-1", { name: "Client" });
    expect(await sdk.verifySession(token)).toMatchObject({ openId: "client-1" });
  });
  it("rejects a valid signature issued for another application", async () => {
    const token = await sdk.signSession({ openId: "client-1", name: "Client", appId: "another-app" });
    expect(await sdk.verifySession(token)).toBeNull();
  });
  it("rejects expired and malformed sessions", async () => {
    const token = await sdk.createSessionToken("client-1", { expiresInMs: -1000 });
    expect(await sdk.verifySession(token)).toBeNull();
    expect(await sdk.verifySession("invalid")).toBeNull();
  });
});
