import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateSMSMessage,
  sendSMSNotification,
  formatPhoneNumber,
  sendBulkSMSNotifications,
  scheduleTaskReminders,
  cancelTaskReminders,
} from "./smsNotification";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

// Mock the twilio module so tests never make real API calls.
// The mock returns a fake client whose messages.create resolves with a fake SID.
vi.mock("twilio", () => {
  const mockClient = { messages: { create: mockCreate } };
  const twilioFactory = vi.fn(() => mockClient);
  return { default: twilioFactory };
});

describe("SMS Notification Service", () => {
  beforeEach(() => {
    mockCreate.mockReset().mockResolvedValue({ sid: "SM_MOCK_SID_12345", status: "queued" });
    vi.stubEnv('TWILIO_ACCOUNT_SID', '');
    vi.stubEnv('TWILIO_AUTH_TOKEN', '');
    vi.stubEnv('TWILIO_PHONE_NUMBER', '');
  });

  afterEach(() => vi.unstubAllEnvs());

  describe("generateSMSMessage", () => {
    it("should generate task reminder message", () => {
      const message = generateSMSMessage({
        phoneNumber: "5551234567",
        taskName: "Submit claim packet",
        taskDueDate: "2026-04-15",
        reminderType: "task_reminder",
        priority: "medium",
      });

      expect(message).toContain("LTC Navigator");
      expect(message).toContain("Submit claim packet");
      expect(message).toContain("2026-04-15");
      expect(message).toContain("HELP");
    });

    it("should generate milestone alert message", () => {
      const message = generateSMSMessage({
        phoneNumber: "5551234567",
        taskName: "Claim approved",
        taskDueDate: "2026-04-15",
        reminderType: "milestone_alert",
        priority: "high",
        customMessage: "Your claim has been approved!",
      });

      expect(message).toContain("milestone");
      expect(message).toContain("Your claim has been approved!");
    });

    it("should generate deadline warning message", () => {
      const message = generateSMSMessage({
        phoneNumber: "5551234567",
        taskName: "Submit documentation",
        taskDueDate: "2026-04-10",
        reminderType: "deadline_warning",
        priority: "high",
      });

      expect(message).toContain("URGENT");
      expect(message).toContain("Submit documentation");
    });
  });

  describe("formatPhoneNumber", () => {
    it("should format 10-digit US number", () => {
      expect(formatPhoneNumber("5551234567")).toBe("+15551234567");
    });

    it("should format number with parentheses", () => {
      expect(formatPhoneNumber("(555) 123-4567")).toBe("+15551234567");
    });

    it("should format number with dashes", () => {
      expect(formatPhoneNumber("555-123-4567")).toBe("+15551234567");
    });

    it("should handle already formatted number", () => {
      expect(formatPhoneNumber("+15551234567")).toBe("+15551234567");
    });
  });

  describe("sendSMSNotification", () => {
    it("should return error when SMS service not configured", async () => {
      const result = await sendSMSNotification({
        phoneNumber: "5551234567",
        taskName: "Test task",
        taskDueDate: "2026-04-15",
        reminderType: "task_reminder",
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not configured");
    });

    it("should return error for invalid phone number", async () => {
      process.env.TWILIO_ACCOUNT_SID = "ACtest00000000000000000000000000000";
      process.env.TWILIO_AUTH_TOKEN = "test_token_00000000000000000000000";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";

      const result = await sendSMSNotification({
        phoneNumber: "invalid",
        taskName: "Test task",
        taskDueDate: "2026-04-15",
        reminderType: "task_reminder",
        priority: "medium",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid phone number");
    });

    it("should return success when SMS service is configured (mocked Twilio)", async () => {
      process.env.TWILIO_ACCOUNT_SID = "ACtest00000000000000000000000000000";
      process.env.TWILIO_AUTH_TOKEN = "test_token_00000000000000000000000";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";

      const result = await sendSMSNotification({
        phoneNumber: "5551234567",
        taskName: "Test task",
        taskDueDate: "2026-04-15",
        reminderType: "task_reminder",
        priority: "medium",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe('accepted');
      expect(result.message).toContain('not yet confirmed');
    });
  });

  describe("sendBulkSMSNotifications", () => {
    beforeEach(() => {
      process.env.TWILIO_ACCOUNT_SID = "ACtest00000000000000000000000000000";
      process.env.TWILIO_AUTH_TOKEN = "test_token_00000000000000000000000";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";
    });

    it("should send to multiple recipients (mocked Twilio)", async () => {
      const recipients = [
        { phoneNumber: "5551234567", name: "John Doe" },
        { phoneNumber: "5559876543", name: "Jane Smith" },
      ];

      const results = await sendBulkSMSNotifications(recipients, {
        taskName: "Test task",
        taskDueDate: "2026-04-15",
        reminderType: "task_reminder",
        priority: "medium",
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it("should handle mixed success and failure (valid + invalid phone)", async () => {
      const recipients = [
        { phoneNumber: "5551234567", name: "John Doe" },
        { phoneNumber: "invalid",    name: "Jane Smith" },
      ];

      const results = await sendBulkSMSNotifications(recipients, {
        taskName: "Test task",
        taskDueDate: "2026-04-15",
        reminderType: "task_reminder",
        priority: "medium",
      });

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });
});


describe('SMS provider failure and scheduling boundaries', () => {
  const config = { phoneNumber: '1 (555) 123-4567', taskName: 'QA task', taskDueDate: '2026-10-10', reminderType: 'task_reminder' as const, priority: 'medium' as const };
  beforeEach(() => {
    mockCreate.mockReset().mockResolvedValue({ sid: 'SM_TEST', status: 'queued' });
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest'); vi.stubEnv('TWILIO_AUTH_TOKEN', 'qa-secret'); vi.stubEnv('TWILIO_PHONE_NUMBER', '+15550001111');
  });
  afterEach(() => vi.unstubAllEnvs());
  it('accepts a domestic 1 prefix and sends normalized E.164', async () => {
    expect(await sendSMSNotification(config)).toMatchObject({ success: true, status: 'accepted' });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ to: '+15551234567' }));
  });
  it.each(['failed', 'undelivered', 'canceled'])('does not report success for provider status %s', async status => {
    mockCreate.mockResolvedValue({ sid: 'SM_TEST', status });
    expect(await sendSMSNotification(config)).toMatchObject({ success: false, status: 'failed' });
  });
  it('rejects an incomplete provider receipt', async () => {
    mockCreate.mockResolvedValue({ status: 'queued' });
    expect(await sendSMSNotification(config)).toMatchObject({ success: false, status: 'failed' });
  });
  it('does not expose provider errors or recipient details', async () => {
    mockCreate.mockRejectedValue(new Error('PRIVATE_TOKEN and +15551234567'));
    const result = await sendSMSNotification(config);
    expect(result).toMatchObject({ success: false, status: 'failed' });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE_TOKEN|15551234567/);
  });
  it('reports that scheduling and cancellation are not connected', async () => {
    expect(await scheduleTaskReminders({ taskId: 3, phoneNumber: config.phoneNumber, taskName: config.taskName, dueDate: config.taskDueDate, reminderDaysBefore: [1], enabled: true })).toMatchObject({ success: false, status: 'unavailable' });
    expect(await cancelTaskReminders(3)).toMatchObject({ success: false, status: 'unavailable' });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
