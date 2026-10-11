import { beforeEach, describe, expect, it, vi } from "vitest";
import { authRouter } from "./routers/auth";
import * as accounts from "./authStore";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
vi.mock("./authStore", () => ({ getAccount: vi.fn(), getAccountByUserId: vi.fn(), recordFailedLogin: vi.fn(), createLoginSession: vi.fn(), revokeSession: vi.fn(), changeAccountPassword: vi.fn() }));
vi.mock("./_core/password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { verifySession: vi.fn() } }));
const input = { currentPassword: "The existing password", newPassword: "The replacement password" };
const context = () => ({ user: { id: 7 }, req: { headers: { cookie: "app_session_id=example" } }, res: { clearCookie: vi.fn() } } as any);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(accounts.getAccountByUserId).mockResolvedValue({ userId: 7, active: true, lockedUntil: null, passwordHash: "existing-hash" } as any);
  vi.mocked(verifyPassword).mockResolvedValue(true); vi.mocked(hashPassword).mockResolvedValue("replacement-hash");
  vi.mocked(sdk.verifySession).mockResolvedValue({ sessionId: "current-session" } as any);
  vi.mocked(accounts.changeAccountPassword).mockResolvedValue(true);
});
describe("signed-in password change", () => {
  it("requires the current password and binds updates to the authenticated user and session", async () => {
    const ctx = context();
    expect(await authRouter.createCaller(ctx).changePassword(input)).toEqual({ success: true, signInRequired: true });
    expect(accounts.getAccountByUserId).toHaveBeenCalledWith(7);
    expect(verifyPassword).toHaveBeenCalledWith(input.currentPassword, "existing-hash");
    expect(accounts.changeAccountPassword).toHaveBeenCalledWith(7, "existing-hash", "replacement-hash", "current-session");
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
  it("records a wrong current password without hashing or changing the replacement", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);
    await expect(authRouter.createCaller(context()).changePassword(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(accounts.recordFailedLogin).toHaveBeenCalledWith(7);
    expect(hashPassword).not.toHaveBeenCalled(); expect(accounts.changeAccountPassword).not.toHaveBeenCalled();
  });
  it.each([{ newPassword: "too short" }, { newPassword: "x".repeat(129) }, { currentPassword: "" }, { currentPassword: "x".repeat(129) }])("rejects invalid input before work: %j", async patch => {
    await expect(authRouter.createCaller(context()).changePassword({ ...input, ...patch })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(accounts.getAccountByUserId).not.toHaveBeenCalled();
  });
  it("rejects an unchanged password", async () => {
    await expect(authRouter.createCaller(context()).changePassword({ ...input, newPassword: input.currentPassword })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(hashPassword).not.toHaveBeenCalled();
  });
  it.each([null, { active: false }, { active: true, lockedUntil: new Date(Date.now() + 60000) }])("rejects unavailable or locked accounts", async account => {
    vi.mocked(accounts.getAccountByUserId).mockResolvedValue(account as any);
    await expect(authRouter.createCaller(context()).changePassword(input)).rejects.toThrow();
    expect(hashPassword).not.toHaveBeenCalled(); expect(accounts.changeAccountPassword).not.toHaveBeenCalled();
  });
  it("rejects a missing session even when the current password was correct", async () => {
    vi.mocked(sdk.verifySession).mockResolvedValue(null);
    await expect(authRouter.createCaller(context()).changePassword(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(accounts.changeAccountPassword).not.toHaveBeenCalled();
  });
  it("does not report success or clear cookies when the transaction detects a stale account/session", async () => {
    const ctx = context(); vi.mocked(accounts.changeAccountPassword).mockResolvedValue(false);
    await expect(authRouter.createCaller(ctx).changePassword(input)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(ctx.res.clearCookie).not.toHaveBeenCalled();
  });
});
