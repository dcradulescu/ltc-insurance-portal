import {describe,it,expect} from 'vitest';
import {restorePolicyFields,validPolicyStep,readPolicyDraft,writeDraftValue,validatePolicyStep} from '../shared/policyFormState';
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
const form={insuredFullName:'McDonald',insuredEmail:'test@example.com',insuredPhone:'+1 (555) 123-4567',insuredDob:'1950-06-15',carrierName:'Example',policyNumber:'123',dailyMaximum:'$250.00',monthlyMaximum:'$7,500.00',lifetimeMaximum:'$500,000.00',eliminationPeriod:'0',minAdlsRequired:'2',careNeeds:['NoneADL'],diagnosisCheckboxes:['None']};
describe('policy step validation',()=>{
 it('accepts valid values at all six steps, including zero waiting days',()=>{for(let i=0;i<6;i++)expect(validatePolicyStep(form,i)).toEqual({});});
 it.each(['2023-02-29','1900-02-29','06/30/1950','9999-01-01'])('rejects invalid or future birth date %s',insuredDob=>expect(validatePolicyStep({...form,insuredDob},0)).toHaveProperty('insuredDob'));
 it('accepts a leap-day birth date',()=>expect(validatePolicyStep({...form,insuredDob:'2000-02-29'},0)).toEqual({}));
 it.each(['-1','$0.00','Infinity','1.2.3','abc'])('rejects invalid benefit %s',dailyMaximum=>expect(validatePolicyStep({...form,dailyMaximum},3)).toHaveProperty('dailyMaximum'));
 it('rejects fractional waiting days and impossible ADL counts',()=>expect(validatePolicyStep({...form,eliminationPeriod:'1.5',minAdlsRequired:'7'},3)).toHaveProperty('eliminationPeriod'));
 it('requires care and condition selections',()=>expect(Object.keys(validatePolicyStep({...form,careNeeds:[],diagnosisCheckboxes:[]},4))).toEqual(['careNeeds','diagnosisCheckboxes']));
});
