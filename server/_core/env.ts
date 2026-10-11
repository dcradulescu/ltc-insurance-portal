const cleanBaseUrl = (value: string | undefined, fallback = "") =>
  (value || fallback).replace(/\/+$/, "");

export const ENV = {
  appId: process.env.APP_ID ?? "ltc-insurance-portal",
  appPublicUrl: cleanBaseUrl(process.env.APP_PUBLIC_URL),
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: process.env.NOTIFY_OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  aiBaseUrl: cleanBaseUrl(process.env.OPENAI_BASE_URL, "https://api.openai.com"),
  aiApiKey: process.env.OPENAI_API_KEY ?? "",
  aiModel: process.env.OPENAI_MODEL ?? "",

  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_KEY ?? "",
  s3PublicBaseUrl: cleanBaseUrl(process.env.S3_PUBLIC_BASE_URL),
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",

  zapierWebhookUrl: process.env.ZAPIER_WEBHOOK_URL ?? "",
};
