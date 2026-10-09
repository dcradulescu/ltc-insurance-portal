import { z } from "zod";

export const nameSchema = z.string().trim().min(1, "Name is required.").max(200);
export const emailSchema = z.string().trim().email("Enter a valid email address.").max(320);
export const profileDetailsSchema = z.object({ name: nameSchema, email: emailSchema });
export const contactDetailsSchema = profileDetailsSchema.extend({
  relationship: z.string().trim().max(200).optional(),
  receiveCcEmails: z.union([z.literal(0), z.literal(1)]).optional(),
});
export const contactMessageSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  message: z.string().trim().min(1, "Message is required.").max(10000),
});

// Reject invalid entries instead of silently dropping an intended recipient.
export const strategyRecipientsSchema = z.array(emailSchema).min(1).max(10)
  .transform(emails => emails.filter((email, index) => emails.findIndex(other => other.toLowerCase() === email.toLowerCase()) === index));
