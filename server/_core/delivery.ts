import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import { escapeHtml, sendEmail } from "./email";

export async function submitWebhook(payload: Record<string, unknown>) {
  if (!ENV.zapierWebhookUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Delivery service is not configured. Please contact the office." });
  try {
    const response = await fetch(ENV.zapierWebhookUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000), redirect: "error",
    });
    if (!response.ok) throw new Error("Webhook rejected submission");
    await response.body?.cancel();
    return { success: true as const, status: "accepted" as const, channel: "webhook" as const };
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Delivery submission could not be confirmed. Check with the office before retrying." });
  }
}

/** One configured channel per request. No automatic fallback that could send duplicates. */
export async function submitEmail(input: { recipients: string[]; subject: string; text: string; payload: Record<string, unknown> }) {
  if (ENV.zapierWebhookUrl) return submitWebhook({ ...input.payload, recipients: input.recipients,
    subject: input.subject, body: input.text, timestamp: new Date().toISOString() });
  const result = await sendEmail({ to: input.recipients, subject: input.subject,
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>` });
  return { ...result, channel: "smtp" as const };
}
