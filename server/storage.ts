import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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

function normalizeKey(relKey: string): string {
  const normalized = relKey.replace(/^\/+/, "").replace(/\.\.+/g, "");
  if (!normalized) throw new Error("Storage key cannot be empty");
  return normalized;
}

function getLocalStorageRoot(): string {
  return process.env.LOCAL_STORAGE_ROOT || "/var/www/ltc-insurance-portal/storage";
}

function getLocalPublicBaseUrl(): string {
  return process.env.LOCAL_STORAGE_PUBLIC_BASE_URL || "/uploaded-files";
}

function toBuffer(data: Buffer | Uint8Array | string): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

async function putLocal(
  relKey: string,
  data: Buffer | Uint8Array | string
): Promise<StoragePutResult> {
  const key = normalizeKey(relKey);
  const storageRoot = getLocalStorageRoot();
  const absolutePath = path.join(storageRoot, key);

  if (!absolutePath.startsWith(path.resolve(storageRoot))) {
    throw new Error("Invalid storage key path");
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, toBuffer(data));

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
