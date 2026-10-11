import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateStrategyPdf } from "./strategyPdfGenerator";
import * as report from "./canonicalReportPdf";
import * as storage from "./storage";
import * as db from "./db";
import * as care from "./careScenarioPersistence";
import type { PdfData } from "./pdfConverter";

vi.mock("./canonicalReportPdf",()=>({
  renderApprovedLtcReport:vi.fn(),
}));
vi.mock("./storage",()=>({
  storagePut:vi.fn(),
}));
vi.mock("./db",()=>({
  getPolicyByUserId:vi.fn(),getStrategyByUserId:vi.fn(),
}));
vi.mock("./careScenarioPersistence",()=>({
  getSavedCareScenario:vi.fn(),
}));
const example:PdfData={
  insuredName:"FICTIONAL TEST PERSON",
  policyNumber:"TEST-0001",
  carrierName:"Illustrative Carrier",
  eliminationPeriod:"0",
  dailyMaximum:250,
  monthlyMaximum:7500,
  lifetimeMaximum:273750,
  adlLimitations:["Dressing"],
  stage1Tasks:[],stage2Tasks:[],stage3Tasks:[],
};
beforeEach(()=>{
  vi.clearAllMocks();
  vi.mocked(db.getPolicyByUserId).mockResolvedValue({
    id:20,userId:7,insuredFullName:"FICTIONAL TEST PERSON",
    policyNumber:"TEST-0001",carrierName:"Illustrative Carrier",
    dailyMaximum:"250",monthlyMaximum:"7500",lifetimeMaximum:"273750",
    eliminationPeriod:"0",
  } as any);
  vi.mocked(db.getStrategyByUserId).mockResolvedValue({
    id:30,policyId:20,userId:7,
  } as any);
  vi.mocked(care.getSavedCareScenario).mockResolvedValue({
    status:"empty",inputs:null,savedAt:null,reason:null,policyChanged:false,
  });
  vi.mocked(report.renderApprovedLtcReport).mockResolvedValue({
    buffer:Buffer.from("%PDF-1.7 synthetic original 18 page report"),
    pageCount:18,
    templateId:"sc-visiting-angels-ltc-original-18-v1",
    renderingMode:"original-image-with-searchable-text-layer",
    reportWarnings:[],
    pageChanges:[],
  });
  vi.mocked(storage.storagePut).mockResolvedValue({
    key:"users/7/strategies/qa.pdf",
    url:"/storage/users/7/strategies/qa.pdf",
  });
});
describe("Approved 18-page report delivery",()=>{
  it("blocks cross-account policy data before invoking the renderer",async()=>{
    vi.mocked(db.getPolicyByUserId).mockResolvedValueOnce(undefined);
    await expect(generateStrategyPdf(example,7)).rejects.toThrow(/signed-in account/);
    expect(report.renderApprovedLtcReport).not.toHaveBeenCalled();
  });
  it("rejects forged policy benefit limits instead of printing them",async()=>{
    await expect(generateStrategyPdf({...example,dailyMaximum:99999},7))
      .rejects.toThrow(/daily benefit does not match/);
    expect(report.renderApprovedLtcReport).not.toHaveBeenCalled();
  });
  it("does not send a client-supplied or historical insured name to the PDF",async()=>{
    await generateStrategyPdf({...example,insuredName:"ANOTHER CLIENT"},7);
    const [reportInput]=vi.mocked(report.renderApprovedLtcReport).mock.calls[0];
    expect(reportInput.insuredName).toBe("");
    expect(reportInput.verifiedPolicy?.policyNumber).toBe("TEST-0001");
  });
  it("routes the download to the original template renderer, not the legacy jsPDF",async()=>{
    const result=await generateStrategyPdf(example,7);
    expect(result.key).toMatch(/^users\/7\/strategies\/qa\.pdf$/);
    expect(report.renderApprovedLtcReport).toHaveBeenCalledOnce();
    expect(report.renderApprovedLtcReport).toHaveBeenCalledWith(expect.objectContaining({
      ...example,insuredName:"",careInputs:undefined,
      verifiedPolicy:expect.objectContaining({id:20,policyNumber:"TEST-0001"}),
    }));
    expect(storage.storagePut).toHaveBeenCalledOnce();
    const args=vi.mocked(storage.storagePut).mock.calls[0];
    expect(args[0]).toMatch(/^users\/7\/strategies\//);
    expect(args[1].subarray(0,5).toString()).toBe("%PDF-");
    expect(args[2]).toBe("application/pdf");
    expect(args[3]).toBe(7);
  });
  it("never trusts a browser-supplied scenario that was not saved to the account",async()=>{
    await generateStrategyPdf({...example,careInputs:{
      paymentType:"reimbursement",termsConfirmed:true,eligibility:"confirmed",
      startDate:"2026-11-01",careDays:[1,2,3,4,5],hourlyRate:"999",
      hoursPerDay:"24",capType:"daily",dailyMax:"250",monthlyMax:"7500",
      totalPool:"273750",remainingPool:"273750",firstMonthUsed:"0",
      eliminationType:"calendar",eliminationRemaining:"0",
      monthlyPremium:"0",assumeFullWaiver:false,dualWaiver:false,
      spouseMonthlyPremium:"",careInflation:"0",benefitInflation:"none",
      benefitRate:"",inflationScope:"",nextIncrease:"",
      riderConfirmed:false,originalDaily:"",originalMonthly:"",originalPool:"",
    }},7);
    const [data]=vi.mocked(report.renderApprovedLtcReport).mock.calls[0];
    expect(data.careInputs).toBeUndefined();
  });
  it("uses a validated scenario restored from the owner database",async()=>{
    const saved={
      paymentType:"reimbursement",termsConfirmed:true,eligibility:"confirmed",
      startDate:"2026-11-15",careDays:[1,2,3,4,5],hourlyRate:"50",
      hoursPerDay:"3",capType:"daily",dailyMax:"250",monthlyMax:"7500",
      totalPool:"273750",remainingPool:"273750",firstMonthUsed:"0",
      eliminationType:"calendar",eliminationRemaining:"0",
      monthlyPremium:"0",assumeFullWaiver:false,dualWaiver:false,
      spouseMonthlyPremium:"",careInflation:"0",benefitInflation:"none",
      benefitRate:"",inflationScope:"",nextIncrease:"",
      riderConfirmed:false,originalDaily:"",originalMonthly:"",originalPool:"",
    } as const;
    vi.mocked(care.getSavedCareScenario).mockResolvedValueOnce({
      status:"saved_valid",inputs:{...saved,careDays:[...saved.careDays]},
      savedAt:"2026-10-10T08:00:00Z",reason:null,policyChanged:false,
    });
    await generateStrategyPdf(example,7);
    expect(care.getSavedCareScenario).toHaveBeenCalledWith(7,30);
    const [data]=vi.mocked(report.renderApprovedLtcReport).mock.calls[0];
    expect(data.careInputs?.startDate).toBe("2026-11-15");
    expect(data.careInputs?.hourlyRate).toBe("50");
  });
  it("does not render stale saved financial results after policy terms change",async()=>{
    vi.mocked(care.getSavedCareScenario).mockResolvedValueOnce({
      status:"needs_review",inputs:null,savedAt:null,reason:"Policy updated",policyChanged:true,
    });
    await generateStrategyPdf(example,7);
    expect(vi.mocked(report.renderApprovedLtcReport).mock.calls[0][0].careInputs).toBeUndefined();
  });
  it("never creates an object when canonical rendering fails",async()=>{
    vi.mocked(report.renderApprovedLtcReport).mockRejectedValueOnce(new Error("Template source hash failed"));
    await expect(generateStrategyPdf(example,7)).rejects.toThrow(/Template source hash failed/);
    expect(storage.storagePut).not.toHaveBeenCalled();
  });
  it("propagates storage failure instead of claiming delivery",async()=>{
    vi.mocked(storage.storagePut).mockRejectedValueOnce(new Error("Storage unavailable"));
    await expect(generateStrategyPdf(example,7)).rejects.toThrow(/Storage unavailable/);
  });
  it("scopes every report object key to the current account",async()=>{
    vi.mocked(db.getPolicyByUserId).mockResolvedValueOnce({
      id:45,userId:19,insuredFullName:"FICTIONAL TEST PERSON",
      carrierName:"Illustrative Carrier",policyNumber:"TEST-0001",
      dailyMaximum:"250",monthlyMaximum:"7500",lifetimeMaximum:"273750",
    eliminationPeriod:"0",
    } as any);
    await generateStrategyPdf(example,19);
    expect(storage.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^users\/19\/strategies\/[0-9a-f-]{36}\.pdf$/),
      expect.any(Buffer),"application/pdf",19,
    );
  });
});
