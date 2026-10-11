> Historical source document. Current verified status and exceptions are in DEVELOPMENT_2026-10-08.md; current setup is in START_HERE.md. Any older completion, security, delivery or test claims below are not current verification.

# SMS Notifications Implementation Guide

## Quick Start

### 1. Enable SMS Notifications in Your Environment

Set these environment variables in your `.env` file or deployment platform:

```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 2. Access SMS Notification Manager

Users can access SMS notification settings from the Strategy page:

1. Navigate to **My Strategy** page
2. Click the **SMS Notifications** button in the action bar
3. Configure preferences in the dialog:
   - **Setup Tab**: Enter phone number and select recipients
   - **Preferences Tab**: Choose notification types and timing
   - **Test Tab**: Send a test message to verify setup

### 3. Integrate with Your Workflow

#### Send a Single Reminder

```typescript
// In a React component
import { trpc } from "@/lib/trpc";

const sendReminder = trpc.sms.sendNotification.useMutation();

const handleSendReminder = async () => {
  await sendReminder.mutateAsync({
    phoneNumber: "+15551234567",
    taskName: "Submit claim packet",
    taskDueDate: "2026-04-15",
    reminderType: "task_reminder",
    priority: "medium",
  });
};
```

#### Send Bulk Reminders

```typescript
const sendBulkReminders = trpc.sms.sendBulk.useMutation();

const handleSendBulk = async () => {
  await sendBulkReminders.mutateAsync({
    recipients: [
      { phoneNumber: "+15551234567", name: "John Doe" },
      { phoneNumber: "+15559876543", name: "Jane Smith" },
    ],
    taskName: "Third-party evaluation scheduled",
    taskDueDate: "2026-04-20",
    reminderType: "milestone_alert",
    priority: "high",
  });
};
```

#### Save User Preferences

```typescript
const savePreferences = trpc.sms.savePreferences.useMutation();

const handleSavePreferences = async () => {
  await savePreferences.mutateAsync({
    phoneNumber: "+15551234567",
    taskReminders: true,
    milestoneAlerts: true,
    deadlineWarnings: true,
    reminderDaysBefore: [7, 3, 1],
  });
};
```

## Advanced Configuration

### Automatic Reminder Scheduling

To enable automatic task reminders, initialize the scheduler in your server startup:

```typescript
// In server/_core/index.ts or your server initialization file
import { initializeTaskReminderScheduler, shutdownTaskReminderScheduler } from "../taskReminderScheduler";

// Start scheduler on server startup
initializeTaskReminderScheduler();

// Gracefully shutdown on server termination
process.on("SIGTERM", () => {
  shutdownTaskReminderScheduler();
  process.exit(0);
});
```

### Custom Reminder Timing

Customize when reminders are sent by modifying the `reminderDaysBefore` array:

```typescript
// Send reminders 14 days, 7 days, 3 days, and 1 day before
reminderDaysBefore: [14, 7, 3, 1]

// Send reminder only on the day of task
reminderDaysBefore: [0]

// Send reminder 1 day before and on the day
reminderDaysBefore: [1, 0]
```

### Custom Message Templates

Modify message templates in `server/smsNotification.ts`:

```typescript
export function generateSMSMessage(config: SMSNotificationConfig): string {
  // Add custom logic here
  switch (config.reminderType) {
    case "task_reminder":
      return `Custom: ${config.taskName} due ${config.taskDueDate}`;
    // ... etc
  }
}
```

## Integration Points

### 1. Strategy Page

SMS button is already integrated in the Strategy page action bar. Users can:
- Configure phone numbers
- Set notification preferences
- Send test messages
- View notification history (future enhancement)

### 2. Task Completion

When a task is marked complete, you can optionally send a milestone alert:

```typescript
// In StrategyChecklist component
const handleTaskComplete = async (taskId: string) => {
  // Mark task as complete
  await updateTask(taskId, { completed: true });
  
  // Send milestone alert
  if (allTasksInStageComplete(currentStage)) {
    await sendSMSNotification({
      phoneNumber: policy.insuredPhone,
      taskName: `Stage ${currentStage} Complete!`,
      taskDueDate: new Date().toLocaleDateString(),
      reminderType: "milestone_alert",
      priority: "high",
    });
  }
};
```

### 3. Claim Status Changes

Send alerts when claim status changes:

```typescript
// When claim is approved
await sendSMSNotification({
  phoneNumber: policy.insuredPhone,
  taskName: "Your LTC Claim Has Been Approved",
  taskDueDate: new Date().toLocaleDateString(),
  reminderType: "milestone_alert",
  priority: "high",
  customMessage: "Congratulations! Your claim has been approved. Review your approval letter for next steps.",
});

