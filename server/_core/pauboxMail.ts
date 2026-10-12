/**
 * LTC Portal transactional email through Paubox Email API (v1 current REST).
 *
 * Paubox is the outbound email transport only; the registered GoDaddy /
 * Microsoft 365 mailbox remains the ordinary inbound mailbox.
 *
 * API reference:
 * https://docs.paubox.com/email-api/quickstart
 * https://docs.paubox.com/email-api/messages
 * https://docs.paubox.com/email-api/attachments
 *
 * Send BCC and the exact in-memory attachment bytes in ONE provider request.
 * Never accept arbitrary API URLs, path-based attachments, non-TLS overrides,
 * plaintext auth, or print private provider responses.
 *
 * A 200/sourceTrackingId means provider acceptance, not inbox delivery.
 */
import { TRPCError } from "@trpc/server";

export interface PauboxMailOptions {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

type PauboxConfig = { apiKey: string; senderEmail: string };
const API_ENDPOINT = "https://api.paubox.com/v1/email/messages";
const MAX_ATTACHMENT_BYTES = 45 * 1024 * 1024; // below Paubox's documented 50 MB limit
const addressIsValid = (address: string) =>
  address.length <= 320 &&
  /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(address);

function getConfig(env: NodeJS.ProcessEnv): PauboxConfig {
  const apiKey = env.PAUBOX_API_KEY?.trim() || "";
  const senderEmail = env.PAUBOX_SENDER_EMAIL?.trim() || "";
  if (!apiKey || /^(?:REPLACE|CHANGEME|YOUR[_-])/i.test(apiKey) || !addressIsValid(senderEmail))
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Paubox email delivery is not configured. Please contact the office.",
    });
  return { apiKey, senderEmail };
}

function recipients(value: string | string[] | undefined, required: boolean): string[] {
  const addresses = typeof value === "string" ? [value] : (value || []);
  if ((required && !addresses.length) ||
      addresses.length > 12 || addresses.some(a => !addressIsValid(a)))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email recipients." });
  return addresses;
}

function attachmentsForApi(input: PauboxMailOptions["attachments"]) {
  let totalBytes = 0;
  return (input || []).map(attachment => {
    if (attachment.path || attachment.content == null ||
        !attachment.filename || /[\\/\r\n]/.test(attachment.filename) ||
        attachment.filename.length > 255)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Paubox requires in-memory attachments with a valid filename.",
      });
    const bytes = Buffer.isBuffer(attachment.content)
      ? attachment.content : Buffer.from(attachment.content, "utf8");
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_ATTACHMENT_BYTES)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "The document is too large for configured secure email delivery.",
      });
    return {
      fileName: attachment.filename,
      contentType: attachment.contentType || "application/octet-stream",
      content: bytes.toString("base64"),
    };
  });
}

export async function sendPauboxMail(
  options: PauboxMailOptions,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ success: true; status: "accepted"; messageId: string }> {
  const config = getConfig(env);
  if (!options.subject || options.subject.length > 998 ||
      /[\r\n]/.test(options.subject) ||
      typeof options.html !== "string" || options.html.length > 2_000_000)
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email content." });

  const to = recipients(options.to, true);
  const bcc = recipients(options.bcc, false);
  const attachments = attachmentsForApi(options.attachments);
  // Paubox REST uses a nested message with recipients, optional bcc,
  // headers, MIME content and base64 file attachments.
  const message = {
    recipients: to,
    ...(bcc.length ? { bcc } : {}),
    headers: { subject: options.subject, from: config.senderEmail },
    content: { "text/html": options.html },
    ...(attachments.length ? { attachments } : {}),
  };

  let response: Response;
  try {
    response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { message } }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Paubox email submission could not be confirmed. Check delivery before retrying.",
    });
  }
  if (response.status !== 200) {
    throw new TRPCError({
      code: response.status === 401 || response.status === 403
        ? "PRECONDITION_FAILED" : "BAD_GATEWAY",
      message: "Paubox did not accept the email. Check provider configuration before retrying.",
    });
  }

  let parsed: unknown;
  try { parsed = await response.json(); }
  catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Paubox email acceptance could not be verified.",
    });
  }
  const tracking = (parsed && typeof parsed === "object" &&
      "sourceTrackingId" in parsed && typeof parsed.sourceTrackingId === "string")
    ? parsed.sourceTrackingId : "";
  if (!tracking || tracking.length > 256 || /[\r\n]/.test(tracking))
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Paubox did not return a valid email tracking reference.",
    });
  return { success: true, status: "accepted", messageId: tracking };
}
