# Actual Database Schema - Policies Table

## Columns in the Real Database

```
id: int NOT NULL
userId: int NOT NULL
holderFirstName: varchar(255)
holderLastName: varchar(255)
holderDateOfBirth: varchar(32)
holderRelationship: varchar(128)
insuranceCompany: varchar(255)
policyNumber: varchar(128)
policyType: varchar(128)
policyStatus: varchar(64)
effectiveDate: varchar(32)
dailyBenefitAmount: varchar(64)
benefitPeriod: varchar(128)
eliminationPeriod: varchar(128)
inflationProtection: varchar(128)
homeCareCoverage: varchar(8)
facilityCareCoverage: varchar(8)
currentCareNeeds: text
diagnosisOrCondition: text
primaryDiagnosis: varchar(255)
adlLimitations: json
cognitiveImpairment: varchar(8)
currentCareReceiving: text
preferredCareType: varchar(128)
priorClaimsFiled: varchar(8)
priorClaimsDetails: text
additionalNotes: text
createdAt: timestamp NOT NULL
updatedAt: timestamp NOT NULL
insuredFullName: varchar(255)
insuredDob: varchar(32)
insuredMailingAddress: text
insuredSsn: varchar(16)
insuredMedicareNumber: varchar(64)
insuredMedicaidNumber: varchar(64)
powerOfAttorneyPresent: varchar(8)
carrierName: varchar(255)
carrierAddress1: varchar(255)
carrierAddress2: varchar(255)
carrierCityStateZip: varchar(255)
carrierPhone: varchar(32)
carrierFax: varchar(32)
claimPreClaimNumber: varchar(128)
dailyMaximum: varchar(64)
monthlyMaximum: varchar(64)
lifetimeMaximum: varchar(64)
minAdlsRequired: varchar(16)
waiverOfPremium: varchar(8)
cnaRequired: varchar(8)
careNotesRequired: varchar(8)
paymentCycle: varchar(128)
assignmentOfBenefits: varchar(8)
caseManagerName: varchar(255)
thirdPartyAssessmentRequired: varchar(8)
thirdPartyAssessmentWho: varchar(255)
cognitiveImpairmentTrigger: varchar(8)
planOfCareStatus: varchar(128)
ltcCoordinatorAssigned: varchar(255)
primaryCarePhysician: json
otherProviders: json
facilitiesUsed: json
dischargeDocumentation: varchar(8)
fillerRelationship: varchar(128)
insuredEmail: varchar(320)
insuredPhone: varchar(32)
```

## Columns in Drizzle Schema but NOT in Database

These columns are defined in the Drizzle ORM schema but do NOT exist in the actual database:

- `lookBackPeriodEnabled`
- `lookBackPeriodDays`
- `careCoordinatorReductionEnabled`
- `careCoordinatorReducedToDays`
- `reductionInCareProvidedEnabled`
- `reductionInCareDaysCountedAs7`
- `equipmentAllowanceEnabled`
- `equipmentAllowanceAmount`
- `equipmentAllowanceCoverage`
- `equipmentAllowanceDeductedFromLifetime`
- `inflationAdjustmentEnabled`
- `inflationType`
- `inflationPercentagePerYear`
- `inflationContinuesAfterBenefits`
- `equipmentAllowanceRelatedAdls`
- `equipmentNeeds`
- `equipmentAllowanceNotes`
- `careNeeds`
- `qualifyingAdls`
- `isHomeCareCovidInPolicy`

## Columns in Database but NOT in Drizzle Schema

These columns exist in the database but are NOT defined in the Drizzle ORM schema:

- `holderFirstName`
- `holderLastName`
- `holderDateOfBirth`
- `holderRelationship`
- `insuranceCompany`
- `policyType`
- `policyStatus`
- `effectiveDate`
- `dailyBenefitAmount`
- `benefitPeriod`
- `inflationProtection`
- `homeCareCoverage`
- `facilityCareCoverage`
- `currentCareReceiving`
- `priorClaimsFiled`
- `priorClaimsDetails`
- `cognitiveImpairment`

## Solution

The schema needs to be completely rewritten to match the actual database structure. This is a significant refactoring that requires:

1. Updating `drizzle/schema.ts` to only include columns that exist in the database
2. Updating all database queries in `server/db.ts`
3. Updating all form handlers in `server/routers.ts` and related routers
4. Updating the frontend form to match the actual database fields
5. Testing all functionality end-to-end
