/**
 * Tests for Save & Resume (magic link) feature
 * Covers: sendSaveLink mutation and getResumeData query
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

// Mock DB helpers used by the save-link procedures
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createSaveLink: vi.fn().mockResolvedValue({ id: 1 }),
    getSaveLinkByToken: vi.fn(),
    markSaveLinkUsed: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock notification helper
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/delivery",()=>({deliver:vi.fn().mockResolvedValue({success:true,status:"accepted"}),resumeOrigin:()=>"https://portal.example.com"}));
const caller = appRouter.createCaller({} as any);

describe("email.sendSaveLink", () => {
  it("accepts delivery without returning a bearer token when called with valid email", async () => {
    const result = await caller.email.sendSaveLink({
      email: "test@example.com",
      insuredName: "Jane Doe",
      stepTitle: "Policy Details",
      origin: "https://example.com",
      formData: { insuredFullName: "Jane Doe" },
      currentStep: 2,
    });
    expect(result.success).toBe(true);
    expect(result).not.toHaveProperty("token");
    expect(db.createSaveLink).toHaveBeenCalled();
  });

  it("returns success: true even without optional fields", async () => {
    const result = await caller.email.sendSaveLink({
      email: "minimal@example.com",
    });
    expect(result.success).toBe(true);
    expect(result).not.toHaveProperty("token");
  });
});

describe("email.getResumeData", () => {
  const getSaveLinkByToken = vi.mocked(db.getSaveLinkByToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns found: false when token does not exist", async () => {
    getSaveLinkByToken.mockResolvedValue(null);
    const result = await caller.email.getResumeData({ token: "nonexistent-token000000000000000" });
    expect(result.found).toBe(false);
  });

  it("returns found: false with expired: true when link is expired", async () => {
    getSaveLinkByToken.mockResolvedValue({
      token: "expired-token0000000000000000000",
      email: "test@example.com",
      insuredName: "Jane Doe",
      formData: {},
      currentStep: 1,
      expiresAt: new Date(Date.now() - 1000), // already expired
      usedAt: null,
    });
    const result = await caller.email.getResumeData({ token: "expired-token0000000000000000000" });
    expect(result.found).toBe(false);
    if (!result.found) {
      expect((result as any).expired).toBe(true);
    }
  });

  it("returns formData and currentStep when token is valid", async () => {
    const mockFormData = { insuredFullName: "Jane Doe", policyNumber: "LTC-12345" };
    getSaveLinkByToken.mockResolvedValue({
      token: "valid-token000000000000000000000",
      email: "test@example.com",
      insuredName: "Jane Doe",
      formData: mockFormData,
      currentStep: 3,
      expiresAt: new Date(Date.now() + 86400000), // expires tomorrow
      usedAt: null,
    });
    const result = await caller.email.getResumeData({ token: "valid-token000000000000000000000" });
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.currentStep).toBe(3);
      expect(result.insuredName).toBe("Jane Doe");
      expect(result.formData).toEqual(mockFormData);
    }
  });
});
