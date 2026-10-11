import { registerFile } from "./db";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getClient() {
  if (!ENV.s3Bucket) throw new Error("S3_BUCKET is not configured");
  const credentials = ENV.s3AccessKeyId && ENV.s3SecretAccessKey
    ? {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      }
    : undefined;

  return new S3Client({
    region: ENV.s3Region,
    endpoint: ENV.s3Endpoint || undefined,
    forcePathStyle: ENV.s3ForcePathStyle,
    credentials,
  });
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

function encodeKey(key: string) {
  return normalizeKey(key)
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
}

function stableUrl(key: string) {
  const encoded = encodeKey(key);
  // Client documents always use the authorization proxy, never a public CDN.
  if (ENV.appPublicUrl) return `${ENV.appPublicUrl}/storage/${encoded}`;
  return `/storage/${encoded}`;
}

export function downloadDisposition(name: string) {
  const raw = (name.split(/[\\/]/).pop() || "document").replace(/[\x00-\x1f\x7f]/g, "");
  const filename = Array.from(Buffer.from(raw, "utf8").toString("utf8")).slice(0, 200).join("") || "document";
  const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="document"; filename*=UTF-8''${encoded}`;
}

export async function getSignedStorageUrl(relKey: string, expiresIn = 3600, downloadName?: string) {
  const client = getClient();
  const key = normalizeKey(relKey);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key, ResponseCacheControl: "private, no-store",
      ...(downloadName ? { ResponseContentDisposition: downloadDisposition(downloadName), ResponseContentType: "application/octet-stream" } : {}) }),
    { expiresIn }
  );
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
  userId: number
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = normalizeKey(relKey);
  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );
  await registerFile(key, userId);
  return { key, url: stableUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: stableUrl(key) };
}
