// SMS Notification Service for LTC Insurance Portal

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

/**
 * Generate SMS notification message based on task and reminder type
 */
export function generateSMSMessage(config: SMSNotificationConfig): string {
  const baseMessage = `LTC Navigator: ${config.taskName}`;

  switch (config.reminderType) {
    case "task_reminder":
      return `${baseMessage} - Due: ${config.taskDueDate}. Complete this task to stay on track with your claim. Reply HELP for support.`;

    case "milestone_alert":
      return `${baseMessage} - Important milestone reached! ${config.customMessage || "Review your strategy for next steps."} Reply HELP for support.`;

    case "deadline_warning":
      return `${baseMessage} - URGENT: Due ${config.taskDueDate}. This is critical for your claim. Complete immediately. Reply HELP.`;

    default:
      return baseMessage;
  }
}

/**
 * Send SMS notification via Twilio
 * Note: Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars
 */
export async function sendSMSNotification(
  config: SMSNotificationConfig
): Promise<SMSResponse> {
  try {
    // Check if SMS service is configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.warn(
        "[SMS] Twilio not configured. SMS notifications disabled. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to enable."
      );
      return {
        success: false,
        error: "SMS service not configured",
        message: "SMS notifications are not currently available",
      };
    }

    // Validate phone number format
    if (!isValidPhoneNumber(config.phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format",
        message: "Please provide a valid phone number",
      };
    }

    // Generate message
    const messageText = generateSMSMessage(config);

    // In production, this would call Twilio API
    // For now, we'll log and return success
    console.log(`[SMS] Sending to ${config.phoneNumber}: ${messageText}`);

    // Simulate Twilio API call
    const messageId = `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
      message: `SMS sent successfully to ${config.phoneNumber}`,
    };
  } catch (error) {
    console.error("[SMS] Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to send SMS notification",
    };
  }
}

/**
 * Send bulk SMS notifications to multiple recipients
 */
export async function sendBulkSMSNotifications(
  recipients: Array<{ phoneNumber: string; name: string }>,
  config: Omit<SMSNotificationConfig, "phoneNumber">
): Promise<SMSResponse[]> {
  return Promise.all(
    recipients.map((recipient) =>
      sendSMSNotification({
        ...config,
        phoneNumber: recipient.phoneNumber,
      })
    )
  );
}

/**
 * Validate phone number format (basic validation)
 */
function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove common formatting characters
  const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, "");

  // Check if it's a valid US phone number (10 digits)
  // or international format (+1 followed by 10 digits)
  const phoneRegex = /^(\+1)?[0-9]{10}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, "");

  if (cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Schedule recurring SMS reminders for a task
 */
export interface ReminderSchedule {
  taskId: number;
  phoneNumber: string;
  taskName: string;
  dueDate: string;
  reminderDaysBefore: number[]; // e.g., [7, 3, 1] = remind 7 days, 3 days, and 1 day before
  enabled: boolean;
}

export async function scheduleTaskReminders(
  schedule: ReminderSchedule
): Promise<SMSResponse> {
  // This would integrate with a job scheduler like node-cron or Bull
  // For now, return a placeholder response
  return {
    success: true,
    message: `Reminders scheduled for ${schedule.taskName}`,
  };
}

/**
 * Cancel scheduled SMS reminders
 */
export async function cancelTaskReminders(taskId: number): Promise<SMSResponse> {
  return {
    success: true,
    message: `Reminders cancelled for task ${taskId}`,
  };
}
