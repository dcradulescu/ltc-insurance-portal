import { describe,expect,it } from "vitest";
import { assessLtcBenefitPathways } from "./ltcBenefitPathways";

describe("LTC educational ADL and cognitive impairment pathways",()=>{
  const base={minAdlsRequired:"2",qualifyingAdls:["Bathing","Dressing","Toileting"],
    cognitiveImpairmentTrigger:"yes",diagnosisCheckboxes:[] as string[],careNeeds:[] as string[]};
  it("recognizes a contractual 2-of-6 ADL threshold without inferring cognitive status",()=>{
    const result=assessLtcBenefitPathways({...base,careNeeds:["Bathing","Dressing"]});
    expect(result.adlThresholdMet).toBe(true);
    expect(result.possibleCognitivePathway).toBe(false);
    expect(result.needsCarrierConfirmation).toBe(true);
  });
  it("preserves potential cognitive pathway when no ADLs apply",()=>{
    const result=assessLtcBenefitPathways({...base,careNeeds:["NoneADL"],diagnosisCheckboxes:["Alzheimer's Disease"]});
    expect(result.adlThresholdMet).toBe(false);
    expect(result.possibleCognitivePathway).toBe(true);
    expect(result.needsCarrierConfirmation).toBe(true);
  });
  it("does not mistake a diagnosis alone for a policy cognitive benefit trigger",()=>{
    const result=assessLtcBenefitPathways({...base,
      cognitiveImpairmentTrigger:"no",diagnosisCheckboxes:["Dementia"],careNeeds:["NoneADL"]});
    expect(result.possibleCognitivePathway).toBe(false);
  });
  it("does not treat non-cognitive diagnoses or generic Other as cognitive triggers",()=>{
    for(const diagnosis of ["Diabetes","Osteoporosis","Other"]){
      expect(assessLtcBenefitPathways({...base,careNeeds:["NoneADL"],diagnosisCheckboxes:[diagnosis]}).possibleCognitivePathway).toBe(false);
    }
  });
  it("never counts a non-qualifying ADL to reach the insured's policy minimum",()=>{
    const result=assessLtcBenefitPathways({...base,careNeeds:["Eating/Feeding","Bathing"]});
    expect(result.adlThresholdMet).toBe(false);
    expect(result.nonQualifyingAdls).toEqual(["Eating/Feeding"]);
  });
  it("never treats zero ADL requirement as automatic claim approval",()=>{
    const result=assessLtcBenefitPathways({...base,minAdlsRequired:"0",careNeeds:["NoneADL"]});
    expect(result.adlThresholdMet).toBe(false);
    expect(result.possibleCognitivePathway).toBe(false);
    expect(result.needsCarrierConfirmation).toBe(true);
  });
});
