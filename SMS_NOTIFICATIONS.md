> Historical source document. Current verified status and exceptions are in DEVELOPMENT_2026-10-08.md; current setup is in START_HERE.md. Any older completion, security, delivery or test claims below are not current verification.

# SMS Notifications Feature Documentation

## Overview

The SMS Notifications feature enables task reminders and milestone alerts to be sent via text message to insured individuals and family members. This helps ensure critical deadlines are not missed during the LTC insurance claim process.

## Components

### 1. SMS Notification Service (`server/smsNotification.ts`)

Core service for generating and sending SMS messages.

**Key Functions:**

- **`generateSMSMessage(config)`** - Generates SMS message text based on task and reminder type
  - Supports three reminder types: `task_reminder`, `milestone_alert`, `deadline_warning`
  - Customizable messages for different scenarios
  - Includes task name, due date, and call-to-action (HELP)

- **`sendSMSNotification(config)`** - Sends a single SMS notification
  - Validates phone number format
  - Integrates with Twilio (when configured)
  - Returns success/failure status with message ID
  - Gracefully handles missing Twilio configuration

- **`sendBulkSMSNotifications(recipients, config)`** - Sends SMS to multiple recipients
  - Sends reminders to insured, family members, care providers, etc.
  - Returns array of results for each recipient
  - Handles partial failures gracefully

- **`formatPhoneNumber(phoneNumber)`** - Normalizes phone number format
  - Accepts various formats: `5551234567`, `(555) 123-4567`, `555-123-4567`, `+15551234567`
  - Returns standardized format: `+15551234567`

**Configuration:**

Set these environment variables to enable SMS:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

### 2. Task Reminder Scheduler (`server/taskReminderScheduler.ts`)

Manages automatic scheduling and sending of task reminders.

**Key Features:**

- **Automatic Checking** - Checks reminders at configurable intervals (default: 1 hour)
- **Flexible Timing** - Send reminders 7, 3, 1 days before, or on the day of task
- **Smart Deduplication** - Won't send duplicate reminders on the same day
- **Dynamic Management** - Add, update, or remove reminders at runtime
- **Status Monitoring** - Check scheduler status and reminder count

**Usage:**

```typescript
import { taskReminderScheduler, initializeTaskReminderScheduler } from "./taskReminderScheduler";

// Initialize and start scheduler
initializeTaskReminderScheduler();

// Add a reminder
taskReminderScheduler.addReminder({
  taskId: "s1-1",
  taskName: "Contact insurance company",
  dueDate: new Date("2026-04-20"),
  phoneNumber: "+15551234567",
  reminderDaysBefore: [7, 3, 1],
  enabled: true,
});

// Check status
const status = taskReminderScheduler.getStatus();
console.log(`Reminders: ${status.reminderCount}, Running: ${status.isRunning}`);

// Shutdown gracefully
import { shutdownTaskReminderScheduler } from "./taskReminderScheduler";
shutdownTaskReminderScheduler();
```

### 3. SMS Notification Manager Component (`client/src/components/SMSNotificationManager.tsx`)

React component for managing SMS notification preferences and sending test messages.

**Features:**

- **Setup Tab** - Configure primary phone number and select additional recipients
- **Preferences Tab** - Choose notification types and reminder timing
- **Test Tab** - Send test SMS to verify setup is working

**Props:**

```typescript
interface SMSNotificationManagerProps {
  policyId: number;           // Policy ID for context
  insuredName: string;        // Insured person's full name
  insuredPhone?: string;      // Pre-filled phone number
  onNotificationSent?: (result: any) => void;  // Callback when notification sent
}
```

**Usage:**

```tsx
import { SMSNotificationManager } from "@/components/SMSNotificationManager";

<SMSNotificationManager 
  policyId={policy.id} 
  insuredName={policy.insuredFullName} 
  insuredPhone={policy.insuredPhone}
  onNotificationSent={(result) => console.log(result)}
/>
```

### 4. tRPC Procedures (`server/routers.ts`)

Three tRPC mutations for SMS operations:

