import { describe,expect,it,vi } from "vitest";
import {
  decodeMariaDbJsonColumn,knownJsonColumnKeys,
  type MysqlTypeCastField,
} from "./dbJsonCompatibility";
function field(name:string,text:string|null,table="strategies",type="BLOB"):MysqlTypeCastField {
  return {name,table,type,string:()=>text};
}

describe("Safe MariaDB JSON column compatibility",()=>{
  it("derives the allowlist directly from Drizzle JSON column declarations",()=>{
    expect(knownJsonColumnKeys.has("strategies.stage1tasks")).toBe(true);
    expect(knownJsonColumnKeys.has("strategies.carescenario")).toBe(true);
    expect(knownJsonColumnKeys.has("policies.adllimitations")).toBe(true);
    expect(knownJsonColumnKeys.has("policies.policyNumber".toLowerCase())).toBe(false);
    expect(knownJsonColumnKeys.size).toBeGreaterThanOrEqual(9);
  });
  it("maps MariaDB's LONGTEXT JSON array alias into a real array",()=>{
    const next=vi.fn();
    const r=decodeMariaDbJsonColumn(
      field("stage1Tasks",'[{"id":"s1-1","label":"Request claims packet"}]'),
      next
    );
    expect(r).toEqual([{id:"s1-1",label:"Request claims packet"}]);
    expect(next).not.toHaveBeenCalled();
  });
  it("supports JSON object snapshots without modifying their values",()=>{
    expect(decodeMariaDbJsonColumn(
      field("careScenario",'{"status":"saved_valid","hoursPerDay":3}'),()=>{throw Error("fallback")}
    )).toEqual({status:"saved_valid",hoursPerDay:3});
  });
  it("does not parse non-JSON strategy text even when it resembles JSON",()=>{
    const next=vi.fn().mockReturnValue('{"literal":"text"}');
    const result=decodeMariaDbJsonColumn(field("strategyContent",'{"literal":"text"}'),next);
    expect(result).toBe('{"literal":"text"}');
    expect(next).toHaveBeenCalledOnce();
  });
  it("does not alter the MySQL native JSON driver behavior",()=>{
    const native={id:"s1-2"};
    expect(decodeMariaDbJsonColumn(
      field("stage1Tasks",'{"id":"s1-2"}',"strategies","JSON"),()=>native
    )).toBe(native);
  });
  it("never parses a similarly named JSON column from a foreign table",()=>{
    const next=vi.fn().mockReturnValue("raw");
    expect(decodeMariaDbJsonColumn(field("stage1Tasks","[3]","untrusted_other_table"),next)).toBe("raw");
  });
  it("accepts NULL values and rejects malformed JSON explicitly",()=>{
    expect(decodeMariaDbJsonColumn(field("stage1Tasks",null),()=>{throw Error("fallback")})).toBeNull();
    expect(()=>decodeMariaDbJsonColumn(field("stage1Tasks","{bad json"),()=>{}))
      .toThrow(/Invalid database JSON/);
  });
  it("normalizes MySQL table and column casing on Windows",()=>{
    expect(decodeMariaDbJsonColumn(field("STAGE1TASKS",'[42]',"STRATEGIES"),()=>{}))
      .toEqual([42]);
  });
});
