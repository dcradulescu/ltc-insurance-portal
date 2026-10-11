import "dotenv/config";
import mysql from "mysql2/promise";
import { is, Table, getTableName, getTableColumns } from "drizzle-orm";
import * as schema from "../drizzle/schema";

async function main() {
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query<mysql.RowDataPacket[]>("SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()");
  // On Windows, MySQL/MariaDB normalize table names to lowercase.
  const tableColumnKey = (table:string,column:string) =>
    table.toLowerCase()+"."+column.toLowerCase();
  const existing = new Set(rows.map(row =>
    tableColumnKey(String(row.TABLE_NAME),String(row.COLUMN_NAME))));
  const missing: string[] = [];
  for (const value of Object.values(schema)) if (is(value, Table)) {
    for (const column of Object.values(getTableColumns(value))) {
      const key = tableColumnKey(getTableName(value),column.name);
      if (!existing.has(key)) missing.push(key);
    }
  }
  const [scenarioColumns] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT DATA_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='strategies' AND COLUMN_NAME='careScenario'"
  );
  const [scenarioJsonChecks] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND LOWER(TABLE_NAME)='strategies'"
  );
  const mariaDbJsonAliasValidated = scenarioJsonChecks.some(row =>
    /json_valid\s*\(\s*[\x60"]?carescenario[\x60"]?\s*\)/i.test(String(row.CHECK_CLAUSE)));
  const scenarioColumnValid = scenarioColumns.length===1 &&
    scenarioColumns[0].IS_NULLABLE==="YES" &&
    (scenarioColumns[0].DATA_TYPE==="json" ||
      (scenarioColumns[0].DATA_TYPE==="longtext" && mariaDbJsonAliasValidated));
  if (!scenarioColumnValid) missing.push("strategies.careScenario JSON NULL");

  const [indexRows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='taskCompletions' ORDER BY INDEX_NAME,SEQ_IN_INDEX"
  );
  const groups = new Map<string, mysql.RowDataPacket[]>();
  for (const row of indexRows) {
    const key = String(row.INDEX_NAME);
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  const requiredColumns = "userId,strategyId,taskId";
  const hasCompletionUniqueIndex = [...groups.values()].some(rows =>
    rows.every(row => Number(row.NON_UNIQUE) === 0) &&
    rows.sort((a,b) => Number(a.SEQ_IN_INDEX) - Number(b.SEQ_IN_INDEX))
      .map(row => String(row.COLUMN_NAME)).join(",") === requiredColumns
  );
  const [auditIndexes] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT INDEX_NAME,NON_UNIQUE,COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='claimMilestoneEvents'"
  );
  const auditNames = new Set(auditIndexes.map(row => String(row.INDEX_NAME)));
  const approvalUniqueIndex = auditIndexes.some(row =>
    String(row.COLUMN_NAME) === "approvalDedupeKey" && Number(row.NON_UNIQUE) === 0);
  const auditMissing = ["idx_claim_milestones_user","idx_claim_milestones_strategy","idx_claim_milestones_kind"]
    .filter(name => !auditNames.has(name));
  if (!approvalUniqueIndex) auditMissing.push("approvalDedupeKey UNIQUE");
  const [approvalFk] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='claimMilestoneEvents' AND COLUMN_NAME='evidenceDocumentId' AND REFERENCED_TABLE_NAME='documentUploads' AND REFERENCED_COLUMN_NAME='id'"
  );
  if (!approvalFk.length) auditMissing.push("claimMilestoneEvents.evidenceDocumentId FK");
  const missingIndexes = [...(hasCompletionUniqueIndex ? [] : ["uq_task_completions_owner_strategy_task"]), ...auditMissing];
  const [engineRows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('strategies','taskCompletions','claimMilestoneEvents')"
  );
  const engineByTable = new Map(engineRows.map(row => [
    String(row.TABLE_NAME).toLowerCase(), String(row.ENGINE)]));
  const nonTransactionalTables = ["strategies", "taskCompletions", "claimMilestoneEvents"]
    .filter(name => engineByTable.get(name.toLowerCase()) !== "InnoDB");
  console.log(JSON.stringify({
    ready: missing.length === 0 && missingIndexes.length===0 &&
      hasCompletionUniqueIndex && nonTransactionalTables.length === 0,
    missingColumns: missing, missingIndexes, nonTransactionalTables,
  }, null, 2));
  if (missing.length || missingIndexes.length || nonTransactionalTables.length) process.exitCode = 1;
} finally { await connection.end(); }

}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
