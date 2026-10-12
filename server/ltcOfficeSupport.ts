/**
 * Office support copies contain the exact report or generated Strategy plus a
 * readable whitelist of structured coverage and care selections. Arbitrary
 * free-text notes and account/policy identifiers are deliberately excluded.
 * Anonymity is NOT guaranteed merely because identifying fields are absent.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { escapeHtml, sendEmail } from "./_core/email";
import { publicPolicyForService } from "../shared/publicLtcPolicy";

export const supportReferenceSchema = z.string().regex(/^LTC-[A-F0-9]{12}$/).optional();

export function resolveLtcSupportReference(reference?:string):string {
  return reference || "LTC-" + randomBytes(6).toString("hex").toUpperCase();
}
export const ltcOfficeAddress = () =>
  process.env.LTC_SUPPORT_EMAIL?.trim() || "daniel@scvisitingangels.com";

export const ltcOfficeCopiesEnabled = () => process.env.LTC_SUPPORT_COPY_ENABLED !== "false";

const labels:Record<string,string>={
  carrierName:"Insurance company",carrierAddress:"Carrier street address",
  carrierAddress1:"Carrier claims department",carrierAddress2:"Carrier claims address line 2",
  carrierCity:"Carrier city",carrierState:"Carrier state",carrierZip:"Carrier ZIP",
  carrierCityStateZip:"Carrier city/state/ZIP",carrierPhone:"Carrier phone",carrierFax:"Carrier fax",
  dailyMaximum:"Daily benefit",monthlyMaximum:"Monthly benefit",lifetimeMaximum:"Lifetime benefit maximum",
  eliminationPeriod:"Elimination period (days)",lookBackPeriodEnabled:"Lookback enabled",
  lookBackPeriodDays:"Lookback period (days)",careCoordinatorReductionEnabled:"Coordinator reduction",
  careCoordinatorReducedToDays:"Reduced elimination days",reductionInCareProvidedEnabled:"Care-day reduction",
  reductionInCareDaysCountedAs7:"Days counted as seven",minAdlsRequired:"ADL threshold",
  qualifyingAdls:"Policy qualifying ADLs",careNeeds:"Reported care needs / ADLs / IADLs",
  diagnosisCheckboxes:"Selected diagnoses/conditions",cognitiveImpairmentTrigger:"Cognitive trigger",
  waiverOfPremium:"Waiver of premium",assignmentOfBenefits:"Assignment of benefits",
  cnaRequired:"CNA requirement",approvedAgencyRequired:"Approved agency required",
  careNotesRequired:"Care notes requirement",careLogsheetsRequired:"Logsheets required",
  invoiceReimbursementDelay:"Reimbursement delay",
  equipmentAllowanceEnabled:"Equipment allowance",equipmentAllowanceAmount:"Equipment allowance amount",
  equipmentAllowanceCoverage:"Equipment coverage",equipmentAllowanceDeductedFromLifetime:"Equipment deducted from pool",
  equipmentAllowanceRelatedAdls:"Equipment-related ADLs",equipmentNeeds:"Equipment needs",
  inflationAdjustmentEnabled:"Inflation adjustment",inflationType:"Inflation adjustment type",
  inflationPercentagePerYear:"Annual inflation percentage",
  inflationContinuesAfterBenefits:"Inflation continues during benefits",
  thirdPartyAssessmentRequired:"Third-party assessment",preferredCareType:"Preferred care type",
};
const unsafeFreeText=new Set([
  "additionalNotes","diagnosisNotes","careNotes","equipmentAllowanceNotes",
  "whereToGetClaimsPacket","howToSubmitClaimsPacket","invoiceReimbursementDelay",
  "carrierAddress","carrierAddress1","carrierAddress2","carrierCityStateZip",
]);
export function buildLtcSupportSummary(policy:Record<string,unknown> = {}):string {
  const permitted = publicPolicyForService(policy);
  const entries=Object.entries(labels).filter(([key])=>key in permitted && !unsafeFreeText.has(key))
    .map(([key,label])=>{
      const value=permitted[key];
      if(value===undefined || value===null || value==="")return null;
      const text=Array.isArray(value)?value.join(", "):typeof value==="boolean"?(value?"Yes":"No"):String(value);
      return "<tr><th scope='row' style='text-align:left;padding:6px;border:1px solid #ddd'>"+
        escapeHtml(label)+"</th><td style='padding:6px;border:1px solid #ddd'>"+
        escapeHtml(text.slice(0,350))+"</td></tr>";
    }).filter(Boolean).join("");
  return "<table style='border-collapse:collapse'>"+entries+"</table>"+
    "<p><small>Unsent local drafts, optional personal notes, policy identifiers, names and dates of birth are not included. "+
    "These benefit and health selections can still be sensitive; treat this email as confidential.</small></p>";
}
type DeliveryState="accepted"|"unavailable"|"disabled";
type SendSupport={
  reference:string;
  source:"strategy_generated"|"pdf_downloaded"|"pdf_emailed";
  policy?:Record<string,unknown>;
  strategyHtml?:string;
  pdfBuffer?:Buffer;
  stageTasks?:string[];
};
export async function sendLtcOfficeSupportCopy(input:SendSupport):Promise<DeliveryState> {
  if(!ltcOfficeCopiesEnabled())return "disabled";
  const safeReference=resolveLtcSupportReference(input.reference);
  const details=buildLtcSupportSummary(input.policy || {});
  const page=input.strategyHtml
    ? "<h2>Generated Strategy (same text shown to visitor)</h2><div>"+
      escapeHtml(input.strategyHtml.replace(/<[^>]*>/g," ").slice(0,30000)).replace(/\n/g,"<br>")+"</div>"
    : "";
  const checklist=input.stageTasks?.length
    ? "<h2>Generated claim checklist (same tasks available to visitor)</h2><ol>"+
      input.stageTasks.map(task=>"<li>"+escapeHtml(task.slice(0,400))+"</li>").join("")+"</ol>"
    : "";
  const attachments=input.pdfBuffer
    ? [{filename:"Visiting-Angels-LTC-Strategy-"+safeReference+".pdf",
      content:input.pdfBuffer,contentType:"application/pdf"}]
    : undefined;
  try{
    await sendEmail({
      to:ltcOfficeAddress(),
      subject:"LTC Support Copy "+safeReference+" — "+
        (input.source==="strategy_generated"?"Strategy Generated":
          input.source==="pdf_downloaded"?"PDF Downloaded":"PDF Emailed"),
      html:"<h1>Visiting Angels — LTC Support Copy</h1>"+
        "<p><strong>Support reference:</strong> "+escapeHtml(safeReference)+"</p>"+
        "<p><strong>Event:</strong> "+escapeHtml(input.source)+"</p>"+
        "<p><strong>Generated:</strong> "+escapeHtml(new Date().toISOString())+"</p>"+
        "<h2>Structured policy and care selections</h2>"+details+page+checklist,
      attachments,
    });
    return "accepted";
  }catch{
    return "unavailable";
  }
}
