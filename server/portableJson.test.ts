import { describe,expect,it } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { policies,strategies,users,saveLinks } from "../drizzle/schema";

describe("MySQL/MariaDB portable JSON columns",()=>{
  const strategyCol=getTableColumns(strategies).stage1Tasks;
  it("retains the exact JSON DDL type across both databases",()=>{
    expect(strategyCol.getSQLType()).toBe("json");
    expect(getTableColumns(strategies).careScenario.getSQLType()).toBe("json");
    expect(getTableColumns(policies).adlLimitations.getSQLType()).toBe("json");
  });
  it("decodes an authentic MariaDB prepared-statement JSON array",()=>{
    const result=strategyCol.mapFromDriverValue(
      '[{"id":"s1-1","label":"Synthetic insurer contact"}]'
    );
    expect(result).toEqual([{id:"s1-1",label:"Synthetic insurer contact"}]);
  });
  it("preserves a native MySQL JSON object returned by mysql2",()=>{
    const native=[{id:"s1-1",label:"New carrier packet"}];
    expect(strategyCol.mapFromDriverValue(native)).toEqual(native);
  });
  it("retains object/array-to-driver serialization for inserts",()=>{
    const value={version:1,policyId:20,inputs:{hoursPerDay:"3"}};
    expect(getTableColumns(strategies).careScenario.mapToDriverValue(value))
      .toBe(JSON.stringify(value));
  });
  it("handles nullable fields and enforces parse failure for corrupted JSON",()=>{
    expect(strategyCol.mapFromDriverValue(null)).toBeNull();
    expect(()=>strategyCol.mapFromDriverValue("{not valid json"))
      .toThrow(/Invalid stored JSON/);
  });
  it("handles user preferences, policy ADLs, and saved forms without coercion",()=>{
    expect(getTableColumns(users).notificationPreferences.mapFromDriverValue('{"sms":false}'))
      .toEqual({sms:false});
    expect(getTableColumns(policies).adlLimitations.mapFromDriverValue('["Dressing","Toileting"]'))
      .toEqual(["Dressing","Toileting"]);
    expect(getTableColumns(saveLinks).formData.mapFromDriverValue('{"currentStep":3}'))
      .toEqual({currentStep:3});
  });
});
