function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return value.includes("REPLACE_WITH") || value.includes("CHANGE_ME") || value === "admin@example.com";
}

export function validateStartupConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;

  const errors: string[] = [];

  if (isPlaceholder(process.env.JWT_SECRET)) {
    errors.push("JWT_SECRET must be set to a strong random value.");
  }

  if (isPlaceholder(process.env.DATABASE_URL)) {
    errors.push("DATABASE_URL must be set to the production MySQL connection string.");
  }

  if ((process.env.LOCAL_AUTH_ENABLED || "true").toLowerCase() === "true") {
    if (isPlaceholder(process.env.LOCAL_ADMIN_EMAIL)) {
      errors.push("LOCAL_ADMIN_EMAIL must be set for local VPS login.");
    }
    if (isPlaceholder(process.env.LOCAL_ADMIN_PASSWORD)) {
      errors.push("LOCAL_ADMIN_PASSWORD must be set to a strong random value.");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration:\n- ${errors.join("\n- ")}`);
  }
}
