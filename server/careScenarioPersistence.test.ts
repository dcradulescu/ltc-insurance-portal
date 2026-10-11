import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dbModule from "./db";
import type { Policy } from "../drizzle/schema";
import type { CareInputs } from "../shared/careCalculator";
import {
  fingerprintPolicy, readStoredCareScenario, saveOwnedCareScenario,
  validateScenarioForPolicy, type CareScenarioRecord,
} from "./careScenarioPersistence";

vi.mock("./db",async load=>({
  ...await load<typeof import("./db")>(),
  getDb:vi.fn(),
}));

const policy= (changes:Partial<Policy>={}):Policy => ({
  id:20,userId:7,insuredFullName:"Synthetic Patient",
  policyNumber:"POL-TEST",carrierName:"Illustrative Carrier",
  dailyMaximum:"250",monthlyMaximum:"7500",lifetimeMaximum:"500000",
  eliminationPeriod:"0", inflationProtection:"none",waiverOfPremium:"no",
  assignmentOfBenefits:"no",...changes,
} as Policy);
const care=(changes:Partial<CareInputs>={}):CareInputs=>({
  paymentType:"reimbursement",termsConfirmed:true,eligibility:"confirmed",
  startDate:"2026-11-15",careDays:[1,2,3,4,5],
  hourlyRate:"50",hoursPerDay:"3",capType:"daily",
  dailyMax:"250",monthlyMax:"7500",totalPool:"500000",remainingPool:"500000",
  firstMonthUsed:"0",eliminationType:"calendar",eliminationRemaining:"0",
  monthlyPremium:"0",assumeFullWaiver:false,dualWaiver:false,spouseMonthlyPremium:"",
  careInflation:"0",benefitInflation:"none",benefitRate:"",
  inflationScope:"",nextIncrease:"",riderConfirmed:false,
  originalDaily:"",originalMonthly:"",originalPool:"",...changes,
});
const record=(inputs=care(),initial=policy()):CareScenarioRecord=>({
  version:1,policyId:20,policyFingerprint:fingerprintPolicy(initial),
  savedAt:"2026-10-10T15:00:00Z",inputs,
});

describe("Care scenario persistence and policy invalidation",()=>{
  it("accepts a validated scenario with exact matching policy amounts",()=>{
    expect(validateScenarioForPolicy(care(),policy())).toEqual({valid:true,reason:null});
    expect(readStoredCareScenario(record(),policy()).status).toBe("saved_valid");
  });
  it("restores incomplete drafts without inventing insurance payments",()=>{
    const saved=readStoredCareScenario(record(care({termsConfirmed:false})),policy());
    expect(saved.status).toBe("needs_review");
    expect(saved.inputs?.termsConfirmed).toBe(false);
    expect(saved.reason).toMatch(/Review/);
  });
  it("detects a changed policy without deleting the saved draft",()=>{
    const saved=readStoredCareScenario(record(),policy({lifetimeMaximum:"600000"}));
    expect(saved.status).toBe("needs_review");
    expect(saved.policyChanged).toBe(true);
    expect(saved.inputs?.hourlyRate).toBe("50");
  });
  it("fingerprint changes when insurer, policy number, or financial terms change",()=>{
    const h=fingerprintPolicy(policy());
    expect(fingerprintPolicy(policy({policyNumber:"OTHER"}))).not.toBe(h);
    expect(fingerprintPolicy(policy({carrierName:"New Carrier"}))).not.toBe(h);
    expect(fingerprintPolicy(policy({eliminationPeriod:"30"}))).not.toBe(h);
    expect(fingerprintPolicy(policy({dailyMaximum:"300"}))).not.toBe(h);
  });
  it("does not expose data for a missing saved scenario",()=>{
    expect(readStoredCareScenario(null,policy())).toEqual({
      status:"empty",inputs:null,savedAt:null,reason:null,policyChanged:false,
    });
  });
  it("rejects invalid stored data while preserving other policy records",()=>{
    expect(readStoredCareScenario({foo:1},policy()).status).toBe("needs_review");
    expect(readStoredCareScenario({...record(),inputs:{bad:"data"}},policy()).inputs).toBeNull();
  });
  it("rejects waiting-day balances exceeding original elimination days",()=>{
    expect(validateScenarioForPolicy(care({eliminationRemaining:"10"}),policy()).valid).toBe(false);
  });
  it("checks all applicable daily and monthly caps",()=>{
    expect(validateScenarioForPolicy(care({capType:"both",monthlyMax:"9000"}),policy()).reason)
      .toMatch(/Monthly limit/);
    expect(validateScenarioForPolicy(care({dailyMax:"300"}),policy()).reason)
      .toMatch(/Daily limit/);
  });
  it("rejects a remaining pool that exceeds the policy limit",()=>{
    expect(validateScenarioForPolicy(care({remainingPool:"500001"}),policy()).valid).toBe(false);
  });
});

describe("Transactional, account-owned saves",()=>{
  beforeEach(()=>vi.clearAllMocks());
  function fakeDb(owner=7){
    const actions:string[]=[];
    const row={id:30,userId:owner,policyId:20,careScenario:null as unknown};
    const select=()=>({
      from(table:any){
        return {where:()=>({
          for:async()=>{actions.push("row-lock");return table? [row] : [];},
          limit:async()=>{actions.push("policy-read");return [policy()];},
        })};
      },
    });
    const tx={
      select,
      update:()=>({set:(data:any)=>({where:async()=>{
        actions.push("update");
        row.careScenario=data.careScenario;
        return [{affectedRows:1}];
      }})}),
    };
    const database={
      transaction:async(fn:(tx:typeof tx)=>Promise<unknown>)=>{
        actions.push("begin");
        const value=await fn(tx);
        actions.push("commit");
        return value;
      },
    };
    return {database:database as any,actions,row};
  }
  it("persists validated care inputs under a strategy-row lock",async()=>{
    const f=fakeDb();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.database);
    const result=await saveOwnedCareScenario(7,30,care());
    expect(result.status).toBe("saved_valid");
    expect(result.inputs?.startDate).toBe("2026-11-15");
    expect(f.actions).toEqual(["begin","row-lock","policy-read","update","commit"]);
  });
  it("stores an incomplete input set as draft, not a confirmed scenario",async()=>{
    const f=fakeDb();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.database);
    const result=await saveOwnedCareScenario(7,30,care({termsConfirmed:false}));
    expect(result.status).toBe("needs_review");
    expect(result.inputs?.termsConfirmed).toBe(false);
  });
  it("rejects malformed client data before accessing the database",async()=>{
    const f=fakeDb();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.database);
    await expect(saveOwnedCareScenario(7,30,{...care(),unexpected:"inject"} as any))
      .rejects.toMatchObject({code:"BAD_REQUEST"});
    expect(f.actions).toHaveLength(0);
  });
});
