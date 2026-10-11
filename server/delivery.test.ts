import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { sendEmail } from "./_core/email";
import { submitEmail, submitWebhook } from "./_core/delivery";
import { ENV } from "./_core/env";
const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn(() => mocks) } }));
beforeEach(() => { vi.clearAllMocks(); ENV.zapierWebhookUrl = ""; vi.stubEnv("SMTP_HOST", ""); vi.stubEnv("SMTP_FROM", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const email = { to: ["one@example.com", "two@example.com"], subject: "Strategy", html: "Example" };
function configured() { vi.stubEnv("SMTP_HOST", "smtp.example.com"); vi.stubEnv("SMTP_FROM", "portal@example.com"); }
describe("truthful provider acceptance", () => {
  it("does not simulate successful email in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await expect(sendEmail(email)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it("returns acceptance after the configured SMTP service accepts recipients", async () => {
    configured(); mocks.sendMail.mockResolvedValue({ accepted: email.to, rejected: [], messageId: "smtp-id" });
    expect(await sendEmail(email)).toMatchObject({ success: true, status: "accepted", messageId: "smtp-id" });
    expect(mocks.close).toHaveBeenCalledOnce();
  });
  it("reports partial recipient failure without retrying", async () => {
    configured(); mocks.sendMail.mockResolvedValue({ accepted: [email.to[0]], rejected: [email.to[1]] });
    await expect(sendEmail(email)).rejects.toThrow("accepted 1 recipient(s) and rejected 1");
    expect(mocks.sendMail).toHaveBeenCalledOnce();
  });
  it("does not expose provider error details", async () => {
    configured(); mocks.sendMail.mockRejectedValue(new Error("private SMTP diagnostic"));
    await expect(sendEmail(email)).rejects.toThrow("submission could not be confirmed");
  });
  it("fails with no webhook configuration", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(submitWebhook({})).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([400, 503])("rejects webhook HTTP %s and does not fall back to SMTP", async status => {
    ENV.zapierWebhookUrl = "https://webhook.example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("failed", { status })));
    await expect(submitEmail({ recipients: email.to, subject: "Test", text: "body", payload: {} })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it("does not claim success after network failure", async () => {
    ENV.zapierWebhookUrl = "https://webhook.example.test";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret URL")));
    await expect(submitWebhook({})).rejects.toThrow("submission could not be confirmed");
  });
  it("preserves webhook recipients and reports acceptance only", async () => {
    ENV.zapierWebhookUrl = "https://webhook.example.test";
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 })); vi.stubGlobal("fetch", fetch);
    expect(await submitEmail({ recipients: email.to, subject: "Test", text: "body", payload: { type: "strategy_email" } }))
      .toEqual({ success: true, status: "accepted", channel: "webhook" });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ recipients: email.to, body: "body" });
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it("escapes page content for SMTP and keeps every recipient", async () => {
    configured(); mocks.sendMail.mockResolvedValue({ accepted: email.to, rejected: [], messageId: "smtp-id" });
    await submitEmail({ recipients: email.to, subject: "Page", text: '<img src="x"> & text', payload: {} });
    expect(mocks.sendMail.mock.calls[0][0]).toMatchObject({ to: email.to });
    expect(mocks.sendMail.mock.calls[0][0].html).toContain('&lt;img src=&quot;x&quot;&gt; &amp; text');
  });
});
