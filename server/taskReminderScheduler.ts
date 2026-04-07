import { sendSMSNotification } from "./smsNotification";

interface TaskReminder {
  taskId: string;
  taskName: string;
  dueDate: Date;
  phoneNumber: string;
  reminderDaysBefore: number[];
  enabled: boolean;
  lastSentDate?: Date;
}

interface ReminderScheduleConfig {
  taskReminders: TaskReminder[];
  checkInterval: number; // milliseconds between checks (default: 3600000 = 1 hour)
}

class TaskReminderScheduler {
  private reminders: Map<string, TaskReminder> = new Map();
  private checkInterval: number = 3600000; // 1 hour
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Initialize the scheduler with reminders
   */
  public initialize(config: ReminderScheduleConfig): void {
    this.checkInterval = config.checkInterval || 3600000;
    config.taskReminders.forEach((reminder) => {
      this.reminders.set(reminder.taskId, reminder);
    });
    console.log(`[TaskReminderScheduler] Initialized with ${this.reminders.size} reminders`);
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.warn("[TaskReminderScheduler] Scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log(`[TaskReminderScheduler] Starting scheduler (check interval: ${this.checkInterval}ms)`);

    // Check immediately on start
    this.checkAndSendReminders();

    // Then check at regular intervals
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, this.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[TaskReminderScheduler] Scheduler stopped");
  }

  /**
   * Check all reminders and send SMS if needed
   */
  private async checkAndSendReminders(): Promise<void> {
    const now = new Date();
    const remindersToSend: TaskReminder[] = [];

    this.reminders.forEach((reminder) => {
      if (!reminder.enabled) return;

      const dueDate = new Date(reminder.dueDate);
      const daysUntilDue = this.calculateDaysUntil(now, dueDate);

      // Check if we should send a reminder
      if (reminder.reminderDaysBefore.includes(daysUntilDue)) {
        // Check if we haven't already sent a reminder today
        if (!reminder.lastSentDate || !this.isSameDay(reminder.lastSentDate, now)) {
          remindersToSend.push(reminder);
        }
      }
    });

    // Send reminders
    for (const reminder of remindersToSend) {
      await this.sendReminder(reminder);
    }
  }

  /**
   * Send a single reminder
   */
  private async sendReminder(reminder: TaskReminder): Promise<void> {
    try {
      const daysUntilDue = this.calculateDaysUntil(new Date(), new Date(reminder.dueDate));
      let reminderType: "task_reminder" | "milestone_alert" | "deadline_warning" = "task_reminder";

      if (daysUntilDue === 0) {
        reminderType = "deadline_warning";
      } else if (daysUntilDue === 1) {
        reminderType = "deadline_warning";
      }

      const result = await sendSMSNotification({
        phoneNumber: reminder.phoneNumber,
        taskName: reminder.taskName,
        taskDueDate: reminder.dueDate.toLocaleDateString(),
        reminderType,
        priority: daysUntilDue <= 1 ? "high" : "medium",
      });

      if (result.success) {
        // Update last sent date
        reminder.lastSentDate = new Date();
        console.log(`[TaskReminderScheduler] Reminder sent for task: ${reminder.taskName}`);
      } else {
        console.error(`[TaskReminderScheduler] Failed to send reminder: ${result.error}`);
      }
    } catch (error) {
      console.error("[TaskReminderScheduler] Error sending reminder:", error);
    }
  }

  /**
   * Add a new reminder
   */
  public addReminder(reminder: TaskReminder): void {
    this.reminders.set(reminder.taskId, reminder);
    console.log(`[TaskReminderScheduler] Added reminder for task: ${reminder.taskName}`);
  }

  /**
   * Remove a reminder
   */
  public removeReminder(taskId: string): void {
    this.reminders.delete(taskId);
    console.log(`[TaskReminderScheduler] Removed reminder for task: ${taskId}`);
  }

  /**
   * Update a reminder
   */
  public updateReminder(taskId: string, updates: Partial<TaskReminder>): void {
    const reminder = this.reminders.get(taskId);
    if (reminder) {
      Object.assign(reminder, updates);
      console.log(`[TaskReminderScheduler] Updated reminder for task: ${taskId}`);
    }
  }

  /**
   * Get all reminders
   */
  public getReminders(): TaskReminder[] {
    return Array.from(this.reminders.values());
  }

  /**
   * Get reminder by task ID
   */
  public getReminder(taskId: string): TaskReminder | undefined {
    return this.reminders.get(taskId);
  }

  /**
   * Calculate days until due date
   */
  private calculateDaysUntil(from: Date, to: Date): number {
    const fromDate = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isRunning: boolean;
    reminderCount: number;
    checkInterval: number;
  } {
    return {
      isRunning: this.isRunning,
      reminderCount: this.reminders.size,
      checkInterval: this.checkInterval,
    };
  }
}

// Export singleton instance
export const taskReminderScheduler = new TaskReminderScheduler();

/**
 * Initialize scheduler with default config
 */
export function initializeTaskReminderScheduler(): void {
  taskReminderScheduler.initialize({
    taskReminders: [],
    checkInterval: 3600000, // 1 hour
  });
  taskReminderScheduler.start();
}

/**
 * Shutdown scheduler gracefully
 */
export function shutdownTaskReminderScheduler(): void {
  taskReminderScheduler.stop();
}
