import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import crypto from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request } from "express";
import { sdk } from "./_core/sdk";

export type StoragePutResult = {
  key: string;
  url: string;
};

export type StorageGetResult = {
  key: string;
  url: string;
};

type StorageProvider = "local" | "r2" | "s3" | "manus";

function getStorageProvider(): StorageProvider {
  const provider = (process.env.OBJECT_STORAGE_PROVIDER || "local").toLowerCase();
  if (["local", "r2", "s3", "manus"].includes(provider)) {
    return provider as StorageProvider;
  }
  throw new Error(`Unsupported OBJECT_STORAGE_PROVIDER: ${provider}`);
}

function isFileAuthRequired(): boolean {
  return (process.env.REQUIRE_AUTH_FOR_FILE_ACCESS || "true").toLowerCase() === "true";
}

async function hasValidSession(req: Request): Promise<boolean> {
  if (!isFileAuthRequired()) return true;
  const cookies = parseCookieHeader(req.headers.cookie || "");
  const sessionCookie = cookies[COOKIE_NAME];
  const session = await sdk.verifySession(sessionCookie);
  return Boolean(session);
}

function normalizeKey(relKey: string): string {
  const normalized = relKey.replace(/^\/+/, "").replace(/\.\.+/g, "");
  if (!normalized) throw new Error("Storage key cannot be empty");
  return normalized;
}

function getLocalStorageRoot(): string {
  return process.env.LOCAL_STORAGE_ROOT || "/var/www/ltc-insurance-portal/shared/uploads";
}

function getLocalPublicBaseUrl(): string {
  return process.env.LOCAL_STORAGE_PUBLIC_BASE_URL || "/uploaded-files";
}

function getLocalAbsolutePath(relKey: string): string {
  const key = normalizeKey(relKey);
  const storageRoot = path.resolve(getLocalStorageRoot());
  const absolutePath = path.resolve(storageRoot, key);

  if (!absolutePath.startsWith(storageRoot + path.sep) && absolutePath !== storageRoot) {
    throw new Error("Invalid storage key path");
  }

  return absolutePath;
}

function toBuffer(data: Buffer | Uint8Array | string): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

async function putLocal(
  relKey: string,
  data: Buffer | Uint8Array | string
): Promise<StoragePutResult> {
  const key = normalizeKey(relKey);
  const absolutePath = getLocalAbsolutePath(key);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, toBuffer(data), { mode: 0o640 });

  const publicBase = getLocalPublicBaseUrl().replace(/\/+$/, "");
  return { key, url: `${publicBase}/${encodeURI(key)}` };
}

async function getLocal(relKey: string): Promise<StorageGetResult> {
  const key = normalizeKey(relKey);
  const publicBase = getLocalPublicBaseUrl().replace(/\/+$/, "");
  return { key, url: `${publicBase}/${encodeURI(key)}` };
}

function unsupportedProvider(provider: StorageProvider): never {
  throw new Error(
    `Storage provider ${provider} is not implemented yet. Use OBJECT_STORAGE_PROVIDER=local for VPS deployment or implement the provider adapter.`
  );
}

export function generateStorageKey(prefix: string, fileName: string): string {
  const safePrefix = normalizeKey(prefix).replace(/\/+$/, "");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const id = crypto.randomUUID();
  return `${safePrefix}/${id}-${safeName}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<StoragePutResult> {
  const provider = getStorageProvider();

  switch (provider) {
    case "local":
      return putLocal(relKey, data);
    case "r2":
    case "s3":
    case "manus":
      return unsupportedProvider(provider);
    default:
      return unsupportedProvider(provider);
  }
}

export async function storageGet(relKey: string): Promise<StorageGetResult> {
  const provider = getStorageProvider();

  switch (provider) {
    case "local":
      return getLocal(relKey);
    case "r2":
    case "s3":
    case "manus":
      return unsupportedProvider(provider);
    default:
      return unsupportedProvider(provider);
  }
}

export function registerLocalStorageRoutes(app: Express): void {
  const publicBase = getLocalPublicBaseUrl().replace(/\/+$/, "");

  app.get(`${publicBase}/*`, async (req, res) => {
    if (!(await hasValidSession(req))) {
      res.status(401).send("Authentication required");
      return;
    }

    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing file key");
      return;
    }

    try {
      const absolutePath = getLocalAbsolutePath(decodeURIComponent(key));
      await fs.access(absolutePath);
      res.setHeader("Cache-Control", "private, no-store");
      createReadStream(absolutePath).pipe(res);
    } catch {
      res.status(404).send("File not found");
    }
  });
}
