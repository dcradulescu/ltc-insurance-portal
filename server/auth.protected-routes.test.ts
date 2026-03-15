import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      hostname: "localhost",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      hostname: "localhost",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me - route protection support", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
    });
  });

  it("authenticated user can access logout", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});
