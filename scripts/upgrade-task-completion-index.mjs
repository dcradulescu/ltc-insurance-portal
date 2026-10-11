import "dotenv/config";
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Metadata-only preflight and explicitly gated additive schema migration.
// Never deletes/deduplicates historical rows; never prints names or task titles.
export const REQUIRED_INDEX = "uq_task_completions_owner_strategy_task";
const COLUMNS = ["userId", "strategyId", "taskId"];
const LOCK_NAME = "ltc_completion_unique_key_2026_10";

export function inspectIndexRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const name = String(row.INDEX_NAME);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  const valid = [...groups].some(([name, entries]) =>
    entries.every(entry => Number(entry.NON_UNIQUE) === 0)
      && entries.slice().sort((a,b)=>Number(a.SEQ_IN_INDEX)-Number(b.SEQ_IN_INDEX))
        .map(entry => entry.COLUMN_NAME).join(",") === COLUMNS.join(",")
  );
  const nameCollision = groups.has(REQUIRED_INDEX) && !valid;
  return { valid, nameCollision };
}

export async function getCompletionIndexStatus(conn) {
  const [tables] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'taskCompletions'"
  );
  if (!tables.length) return { tablePresent: false, uniqueIndexPresent: false, duplicateGroups: 0, excessRows: 0, indexNameCollision: false, innoDbReady: false };
  const [engines] = await conn.query(
    "SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('strategies','taskCompletions')"
  );
  const storage = new Map(engines.map(row=>[String(row.TABLE_NAME),String(row.ENGINE)]));
  const innoDbReady = storage.get("strategies")==="InnoDB" && storage.get("taskCompletions")==="InnoDB";
  const [indexes] = await conn.query(
    "SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'taskCompletions' ORDER BY INDEX_NAME, SEQ_IN_INDEX"
  );
  const {valid, nameCollision} = inspectIndexRows(indexes);
  const [duplicates] = await conn.query(
    "SELECT COUNT(*) AS duplicateGroups, COALESCE(SUM(n - 1),0) AS excessRows FROM (SELECT COUNT(*) AS n FROM taskCompletions GROUP BY userId,strategyId,taskId HAVING COUNT(*) > 1) AS duplicated"
  );
  return {
    tablePresent: true,
    uniqueIndexPresent: valid,
    duplicateGroups: Number(duplicates[0].duplicateGroups),
    excessRows: Number(duplicates[0].excessRows),
    indexNameCollision: nameCollision,
    innoDbReady,
  };
}

export function assessMigration(status) {
  if (!status.tablePresent) return { readyToApply: false, reason: "table_missing_use_fresh_schema_bootstrap" };
  if (status.innoDbReady === false) return { readyToApply: false, reason: "strategies_and_completions_must_use_innodb" };
  if (status.indexNameCollision) return { readyToApply: false, reason: "index_name_collision" };
  if (status.duplicateGroups > 0) return { readyToApply: false, reason: "existing_duplicate_groups_require_manual_reconciliation" };
  return { readyToApply: true, reason: status.uniqueIndexPresent ? "index_already_present" : "additive_index_eligible" };
}

export async function runUpgrade(args = process.argv.slice(2)) {
  const apply = args.includes("--apply");
  const allowed = new Set(["--inspect","--apply","--backup-verified"]);
  if (args.some(arg => !allowed.has(arg))) throw new Error("Unsupported upgrade argument");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; no database changes made");
  if (apply && (!args.includes("--backup-verified") || process.env.LTC_APPROVE_COMPLETION_INDEX_MIGRATION !== "YES")) {
    throw new Error("Refusing schema change without --backup-verified and LTC_APPROVE_COMPLETION_INDEX_MIGRATION=YES");
  }
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    let status = await getCompletionIndexStatus(conn);
    let assessment = assessMigration(status);
    if (!apply) {
      const result = { mode: "inspect_only", ...status, ...assessment, liveRowsChanged: 0 };
      console.log(JSON.stringify(result, null, 2));
      if (status.tablePresent && !assessment.readyToApply) process.exitCode = 2;
      return result;
    }
    const [[lock]] = await conn.query("SELECT GET_LOCK(?, 15) AS locked", [LOCK_NAME]);
    if (Number(lock.locked) !== 1) throw new Error("Unable to acquire migration advisory lock");
    try {
      // Rerun preflight while the operator holds the advisory lock. ALTER obtains
      // the actual MySQL metadata lock and fails if concurrent external writes race.
      status = await getCompletionIndexStatus(conn);
      assessment = assessMigration(status);
      if (!assessment.readyToApply) throw new Error("Refusing migration: " + assessment.reason);
      if (!status.uniqueIndexPresent) {
        await conn.query(
          "ALTER TABLE taskCompletions ADD UNIQUE INDEX uq_task_completions_owner_strategy_task (userId,strategyId,taskId)"
        );
      }
      const verified = await getCompletionIndexStatus(conn);
      if (!verified.uniqueIndexPresent || verified.duplicateGroups) throw new Error("Unique-key verification failed after DDL");
      const result = { mode: "apply", indexPresent: verified.uniqueIndexPresent, duplicateGroups: verified.duplicateGroups, excessRows: verified.excessRows, liveRowsChanged: 0 };
      console.log(JSON.stringify(result, null, 2));
      return result;
    } finally {
      await conn.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]).catch(()=>{});
    }
  } finally {
    await conn.end();
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runUpgrade().catch(error => { console.error("Completion-index upgrade blocked: " + error.message); process.exitCode = 1; });
}