// When third-party evaluation is scheduled
await sendSMSNotification({
  phoneNumber: policy.insuredPhone,
  taskName: "Third-Party Evaluation Scheduled",
  taskDueDate: evaluationDate.toLocaleDateString(),
  reminderType: "milestone_alert",
  priority: "high",
  customMessage: "Your third-party evaluation has been scheduled. Be prepared to demonstrate ADL limitations.",
});
```

## Testing

### Run Unit Tests

```bash
pnpm test -- server/smsNotification.test.ts
```

### Manual Testing

1. Go to Strategy page
2. Click "SMS Notifications" button
3. Enter a test phone number
4. Click "Send Test Message" in the Test tab
5. Verify message format and delivery

### Debug Logging

Enable debug logging to see SMS operations:

```typescript
// In server/smsNotification.ts
console.log(`[SMS] Sending to ${config.phoneNumber}: ${messageText}`);
```

Check server logs for SMS activity:

```bash
# View recent logs
tail -f .manus-logs/devserver.log | grep SMS

# Or search for specific messages
grep -i "SMS" .manus-logs/devserver.log
```

## Troubleshooting

### SMS Not Sending

**Problem:** SMS notifications are not being sent

**Solutions:**
1. Verify Twilio credentials are set in environment variables
2. Check that phone numbers are in valid format (with country code)
3. Verify Twilio account has sufficient credits
4. Check server logs for error messages
5. Test with the SMS Notification Manager test feature

### Invalid Phone Number

**Problem:** "Invalid phone number format" error

**Solutions:**
1. Ensure phone number includes country code (e.g., +1 for USA)
2. Use format: `+15551234567` or `(555) 123-4567`
3. Remove any non-numeric characters except +, -, (, )
4. Verify number is not already formatted incorrectly

### Scheduler Not Running

**Problem:** Automatic reminders are not being sent

**Solutions:**
1. Verify scheduler is initialized: `initializeTaskReminderScheduler()`
2. Check that reminders are added to scheduler
3. Verify `reminderDaysBefore` array is not empty
4. Check server logs for scheduler errors
5. Verify task due dates are in the future

### Duplicate Reminders

**Problem:** Users are receiving duplicate reminders

**Solutions:**
1. Check `lastSentDate` tracking is working
2. Verify scheduler check interval is not too frequent
3. Ensure only one scheduler instance is running
4. Check for multiple reminder entries for same task

## Production Deployment

### Before Going Live

1. **Test with Real Twilio Account**
   - Create Twilio account and get credentials
   - Test with real phone numbers
   - Verify SMS delivery

2. **Set Environment Variables**
   - Add Twilio credentials to production environment
   - Use secure secret management (not in code)

3. **Monitor SMS Costs**
   - Twilio charges per SMS sent
   - Monitor usage in Twilio dashboard
   - Set up billing alerts

4. **Implement Rate Limiting**
   - Prevent SMS spam
   - Limit reminders per user per day
   - Implement cooldown periods

5. **Add Opt-out Support**
   - Allow users to opt-out of SMS
   - Respect Do Not Call regulations
   - Log opt-out preferences

### Deployment Checklist

- [ ] Twilio account created and configured
- [ ] Environment variables set in production
- [ ] SMS notification tests passing
- [ ] Manual testing completed with real phone numbers
- [ ] Error handling and logging in place
- [ ] Rate limiting implemented
- [ ] Opt-out mechanism available
- [ ] Documentation updated
- [ ] Team trained on SMS feature
- [ ] Monitoring and alerts configured

## Future Enhancements

1. **Database Persistence**
   - Store SMS preferences in database
   - Track SMS delivery history
   - Enable SMS analytics

2. **Advanced Scheduling**
   - Integration with Bull job queue
   - Distributed scheduler for multi-server deployments
   - Timezone-aware scheduling

3. **Multi-Channel Messaging**
   - Email reminders as fallback
   - Push notifications
   - WhatsApp integration

4. **Smart Reminders**
   - ML-based optimal send time
   - Personalized reminder frequency
   - Adaptive reminder content

5. **Compliance**
   - TCPA compliance tracking
   - Consent management
   - Audit logging

## Support Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [SMS Best Practices](https://www.twilio.com/docs/sms/best-practices)
- [LTC Navigator Support](https://help.manus.im)
