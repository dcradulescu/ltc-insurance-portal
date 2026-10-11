import { calculateCare, parseAmount, type CareInputs } from "../shared/careCalculator";
import { buildClaimSchedule, parseEliminationDays } from "../shared/claimSchedule";
import type { PdfData } from "./pdfConverter";
import type { Policy } from "../drizzle/schema";

export type CanonicalReportInput = PdfData & {
  /** Internal, account-owned server record. Never accepted in PDF API input. */
  verifiedPolicy?: Partial<Policy>;
  careInputs?: CareInputs;
  reportDate?: string;
  issueDate?: string;
  policyStatus?: string;
  benefitPeriod?: string;
  inflationRate?: number;
  insuredAge?: number;
  claimsAddress1?: string;
  claimsAddress2?: string;
  claimsCityStateZip?: string;
  claimsFax?: string;
};

export interface ReportScenario {
  year: 1 | 2 | 3;
  careCost: number;
  insurance: number;
  outOfPocket: number;
  waitingCost: number;
  insuranceShare: number;
}

export interface CanonicalReportModel {
  templateId: "sc-visiting-angels-ltc-original-18-v1";
  person: {
    fullName: string; firstName: string; dob: string | null;
    age: number | null; email: string | null; phone: string | null;
    address: string | null;
  };
  policy: {
    carrierName: string; policyNumber: string;
    issueDate: string | null; claimNumber: string | null;
    carrierPhone: string | null; claimsAddress1: string | null;
    claimsAddress2: string | null; claimsCityStateZip: string | null;
    claimsFax: string | null; status: string | null;
    dailyMax: number | null; monthlyMax: number | null;
    lifetimeMax: number | null; benefitPeriod: string | null;
    eliminationDays: number | null; minAdls: number | null;
    inflationRate: number | null; waiver: string | null;
    aob: string | null; cognitive: string | null;
    paymentCycle: string | null; paymentMethod: string | null;
    caseManager: string | null; cnaRequired: string | null;
    careLogsRequired: string | null; assessorRequired: string | null;
    assessorWho: string | null; planOfCareStatus: string | null;
    homeCareCoverage: string | null; facilityCareCoverage: string | null;
    inflationProtection: string | null; coveredCare: string | null;
  };
  reportDate: string;
  planningStartDate: string | null;
  schedule: Record<string, [number, number]>;
  tasks: Array<{id: string; label: string; completed: boolean; stage: 1 | 2 | 3}>;
  financial: {
    verifiedModel: boolean;
    months: Array<{month:string;from:string;through:string;careCost:number;insurance:number;outOfPocket:number;waitingCost:number}>;
    scenarios: ReportScenario[];
    typicalMonthlyCareCost: number | null;
    firstYearWaitingCost: number | null;
    reason: string | null;
    projectedRemainingPool: number | null;
    currentRemainingPool: number | null;
    firstBenefitDate: string | null;
    coverageRatio: number | null;
    dailyCareCost: number | null;
    careHoursPerDay: number | null;
    careDaysPerWeek: number | null;
  };
  warnings: string[];
}

