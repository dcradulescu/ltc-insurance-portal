import nodemailer from "nodemailer";
import { TRPCError } from "@trpc/server";

interface EmailOptions {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; path?: string; content?: Buffer | string; contentType?: string }>;
}

export function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

/** Success means the SMTP server accepted every recipient, not inbox delivery. */
export async function sendEmail(options: EmailOptions) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Email service is not configured. Please contact the office." });
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  try {
    const result = await transporter.sendMail({ from: process.env.SMTP_FROM, ...options });
    const accepted = result.accepted?.length || 0;
    const rejected = result.rejected?.length || 0;
    if (!accepted || rejected) {
      throw new TRPCError({ code: "BAD_GATEWAY", message: `Email service accepted ${accepted} recipient(s) and rejected ${rejected}. Check before retrying to avoid duplicates.` });
    }
    return { success: true as const, status: "accepted" as const, messageId: result.messageId };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Email submission could not be confirmed. Check with the office before retrying." });
  } finally { transporter.close(); }
}
