import { describe, expect, it } from "vitest";
import { sanitizePublicPolicy,publicPolicyForService,REDACTED_LTC_FIELDS } from "./publicLtcPolicy";
describe("anonymous visitor field separation",()=>{
  const source={
    insuredFullName:"SYNTHETIC NAME",insuredEmail:"test@example.test",insuredPhone:"555-1234",
    insuredDob:"1950-01-01",insuredAddress:"Private street",insuredCity:"Private city",
    poa_name:"PRIVATE POA",poa_relationship:"Child",
    powerOfAttorneyPresent:"yes",policyNumber:"SYNTHETIC-POL",claimPreClaimNumber:"SYNTH-CLAIM",
    caseManagerName:"Fictional Manager",caseManagerAssigned:"yes",
    diagnosisNotes:"PRIVATE DIAGNOSIS",careNotes:"PRIVATE CARE",
    carrierName:"Illustrative Carrier",carrierPhone:"800-555-1000",carrierFax:"800-555-2000",
    dailyMaximum:"$250.00",lifetimeMaximum:"$200000",
    diagnosisCheckboxes:["Dementia"],careNeeds:["Bathing","Dressing"],
    additionalNotes:"Personal learning diary",
  };
  it("clears identifying fields when restoring stale browser drafts",()=>{
    const clean=sanitizePublicPolicy(source);
    for(const key of REDACTED_LTC_FIELDS)if(key in source)expect(clean[key as keyof typeof clean]).toBe("");
    expect(clean.carrierPhone).toBe(source.carrierPhone);
    expect(clean.carrierFax).toBe(source.carrierFax);
    expect(clean.additionalNotes).toBe(source.additionalNotes);
    expect(clean.careNeeds).toEqual(["Bathing","Dressing"]);
    expect(clean.diagnosisCheckboxes).toEqual(["Dementia"]);
  });
  it("sends only approved fixed policy fields to AI; keeps learning diary local",()=>{
    const outbound=publicPolicyForService(source);
    expect(outbound.carrierName).toBe("Illustrative Carrier");
    expect(outbound.carrierPhone).toBe(source.carrierPhone);
    expect(outbound.diagnosisCheckboxes).toEqual(["Dementia"]);
    expect(JSON.stringify(outbound)).not.toContain("PRIVATE");
    expect(JSON.stringify(outbound)).not.toContain("SYNTHETIC");
    expect(outbound).not.toHaveProperty("additionalNotes");
    expect(outbound).not.toHaveProperty("policyNumber");
  });
});