/** Treat a missing, zero, negative, or nonfinite policy cap as unverified. */
const positive = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const validDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const iso = m[0];
  const date = new Date(iso + "T00:00:00Z");
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0,10) === iso ? iso : null;
};
const isYes = (s?: string): boolean => /^(yes|true|1)$/i.test((s || "").trim());
export function buildCanonicalReportModel(
  input: CanonicalReportInput,
  now = new Date(),
): CanonicalReportModel {
  const warnings: string[] = [];
  const policyRecord=input.verifiedPolicy;
  // The PDF retains a blank line for handwritten completion. Never load
  // a name from current or historical policy/visitor data.
  const name = "____________________________";
  const carrierName = (policyRecord?.carrierName || input.carrierName)?.trim();
  const policyNumber = "____________________________"; // Writable blank: unique policy identifier never printed.
  if (!carrierName) throw new Error("Canonical report requires insurance carrier name.");
  const eliminationDays = parseEliminationDays(input.eliminationPeriod);
  if (eliminationDays === null) warnings.push("Elimination period is not verified.");
  const max = positive(input.dailyMaximum);
  const pool = positive(input.lifetimeMaximum);
  if (max === null || pool === null) warnings.push("Benefit caps and/or lifetime pool are not confirmed.");
  const birthday = null; // Identifying DOB is never exported.
  const reportDate = validDate(input.reportDate) || now.toISOString().slice(0,10);
  const person = ["Policyholder"];
  const age = birthday ? (() => {
    const a = new Date(birthday + "T00:00:00Z"), b = new Date(reportDate + "T00:00:00Z");
    const count = b.getUTCFullYear() - a.getUTCFullYear();
    return count - (b.getUTCMonth() < a.getUTCMonth() ||
      b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate() ? 1 : 0);
  })() : null;
  const tasks: CanonicalReportModel["tasks"] = [];
  ([1,2,3] as const).forEach(stage => {
    const labels = (input["stage"+stage+"Tasks" as keyof PdfData] as string[]|undefined) || [];
    const ids = (input["stage"+stage+"TaskIds" as keyof PdfData] as string[]|undefined) || [];
    labels.forEach((label,i) => {
      const id = ids[i];
      if (id && /^s[123]-\d+$/.test(id)) {
        tasks.push({id,label,stage,completed:input.taskCompletionDates?.some(t=>t.taskId===id && t.completed) || false});
      }
    });
  });
  const planningStartDate = validDate(input.planStartDate);
  const schedule = buildClaimSchedule(eliminationDays,{
    planStartDate:planningStartDate,
    completedTasks:input.taskCompletionDates,
    activeTaskIds:tasks.map(t=>t.id),
  });
  let scenarios: ReportScenario[] = [];
  let months: CanonicalReportModel["financial"]["months"] = [];
  let reason: string | null = "Care costs and insurer payments require a confirmed calculator scenario.";
  let firstBenefitDate: string | null = null;
  let projectedRemainingPool: number | null = null;
  let dailyCareCost: number | null = null;
  let careHoursPerDay: number | null = null, careDaysPerWeek: number | null = null;
  if (input.careInputs) {
    const ci=input.careInputs;
    const differences:string[]=[];
    const sameMoney=(actual:number|null,confirmed:number|null)=>
      actual!==null && confirmed!==null &&
      Math.round(actual*100)===Math.round(confirmed*100);
    // The calculator may have independently edited coverage assumptions.
    // Do not print projections until these inputs agree with the policy.
    const dailyApplies=["daily","both"].includes(ci.capType);
    const monthlyApplies=["monthly","both"].includes(ci.capType);
    if (dailyApplies && !sameMoney(parseAmount(ci.dailyMax),max))
      differences.push("daily home-care limit");
    if (monthlyApplies && !sameMoney(parseAmount(ci.monthlyMax),positive(input.monthlyMaximum)))
      differences.push("monthly home-care limit");
    if (!sameMoney(parseAmount(ci.totalPool),pool))
      differences.push("current lifetime benefit maximum");
    const remaining=parseAmount(ci.remainingPool);
    if (remaining===null || pool===null || remaining>pool)
      differences.push("remaining lifetime pool");
    const evaluated = differences.length ? null : calculateCare(ci);
    if (evaluated?.result && !Object.keys(evaluated.errors).length) {
      months=evaluated.result.months;
      firstBenefitDate=evaluated.result.firstBenefitDate;
      projectedRemainingPool=evaluated.result.remainingPool;
      dailyCareCost=evaluated.result.dailyCareCost;
      careHoursPerDay=Number(ci.hoursPerDay);
      careDaysPerWeek=ci.careDays.length;
      for (const year of [1,2,3] as const) {
        const period=evaluated.result.rollingYears.slice(0,year);
        const sum=(key:"careCost"|"insurance"|"outOfPocket"|"waitingCost")=>
          Math.round(period.reduce((total,row)=>total+Math.round(row[key]*100),0))/100;
        const cost=sum("careCost"),insurance=sum("insurance");
        scenarios.push({year,careCost:cost,insurance,outOfPocket:sum("outOfPocket"),
          waitingCost:sum("waitingCost"),insuranceShare:cost?insurance/cost*100:0});
      }
      reason=null;
    } else {
      reason=differences.length
        ? "Care scenario does not match the recorded policy: "+differences.join(", ")+"."
        : "The care scenario has validation errors: "+Object.keys(evaluated?.errors||{}).join(", ")+".";
    }
  }
  if (reason) warnings.push(reason);
  const month = months.find(m=>m.from?.endsWith("-01")) || months[0];
  return {
    templateId:"sc-visiting-angels-ltc-original-18-v1",
    person:{fullName:name,firstName:person[0],dob:birthday,age,
      email:null,
      phone:null,
      address:null},
    policy:{carrierName,policyNumber,
      issueDate:validDate(policyRecord?.effectiveDate || input.issueDate),
      claimNumber:null, // Leave claim and pre-claim identifiers for handwriting.
      carrierPhone:policyRecord?.carrierPhone||input.carrierPhone||null,
      claimsAddress1:policyRecord?.carrierAddress1||input.claimsAddress1||null,
      claimsAddress2:policyRecord?.carrierAddress2||input.claimsAddress2||null,
      claimsCityStateZip:policyRecord?.carrierCityStateZip||input.claimsCityStateZip||null,
      claimsFax:policyRecord?.carrierFax||input.claimsFax||null,
      status:policyRecord?.policyStatus||input.policyStatus||null,
      dailyMax:max, monthlyMax:positive(input.monthlyMaximum),lifetimeMax:pool,
      benefitPeriod:policyRecord?.benefitPeriod||input.benefitPeriod||null,
      eliminationDays,
      minAdls:policyRecord?.minAdlsRequired && /^\d+$/.test(policyRecord.minAdlsRequired)
        ? Number(policyRecord.minAdlsRequired)
        : typeof input.minAdlsRequired==="number"&&input.minAdlsRequired>=0?input.minAdlsRequired:null,
      inflationRate:typeof input.inflationRate==="number"&&input.inflationRate>=0&&input.inflationRate<=20?input.inflationRate:null,
      waiver:policyRecord?.waiverOfPremium||input.waiverOfPremium||null,
      aob:policyRecord?.assignmentOfBenefits||input.assignmentOfBenefits||null,
      cognitive:policyRecord?.cognitiveImpairmentTrigger||input.cognitiveImpairmentTrigger||null,
      paymentCycle:policyRecord?.paymentCycle||null,
      paymentMethod:input.careInputs?.paymentType==="reimbursement"?
        "Reimbursement (client-confirmed; verify carrier terms)":null,
      caseManager:null, // Leave the case manager name for handwriting.
      cnaRequired:policyRecord?.cnaRequired||null,
      careLogsRequired:policyRecord?.careNotesRequired||null,
      assessorRequired:policyRecord?.thirdPartyAssessmentRequired||input.thirdPartyAssessmentRequired||null,
      assessorWho:policyRecord?.thirdPartyAssessmentWho||null,
      planOfCareStatus:policyRecord?.planOfCareStatus||null,
      homeCareCoverage:policyRecord?.homeCareCoverage||null,
      facilityCareCoverage:policyRecord?.facilityCareCoverage||null,
      inflationProtection:policyRecord?.inflationProtection||null,
      coveredCare:policyRecord?.preferredCareType||null},
    reportDate,planningStartDate,schedule,tasks,
    financial:{verifiedModel:scenarios.length===3,months,scenarios,
      typicalMonthlyCareCost:scenarios.length ? month?.careCost ?? null : null,
      firstYearWaitingCost:scenarios[0]?.waitingCost ?? null,reason,projectedRemainingPool,
      currentRemainingPool:scenarios.length?parseAmount(input.careInputs!.remainingPool):null,
      firstBenefitDate,coverageRatio:scenarios[2]?.insuranceShare ?? null,dailyCareCost,
      careHoursPerDay,careDaysPerWeek},
    warnings,
  };
}
