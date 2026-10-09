// Older policies store extended form answers in the equipmentAllowance JSON field.
// Only these keys may augment a row; identifiers and owner fields are never metadata.
const strings = ['poa_name','poa_relationship','lookBackPeriodDays','careCoordinatorReducedToDays','reductionInCareDaysCountedAs7','approvedAgencyRequired','numberOfDaysUntilPayment','equipmentAllowanceAmount','equipmentAllowanceCoverage','equipmentAllowanceDeductedFromLifetime','equipmentAllowanceNotes','inflationType','inflationPercentagePerYear','caseManagerAssigned','careNotes','diagnosisNotes'];
const booleans = ['lookBackPeriodEnabled','careCoordinatorReductionEnabled','reductionInCareProvidedEnabled','equipmentAllowanceEnabled','inflationAdjustmentEnabled','inflationContinuesAfterBenefits'];
const arrays = ['qualifyingAdls','equipmentAllowanceRelatedAdls','equipmentNeeds','careNeeds','diagnosisCheckboxes'];
export function readPolicyMetadata(value: unknown): Record<string,unknown> {
 let metadata:Record<string,unknown>;
 try {metadata=JSON.parse(typeof value==='string'?value:'{}');} catch {return {};}
 if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return {};
 const safe:Record<string,unknown>={};
 for(const key of strings)if(typeof metadata[key]==='string')safe[key]=metadata[key];
 for(const key of booleans)if(typeof metadata[key]==='boolean')safe[key]=metadata[key];
 for(const key of arrays)if(Array.isArray(metadata[key]))safe[key]=(metadata[key] as unknown[]).filter(v=>typeof v==='string');
 return safe;
}

export function hydratePolicyMetadata<T extends {equipmentAllowance?: unknown}>(policy:T): T & Record<string,unknown> {
 return {...policy,...readPolicyMetadata(policy.equipmentAllowance)};
}
