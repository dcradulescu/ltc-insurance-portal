import { describe,expect,it } from "vitest";
import { assessScheduleUpgrade, runScheduleUpgrade } from "../scripts/upgrade-strategy-schedule.mjs";
describe("Schedule-start metadata upgrade safety",()=>{
  it("allows a missing nullable column in an existing strategies table",()=>{
    expect(assessScheduleUpgrade({tablePresent:true,scheduleColumnPresent:false,scheduleColumnCompatible:false}))
      .toEqual({readyToApply:true,reason:"additive_column_eligible"});
  });
  it("is idempotent when compatible column already exists",()=>{
    expect(assessScheduleUpgrade({tablePresent:true,scheduleColumnPresent:true,scheduleColumnCompatible:true}))
      .toEqual({readyToApply:true,reason:"already_present"});
  });
  it("rejects conflicting column definitions",()=>{
    expect(assessScheduleUpgrade({tablePresent:true,scheduleColumnPresent:true,scheduleColumnCompatible:false}).readyToApply).toBe(false);
  });
  it("rejects missing strategies table",()=>{
    expect(assessScheduleUpgrade({tablePresent:false,scheduleColumnPresent:false,scheduleColumnCompatible:false}).readyToApply).toBe(false);
  });
  it("requires a configured DB for read-only inspection",async()=>{
    const before=process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try{await expect(runScheduleUpgrade(["--inspect"])).rejects.toThrow(/DATABASE_URL/);}
    finally{if(before===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=before;}
  });
  it("requires backup plus explicit environment consent for DDL",async()=>{
    const before=process.env.DATABASE_URL;
    const approval=process.env.LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION;
    process.env.DATABASE_URL="mysql://invalid:invalid@127.0.0.1:1/nonexistent";
    delete process.env.LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION;
    try{
      await expect(runScheduleUpgrade(["--apply"])).rejects.toThrow(/backup-verified/);
      await expect(runScheduleUpgrade(["--apply","--backup-verified"])).rejects.toThrow(/LTC_APPROVE/);
    }finally{
      if(before===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=before;
      if(approval===undefined)delete process.env.LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION;else process.env.LTC_APPROVE_STRATEGY_SCHEDULE_MIGRATION=approval;
    }
  });
});
