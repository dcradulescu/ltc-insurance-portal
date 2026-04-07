import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  try {
    // For development/testing, log instead of sending
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 Email (development mode):", {
        to: options.to,
        subject: options.subject,
        attachments: options.attachments?.map(a => a.filename),
      });
      return { success: true, messageId: "dev-mode-" + Date.now() };
    }

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@ltcnavigator.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log("✅ Email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw new Error(`Failed to send email: ${error}`);
  }
}
