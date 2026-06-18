import express, { type Express } from "express";
import path from "path";

function getLocalStorageRoot(): string {
  return process.env.LOCAL_STORAGE_ROOT || "/var/www/ltc-insurance-portal/shared/uploads";
}

function getLocalPublicBaseUrl(): string {
  return process.env.LOCAL_STORAGE_PUBLIC_BASE_URL || "/uploaded-files";
}

export function registerLocalStorageRoutes(app: Express) {
  if ((process.env.OBJECT_STORAGE_PROVIDER || "local").toLowerCase() !== "local") {
    return;
  }

  const storageRoot = path.resolve(getLocalStorageRoot());
  const publicBaseUrl = getLocalPublicBaseUrl().replace(/\/+$/, "") || "/uploaded-files";

  app.use(
    publicBaseUrl,
    express.static(storageRoot, {
      dotfiles: "deny",
      fallthrough: false,
      index: false,
      maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
      setHeaders(res) {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "private, max-age=3600");
      },
    })
  );
}
