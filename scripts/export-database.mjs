import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const connection = process.env.DATABASE_URL;
if (!connection) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}

let url;
try {
  url = new URL(connection);
} catch {
  console.error("DATABASE_URL is not a valid URL.");
  process.exit(2);
}

if (!url.protocol.startsWith("mysql")) {
  console.error("DATABASE_URL must be MySQL-compatible.");
  process.exit(2);
}

const database = url.pathname.replace(/^\//, "");
if (!database) {
  console.error("DATABASE_URL must include a database name.");
  process.exit(2);
}

const stamp = new Date().toISOString().slice(0, 10);
const outputPath = path.resolve(process.argv[2] || `ltc-portal-database-${stamp}.sql`);
const out = fs.createWriteStream(outputPath, { flags: "wx" });

const args = [
  "--host", url.hostname,
  "--port", url.port || "3306",
  "--user", decodeURIComponent(url.username),
  "--single-transaction",
  "--routines",
  "--triggers",
  "--events",
  "--hex-blob",
  "--set-gtid-purged=OFF",
  "--default-character-set=utf8mb4",
  database,
];

const child = spawn("mysqldump", args, {
  env: {
    ...process.env,
    MYSQL_PWD: decodeURIComponent(url.password),
  },
  stdio: ["ignore", "pipe", "inherit"],
});

child.stdout.pipe(out);
child.on("error", error => {
  out.destroy();
  try { fs.unlinkSync(outputPath); } catch {}
  if (error.code === "ENOENT") {
    console.error("mysqldump is not installed or not in PATH.");
  } else {
    console.error("Database export failed:", error.message);
  }
  process.exit(1);
});
child.on("close", code => {
  out.end();
  if (code !== 0) {
    try { fs.unlinkSync(outputPath); } catch {}
    process.exit(code || 1);
  }
  console.log(`Database export created: ${outputPath}`);
});
