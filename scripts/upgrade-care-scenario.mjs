import "dotenv/config";
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Safe, additive migration: nullable JSON column only. Never modifies rows. */
export function assessCareColumn(status) {
  if (!status.strategiesPresent) return {readyToApply:false,reason:"strategies_table_missing"};
  if (!status.innoDb) return {readyToApply:false,reason:"strategies_must_be_innodb"};
  if (status.careColumnPresent && !status.careColumnCompatible)
    return {readyToApply:false,reason:"care_scenario_conflicting_column_definition"};
  return {readyToApply:true,reason:status.careColumnPresent?"already_present":"additive_json_column_eligible"};
}
export async function inspectCareColumn(conn) {
  const [tables] = await conn.query(
    "SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='strategies'"
  );
  const [columns] = await conn.query(
    "SELECT COLUMN_NAME,DATA_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='strategies' AND COLUMN_NAME='careScenario'"
  );
  const [jsonChecks] = await conn.query(
    "SELECT CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND LOWER(TABLE_NAME)='strategies'"
  );
  const mariaDbJsonAliasValidated=jsonChecks.some(row=>
    /json_valid\s*\(\s*[\x60"]?carescenario[\x60"]?\s*\)/i.test(String(row.CHECK_CLAUSE)));
  const c=columns[0];
  return {
    strategiesPresent:tables.length===1,
    innoDb:tables[0]?.ENGINE==="InnoDB",
    careColumnPresent:!!c,
    careColumnCompatible:!!c && c.IS_NULLABLE==="YES" &&
      (c.DATA_TYPE==="json" || (c.DATA_TYPE==="longtext" && mariaDbJsonAliasValidated)),
  };
}
export async function runCareScenarioUpgrade(args=process.argv.slice(2)) {
  const permitted=new Set(["--inspect","--apply","--backup-verified"]);
  if (args.some(a=>!permitted.has(a))) throw new Error("Unsupported migration option");
  const apply=args.includes("--apply");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required; no database changed");
  if (apply && (!args.includes("--backup-verified") ||
      process.env.LTC_APPROVE_CARE_SCENARIO_MIGRATION!=="YES")) {
    throw new Error("Refusing change without --backup-verified and LTC_APPROVE_CARE_SCENARIO_MIGRATION=YES");
  }
  const conn=await mysql.createConnection(process.env.DATABASE_URL);
  try {
    let status=await inspectCareColumn(conn);
    let assessment=assessCareColumn(status);
    if(!apply) {
      const result={mode:"inspect_only",...status,...assessment,rowsChanged:0};
      console.log(JSON.stringify(result,null,2));
      if(!assessment.readyToApply)process.exitCode=2;
      return result;
    }
    const [[lock]]=await conn.query("SELECT GET_LOCK('ltc_care_scenario_upgrade_2026',15) AS acquired");
    if(Number(lock.acquired)!==1)throw new Error("Unable to acquire migration lock");
    try {
      status=await inspectCareColumn(conn);
      assessment=assessCareColumn(status);
      if(!assessment.readyToApply)throw new Error("Refusing migration: "+assessment.reason);
      if(!status.careColumnPresent) {
        await conn.query("ALTER TABLE strategies ADD COLUMN careScenario JSON NULL");
      }
      const verified=await inspectCareColumn(conn);
      if(!verified.careColumnCompatible)throw new Error("Migration verification failed");
      const result={mode:"apply",...verified,rowsChanged:0};
      console.log(JSON.stringify(result,null,2));
      return result;
    } finally {
      await conn.query("SELECT RELEASE_LOCK('ltc_care_scenario_upgrade_2026')").catch(()=>{});
    }
  } finally {await conn.end();}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  runCareScenarioUpgrade().catch(e=>{console.error("Care scenario migration blocked: "+e.message);process.exitCode=1;});
}
