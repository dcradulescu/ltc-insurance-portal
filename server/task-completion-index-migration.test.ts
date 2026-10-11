import { describe, expect, it } from "vitest";
import { inspectIndexRows, assessMigration, runUpgrade } from "../scripts/upgrade-task-completion-index.mjs";
const names = ["userId","strategyId","taskId"];
function rows(unique:number, namesSet=names, indexName="uq_task_completions_owner_strategy_task") {
  return namesSet.map((n:string,i:number)=>({
    INDEX_NAME:indexName, NON_UNIQUE:unique, COLUMN_NAME:n, SEQ_IN_INDEX:i+1,
  }));
}
describe("Task-completion index migration guards", () => {
  it("identifies an exact composite unique key",()=>{
    expect(inspectIndexRows(rows(0)).valid).toBe(true);
    expect(inspectIndexRows(rows(1)).valid).toBe(false);
  });
  it("rejects uniqueness on the wrong columns or a subset",()=>{
    expect(inspectIndexRows(rows(0,["userId","strategyId"])).valid).toBe(false);
    expect(inspectIndexRows(rows(0,["userId","strategyId","taskId","stage"])).valid).toBe(false);
    expect(inspectIndexRows(rows(0,["userId","taskId","strategyId"])).valid).toBe(false);
  });
  it("allows a correctly ordered unique key with a different index name",()=>{
    expect(inspectIndexRows(rows(0,names,"another_unique_name")).valid).toBe(true);
  });
  it("blocks migration on duplicates, index collisions, and missing table",()=>{
    expect(assessMigration({tablePresent:true, indexNameCollision:false, duplicateGroups:2, uniqueIndexPresent:false}).readyToApply).toBe(false);
    expect(assessMigration({tablePresent:true, indexNameCollision:true, duplicateGroups:0, uniqueIndexPresent:false}).readyToApply).toBe(false);
    expect(assessMigration({tablePresent:false, indexNameCollision:false, duplicateGroups:0, uniqueIndexPresent:false}).readyToApply).toBe(false);
  });
  it("is idempotent when unique index already exists",()=>{
    expect(assessMigration({tablePresent:true, indexNameCollision:false, duplicateGroups:0, uniqueIndexPresent:true}))
      .toEqual({readyToApply:true, reason:"index_already_present"});
  });
  it("never connects without an explicit DATABASE_URL",async()=>{
    const orig=process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try{await expect(runUpgrade(["--inspect"])).rejects.toThrow(/DATABASE_URL/);}
    finally{if(orig===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=orig;}
  });
  it("refuses --apply without both operator approvals before connecting",async()=>{
    const orig=process.env.DATABASE_URL;
    const flag=process.env.LTC_APPROVE_COMPLETION_INDEX_MIGRATION;
    process.env.DATABASE_URL="mysql://not-real:not-real@127.0.0.1:1/nonexistent";
    delete process.env.LTC_APPROVE_COMPLETION_INDEX_MIGRATION;
    try{
      await expect(runUpgrade(["--apply"])).rejects.toThrow(/backup-verified/);
      await expect(runUpgrade(["--apply","--backup-verified"])).rejects.toThrow(/LTC_APPROVE/);
    }finally{
      if(orig===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=orig;
      if(flag===undefined)delete process.env.LTC_APPROVE_COMPLETION_INDEX_MIGRATION;else process.env.LTC_APPROVE_COMPLETION_INDEX_MIGRATION=flag;
    }
  });
});
