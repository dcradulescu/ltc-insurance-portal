# LTC Insurance Portal - Strategy Generation Logic

## How the Strategy Page is Created

The Strategy page is **generated dynamically** based on the policy form data. Each task appears or disappears based on specific field values. This document shows the exact conditional logic for each task.

---

## Stage 1: Prior to Claim (Weeks 1-4)

### Task 1: Calculate Effective Elimination Period
**Always Shown** ✓

**Calculation Logic:**
```
effectiveEliminationPeriod = MIN(
  eliminationPeriod,
  careCoordinatorReducedToDays (if careCoordinatorReductionEnabled)
)

If reductionInCareProvidedEnabled:
  daysPerWeek = reductionInCareDaysCountedAs7
  weeksNeeded = effectiveEliminationPeriod / 7
  actualDaysNeeded = weeksNeeded * daysPerWeek
  effectiveEliminationPeriod = MIN(effectiveEliminationPeriod, actualDaysNeeded)
```

**Display:**
- Show calculated number of days
- Show breakdown if reductions applied
- Example: "Your effective elimination period is 16 days (originally 30 days, reduced by care coordinator)"

---

### Task 2: Request Claim Packet
**Always Shown** ✓

**Display:**
- Insurance company name: `carrierName`
- Contact phone: `carrierPhone`
- Contact fax: `carrierFax`
- Mailing address: `carrierAddress1`, `carrierAddress2`, `carrierCityStateZip`

---

### Task 3: Gather Look Back Documentation
**Always Shown** ✓

**Display:**
- Look back period: `lookBackPeriodDays` days
- Instruction: "Collect all out-of-pocket care expenses from the past {lookBackPeriodDays} days"

---

### Task 4: Doctors Letters
**Shown If:** `minAdlsRequired > 0` OR `cognitiveImpairmentTrigger === true`

**Conditional Display Logic:**
```javascript
showDoctorsLetters = (
  minAdlsRequired > 0 || 
  cognitiveImpairmentTrigger === true
)
```

**If Shown, Display:**
- List of qualifying ADLs: Show all checked items from `qualifyingAdls` array
  - Example: "Bathing, Dressing, Toileting"
- OR cognitive decline requirement
- Instruction: "Get physician letter supporting these conditions"
- Download link: Sample doctor letter template
- Critical note: "ADLs on letter MUST match your policy, home care plan, and third-party evaluation"

**Example:**
```
Doctors Letters
Your policy requires support for these ADLs:
✓ Bathing
✓ Dressing
✓ Toileting

Get a letter from your physician confirming:
- Patient requires help with these specific ADLs
- Care is medically necessary for safety/monitoring
- Continuous care is needed due to these conditions
```

---

### Task 5: Start Care
**Always Shown** ✓

**Display:**
- If `isHomeCareCovidInPolicy === "yes"`:
  - "Ensure your home care agency is approved by {carrierName}"
  - Show: `careNeeds` array (what services are needed)
- If `isHomeCareCovidInPolicy === "no"`:
  - "Coordinate care with your family/caregivers"

---

### Task 6: Determine AOB (Assignment of Benefits)
**Shown If:** `isHomeCareCovidInPolicy === "yes"`

**Conditional Display Logic:**
```javascript
showAOB = (isHomeCareCovidInPolicy === "yes")
```

**If Shown, Display:**
- Question: "Do you want the provider to bill insurance directly?"
- Options: Yes / No
- If Yes: "Request AOB form from {carrierName} or your home care provider"
- If No: "You will pay provider and seek reimbursement from insurance"

---

### Task 7: POA Documents
**Shown If:** `powerOfAttorneyPresent === true` AND `poa_name` is not empty

**Conditional Display Logic:**
```javascript
showPOADocuments = (
  powerOfAttorneyPresent === true && 
  poa_name && poa_name.trim() !== ""
)
```

**If Shown, Display:**
- POA Name: `poa_name`
- POA Relationship: `poa_relationship`
- Instruction: "Gather POA documents and include with claim packet"
- Note: "POA must be present for claim evaluation"

---

### Task 8: Privacy Form
**Shown If:** (`powerOfAttorneyPresent === true` AND `poa_name` is not empty) OR (`isHomeCareCovidInPolicy === "yes"`)

**Conditional Display Logic:**
```javascript
showPrivacyForm = (
  (powerOfAttorneyPresent === true && poa_name && poa_name.trim() !== "") ||
  (isHomeCareCovidInPolicy === "yes")
)
```

**If Shown, Display:**
- List of people to add to privacy form:
  - POA Name: `poa_name` (if POA present)
  - Home Care Provider: (if home care covered)
- Instruction: "Complete privacy form in claim packet and add these authorized representatives"

---

### Task 9: Home Care Provider Forms
**Shown If:** `isHomeCareCovidInPolicy === "yes"`

