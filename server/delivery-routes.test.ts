import { beforeEach, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import { submitEmail } from "./_core/delivery";
import { notifyOwner } from "./_core/notification";
import { generateStrategyPdf } from "./strategyPdfGenerator";
import { updatePreferences } from "./preferences";
import * as db from "./db";
vi.mock("./_core/delivery", () => ({ submitEmail: vi.fn(), submitWebhook: vi.fn() }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));
vi.mock("./strategyPdfGenerator", () => ({ generateStrategyPdf: vi.fn() }));
vi.mock("./storage", () => ({ getSignedStorageUrl: vi.fn().mockResolvedValue("https://example.test/signed"), storagePut: vi.fn() }));
vi.mock("./preferences", () => ({ updatePreferences: vi.fn() }));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(),
  getStrategyById: vi.fn().mockResolvedValue({ id: 8, userId: 7, policyId: 6, strategyContent: "Saved strategy" }),
  getPolicyById: vi.fn().mockResolvedValue({ id: 6, userId: 7 }),
}));
const caller = appRouter.createCaller({ user: { id: 7, email: "owner@example.com", notificationPreferences: null }, req: { headers: {} }, res: {} } as any);
const pdf = { insuredName: "Client", policyNumber: "P123", carrierName: "Carrier", dailyMaximum: 0, monthlyMaximum: 0, lifetimeMaximum: 0 };
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(submitEmail).mockResolvedValue({ success: true, status: "accepted", channel: "webhook" });
  vi.mocked(generateStrategyPdf).mockResolvedValue({ key: "users/7/pdf", url: "/storage/users/7/pdf" } as any);
  vi.mocked(updatePreferences).mockResolvedValue(undefined);
});
it("page delivery submits the actual requested content and recipients", async () => {
  const result = await caller.email.sendPageContent({ pageName: "Guide", content: "Requested guide", recipients: ["one@example.com", "two@example.com"] });
  expect(submitEmail).toHaveBeenCalledWith(expect.objectContaining({ text: "Requested guide", recipients: ["one@example.com", "two@example.com"] }));
  expect(result.message).toContain("Inbox delivery is not confirmed");
});
it("does not report strategy success after delivery failure", async () => {
  vi.mocked(submitEmail).mockRejectedValueOnce(new Error("Delivery failed"));
  await expect(caller.email.sendStrategy({ strategyId: 8, recipients: ["one@example.com"] })).rejects.toThrow("Delivery failed");
});
it("stops strategy delivery when the requested PDF cannot be generated", async () => {
  vi.mocked(generateStrategyPdf).mockRejectedValueOnce(new Error("PDF failed"));
  await expect(caller.email.sendStrategy({ strategyId: 8, recipients: ["one@example.com"], policyData: pdf })).rejects.toThrow("PDF failed");
  expect(submitEmail).not.toHaveBeenCalled();
});
it("PDF email includes a temporary link and accurate acceptance wording", async () => {
  const result = await caller.pdfDelivery.sendPdfByEmail({ ...pdf, recipientEmail: "one@example.com", recipientName: "Recipient" });
  expect(submitEmail).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining("https://example.test/signed") }));
  expect(result.message).toContain("expires in one hour");
});
it("rejects a zero-recipient strategy request", async () => {
  await expect(caller.email.sendStrategy({ strategyId: 8, recipients: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(submitEmail).not.toHaveBeenCalled();
});
it("contact submission cannot succeed when owner notification is skipped", async () => {
  vi.mocked(notifyOwner).mockResolvedValueOnce(false);
  await expect(caller.email.sendContactForm({ name: "Person", email: "one@example.com", subject: "Help", message: "Question" })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
});
it("SMS preferences are persisted under the signed-in user", async () => {
  const input = { phoneNumber: "(864) 555-0100", taskReminders: true, milestoneAlerts: false, deadlineWarnings: true, reminderDaysBefore: [7, 1] };
  const result = await caller.sms.savePreferences(input);
  expect(updatePreferences).toHaveBeenCalledWith(7, { sms: { ...input, phoneNumber: "8645550100" } });
  expect(result.message).toContain("Automatic SMS scheduling is not enabled");
});
it("does not claim preferences were saved on database failure", async () => {
  vi.mocked(updatePreferences).mockRejectedValueOnce(new Error("DB unavailable"));
  await expect(caller.sms.savePreferences({ phoneNumber: "8645550100", taskReminders: true, milestoneAlerts: true, deadlineWarnings: true, reminderDaysBefore: [1] })).rejects.toThrow("DB unavailable");
});
it("returns only the signed-in user's stored SMS preferences", async () => {
  const sms = { phoneNumber: "8645550100", taskReminders: true, milestoneAlerts: false, deadlineWarnings: true, reminderDaysBefore: [3] };
  const ownCaller = appRouter.createCaller({ user: { id: 7, notificationPreferences: { sms } } } as any);
  expect(await ownCaller.sms.getPreferences()).toEqual(sms);
  expect(await caller.sms.getPreferences()).toBeNull();
});
