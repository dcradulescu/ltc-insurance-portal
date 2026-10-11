import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-" + userId,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// Mock the db module
vi.mock("./db", () => {
  const policies = new Map<number, any>();
  let nextPolicyId = 1;
  const strategies = new Map<number, any>();
  let nextStrategyId = 1;

  return {
    createPolicy: vi.fn(async (data: any) => {
      const id = nextPolicyId++;
      policies.set(id, { id, ...data });
      return id;
    }),
    updatePolicy: vi.fn(async (id: number, userId: number, data: any) => {
      const existing = policies.get(id);
      if (existing) {
        policies.set(id, { ...existing, ...data });
      }
    }),
    getPolicyByUserId: vi.fn(async (userId: number) => {
      for (const [, p] of policies) {
        if (p.userId === userId) return p;
      }
      return undefined;
    }),
    getPolicyById: vi.fn(async (id: number) => {
      return policies.get(id);
    }),
    createStrategy: vi.fn(async (data: any) => {
      const id = nextStrategyId++;
      strategies.set(id, { id, ...data });
      return id;
    }),
    getStrategyByPolicyId: vi.fn(async (policyId: number, userId: number) => {
      for (const [, s] of strategies) {
        if (s.policyId === policyId && s.userId === userId) return s;
      }
      return undefined;
    }),
    getStrategyByUserId: vi.fn(async (userId: number) => {
      for (const [, s] of strategies) {
        if (s.userId === userId) return s;
      }
      return undefined;
    }),
    getStrategyById: vi.fn(async (id: number) => {
      return strategies.get(id);
    }),
    updateStrategy: vi.fn(async () => {}),
    saveChatMessage: vi.fn(async () => {}),
    getChatHistory: vi.fn(async () => []),
    upsertUser: vi.fn(async () => {}),
    getUserByOpenId: vi.fn(async () => undefined),
    getDb: vi.fn(async () => null),
    createDocumentUpload: vi.fn(async () => 1),
    getDocumentsByUserId: vi.fn(async () => []),
    getDocumentsByTaskId: vi.fn(async () => []),
    deleteDocument: vi.fn(async () => {}),
    createUserContact: vi.fn(async () => 1),
    getUserContacts: vi.fn(async () => []),
    updateUserContact: vi.fn(async () => {}),
    deleteUserContact: vi.fn(async () => {}),
  };
});

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: "<h2>Test Strategy</h2><p>This is a test strategy.</p>" } }],
  })),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn(async () => ({ url: "https://example.com/file.pdf", key: "test-key" })),
}));

describe("policy ownership", () => {
  it("creates and updates a policy for its account", async () => {
    const caller = appRouter.createCaller(createAuthContext(101).ctx);
    const created = await caller.policy.save({ insuredFullName: "Jane Smith" });
    const updated = await caller.policy.save({ id: created.id, insuredFullName: "Jane Updated" });
    expect(updated.id).toBe(created.id);
    expect(await caller.policy.get()).toMatchObject({ userId: 101, insuredFullName: "Jane Updated" });
  });
  it("does not return another account's latest policy", async () => {
    const caller = appRouter.createCaller(createAuthContext(999).ctx);
    expect(await caller.policy.get()).toEqual({ id: 0 });
  });
  it("rejects edits by a different account", async () => {
    const first = appRouter.createCaller(createAuthContext(201).ctx);
    const second = appRouter.createCaller(createAuthContext(202).ctx);
    const created = await first.policy.save({ insuredFullName: "Private client" });
    await expect(second.policy.save({ id: created.id, insuredFullName: "Changed" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("generates a strategy for an owned policy", async () => {
    const caller = appRouter.createCaller(createAuthContext(200).ctx);
    const policy = await caller.policy.save({ insuredFullName: "Alice", carrierName: "Carrier", policyNumber: "P-100" });
    expect(await caller.strategy.generate({ policyId: policy.id })).toHaveProperty("id");
  });
  it("rejects anonymous policy access", async () => {
    const caller = appRouter.createCaller(createUnauthContext().ctx);
    await expect(caller.policy.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.policy.save({ insuredFullName: "Test" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
