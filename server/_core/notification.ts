import { TRPCError } from "@trpc/server";
import { sendEmail } from "./email";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

function validatePayload(input: NotificationPayload): NotificationPayload {
  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title) throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  if (!content) throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  if (title.length > TITLE_MAX_LENGTH) throw new TRPCError({ code: "BAD_REQUEST", message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.` });
  if (content.length > CONTENT_MAX_LENGTH) throw new TRPCError({ code: "BAD_REQUEST", message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.` });
  return { title, content };
}

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  if (!ENV.ownerEmail) {
    console.warn("[Notification] NOTIFY_OWNER_EMAIL is not configured; notification skipped.");
    return false;
  }

  try {
    const result = await sendEmail({
      to: ENV.ownerEmail,
      subject: title,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(content)}</pre>`,
    });
    return result.success;
  } catch (error) {
    console.warn("[Notification] Email delivery failed:", error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
