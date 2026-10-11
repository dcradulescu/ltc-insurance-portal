import "dotenv/config";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";

// Intentionally refuses every nonempty database. Existing installations use migrations.
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const manifest = JSON.parse(await fs.readFile(new URL("./schema-baseline.json", import.meta.url), "utf8"));
const schema = await fs.readFile(new URL("../drizzle/schema.ts", import.meta.url));
if (createHash("sha256").update(schema).digest("hex") !== manifest.schema_sha256) throw new Error("Schema baseline is stale; regenerate it before bootstrapping.");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [tables] = await db.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  if (tables.length) throw new Error("Refusing bootstrap: database is not empty. Back up and use reviewed migrations instead.");
  const sql = await fs.readFile(new URL("./schema-baseline.sql", import.meta.url), "utf8");
  for (const statement of sql.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) await db.query(statement);
  await db.query("CREATE TABLE __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)");
  const journal = JSON.parse(await fs.readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  for (const entry of journal.entries) {
    const body = await fs.readFile(new URL(`../drizzle/${entry.tag}.sql`, import.meta.url), "utf8");
    await db.execute("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)", [createHash("sha256").update(body).digest("hex"), entry.when]);
  }
  console.log("Created current schema and migration baseline in an empty database.");
} finally { await db.end(); }
