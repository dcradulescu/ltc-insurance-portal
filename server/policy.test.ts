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
    loginMethod: "manus",
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

describe("policy.save", () => {
  it("creates a new policy for authenticated user", async () => {
    const { ctx } = createAuthContext(100);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.policy.save({
      insuredFullName: "John Doe",
      carrierName: "Genworth",
      policyNumber: "POL-12345",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("updates an existing policy", async () => {
    const { ctx } = createAuthContext(101);
    const caller = appRouter.createCaller(ctx);

    const created = await caller.policy.save({
      insuredFullName: "Jane Smith",
    });

    const updated = await caller.policy.save({
      id: created.id,
      insuredFullName: "Jane Updated",
    });

    expect(updated.id).toBe(created.id);
  });

  it("allows unauthenticated users (public procedure)", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    // All procedures are now public — should succeed
    const result = await caller.policy.save({ insuredFullName: "Test" });
    expect(result).toHaveProperty("id");
  });
});

describe("policy.get", () => {
  it("returns a policy object (public procedure uses default userId=1)", async () => {
    const { ctx } = createAuthContext(999);
    const caller = appRouter.createCaller(ctx);

    // policy.get uses getPolicyById(1) as a default — returns whatever is in mock
    const result = await caller.policy.get();
    // It may return a policy or { id: 0 } fallback
    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
  });

  it("allows unauthenticated users (public procedure)", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw — it's a public procedure
    const result = await caller.policy.get();
    expect(result).toBeDefined();
  });
});

describe("strategy.generate", () => {
  it("generates a strategy for a valid policy", async () => {
    const { ctx } = createAuthContext(200);
    const caller = appRouter.createCaller(ctx);

    // First create a policy
    const policy = await caller.policy.save({
      insuredFullName: "Alice Johnson",
      carrierName: "John Hancock",
      policyNumber: "JH-99999",
      dailyMaximum: "$200/day",
      eliminationPeriod: "90 days",
    });

    const strategy = await caller.strategy.generate({ policyId: policy.id });

    expect(strategy).toHaveProperty("id");
    expect(strategy).toHaveProperty("content");
    expect(typeof strategy.content).toBe("string");
    expect(strategy.content.length).toBeGreaterThan(0);
  });

  it("allows unauthenticated users (public procedure)", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    // strategy.generate is public, but will throw if policy not found
    // Since we're using mock data, policy ID 1 should exist from previous tests
    const result = await caller.strategy.generate({ policyId: 1 });
    expect(result).toHaveProperty("id");
  });
});

describe("chat.send", () => {
  it("returns a response for a chat message", async () => {
    const { ctx } = createAuthContext(300);
    const caller = appRouter.createCaller(ctx);

    const response = await caller.chat.send({
      messages: [{ role: "user", content: "What is LTC insurance?" }],
      sessionId: "test-session-123",
    });

    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
  });

  it("works for unauthenticated users (public procedure)", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const response = await caller.chat.send({
      messages: [{ role: "user", content: "Hello" }],
      sessionId: "anon-session-456",
    });

    expect(typeof response).toBe("string");
  });
});

describe("email.sendStrategy", () => {
  it("allows unauthenticated users (public procedure) but may fail without strategy", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    // email.sendStrategy is public, but will check strategy.userId === 1
    // It should either succeed or throw "Strategy not found" — not an auth error
    const result = await caller.email.sendStrategy({
      strategyId: 1,
      recipients: ["test@example.com"],
    });

    // If strategy exists in mock, it should return success
    expect(result).toHaveProperty("success");
  });
});
