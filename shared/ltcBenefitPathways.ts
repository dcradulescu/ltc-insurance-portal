/**
 * Education-only screening of possible LTC benefit-trigger pathways.
 * An Alzheimer's or dementia diagnosis alone does not establish eligibility:
 * policy wording, substantial supervision, cognitive assessment and coverage
 * conditions still require insurer/professional confirmation.
 */
export const LTC_STANDARD_ADLS = ["Bathing","Dressing","Eating/Feeding","Toileting","Transferring","Continence"] as const;

export type LTCPathwayInput = {
  minAdlsRequired?: string | number | null;
  qualifyingAdls?: string[] | null;
  careNeeds?: string[] | null;
  cognitiveImpairmentTrigger?: string | null;
  diagnosisCheckboxes?: string[] | null;
};

export function assessLtcBenefitPathways(input: LTCPathwayInput) {
  const required = Number(input.minAdlsRequired ?? 0);
  const validRequired = Number.isInteger(required) && required >= 0 && required <= 6;
  const adls = LTC_STANDARD_ADLS as readonly string[];
  const qualifying = input.qualifyingAdls?.length ? input.qualifyingAdls : [...adls];
  const careNeeds = input.careNeeds || [];
  const actual = careNeeds.filter(v => adls.includes(v));
  const nonQualifying = actual.filter(v => !qualifying.includes(v));
  const explicitNone = careNeeds.includes("NoneADL");
  const adlThresholdMet = validRequired && required > 0 && !explicitNone &&
    actual.length >= required && nonQualifying.length === 0;
  const diagnosedCognitiveCondition = (input.diagnosisCheckboxes || []).some(v =>
    v === "Alzheimer's Disease" || v === "Dementia");
  const policyHasCognitiveTrigger = /^(yes|true|1)$/i.test(
    String(input.cognitiveImpairmentTrigger || "").trim());
  const possibleCognitivePathway = policyHasCognitiveTrigger && diagnosedCognitiveCondition;
  return {required,adlThresholdMet,actualAdls:actual,nonQualifyingAdls:nonQualifying,
    explicitNone,policyHasCognitiveTrigger,diagnosedCognitiveCondition,
    possibleCognitivePathway,needsCarrierConfirmation:true};
}
