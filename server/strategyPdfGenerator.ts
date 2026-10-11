import { randomUUID } from "node:crypto";
import { storagePut } from "./storage";
import type { PdfData } from "./pdfConverter";
import { renderApprovedLtcReport } from "./canonicalReportPdf";
import { getPolicyByUserId, getStrategyByUserId } from "./db";
import { getSavedCareScenario } from "./careScenarioPersistence";
import { parseAmount } from "../shared/careCalculator";

export async function generateStrategyPdf(data: PdfData, userId: number): Promise<{ url: string; key: string }> {
  // The report must refer to a policy that the authenticated account owns.
  // Do not trust client-supplied insured/carrier details or inflated limits.
  const policy=await getPolicyByUserId(userId);
  const equalText=(a:string|null|undefined,b:string|null|undefined)=>
    (a||"").trim().toLocaleLowerCase("en-US")===(b||"").trim().toLocaleLowerCase("en-US");
  if(!policy ||
     !equalText(policy.policyNumber,data.policyNumber) ||
     !equalText(policy.carrierName,data.carrierName)) {
    throw new Error("Report policy does not match the signed-in account. Save the current policy and retry.");
  }
  const limits=[
    ["daily",policy.dailyMaximum,data.dailyMaximum],
    ["monthly",policy.monthlyMaximum,data.monthlyMaximum],
    ["lifetime",policy.lifetimeMaximum,data.lifetimeMaximum],
  ] as const;
  for(const [label,stored,submitted] of limits){
    const actual=stored ? parseAmount(stored) : null;
    if(actual===null ? submitted>0 : Math.round(actual*100)!==Math.round(submitted*100)){
      throw new Error("Report "+label+" benefit does not match the saved policy. Save the current policy and retry.");
    }
  }

  // The insurer's saved policy, not the browser PDF payload, supplies the
  // remaining administrative fields. The validated financial scenario must
  // also be restored from account-scoped database state; never trust a
  // client-supplied unsaved calculator scenario.
  const latestStrategy=await getStrategyByUserId(userId);
  const savedScenario=latestStrategy?.policyId===policy.id
    ? await getSavedCareScenario(userId,latestStrategy.id)
    : null;
  const verifiedInputs=savedScenario?.status==="saved_valid"
    ? savedScenario.inputs ?? undefined : undefined;
  const trustedData={
    ...data,
    insuredName:"", // The name field stays blank, including for older stored records.
    careInputs:verifiedInputs,
    verifiedPolicy:policy,
    insuredDob:policy.insuredDob || undefined,
    insuredPhone:policy.insuredPhone || undefined,
    insuredEmail:policy.insuredEmail || undefined,
    insuredAddress:policy.insuredMailingAddress || undefined,
    carrierPhone:policy.carrierPhone || undefined,
    claimNumber:policy.claimPreClaimNumber || undefined,
    eliminationPeriod:policy.eliminationPeriod || undefined,
    waiverOfPremium:policy.waiverOfPremium || undefined,
    assignmentOfBenefits:policy.assignmentOfBenefits || undefined,
    claimsAddress1:policy.carrierAddress1 || undefined,
    claimsAddress2:policy.carrierAddress2 || undefined,
    claimsCityStateZip:policy.carrierCityStateZip || undefined,
    claimsFax:policy.carrierFax || undefined,
    policyStatus:policy.policyStatus || undefined,
    benefitPeriod:policy.benefitPeriod || undefined,
    issueDate:policy.effectiveDate || undefined,
  };

  // Canonical output is the locked, original 18-page Visiting Angels master.
  // Never silently fall back to the former jsPDF layout on rendering errors.
  const { buffer: pdfBuffer } = await renderApprovedLtcReport(trustedData);

  const safeName = (data.insuredName || "unknown").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  const fileName = `LTC-Strategy-${safeName}-${Date.now()}.pdf`;
  const result = await storagePut(
    `users/${userId}/strategies/${randomUUID()}.pdf`,
    pdfBuffer,
    "application/pdf",
    userId
  );

  return result;
}
