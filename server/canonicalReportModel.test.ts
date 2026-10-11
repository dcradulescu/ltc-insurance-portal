import { describe, expect, it } from "vitest";
import { buildCanonicalReportModel, type CanonicalReportInput } from "./canonicalReportModel";
import type { CareInputs } from "../shared/careCalculator";

function base(overrides: Partial<CanonicalReportInput> = {}): CanonicalReportInput {
  return {
    insuredName:"SYNTHETIC CLIENT", insuredDob:"1950-05-08",
    insuredEmail:"example@example.test", insuredPhone:"(999) 555-0200",
    insuredAddress:"1 Example Road, Fictional, SC",
    carrierName:"Illustrative Carrier",policyNumber:"TEST-0001",
    eliminationPeriod:"0",dailyMaximum:250,monthlyMaximum:7500,
    lifetimeMaximum:273750,minAdlsRequired:2,
    stage1Tasks:["Gather policy"],stage1TaskIds:["s1-1"],
    stage2Tasks:["Submit claim"],stage2TaskIds:["s2-1"],
    stage3Tasks:["Invoice"],stage3TaskIds:["s3-1"],
    adlLimitations:["Dressing","Toileting"],planStartDate:"2026-10-10",
    ...overrides,
  };
}
const care=(changes:Partial<CareInputs>={}):CareInputs=>({
  paymentType:"reimbursement",termsConfirmed:true,eligibility:"confirmed",
  startDate:"2026-11-01",careDays:[1,2,3,4,5],
  hourlyRate:"50",hoursPerDay:"3",capType:"daily",
  dailyMax:"250",monthlyMax:"7500",totalPool:"273750",remainingPool:"273750",
  firstMonthUsed:"0",eliminationType:"calendar",eliminationRemaining:"0",
  monthlyPremium:"0",assumeFullWaiver:false,dualWaiver:false,spouseMonthlyPremium:"",
  careInflation:"0",benefitInflation:"none",benefitRate:"",
  inflationScope:"",nextIncrease:"",riderConfirmed:false,originalDaily:"",
  originalMonthly:"",originalPool:"",...changes,
});
const NOW=new Date("2026-10-10T12:00:00Z");

