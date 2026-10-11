import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { authRouter } from "./routers/auth";
import { hashPassword, verifyPassword } from "./_core/password";
import * as accounts from "./authStore";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
vi.mock("./_core/env", () => ({ ENV: { appId: "ltc-insurance-portal", cookieSecret: "test-secret-".repeat(8) } }));
vi.mock("./authStore", () => ({ getAccount: vi.fn(), recordFailedLogin: vi.fn(), createLoginSession: vi.fn(), revokeSession: vi.fn(), hasActiveSession: vi.fn() }));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getUserByOpenId: vi.fn() }));
const user = { id: 7, openId: "local:7", name: "Client", email: "client@example.com", role: "user" };
let passwordHash: string;
const password = "A long example password!";
const ctx = () => ({ user: null, req: { headers: {}, secure: false }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as any);
beforeAll(async () => { passwordHash = await hashPassword(password); });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(accounts.getAccount).mockResolvedValue({ user, account: { userId: 7, passwordHash, active: true, lockedUntil: null } } as any);
  vi.mocked(db.getUserByOpenId).mockResolvedValue(user as any);
  vi.mocked(accounts.hasActiveSession).mockResolvedValue(true);
});
describe("password authentication and session lifecycle", () => {
  it("uses salted password hashes and rejects the wrong password", async () => {
    expect(await hashPassword(password)).not.toBe(passwordHash);
    expect(await verifyPassword(password, passwordHash)).toBe(true);
    expect(await verifyPassword("incorrect", passwordHash)).toBe(false);
    expect(await verifyPassword(password, undefined)).toBe(false);
  });
  it("creates an eight-hour revocable session and a host-only cookie", async () => {
    const context = ctx();
    await authRouter.createCaller(context).login({ email: "CLIENT@example.com", password });
    expect(accounts.getAccount).toHaveBeenCalledWith("client@example.com");
    expect(accounts.createLoginSession).toHaveBeenCalledWith(7, expect.any(String), expect.any(Date), passwordHash);
    const [name, token, options] = context.res.cookie.mock.calls[0];
    expect(name).toBe(COOKIE_NAME); expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", maxAge: 28800000 }); expect(options.domain).toBeUndefined();
    const req = { headers: { cookie: `${COOKIE_NAME}=${token}` } } as any;
    expect((await sdk.authenticateRequest(req)).id).toBe(7);
    const logoutContext = { ...ctx(), req };
    await authRouter.createCaller(logoutContext).logout();
    expect(accounts.revokeSession).toHaveBeenCalledWith(expect.any(String));
    expect(logoutContext.res.clearCookie).toHaveBeenCalled();
    vi.mocked(accounts.hasActiveSession).mockResolvedValue(false);
    await expect(sdk.authenticateRequest(req)).rejects.toThrow("Session expired");
  });
  it.each(["unknown", "wrong", "locked", "disabled"])("rejects %s accounts without issuing a session", async mode => {
    if (mode === "unknown") vi.mocked(accounts.getAccount).mockResolvedValue(undefined);
    else if (mode === "locked" || mode === "disabled") vi.mocked(accounts.getAccount).mockResolvedValue({ user, account: { passwordHash, active: mode !== "disabled", lockedUntil: mode === "locked" ? new Date(Date.now()+60000) : null } } as any);
    await expect(authRouter.createCaller(ctx()).login({ email: user.email, password: mode === "wrong" ? "wrong password" : password })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(accounts.createLoginSession).not.toHaveBeenCalled();
  });
  it("rejects legacy signed cookies without a persisted session", async () => {
    const token = await sdk.createSessionToken(user.openId);
    await expect(sdk.authenticateRequest({ headers: { cookie: `${COOKIE_NAME}=${token}` } } as any)).rejects.toThrow("Invalid session cookie");
  });
});
