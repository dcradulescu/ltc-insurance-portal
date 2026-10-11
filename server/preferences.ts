import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

/** Lock and merge current JSON so profile and SMS updates cannot overwrite each other. */
export async function updatePreferences(userId: number, patch: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  await db.transaction(async tx => {
    const [user] = await tx.select({ preferences: users.notificationPreferences }).from(users)
      .where(eq(users.id, userId)).for("update");
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
    await tx.update(users).set({ notificationPreferences: { ...(user.preferences as object || {}), ...patch } })
      .where(eq(users.id, userId));
  });
}
