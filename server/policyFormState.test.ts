import {describe,it,expect} from 'vitest';
import {restorePolicyFields,validPolicyStep,readPolicyDraft,writeDraftValue,validatePolicyStep,reachablePolicyStep} from '../shared/policyFormState';
const defaults={insuredFullName:'',careNeeds:[] as string[],waiverOfPremium:'',enabled:false};
describe('safe policy draft restoration',()=>{
 it('fills defaults, drops unknown IDs and rejects type mismatches',()=>{
  expect(restorePolicyFields(defaults,{insuredFullName:42,id:9,userId:3,enabled:'true',careNeeds:['Bathing',null,2],waiverOfPremium:'Yes'})).toEqual({...defaults,careNeeds:['Bathing'],waiverOfPremium:'yes'});
 });
 it('migrates legacy none selection',()=>expect(restorePolicyFields(defaults,{careNeeds:['None']})).toMatchObject({careNeeds:['NoneADL']}));
 it.each(['NaN','-1','6','100','1x',null,Infinity])('clamps invalid saved step %s',value=>expect(validPolicyStep(value)).toBe(0));
 it('keeps valid review step',()=>expect(validPolicyStep('5')).toBe(5));
 it('recovers from corrupt storage and blocked storage',()=>{
  expect(readPolicyDraft({getItem:()=>'{broken'},defaults).hasDraft).toBe(false);
  expect(readPolicyDraft({getItem:()=>{throw Error('blocked')}},defaults).unavailable).toBe(true);
  expect(writeDraftValue({setItem:()=>{throw Error('quota')}},'key','value')).toBe(false);
 });
});
const form={insuredFullName:'McDonald',insuredEmail:'test@example.com',insuredPhone:'+1 (555) 123-4567',insuredDob:'1950-06-15',carrierName:'Example',policyNumber:'123',dailyMaximum:'$250.00',monthlyMaximum:'$7,500.00',lifetimeMaximum:'$500,000.00',eliminationPeriod:'0',minAdlsRequired:'2',waiverOfPremium:'no',assignmentOfBenefits:'yes',cognitiveImpairmentTrigger:'yes',careNeeds:['NoneADL'],diagnosisCheckboxes:['None']};
describe('policy step validation',()=>{
 it('accepts valid values at all six steps, including zero waiting days',()=>{for(let i=0;i<6;i++)expect(validatePolicyStep(form,i)).toEqual({});});
 it.each(['2023-02-29','1900-02-29','06/30/1950','9999-01-01'])('rejects invalid or future birth date %s',insuredDob=>expect(validatePolicyStep({...form,insuredDob},0)).toHaveProperty('insuredDob'));
 it('accepts a leap-day birth date',()=>expect(validatePolicyStep({...form,insuredDob:'2000-02-29'},0)).toEqual({}));
 it.each(['-1','$0.00','Infinity','1.2.3','abc'])('rejects invalid benefit %s',dailyMaximum=>expect(validatePolicyStep({...form,dailyMaximum},3)).toHaveProperty('dailyMaximum'));
 it('rejects fractional waiting days and impossible ADL counts',()=>expect(validatePolicyStep({...form,eliminationPeriod:'1.5',minAdlsRequired:'7'},3)).toHaveProperty('eliminationPeriod'));
 it('requires care and condition selections',()=>expect(Object.keys(validatePolicyStep({...form,careNeeds:[],diagnosisCheckboxes:[]},4))).toEqual(['careNeeds','diagnosisCheckboxes']));
});


