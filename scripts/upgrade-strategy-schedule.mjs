import "dotenv/config";
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// An additive migration only. Default is metadata-only inspection.
export async function inspectScheduleColumn(conn) {
  const [rows] = await conn.query(
    "SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='strategies' AND COLUMN_NAME IN ('id','scheduleStartDate')"
  );
  const hasTable = rows.some(r => r.COLUMN_NAME === "id");
  const schedule = rows.find(r => r.COLUMN_NAME === "scheduleStartDate");
  const compatible = !!schedule && schedule.DATA_TYPE === "varchar" &&
    Number(schedule.CHARACTER_MAXIMUM_LENGTH) === 10 && schedule.IS_NULLABLE === "YES";
  return { tablePresent:hasTable, scheduleColumnPresent:!!schedule, scheduleColumnCompatible:compatible };
}
export function assessScheduleUpgrade(status) {
  if (!status.tablePresent) return {readyToApply:false,reason:"strategies_table_missing"};
  if (status.scheduleColumnPresent && !status.scheduleColumnCompatible) return {readyToApply:false,reason:"conflicting_column_definition"};
  return {readyToApply:true,reason:status.scheduleColumnPresent?"already_present":"additive_column_eligible"};
}
export async function runScheduleUpgrade(args=process.argv.slice(2)) {
  const apply = args.includes("--apply");
  const allowed = new Set(["--inspect","--apply","--backup-verified"]);
  if (args.some(a=>!allowed.has(a))) throw new Error("Unsupported strategy schedule upgrade argument");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; no database changes made");
  if (apply && (!args.includes("--backup-verified") || process.env.LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION!=="YES")) {
    throw new Error("Refusing schema change without --backup-verified and LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION=YES");
  }
  const conn=await mysql.createConnection(process.env.DATABASE_URL);
  try{
    let status=await inspectScheduleColumn(conn);
    let decision=assessScheduleUpgrade(status);
    if(!apply){
      const report={mode:"inspect_only",...status,...decision,liveRowsChanged:0};
      console.log(JSON.stringify(report,null,2));
      if(!decision.readyToApply)process.exitCode=2;
      return report;
    }
    const [[lock]]=await conn.query("SELECT GET_LOCK('ltc_schedule_start_upgrade_2026',15) AS locked");
    if(Number(lock.locked)!==1)throw new Error("Cannot acquire schedule-upgrade advisory lock");
    try{
      status=await inspectScheduleColumn(conn);
      decision=assessScheduleUpgrade(status);
      if(!decision.readyToApply)throw new Error("Refusing schedule migration: "+decision.reason);
      if(!status.scheduleColumnPresent)await conn.query("ALTER TABLE strategies ADD COLUMN scheduleStartDate varchar(10) NULL");
      const verified=await inspectScheduleColumn(conn);
      if(!verified.scheduleColumnCompatible)throw new Error("Schedule date column verification failed");
      const report={mode:"apply",scheduleColumnPresent:true,scheduleColumnCompatible:true,liveRowsChanged:0};
      console.log(JSON.stringify(report,null,2));
      return report;
    }finally{await conn.query("SELECT RELEASE_LOCK('ltc_schedule_start_upgrade_2026')").catch(()=>{});}
  }finally{await conn.end();}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  runScheduleUpgrade().catch(e=>{console.error("Schedule upgrade blocked: "+e.message);process.exitCode=1;});
}
