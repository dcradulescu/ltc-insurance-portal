// Fictional example used by the existing sample-data action and its printable reference.
export const samplePolicyForm = {
  insuredFullName: "John Smith", insuredEmail: "john@example.com", insuredPhone: "(555) 123-4567", insuredDob: "1950-06-15", insuredMailingAddress: "123 Main St, Charleston, SC 29401", insuredAddress: "123 Main St", insuredCity: "Charleston", insuredState: "SC", insuredZip: "29401",
  powerOfAttorneyPresent: "yes", poa_name: "Jane Smith", poa_relationship: "Daughter",
  carrierName: "Genworth", carrierAddress1: "123 Insurance Blvd", carrierAddress2: "Suite 100", carrierCityStateZip: "Richmond, VA 23219", carrierAddress: "123 Insurance Blvd Suite 100", carrierCity: "Richmond", carrierState: "VA", carrierZip: "23219",
  carrierPhone: "(800) 555-1234", carrierFax: "(804) 555-5678",
  policyNumber: "POL123456", claimPreClaimNumber: "PRE789",
  eliminationPeriod: "90", lookBackPeriodEnabled: true, lookBackPeriodDays: "30", careCoordinatorReductionEnabled: false, careCoordinatorReducedToDays: "", reductionInCareProvidedEnabled: false, reductionInCareDaysCountedAs7: "", dailyMaximum: "$250.00", monthlyMaximum: "$7500.00", lifetimeMaximum: "$500000.00",
  minAdlsRequired: "2", qualifyingAdls: ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"], waiverOfPremium: "yes", cnaRequired: "no", approvedAgencyRequired: "no", careNotesRequired: "yes", careLogsheetsRequired: "no", whereToGetClaimsPacket: "Contact carrier", howToSubmitClaimsPacket: "Mail or fax", invoiceReimbursementDelay: "30 days",
  assignmentOfBenefits: "yes",
  equipmentAllowanceEnabled: true, equipmentAllowanceAmount: "$100.00", equipmentAllowanceCoverage: "Annually", equipmentAllowanceDeductedFromLifetime: "no", equipmentAllowanceRelatedAdls: ["Bathing"], equipmentNeeds: ["Shower chair", "Walker"], equipmentAllowanceNotes: "Covers mobility aids",
  inflationAdjustmentEnabled: true, inflationType: "compound", inflationPercentagePerYear: "3", inflationContinuesAfterBenefits: true,
  caseManagerAssigned: "yes", caseManagerName: "Sarah Johnson", thirdPartyAssessmentRequired: "yes",
  cognitiveImpairmentTrigger: "yes",
  careNeeds: ["Bathing", "Dressing", "Toileting"], careNotes: "Needs 24/7 supervision due to fall risk",
  diagnosisCheckboxes: ["Alzheimer's Disease", "Osteoarthritis"], diagnosisNotes: "Diagnosed 2 years ago, progressive decline",
  preferredCareType: "Home Care", additionalNotes: "Prefers female caregivers",
};