**Conditional Display Logic:**
```javascript
showHomeCareForms = (isHomeCareCovidInPolicy === "yes")
```

**If Shown, Display Sub-Tasks:**

**9A. Plan of Care**
- Instruction: "Schedule assessment with home care agency"
- Display: `careNeeds` array (what services are needed)
- Output: "Assessment results converted to Plan of Care"
- Action: "Save Plan of Care document for claim packet"

**9B. State License**
- Instruction: "Obtain home care agency's state license"
- Action: "Include with claim packet"

**9C. W9 Form**
- Instruction: "Get W9 tax form from home care agency"
- Action: "Include with claim packet"

**9D. Care Notes**
- Instruction: "Ensure home care provider maintains daily care notes"
- Display: "Care notes must document:"
  - Date and time of care
  - Services provided
  - Which ADLs were assisted: {qualifyingAdls.join(", ")}
  - Provider signature
- Action: "Collect all care notes for claim packet"

---

### Task 10: Gather Medical Documents
**Shown If:** `primaryDiagnosis` is selected AND not "none"

**Conditional Display Logic:**
```javascript
showMedicalDocuments = (
  primaryDiagnosis && 
  primaryDiagnosis !== "none" && 
  primaryDiagnosis !== ""
)
```

**If Shown, Display:**
- Diagnosis: `primaryDiagnosis`
- Instruction: "Collect medical documentation supporting your diagnosis"
- Documents needed:
  - Hospital discharge summaries
  - Doctor visit notes mentioning diagnosis
  - Medication lists
  - Lab results or imaging reports
  - Any documentation showing admission reason
- Action: "Save all medical documents for claim packet"

---

### Task 11: Switch to Monthly Premiums
**Shown If:** `waiverOfPremium === "yes"`

**Conditional Display Logic:**
```javascript
showMonthlyPremiums = (waiverOfPremium === "yes")
```

**If Shown, Display:**
- Explanation: "Your policy includes Waiver of Premium - premiums stop when benefits begin"
- Recommendation: "Switch to monthly premium payments now"
- Benefit: "If you paid annual premiums upfront, you won't lose unused portion"
- Action: "Contact {carrierName} to switch to monthly billing"
- Contact: `carrierPhone`

---

### Task 12: Make Copies
**Always Shown** ✓

**Display:**
- Instruction: "Make 2-3 copies of ALL documentation"
- Purpose: "Keep copies for your records and in case documents are lost during transmission"

---

### Task 13: Label All Documents
**Always Shown** ✓

**Display:**
- Policy Number: `policyNumber`
- Instruction: "Write '{insuredFullName}, Policy #{policyNumber}' on every page"
- Reason: "If pages get separated, claims department can route to correct policy"

---

## Stage 2: Filing the Claim (Weeks 4-12)

### Task 1: Make Copies of ALL Documents
**Always Shown** ✓

---

### Task 2: Submit Claim Packet
**Always Shown** ✓

**Display:**
- Fax number: `carrierFax`
- Email: (if available)
- Mailing address: `carrierAddress1`, `carrierAddress2`, `carrierCityStateZip`
- Attention: "Claims Department"
- Cover sheet template with:
  - Insured name: `insuredFullName`
  - Policy number: `policyNumber`
  - Date submitted
  - Number of pages

---

### Task 3: Insurance Review Period
**Always Shown** ✓

**Display:**
- Timeline: "30 days"
- Instruction: "Track status with insurance company"
- Tip: "Call claims department for quicker verbal update"

---

### Task 4: Insurance Pulls Medical Records
**Always Shown** ✓

**Display:**
- Primary Care Physician: `primaryCarePhysician`
- Other Providers: `otherProviders` (if listed)
- Critical Note: "Your doctor MUST have the signed letter in their file"
- Action: "Confirm with doctor's office that letter is filed"

---

### Task 5: Third Party ADL Evaluation
**Always Shown** ✓

**Conditional Display Logic:**
```javascript
showThirdPartyEval = true // Always shown
```

**If Shown, Display:**

**Main Task:**
- Timeline: "Will occur during 30-day review period"
- Format: "In-person or Telehealth"
- Instruction: "Nurse will evaluate your ability to perform ADLs"

**Sub-Task 5A: Home Care Provider Present**
- **Shown If:** `isHomeCareCovidInPolicy === "yes"`
- Instruction: "Have your home care provider attend the evaluation"
- Reason: "They can provide guidance and support"

**Sub-Task 5B: Demonstrate ADL Functions**
- Display: "You will be asked to demonstrate:"
  - {qualifyingAdls.join(", ")}
- Instruction: "SHOW the nurse how you perform these functions"
- Examples: "How you shower, walk, get dressed, use bathroom"
- Critical Warning: "⚠️ STATING YOU DO THINGS YOURSELF = CLAIM DENIAL"
- Tip: "Be honest about what you need help with"

