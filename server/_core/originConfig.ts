type OriginPattern = string | RegExp;

function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

export function getConfiguredOrigins(): OriginPattern[] {
  const configured = [
    ...splitCsv(process.env.APP_PUBLIC_URL),
    ...splitCsv(process.env.ALLOWED_ORIGINS),
  ];

  return [
    ...configured,
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  ];
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  return getConfiguredOrigins().some(pattern =>
    typeof pattern === "string" ? pattern === origin : pattern.test(origin)
  );
}

export function getCspExternalSources(): string[] {
  const origins = getConfiguredOrigins().filter(
    (origin): origin is string => typeof origin === "string"
  );

  return origins;
}
