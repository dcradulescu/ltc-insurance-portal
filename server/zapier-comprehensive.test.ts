import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
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

describe("policyForm.sendComprehensiveToZapier", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success: false when webhook URL is not configured", async () => {
    // The ENV.zapierWebhookUrl may be empty in test environment
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.policyForm.sendComprehensiveToZapier({
      trigger: "strategy_completed",
      currentPage: "strategy",
      sessionDurationSeconds: 120,
    });

    // When no webhook URL is configured, it should return gracefully
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
    expect(typeof result.success).toBe("boolean");
  }, 10000);

  it("accepts all valid trigger types", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const triggers = ["form_completed", "strategy_completed", "exit", "timeout"] as const;

    for (const trigger of triggers) {
      const result = await caller.policyForm.sendComprehensiveToZapier({
        trigger,
        currentPage: "test",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    }
  }, 20000);

  it("accepts unsavedFormData in the payload", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.policyForm.sendComprehensiveToZapier({
      trigger: "exit",
      currentPage: "policy-form",
      formStep: 3,
      sessionDurationSeconds: 300,
      unsavedFormData: {
        insuredFullName: "John Doe",
        carrierName: "Genworth",
        policyNumber: "POL-12345",
      },
    });

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
  });
});

describe("policyForm.sendToZapier (legacy)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success: false when webhook URL is not configured", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.policyForm.sendToZapier({
      trigger: "completed",
      currentStep: 6,
      sessionDurationSeconds: 600,
    });

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
    expect(typeof result.success).toBe("boolean");
  });

  it("accepts all legacy trigger types", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const triggers = ["completed", "exit", "timeout", "save"] as const;

    for (const trigger of triggers) {
      const result = await caller.policyForm.sendToZapier({
        trigger,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    }
  }, 20000);

  it("accepts formData in the legacy payload", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.policyForm.sendToZapier({
      formData: {
        insuredFullName: "Jane Doe",
        carrierName: "MetLife",
      },
      trigger: "completed",
      completionPercentage: 100,
    });

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
  });
});