---

### Task 6: Continue Toward Elimination Period
**Always Shown** ✓

**Display:**
- Effective Elimination Period: `effectiveEliminationPeriod` days
- Instruction: "Continue tracking care provided"
- Purpose: "If you meet elimination period before 30-day determination, insurance will reimburse"

---

### Task 7: Receive Determination
**Always Shown** ✓

**Display:**
- Timeline: "Within 30 days (typically in writing)"
- Possible outcomes:
  - Approved
  - Denied
  - Conditional (approved with restrictions)

---

### Task 8: If Approved & Met Elimination Period
**Shown If:** (Claim approved) AND (Elimination period met)

**Conditional Display Logic:**
```javascript
showApprovedReimbursement = (
  claimStatus === "approved" && 
  daysOfCareProvided >= effectiveEliminationPeriod
)
```

**If Shown, Display:**
- Daily Maximum: `dailyMaximum`
- Message: "Insurance will reimburse up to ${dailyMaximum} per day"
- Action: "Work with home care provider on reimbursement process"

---

### Task 9: If Denied
**Shown If:** Claim denied

**Conditional Display Logic:**
```javascript
showDenialOptions = (claimStatus === "denied")
```

**If Shown, Display:**
- Option 1: "Dispute the determination"
  - Action: "Request written explanation"
  - Action: "Review for errors or missing documentation"
  - Action: "Submit dispute with additional evidence"

- Option 2: "Refile a new claim"
  - Requirement: "Must have separate documented condition change"
  - Action: "Update policy form with new information"
  - Action: "Resubmit with new documentation"

---

## Stage 3: Post Approval (Weeks 12+)

### Tasks - TO BE DEFINED

---

## Implementation Example

Here's how the Strategy page renders for a specific user:

**User Data:**
```javascript
{
  minAdlsRequired: 2,
  qualifyingAdls: ["Bathing", "Dressing"],
  cognitiveImpairmentTrigger: false,
  isHomeCareCovidInPolicy: "yes",
  powerOfAttorneyPresent: true,
  poa_name: "John Smith",
  poa_relationship: "Son",
  primaryDiagnosis: "Dementia",
  waiverOfPremium: "yes",
  eliminationPeriod: 30,
  careCoordinatorReductionEnabled: true,
  careCoordinatorReducedToDays: 20,
  carrierName: "Mutual of Omaha",
  carrierPhone: "(555) 123-4567"
}
```

**Strategy Page Renders:**

**Stage 1 Tasks Shown:**
1. ✓ Calculate Effective Elimination Period (20 days)
2. ✓ Request Claim Packet
3. ✓ Gather Look Back Documentation
4. ✓ Doctors Letters (shown because minAdlsRequired > 0)
5. ✓ Start Care
6. ✓ Determine AOB (shown because isHomeCareCovidInPolicy = "yes")
7. ✓ POA Documents (shown because POA present)
8. ✓ Privacy Form (shown because POA present AND home care covered)
9. ✓ Home Care Provider Forms (shown because isHomeCareCovidInPolicy = "yes")
10. ✓ Gather Medical Documents (shown because primaryDiagnosis selected)
11. ✓ Switch to Monthly Premiums (shown because waiverOfPremium = "yes")
12. ✓ Make Copies
13. ✓ Label All Documents

**Stage 1 Tasks Hidden:**
- (None - all tasks shown for this user)

---

## Summary of Conditional Logic

| Task | Condition | Field(s) |
|------|-----------|----------|
| Doctors Letters | `minAdlsRequired > 0 \|\| cognitiveImpairmentTrigger === true` | minAdlsRequired, cognitiveImpairmentTrigger |
| Determine AOB | `isHomeCareCovidInPolicy === "yes"` | isHomeCareCovidInPolicy |
| POA Documents | `powerOfAttorneyPresent === true && poa_name !== ""` | powerOfAttorneyPresent, poa_name |
| Privacy Form | `(powerOfAttorneyPresent && poa_name) \|\| isHomeCareCovidInPolicy === "yes"` | powerOfAttorneyPresent, poa_name, isHomeCareCovidInPolicy |
| Home Care Forms | `isHomeCareCovidInPolicy === "yes"` | isHomeCareCovidInPolicy |
| Medical Documents | `primaryDiagnosis !== "" && primaryDiagnosis !== "none"` | primaryDiagnosis |
| Monthly Premiums | `waiverOfPremium === "yes"` | waiverOfPremium |
| Home Care Provider Present | `isHomeCareCovidInPolicy === "yes"` | isHomeCareCovidInPolicy |
| Approved Reimbursement | `claimStatus === "approved" && daysOfCare >= eliminationPeriod` | claimStatus, eliminationPeriod |
| Denial Options | `claimStatus === "denied"` | claimStatus |

