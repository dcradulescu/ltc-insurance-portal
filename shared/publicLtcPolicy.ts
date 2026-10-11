/** Fields the public educational intake must never request or restore.
 * The approved PDF still includes blank writable areas for these identifiers.
 */
export const REDACTED_LTC_FIELDS = new Set([
  "insuredFullName", "insuredEmail", "insuredPhone", "insuredDob",
  "insuredMailingAddress", "insuredAddress", "insuredCity", "insuredState", "insuredZip",
  "insuredMedicareNumber", "insuredMedicaidNumber",
  "powerOfAttorneyPresent", "poa_name", "poa_relationship",
  "policyNumber", "claimPreClaimNumber",
  "caseManagerAssigned", "caseManagerName",
  "diagnosisNotes", "careNotes",
]);
export function sanitizePublicPolicy<T extends Record<string, any>>(raw: T): T {
  const safe: Record<string, any> = { ...raw };
  for (const key of REDACTED_LTC_FIELDS) {
    if (key in safe) safe[key] = "";
  }
  return safe as T;
}

/** A limited whitelist, never an arbitrary user-supplied policy object. */
export const PUBLIC_POLICY_FIELDS = [
  "carrierName", "carrierAddress1", "carrierAddress2", "carrierCityStateZip",
  "carrierAddress", "carrierCity", "carrierState", "carrierZip", "carrierPhone", "carrierFax",
  "eliminationPeriod", "lookBackPeriodEnabled", "lookBackPeriodDays",
  "careCoordinatorReductionEnabled", "careCoordinatorReducedToDays",
  "reductionInCareProvidedEnabled", "reductionInCareDaysCountedAs7",
  "dailyMaximum", "monthlyMaximum", "lifetimeMaximum", "minAdlsRequired", "qualifyingAdls",
  "waiverOfPremium", "cnaRequired", "approvedAgencyRequired", "careNotesRequired",
  "careLogsheetsRequired", "whereToGetClaimsPacket", "howToSubmitClaimsPacket",
  "invoiceReimbursementDelay", "assignmentOfBenefits",
  "equipmentAllowanceEnabled", "equipmentAllowanceAmount", "equipmentAllowanceCoverage",
  "equipmentAllowanceDeductedFromLifetime", "equipmentAllowanceRelatedAdls", "equipmentNeeds",
  "equipmentAllowanceNotes", "inflationAdjustmentEnabled", "inflationType",
  "inflationPercentagePerYear", "inflationContinuesAfterBenefits",
  "thirdPartyAssessmentRequired", "cognitiveImpairmentTrigger",
  "careNeeds", "diagnosisCheckboxes", "preferredCareType",
] as const;
export function publicPolicyForService(raw: Record<string, any>): Record<string, any> {
  const safe = sanitizePublicPolicy(raw);
  const result: Record<string, any> = {};
  for (const key of PUBLIC_POLICY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(safe, key)) result[key] = safe[key];
  }
  return result;
}
