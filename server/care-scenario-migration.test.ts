import { describe, expect, it } from "vitest";
import { assessCareColumn, runCareScenarioUpgrade } from "../scripts/upgrade-care-scenario.mjs";
const valid={strategiesPresent:true,innoDb:true,careColumnPresent:true,careColumnCompatible:true};

describe("Care scenario migration is additive and permission-gated",()=>{
  it("recognizes an already compatible nullable JSON column",()=>{
    expect(assessCareColumn(valid)).toEqual({readyToApply:true,reason:"already_present"});
  });
  it("allows installation of an additional nullable field on an InnoDB strategies table",()=>{
    expect(assessCareColumn({...valid,careColumnPresent:false,careColumnCompatible:false}))
      .toEqual({readyToApply:true,reason:"additive_json_column_eligible"});
  });
  it.each([
    [{...valid,strategiesPresent:false},"strategies_table_missing"],
    [{...valid,innoDb:false},"strategies_must_be_innodb"],
    [{...valid,careColumnCompatible:false},"care_scenario_conflicting_column_definition"],
  ] as const)("refuses unsafe DB layout: %s", (status,reason)=>{
    expect(assessCareColumn(status)).toEqual({readyToApply:false,reason});
  });
  it("does not open a connection when DATABASE_URL is missing",async()=>{
    const old=process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try{await expect(runCareScenarioUpgrade(["--inspect"])).rejects.toThrow(/DATABASE_URL/);}
    finally{if(old===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=old;}
  });
  it("requires explicit backup verification and approval even when a URL exists",async()=>{
    const old=process.env.DATABASE_URL,approval=process.env.LTC_APPROVE_CARE_SCENARIO_MIGRATION;
    process.env.DATABASE_URL="mysql://invalid:invalid@127.0.0.1:1/no_database";
    delete process.env.LTC_APPROVE_CARE_SCENARIO_MIGRATION;
    try{
      await expect(runCareScenarioUpgrade(["--apply"])).rejects.toThrow(/backup-verified/);
      await expect(runCareScenarioUpgrade(["--apply","--backup-verified"]))
        .rejects.toThrow(/LTC_APPROVE_CARE_SCENARIO_MIGRATION/);
    }finally{
      if(old===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=old;
      if(approval===undefined)delete process.env.LTC_APPROVE_CARE_SCENARIO_MIGRATION;
      else process.env.LTC_APPROVE_CARE_SCENARIO_MIGRATION=approval;
    }
  });
  it("rejects unsupported command-line flags",async()=>{
    await expect(runCareScenarioUpgrade(["--dangerous-delete"])).rejects.toThrow(/Unsupported/);
  });
});
