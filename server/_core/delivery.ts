import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

/** A provider acceptance is not proof of arrival in the recipient's inbox. */
export async function deliver(payload: Record<string, unknown>) {
  const configured = ENV.zapierWebhookUrl;
  if (!configured) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Email delivery is not configured. Please download your information or contact the office." });
  let url: URL;
  try { url = new URL(configured); } catch { throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Email delivery configuration is invalid." }); }
  if (url.protocol !== "https:") throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Email delivery requires HTTPS." });
  try {
    const response = await fetch(url.href, {
      method: "POST", headers: { "Content-Type": "application/json" }, redirect: "error",
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Provider status ${response.status}`);
    return { success: true as const, status: "accepted" as const, message: "Accepted for email delivery. Inbox arrival is not yet confirmed." };
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Email delivery was not accepted. Please try again or download your information." });
  }
}
export function resumeOrigin() {
  const value = process.env.APP_URL;
  if (!value) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Save-and-return links are not configured." });
  let url: URL;
  try { url = new URL(value); } catch { throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Save-and-return application URL is invalid." }); }
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Save-and-return requires a secure application URL." });
  return url.origin;
}
