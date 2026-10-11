import "dotenv/config";
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_COLUMNS = [
  "id", "userId", "strategyId", "policyId", "kind", "effectiveDate",
  "carrierReference", "approvalDedupeKey", "evidenceDocumentId",
  "attestedByUserId", "evidenceLevel", "recordedAt",
];

export function assessClaimAuditTable(status) {
  if (!status.tablePresent) return { readyToApply: true, reason: "additive_table_eligible" };
  if (status.engine !== "InnoDB") return { readyToApply: false, reason: "claim_events_must_use_innodb" };
  if (status.missingColumns.length) return { readyToApply: false, reason: "table_definition_incomplete" };
  if (!status.uniqueDedupeKey) return { readyToApply: false, reason: "unique_approval_key_missing" };
  if (!status.evidenceForeignKey) return { readyToApply: false, reason: "evidence_file_retention_fk_missing" };
  if (status.missingIndexes.length) return { readyToApply: false, reason: "claim_event_indexes_missing" };
  return { readyToApply: true, reason: "table_already_present" };
}

export async function inspectClaimAuditTable(conn) {
  const [tables] = await conn.query(
    "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'claimMilestoneEvents'"
  );
  if (!tables.length) return {
    tablePresent: false, engine: null,
    missingColumns: [], uniqueDedupeKey: false, evidenceForeignKey: false, missingIndexes: [], rowCount: 0,
  };
  const [columns] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='claimMilestoneEvents'"
  );
  const cols = new Set(columns.map(c=>String(c.COLUMN_NAME)));
  const [indexes] = await conn.query(
    "SELECT INDEX_NAME,NON_UNIQUE,COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='claimMilestoneEvents'"
  );
  const uniqueDedupeKey = indexes.some(i => i.COLUMN_NAME==="approvalDedupeKey" && Number(i.NON_UNIQUE)===0);
  const [foreignKeys] = await conn.query(
    "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='claimMilestoneEvents' AND COLUMN_NAME='evidenceDocumentId' AND REFERENCED_TABLE_NAME='documentUploads' AND REFERENCED_COLUMN_NAME='id'"
  );
  const evidenceForeignKey = foreignKeys.length > 0;
  const requiredIndexes=["idx_claim_milestones_user","idx_claim_milestones_strategy","idx_claim_milestones_kind"];
  const names=new Set(indexes.map(i=>String(i.INDEX_NAME)));
  const [[count]]=await conn.query("SELECT COUNT(*) AS rowsCount FROM claimMilestoneEvents");
  return {
    tablePresent:true, engine:String(tables[0].ENGINE),
    missingColumns:REQUIRED_COLUMNS.filter(x=>!cols.has(x)),
    uniqueDedupeKey, evidenceForeignKey, missingIndexes:requiredIndexes.filter(x=>!names.has(x)),
    rowCount:Number(count.rowsCount),
  };
}

export async function runClaimAuditUpgrade(args=process.argv.slice(2)) {
  const allowed=new Set(["--inspect","--apply","--backup-verified"]);
  if(args.some(x=>!allowed.has(x)))throw new Error("Unsupported argument");
  const apply=args.includes("--apply");
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required; no database changes made");
  if(apply && (!args.includes("--backup-verified") || process.env.LTC_APPROVE_CLAIM_MILESTONES_MIGRATION!=="YES")) {
    throw new Error("Refusing schema changes without --backup-verified and LTC_APPROVE_CLAIM_MILESTONES_MIGRATION=YES");
  }
  const conn=await mysql.createConnection(process.env.DATABASE_URL);
  try{
    let status=await inspectClaimAuditTable(conn);
    let assessment=assessClaimAuditTable(status);
    if(!apply) {
      const result={mode:"inspect_only",...status,...assessment,patientRowsChanged:0};
      console.log(JSON.stringify(result,null,2));
      if(!assessment.readyToApply)process.exitCode=2;
      return result;
    }
    const [[lock]]=await conn.query("SELECT GET_LOCK('ltc_claim_milestone_migration_2026',15) AS locked");
    if(Number(lock.locked)!==1)throw new Error("Could not acquire exclusive migration lock");
    try{
      status=await inspectClaimAuditTable(conn);
      assessment=assessClaimAuditTable(status);
      if(!assessment.readyToApply)throw new Error("Refusing existing incompatible table: "+assessment.reason);
      if(!status.tablePresent) {
        await conn.query(
          "CREATE TABLE claimMilestoneEvents ("+
          "id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,"+
          "userId INT NOT NULL,"+
          "strategyId INT NOT NULL,"+
          "policyId INT NOT NULL,"+
          "kind VARCHAR(48) NOT NULL,"+
          "effectiveDate VARCHAR(10) NOT NULL,"+
          "carrierReference VARCHAR(128) NULL,"+
          "approvalDedupeKey VARCHAR(96) NULL UNIQUE,"+
          "evidenceDocumentId INT NULL,"+
          "attestedByUserId INT NOT NULL,"+
          "evidenceLevel VARCHAR(32) NOT NULL DEFAULT 'user_submitted',"+
          "recordedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"+
          "CONSTRAINT fk_claim_milestone_evidence FOREIGN KEY(evidenceDocumentId) REFERENCES documentUploads(id) ON DELETE RESTRICT,"+
          "INDEX idx_claim_milestones_user(userId),"+
          "INDEX idx_claim_milestones_strategy(strategyId),"+
          "INDEX idx_claim_milestones_kind(kind)"+
          ") ENGINE=InnoDB"
        );
      }
      const verified=await inspectClaimAuditTable(conn);
      if(assessClaimAuditTable(verified).reason!=="table_already_present")throw new Error("Post-migration verification failed");
      const result={mode:"apply",...verified,patientRowsChanged:0};
      console.log(JSON.stringify(result,null,2));
      return result;
    }finally{await conn.query("SELECT RELEASE_LOCK('ltc_claim_milestone_migration_2026')").catch(()=>{});}
  }finally{await conn.end();}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  runClaimAuditUpgrade().catch(error=>{console.error("Claim milestone migration blocked: "+error.message);process.exitCode=1;});
}
