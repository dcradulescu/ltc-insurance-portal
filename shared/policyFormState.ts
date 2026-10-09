/** Only known fields with matching types may be restored from browser or recovery data. */
export function restorePolicyFields<T extends object>(defaults: T, candidate: unknown): T {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate as Record<string,unknown> : {};
  const result = {...defaults};
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    const fallback = defaults[key], value = source[key as string];
    if (Array.isArray(fallback)) {
      if (Array.isArray(value)) (result as any)[key] = value.filter((v): v is string => typeof v === 'string').slice(0,100);
    } else if (typeof value === typeof fallback) (result as any)[key] = value;
  }
  const record = result as Record<string,unknown>;
  const yesNoFields = ['powerOfAttorneyPresent','waiverOfPremium','cnaRequired','approvedAgencyRequired','careNotesRequired','careLogsheetsRequired','assignmentOfBenefits','equipmentAllowanceDeductedFromLifetime','caseManagerAssigned','thirdPartyAssessmentRequired','cognitiveImpairmentTrigger'];
  for (const field of yesNoFields) if (typeof record[field] === 'string' && /^(yes|no)$/i.test(record[field] as string)) record[field] = (record[field] as string).toLowerCase();
  if (Array.isArray(record.careNeeds)) record.careNeeds = record.careNeeds.map(v => v === 'None' ? 'NoneADL' : v);
  return result;
}
export function validPolicyStep(value: unknown): number {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return typeof number === 'number' && Number.isInteger(number) && number >= 0 && number <= 5 ? number : 0;
}
export function readPolicyDraft<T extends object>(storage: Pick<Storage,'getItem'>, defaults:T) {
  try {
    const raw = storage.getItem('ltc_policy_form');
    const value = raw ? JSON.parse(raw) : null;
    const hasDraft = !!value && typeof value === 'object' && !Array.isArray(value);
    return {form:restorePolicyFields(defaults,value),step:validPolicyStep(storage.getItem('ltc_policy_step')),hasDraft,unavailable:false};
  } catch { return {form:defaults,step:0,hasDraft:false,unavailable:true}; }
}
export function writeDraftValue(storage: Pick<Storage,'setItem'>,key:string,value:string):boolean {
  try {storage.setItem(key,value);return true;} catch {return false;}
}
const ADLS = ['Bathing','Dressing','Eating/Feeding','Toileting','Transferring','Continence'];
const currency = (value:string) => /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value.trim()) && Number.isFinite(Number(value.replace(/[$,]/g,''))) && Number(value.replace(/[$,]/g,''))>0;
export function validatePolicyStep(form:Record<string,any>,step:number,now = new Date()): Record<string,string> {
 const errors:Record<string,string>={};
 const text=(key:string)=> typeof form[key]==='string'?form[key].trim():'';
 if(step===0){
  if(!text('insuredFullName'))errors.insuredFullName='Full name is required.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('insuredEmail')))errors.insuredEmail='Please enter a valid email address.';
  const digits=text('insuredPhone').replace(/\D/g,'');
  if(!/^\d{10}$/.test(digits)&&!/^1\d{10}$/.test(digits))errors.insuredPhone='Please enter a valid 10-digit US phone number.';
  const dob=text('insuredDob');
  if(dob){
   const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);const date=match?new Date(`${dob}T00:00:00Z`):null;
   if(!date||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob||dob>now.toISOString().slice(0,10))errors.insuredDob='Enter a real date of birth that is not in the future.';
  }
 }
 if(step===1&&!text('carrierName'))errors.carrierName='Insurance company name is required.';
 if(step===2&&!text('policyNumber'))errors.policyNumber='Policy number is required.';
 if(step===3){
  for(const field of ['dailyMaximum','lifetimeMaximum'])if(!currency(text(field)))errors[field]='Enter a positive benefit amount.';
  if(text('monthlyMaximum')&&!currency(text('monthlyMaximum')))errors.monthlyMaximum='Enter a positive monthly benefit amount.';
  if(!/^\d+(?:\s*days?)?$/i.test(text('eliminationPeriod')))errors.eliminationPeriod='Enter a whole number of days (zero is allowed).';
  if(text('minAdlsRequired')&&!/^[0-6]$/.test(text('minAdlsRequired')))errors.minAdlsRequired='Enter an ADL requirement from 0 to 6.';
  if(form.inflationAdjustmentEnabled){const rate=Number(text('inflationPercentagePerYear'));if(!text('inflationPercentagePerYear')||!Number.isFinite(rate)||rate<0||rate>100)errors.inflationPercentagePerYear='Enter an annual rate from 0% to 100%.';}
 }
 if(step===4){
  const care = Array.isArray(form.careNeeds)?form.careNeeds:[];
  if(!care.some(v=>ADLS.includes(v)||v==='NoneADL'))errors.careNeeds='Select an ADL or choose "None of these ADLs apply".';
  if(!Array.isArray(form.diagnosisCheckboxes)||!form.diagnosisCheckboxes.length)errors.diagnosisCheckboxes='Select at least one diagnosis or condition.';
 }
 return errors;
}