describe("Canonical LTC report inputs and policy safety",()=>{
  it("uses exactly the approved original 18-page template reference",()=>{
    expect(buildCanonicalReportModel(base(),NOW).templateId)
      .toBe("sc-visiting-angels-ltc-original-18-v1");
  });
  it("never converts a confirmed zero elimination period to 90",()=>{
    expect(buildCanonicalReportModel(base(),NOW).policy.eliminationDays).toBe(0);
    expect(buildCanonicalReportModel(base({eliminationPeriod:"90"}),NOW).policy.eliminationDays).toBe(90);
  });
  it.each(["","unknown","90xyz","-15","1.5","999999"])(
    "marks malformed or missing elimination value %s unverified",term=>{
      const model=buildCanonicalReportModel(base({eliminationPeriod:term}),NOW);
      expect(model.policy.eliminationDays).toBeNull();
      expect(model.warnings.join(" ")).toMatch(/Elimination period is not verified/);
    },
  );
  it("never treats missing policy caps as confirmed dollars",()=>{
    const model=buildCanonicalReportModel(base({dailyMaximum:0,monthlyMaximum:0,lifetimeMaximum:0}),NOW);
    expect(model.policy.dailyMax).toBeNull();
    expect(model.policy.monthlyMax).toBeNull();
    expect(model.policy.lifetimeMax).toBeNull();
    expect(model.warnings.join(" ")).toMatch(/Benefit caps/);
  });
  it.each([""," ","\t","NAMED PERSON"])("leaves the PDF name line blank for %j",insuredName=>{
    const report=buildCanonicalReportModel(base({insuredName}),NOW);
    expect(report.person.fullName).toBe("____________________________");
    expect(report.person.firstName).toBe("Policyholder");
  });
  it("does not reintroduce a historical stored name in the PDF",()=>{
    const report=buildCanonicalReportModel(base({
      verifiedPolicy:{insuredFullName:"HISTORICAL PERSON"} as any,
    }),NOW);
    expect(report.person.fullName).toBe("____________________________");
  });
  it("requires only carrier identification and keeps the policy number writable and anonymous",()=>{
    expect(()=>buildCanonicalReportModel(base({carrierName:" "}),NOW)).toThrow(/carrier/);
    expect(buildCanonicalReportModel(base({policyNumber:" "}),NOW).policy.policyNumber)
      .toBe("____________________________");
  });
  it("never calculates identifying age from a birthdate supplied by a browser",()=>{
    const model=buildCanonicalReportModel(base({insuredDob:"1950-10-11",reportDate:"2026-10-10"}),NOW);
    expect(model.person.age).toBeNull();
    expect(model.person.dob).toBeNull();
  });
  it("does not invent DOB or age when missing",()=>{
    const model=buildCanonicalReportModel(base({insuredDob:""}),NOW);
    expect(model.person.dob).toBeNull();
    expect(model.person.age).toBeNull();
  });
  it("applies active IDs and saved completion evidence to a common task map",()=>{
    const model=buildCanonicalReportModel(base({
      taskCompletionDates:[{taskId:"s1-1",completed:true,completedAt:"2026-10-11T12:00:00Z"}]
    }),NOW);
    expect(model.tasks).toHaveLength(3);
    expect(model.tasks.find(t=>t.id==="s1-1")?.completed).toBe(true);
    expect(model.tasks.find(t=>t.id==="s2-1")?.completed).toBe(false);
    expect(model.schedule["s2-1"]).toBeDefined();
  });
  it("does not publish financial scenarios without an explicit validated model",()=>{
    const model=buildCanonicalReportModel(base(),NOW);
    expect(model.financial.verifiedModel).toBe(false);
    expect(model.financial.scenarios).toHaveLength(0);
    expect(model.financial.typicalMonthlyCareCost).toBeNull();
    expect(model.financial.reason).toMatch(/confirmed calculator scenario/);
  });
  it("projects cumulative years from the existing care calculator, not guessed percentages",()=>{
    const model=buildCanonicalReportModel(base({careInputs:care()}),NOW);
    expect(model.financial.verifiedModel).toBe(true);
    expect(model.financial.scenarios).toHaveLength(3);
    const [first,second,third]=model.financial.scenarios;
    expect(first.careCost).toBeGreaterThan(0);
    expect(second.careCost).toBeGreaterThanOrEqual(first.careCost);
    expect(third.careCost).toBeGreaterThanOrEqual(second.careCost);
    expect(third.insurance+third.outOfPocket).toBeCloseTo(third.careCost,2);
    expect(first.waitingCost).toBe(0);
    expect(model.financial.firstBenefitDate).not.toBeNull();
  });
  it("preserves supported 90-day policy wait instead of projecting immediate reimbursement",()=>{
    const model=buildCanonicalReportModel(base({
      eliminationPeriod:"90",careInputs:care({eliminationRemaining:"90"}),
    }),NOW);
    expect(model.policy.eliminationDays).toBe(90);
    expect(model.financial.firstYearWaitingCost).toBeGreaterThan(0);
    expect(model.financial.firstBenefitDate).not.toBeNull();
  });
  it("computes exact rolling 12/24/36-month totals for a mid-month start",()=>{
    const model=buildCanonicalReportModel(base({careInputs:care({startDate:"2026-11-15"})}),NOW);
    expect(model.financial.verifiedModel).toBe(true);
    expect(model.financial.scenarios).toHaveLength(3);
    const [first,second,third]=model.financial.scenarios;
    expect(first.careCost).toBeGreaterThan(0);
    expect(second.careCost).toBeGreaterThan(first.careCost);
    expect(third.careCost).toBeGreaterThan(second.careCost);
    expect(model.financial.reason).toBeNull();
  });
  it("suppresses inconsistent or ineligible scenarios even if the UI submits them",()=>{
    const model=buildCanonicalReportModel(base({careInputs:care({termsConfirmed:false})}),NOW);
    expect(model.financial.verifiedModel).toBe(false);
    expect(model.financial.scenarios).toHaveLength(0);
    expect(model.financial.reason).toMatch(/validation errors/);
  });
  it.each([
    [{dailyMax:"175"}, "daily home-care limit"],
    [{totalPool:"400000"}, "current lifetime benefit maximum"],
    [{remainingPool:"400000"}, "remaining lifetime pool"],
    [{capType:"both",monthlyMax:"9000"}, "monthly home-care limit"],
  ] as const)("suppresses output when calculator financial assumptions conflict with policy %j",
    (changes,expected)=>{
      const model=buildCanonicalReportModel(base({careInputs:care(changes)}),NOW);
      expect(model.financial.verifiedModel).toBe(false);
      expect(model.financial.scenarios).toHaveLength(0);
      expect(model.financial.reason).toContain(expected);
  });
  it("does not assume waiver of premium, AOB, or cognitive eligibility",()=>{
    const model=buildCanonicalReportModel(base(),NOW);
    expect(model.policy.waiver).toBeNull();
    expect(model.policy.aob).toBeNull();
    expect(model.policy.cognitive).toBeNull();
  });
});

