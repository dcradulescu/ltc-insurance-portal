import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedTemplateId = "sc-visiting-angels-ltc-original-18-v1";

async function hashFile(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

/** Confirm exact user-approved pages. Never regenerate the lock automatically. */
export async function verifyCanonicalTemplate(projectRoot = packageRoot) {
  const lockPath = path.join(projectRoot, "report-templates", "ltc-original-18.lock.json");
  const sourceDir = path.join(projectRoot, "original-templates");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  if (lock.template_id !== expectedTemplateId || lock.status !== "CANONICAL_DESIGN_APPROVED") {
    throw new Error("Unapproved canonical LTC report template lock");
  }
  if (lock.page_count !== 18 || !Array.isArray(lock.pages) || lock.pages.length !== 18) {
    throw new Error("Canonical LTC report must define exactly 18 pages");
  }
  const actual = (await readdir(sourceDir)).filter(f => f.endsWith(".html")).sort();
  const expected = lock.pages.map(p => path.basename(p.file)).sort();
  if (new Set(expected).size !== 18 || actual.length !== 18 ||
      actual.some((filename, index) => filename !== expected[index])) {
    throw new Error("Canonical LTC report pages added, missing, or renamed");
  }
  let totalBytes = 0;
  for (const [index, page] of lock.pages.entries()) {
    const relative = "original-templates/" + String(index + 1).padStart(2, "0") + "-";
    if (page.page !== index + 1 || typeof page.file !== "string" ||
        !page.file.startsWith(relative) || page.file.includes("\\") ||
        !/^[a-f0-9]{64}$/.test(page.sha256)) {
      throw new Error("Canonical LTC report invalid page " + (index + 1) + " entry");
    }
    const file = path.join(sourceDir, path.basename(page.file));
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) {
      throw new Error("Canonical LTC report page is not regular source file: " + page.file);
    }
    if (info.size !== page.bytes || await hashFile(file) !== page.sha256) {
      throw new Error("Canonical LTC report altered: " + page.file);
    }
    totalBytes += info.size;
  }
  return { templateId: expectedTemplateId, verifiedPages: 18, totalBytes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyCanonicalTemplate()
    .then(result => console.log("CANONICAL_LTC_TEMPLATE_VERIFIED", JSON.stringify(result)))
    .catch(error => {
      console.error("CANONICAL_LTC_TEMPLATE_INVALID:", error.message);
      process.exitCode = 1;
    });
}