- **`sms.sendNotification`** - Send a single SMS notification
  ```typescript
  trpc.sms.sendNotification.useMutation({
    phoneNumber: "5551234567",
    taskName: "Submit claim packet",
    taskDueDate: "2026-04-15",
    reminderType: "task_reminder",
    priority: "medium",
  });
  ```

- **`sms.sendBulk`** - Send SMS to multiple recipients
  ```typescript
  trpc.sms.sendBulk.useMutation({
    recipients: [
      { phoneNumber: "5551234567", name: "John Doe" },
      { phoneNumber: "5559876543", name: "Jane Smith" },
    ],
    taskName: "Submit claim packet",
    taskDueDate: "2026-04-15",
    reminderType: "task_reminder",
    priority: "medium",
  });
  ```

- **`sms.savePreferences`** - Save user SMS preferences
  ```typescript
  trpc.sms.savePreferences.useMutation({
    phoneNumber: "5551234567",
    taskReminders: true,
    milestoneAlerts: true,
    deadlineWarnings: true,
    reminderDaysBefore: [7, 3, 1],
  });
  ```

## Integration with Strategy Page

The SMS Notification Manager is integrated into the Strategy page via a dialog button:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <MessageCircle className="w-4 h-4 mr-2" /> SMS Notifications
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="font-serif">SMS Task Reminders</DialogTitle>
    </DialogHeader>
    <SMSNotificationManager 
      policyId={policy?.id || 0} 
      insuredName={policy?.insuredFullName || ""} 
      insuredPhone={policy?.insuredPhone} 
    />
  </DialogContent>
</Dialog>
```

## Reminder Types

### Task Reminder
- **When:** 7, 3, or 1 day before task due date
- **Message:** "LTC Navigator: [Task Name] - Due: [Date]. Complete this task to stay on track with your claim."
- **Priority:** Medium

### Milestone Alert
- **When:** When important milestones are reached (claim approved, evaluation scheduled, etc.)
- **Message:** "LTC Navigator: [Milestone] - Important milestone reached! [Custom Message]"
- **Priority:** High

### Deadline Warning
- **When:** 1 day before or on the day of critical deadline
- **Message:** "LTC Navigator: [Task Name] - URGENT: Due [Date]. This is critical for your claim. Complete immediately."
- **Priority:** High

## Testing

Run the SMS notification tests:

```bash
pnpm test -- server/smsNotification.test.ts
```

Test coverage includes:
- Message generation for all reminder types
- Phone number formatting and validation
- SMS sending with and without Twilio configuration
- Bulk SMS sending to multiple recipients

## Future Enhancements

1. **Database Persistence** - Store SMS preferences and delivery history in database
2. **Scheduled Jobs** - Integrate with job scheduler (Bull, node-cron) for production reliability
3. **Twilio Integration** - Complete Twilio API integration for actual SMS delivery
4. **Delivery Tracking** - Track SMS delivery status and bounce handling
5. **Opt-out Management** - Allow users to opt-out of specific notification types
6. **Multi-language Support** - Send SMS in user's preferred language
7. **WhatsApp Integration** - Extend to WhatsApp Business API for richer messaging

## Configuration

### Environment Variables

```
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Scheduler Configuration (optional)
SMS_CHECK_INTERVAL=3600000  # milliseconds (default: 1 hour)
```

### Disabling SMS

If SMS is not configured, the service gracefully returns an error message indicating that SMS notifications are not available. Users can still use the UI to set preferences, but notifications won't be sent until Twilio is configured.

## Security Considerations

1. **Phone Number Validation** - All phone numbers are validated before sending
2. **No Sensitive Data in SMS** - SMS messages contain only task names and dates, not personal health information
3. **Environment Variables** - Twilio credentials stored in environment variables, never in code
4. **Rate Limiting** - Consider implementing rate limiting to prevent SMS spam
5. **Opt-in/Opt-out** - Users should be able to easily opt-out of notifications

## Support

For issues or questions about SMS notifications:
1. Check that Twilio credentials are correctly configured
2. Verify phone numbers are in valid format
3. Review SMS notification test results
4. Check server logs for error messages
5. Contact support if SMS service is not responding
