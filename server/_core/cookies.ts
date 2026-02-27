import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const secure = isSecureRequest(req);
  
  // For local development, don't set domain or sameSite=none
  const isLocalhost = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
  
  if (isLocalhost) {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  // For production, set domain and use sameSite=none with secure
  const shouldSetDomain = hostname && !hostname.startsWith(".");
  const domain = shouldSetDomain ? `.${hostname}` : undefined;

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true, // Always require secure for sameSite=none
  };
}
