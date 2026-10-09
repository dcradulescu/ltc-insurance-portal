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
    const form = restorePolicyFields(defaults,value);
    return {form,step:hasDraft ? reachablePolicyStep(form,storage.getItem('ltc_policy_step')) : 0,hasDraft,unavailable:false};
  } catch { return {form:defaults,step:0,hasDraft:false,unavailable:true}; }
}
export function writeDraftValue(storage: Pick<Storage,'setItem'>,key:string,value:string):boolean {
  try {storage.setItem(key,value);return true;} catch {return false;}
}
export function reachablePolicyStep(form:Record<string,any>, requested:unknown):number {
  const target = validPolicyStep(requested);
  for (let step=0;step<target;step++) if (Object.keys(validatePolicyStep(form,step)).length) return step;
  return target;
}
const ADLS = ['Bathing','Dressing','Eating/Feeding','Toileting','Transferring','Continence'];
const currency = (value:string) => /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value.trim()) && Number.isFinite(Number(value.replace(/[$,]/g,''))) && Number(value.replace(/[$,]/g,''))>0;
export function validatePolicyStep(form:Record<string,any>,step:number,now = new Date()): Record<string,string> {
 const errors:Record<string,string>={};
 const text=(key:string)=> typeof form[key]==='string'?form[key].trim():'';
 const phone=(value:string)=> /^[+()\d\s.-]+$/.test(value) && /^(?:1)?\d{10}$/.test(value.replace(/\D/g,''));
 const days=(value:string,max:number)=> /^\d+(?:\s*days?)?$/i.test(value) && Number.parseInt(value,10)<=max;
 const yesNo=(key:string,label:string)=> {if(!['yes','no'].includes(text(key)))errors[key]=`Select Yes or No for ${label}.`;};
 for (const prefix of step===0?['insured']:step===1?['carrier']:[]) {
  if(text(`${prefix}State`)&&!/^[A-Za-z]{2}$/.test(text(`${prefix}State`)))errors[`${prefix}State`]='Enter a two-letter state abbreviation.';
  if(text(`${prefix}Zip`)&&!/^\d{5}(?:-\d{4})?$/.test(text(`${prefix}Zip`)))errors[`${prefix}Zip`]='Enter a five-digit ZIP code or ZIP+4.';
 }

 if(step===0){
  if(!text('insuredFullName'))errors.insuredFullName='Full name is required.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('insuredEmail')))errors.insuredEmail='Please enter a valid email address.';
  if(!phone(text('insuredPhone')))errors.insuredPhone='Please enter a valid 10-digit US phone number.';
  const dob=text('insuredDob');
  if(dob){
   const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);const date=match?new Date(`${dob}T00:00:00Z`):null;
   if(!date||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob||dob>now.toISOString().slice(0,10))errors.insuredDob='Enter a real date of birth that is not in the future.';
  }
 }
 if(step===1){
  if(!text('carrierName'))errors.carrierName='Insurance company name is required.';
  for(const key of ['carrierPhone','carrierFax'])if(text(key)&&!phone(text(key)))errors[key]='Enter a valid 10-digit US phone or fax number.';
 }
 if(step===2&&!text('policyNumber'))errors.policyNumber='Policy number is required.';
 if(step===3){
  for(const field of ['dailyMaximum','lifetimeMaximum'])if(!currency(text(field)))errors[field]='Enter a positive benefit amount.';
  if(text('monthlyMaximum')&&!currency(text('monthlyMaximum')))errors.monthlyMaximum='Enter a positive monthly benefit amount.';
  if(!days(text('eliminationPeriod'),999))errors.eliminationPeriod='Enter a whole number of days from 0 to 999.';
  if(text('eliminationPeriod'))for(const [key,max] of [['lookBackPeriodDays',999],['careCoordinatorReducedToDays',999],['reductionInCareDaysCountedAs7',7]] as const){
   if(text(key)&&(!days(text(key),max)||(key==='reductionInCareDaysCountedAs7'&&Number.parseInt(text(key),10)===0)))errors[key]=`Enter whole days from ${key==='reductionInCareDaysCountedAs7'?1:0} to ${max}.`;
  }
  yesNo('waiverOfPremium','waiver of premium');
  yesNo('assignmentOfBenefits','assignment of benefits');
  yesNo('cognitiveImpairmentTrigger','the cognitive impairment trigger');
  if(form.equipmentAllowanceEnabled===true)yesNo('careNotesRequired','care notes');
  if(!/^[0-6]$/.test(text('minAdlsRequired')))errors.minAdlsRequired='Enter an ADL requirement from 0 to 6.';
  // Dormant inflation metadata has no editable control in this wizard; it cannot block navigation.
 }
 if(step===4){
  const care = Array.isArray(form.careNeeds)?form.careNeeds:[];
  if(!care.some(v=>ADLS.includes(v)||v==='NoneADL')||(care.includes('NoneADL')&&care.some(v=>ADLS.includes(v))))errors.careNeeds='Select an ADL or choose "None of these ADLs apply".';
  if(!Array.isArray(form.diagnosisCheckboxes)||!form.diagnosisCheckboxes.some((value:unknown)=>typeof value==='string'&&value.trim()))errors.diagnosisCheckboxes='Select at least one diagnosis or condition.';
 }
 return errors;
}
