import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getHostname(req: Request): string {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0] || req.hostname;

  return host.split(":")[0].trim().toLowerCase();
}

function isIpAddress(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function getConfiguredCookieDomain(): string | undefined {
  const configured = process.env.SESSION_COOKIE_DOMAIN?.trim();
  if (!configured) return undefined;
  return configured.startsWith(".") ? configured : `.${configured}`;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = getHostname(req);
  const secure = isSecureRequest(req);
  const isLocalhost = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);

  if (isLocalhost || !secure) {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  return {
    domain: getConfiguredCookieDomain(),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
  };
}
