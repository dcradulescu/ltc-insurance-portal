import { z } from "zod";

export const smsPreferencesSchema = z.object({
  phoneNumber: z.string().trim().transform(value => value.replace(/[\s().-]/g, ""))
    .pipe(z.string().regex(/^(\+1)?[0-9]{10}$/, "Use a 10-digit US phone number, optionally starting with +1")),
  taskReminders: z.boolean(), milestoneAlerts: z.boolean(), deadlineWarnings: z.boolean(),
  reminderDaysBefore: z.array(z.number().int().min(0).max(30)).max(31),
});
