import "dotenv/config";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../server/db";
import { hashPassword } from "../server/_core/password";
import { portalAccounts, portalSessions, users } from "../drizzle/schema";

async function main() {
  const { values } = parseArgs({ options: {
    email: { type: "string" }, name: { type: "string" }, role: { type: "string" },
    "existing-user-id": { type: "string" }, reset: { type: "boolean" },
  } });
  const email = z.string().email().max(320).parse(values.email?.trim().toLowerCase());
  const role = values.role ? z.enum(["user", "admin"]).parse(values.role) : undefined;
  if (process.stdin.isTTY) throw new Error("Read the password securely and pass it on stdin; passwords are never accepted as arguments.");
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
    if (chunks.reduce((n, item) => n + item.length, 0) > 1024) throw new Error("Password input too long");
  }
  const passwordHash = await hashPassword(Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, ""));
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required");
  const userId = await db.transaction(async tx => {
    const current = (await tx.select().from(portalAccounts).where(eq(portalAccounts.email, email)).limit(1))[0];
    if (current) {
      if (!values.reset) throw new Error("Account exists; use --reset to replace its password and revoke sessions");
      if (values["existing-user-id"] && Number(values["existing-user-id"]) !== current.userId) throw new Error("Account/user mismatch");
      await tx.update(portalAccounts).set({ passwordHash, failedAttempts: 0, lockedUntil: null }).where(eq(portalAccounts.userId, current.userId));
      await tx.delete(portalSessions).where(eq(portalSessions.userId, current.userId));
      if (role || values.name) await tx.update(users).set({ ...(role ? { role } : {}), ...(values.name ? { name: values.name } : {}) }).where(eq(users.id, current.userId));
      return current.userId;
    }
    if (values.reset) throw new Error("No account exists for this email");
    let id: number;
    if (values["existing-user-id"]) {
      id = z.coerce.number().int().positive().parse(values["existing-user-id"]);
      const user = (await tx.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!user) throw new Error("Existing user not found");
      await tx.update(users).set({ email, loginMethod: "local", ...(role ? { role } : {}), ...(values.name ? { name: values.name } : {}) }).where(eq(users.id, id));
    } else {
      const name = z.string().trim().min(1).max(255).parse(values.name);
      const inserted = await tx.insert(users).values({ openId: `local:${randomUUID()}`, email, name, role: role || "user", loginMethod: "local" });
      id = Number(inserted[0].insertId);
    }
    await tx.insert(portalAccounts).values({ userId: id, email, passwordHash });
    return id;
  });
  console.log(`Account ready for user ${userId}. No password or session token was logged.`);
}
main().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