describe("Canonical administrative fields use the saved insurer policy",()=>{
  it("maps the claim-administration worksheet from the owner policy record",()=>{
    const record = {
      id:20,userId:7,insuredFullName:"SYNTHETIC CLIENT",
      policyNumber:"POL-TEST",carrierName:"Illustrative Carrier",
      insuredPhone:"(999) 555-0155",insuredEmail:"record@example.test",
      insuredMailingAddress:"1 Saved Address, Greenville, SC",
      carrierPhone:"(999) 555-0909",carrierFax:"(999) 555-0190",
      carrierAddress1:"Claims Department",carrierAddress2:"PO Box 123",
      carrierCityStateZip:"Richmond, VA 00000",
      claimPreClaimNumber:"CLAIM-SYNTHETIC-8",policyStatus:"Active (carrier verification pending)",
      effectiveDate:"2020-01-01",benefitPeriod:"4 years",
      dailyMaximum:"250",monthlyMaximum:"7500",lifetimeMaximum:"273750",
      eliminationPeriod:"0", minAdlsRequired:"2",waiverOfPremium:"yes",
      assignmentOfBenefits:"no",paymentCycle:"Monthly",
      cnaRequired:"yes",careNotesRequired:"yes",
      caseManagerName:"Fictional Manager",thirdPartyAssessmentRequired:"yes",
      thirdPartyAssessmentWho:"Assigned nurse",planOfCareStatus:"Requested",
      homeCareCoverage:"yes",facilityCareCoverage:"no",
      inflationProtection:"3% compound rider — verify continuation",
    } as any;
    const model=buildCanonicalReportModel(base({
      verifiedPolicy:record,insuredPhone:"OTHER",
      insuredEmail:"fake@example.test",claimNumber:"FORGED-CLAIM",
      policyStatus:"inactive",benefitPeriod:"12 years",
    }),NOW);
    expect(model.person.phone).toBeNull();
    expect(model.person.email).toBeNull();
    expect(model.person.address).toBeNull();
    expect(model.policy.policyNumber).toBe("____________________________");
    expect(model.policy.claimNumber).toBeNull();
    expect(model.policy.claimsFax).toBe(record.carrierFax);
    expect(model.policy.caseManager).toBeNull();
    expect(model.policy.cnaRequired).toBe("yes");
    expect(model.policy.careLogsRequired).toBe("yes");
    expect(model.policy.paymentCycle).toBe("Monthly");
    expect(model.policy.benefitPeriod).toBe("4 years");
    expect(model.policy.waiver).toBe("yes");
    expect(model.policy.aob).toBe("no");
    expect(model.policy.homeCareCoverage).toBe("yes");
    expect(model.policy.facilityCareCoverage).toBe("no");
    expect(model.policy.assessorWho).toBe("Assigned nurse");
  });
  it("does not confuse starting remaining pool with the projected five-year ending pool",()=>{
    const model=buildCanonicalReportModel(base({
      lifetimeMaximum:273750,
      careInputs:care({totalPool:"273750",remainingPool:"200000"}),
    }),NOW);
    expect(model.financial.verifiedModel).toBe(true);
    expect(model.financial.currentRemainingPool).toBe(200000);
    expect(model.financial.projectedRemainingPool).not.toBe(200000);
  });
});
