import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateSMSMessage,
  sendSMSNotification,
  formatPhoneNumber,
  sendBulkSMSNotifications,
} from "./smsNotification";

describe("SMS Notification Service", () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

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
      const formatted = formatPhoneNumber("5551234567");
      expect(formatted).toBe("+15551234567");
    });

    it("should format number with parentheses", () => {
      const formatted = formatPhoneNumber("(555) 123-4567");
      expect(formatted).toBe("+15551234567");
    });

    it("should format number with dashes", () => {
      const formatted = formatPhoneNumber("555-123-4567");
      expect(formatted).toBe("+15551234567");
    });

    it("should handle already formatted number", () => {
      const formatted = formatPhoneNumber("+15551234567");
      expect(formatted).toBe("+15551234567");
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
      process.env.TWILIO_ACCOUNT_SID = "test_sid";
      process.env.TWILIO_AUTH_TOKEN = "test_token";
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

    it("should return success when SMS service is configured", async () => {
      process.env.TWILIO_ACCOUNT_SID = "test_sid";
      process.env.TWILIO_AUTH_TOKEN = "test_token";
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
    });
  });

  describe("sendBulkSMSNotifications", () => {
    beforeEach(() => {
      process.env.TWILIO_ACCOUNT_SID = "test_sid";
      process.env.TWILIO_AUTH_TOKEN = "test_token";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";
    });

    it("should send to multiple recipients", async () => {
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

    it("should handle mixed success and failure", async () => {
      const recipients = [
        { phoneNumber: "5551234567", name: "John Doe" },
        { phoneNumber: "invalid", name: "Jane Smith" },
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