describe('wizard requirements and sequential recovery',()=>{
 it.each([
  [0,'insuredFullName'],[0,'insuredEmail'],[0,'insuredPhone'],[1,'carrierName'],[2,'policyNumber'],
  [3,'dailyMaximum'],[3,'lifetimeMaximum'],[3,'eliminationPeriod'],[3,'minAdlsRequired'],
  [3,'waiverOfPremium'],[3,'assignmentOfBenefits'],[3,'cognitiveImpairmentTrigger'],
 ])('requires the visible field %s / %s',(step,field)=>{
  expect(validatePolicyStep({...form,[field]:''},Number(step))).toHaveProperty(String(field));
 });
 it('requires care notes only when the home care section is visible',()=>{
  expect(validatePolicyStep({...form,equipmentAllowanceEnabled:true,careNotesRequired:''},3)).toHaveProperty('careNotesRequired');
  expect(validatePolicyStep({...form,equipmentAllowanceEnabled:false,careNotesRequired:''},3)).toEqual({});
 });
 it.each(['waiverOfPremium','assignmentOfBenefits','cognitiveImpairmentTrigger'])('rejects an unknown restored answer for %s',field=>{
  expect(validatePolicyStep({...form,[field]:'maybe'},3)).toHaveProperty(field);
 });
 it('accepts optional fields being empty but validates their supplied formats',()=>{
  expect(validatePolicyStep({...form,insuredDob:'',insuredZip:'',insuredState:''},0)).toEqual({});
  expect(validatePolicyStep({...form,insuredZip:'123',insuredState:'12',insuredPhone:'5551234567extension'},0)).toMatchObject({insuredZip:expect.any(String),insuredState:expect.any(String),insuredPhone:expect.any(String)});
  expect(validatePolicyStep({...form,carrierPhone:'555',carrierFax:'180055512340',carrierZip:'1234'},1)).toMatchObject({carrierPhone:expect.any(String),carrierFax:expect.any(String),carrierZip:expect.any(String)});
  expect(validatePolicyStep({...form,insuredZip:'12345-6789',insuredState:'SC'},0)).toEqual({});
 });
 it.each([
  ['eliminationPeriod','1000'],['eliminationPeriod','1e2'],['eliminationPeriod','-1'],
  ['lookBackPeriodDays','1.5'],['careCoordinatorReducedToDays','-10'],
  ['reductionInCareDaysCountedAs7','8'],['reductionInCareDaysCountedAs7','0'],
  ['monthlyMaximum','1.2.3'],
 ])('rejects malformed numeric field %s=%s',(field,value)=>expect(validatePolicyStep({...form,[field]:value},3)).toHaveProperty(field));
 it('accepts zero and suffix days where applicable; ignores dormant non-editable metadata',()=>{
  expect(validatePolicyStep({...form,lookBackPeriodDays:'0 Days',careCoordinatorReducedToDays:'10 days',reductionInCareDaysCountedAs7:'7',inflationAdjustmentEnabled:true,inflationPercentagePerYear:''},3)).toEqual({});
 });
 it('rejects contradictory ADLs and blank-only diagnosis arrays',()=>{
  expect(validatePolicyStep({...form,careNeeds:['Bathing','NoneADL'],diagnosisCheckboxes:['  ']},4)).toHaveProperty('careNeeds');
  expect(validatePolicyStep({...form,diagnosisCheckboxes:['  ']},4)).toHaveProperty('diagnosisCheckboxes');
 });
 it('reopens valid drafts at each saved step, including the partially filled current step',()=>{
  for(let step=0;step<6;step++)expect(reachablePolicyStep(form,step)).toBe(step);
  expect(reachablePolicyStep({...form,carrierName:''},1)).toBe(1);
 });
 it('rewinds a stale saved step to the earliest missing prerequisite',()=>{
  expect(reachablePolicyStep({...form,insuredEmail:''},5)).toBe(0);
  expect(reachablePolicyStep({...form,policyNumber:''},5)).toBe(2);
  expect(reachablePolicyStep({...form,waiverOfPremium:''},5)).toBe(3);
 });
 it('ignores orphaned progress when no corresponding draft exists',()=>{
  const storage={getItem:(key:string)=>key==='ltc_policy_step'?'5':null};
  expect(readPolicyDraft(storage,form)).toMatchObject({step:0,hasDraft:false});
 });
});
