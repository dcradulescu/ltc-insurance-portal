// SMS Notification Service for LTC Insurance Portal
// Uses Twilio when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER are set.
// Falls back to a logged-only mode when credentials are absent (dev/staging).
import twilio from "twilio";

interface SMSNotificationConfig {
  phoneNumber: string;
  taskName: string;
  taskDueDate: string;
  reminderType: "task_reminder" | "milestone_alert" | "deadline_warning";
  priority: "low" | "medium" | "high";
  customMessage?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  message: string;
}

/** Build the SMS body text from the config */
export function generateSMSMessage(config: SMSNotificationConfig): string {
  const base = `LTC Navigator: ${config.taskName}`;
  switch (config.reminderType) {
    case "task_reminder":
      return `${base} — Due: ${config.taskDueDate}. Complete this task to stay on track with your claim. Reply HELP for support.`;
    case "milestone_alert":
      return `${base} — Important milestone reached! ${config.customMessage || "Review your strategy for next steps."} Reply HELP for support.`;
    case "deadline_warning":
      return `${base} — URGENT: Due ${config.taskDueDate}. This is critical for your claim. Complete immediately. Reply HELP.`;
    default:
      return base;
  }
}

/** Validate US phone number (10 digits, optional +1 prefix) */
function isValidPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, "");
  return /^(\+1)?[0-9]{10}$/.test(cleaned);
}

/** Normalise to E.164 format (+1XXXXXXXXXX) */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("1") && cleaned.length === 11) return `+${cleaned}`;
  if (cleaned.length === 10) return `+1${cleaned}`;
  return `+${cleaned}`;
}

/**
 * Send a single SMS via Twilio.
 * If Twilio credentials are not configured the message is logged and the
 * function returns { success: false } so callers can surface a clear error.
 */
export async function sendSMSNotification(
  config: SMSNotificationConfig
): Promise<SMSResponse> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn(
        "[SMS] Twilio credentials not configured. " +
        "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable real SMS delivery."
      );
      return {
        success: false,
        error: "SMS service not configured",
        message: "SMS notifications require Twilio credentials. Please contact your administrator.",
      };
    }

    if (!isValidPhoneNumber(config.phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format",
        message: "Please provide a valid 10-digit US phone number.",
      };
    }

    const toNumber   = formatPhoneNumber(config.phoneNumber);
    const messageText = generateSMSMessage(config);

    const client = twilio(accountSid, authToken);

    const result = await client.messages.create({
      body: messageText,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`[SMS] Sent to ${toNumber} — SID: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid,
      message: `SMS sent successfully to ${toNumber}`,
    };
  } catch (error) {
    console.error("[SMS] Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to send SMS notification. Please try again.",
    };
  }
}

/** Send the same SMS to multiple recipients */
export async function sendBulkSMSNotifications(
  recipients: Array<{ phoneNumber: string; name: string }>,
  config: Omit<SMSNotificationConfig, "phoneNumber">
): Promise<SMSResponse[]> {
  return Promise.all(
    recipients.map((r) =>
      sendSMSNotification({ ...config, phoneNumber: r.phoneNumber })
    )
  );
}

// ── Reminder scheduling types (used by taskReminderScheduler) ────────────────

export interface ReminderSchedule {
  taskId: number;
  phoneNumber: string;
  taskName: string;
  dueDate: string;
  reminderDaysBefore: number[]; // e.g. [7, 3, 1]
  enabled: boolean;
}

export async function scheduleTaskReminders(
  schedule: ReminderSchedule
): Promise<SMSResponse> {
  // Actual scheduling is handled by taskReminderScheduler.ts
  return { success: true, message: `Reminders scheduled for ${schedule.taskName}` };
}

export async function cancelTaskReminders(taskId: number): Promise<SMSResponse> {
  return { success: true, message: `Reminders cancelled for task ${taskId}` };
}
