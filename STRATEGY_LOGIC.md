# LTC Insurance Portal - Strategy Page Logic

## Stage 1: Prior to Claim (Weeks 1-4)

### Tasks with Conditional Logic

1. **Calculate Effective Elimination Period** (Day 1)
   - Always shown
   - Drivers: Elimination Period, Care Coordinator Reduction, Reduction in Care Provided
   - Logic: Take minimum of (stated period, coordinator-reduced period)

2. **Request Claim Packet** (Day 1)
   - Always shown
   - Driver: LTC Insurance Company
   - Action: Mail request to insurance company

3. **Gather Look Back Documentation** (2 weeks)
   - Always shown
   - Driver: Look Back Period
   - Action: Collect out-of-pocket care expenses within look back period

4. **Doctors Letters**
   - Shown if: Min ADLs Required > 0 OR Cognitive Decline required
   - Drivers: Min ADLs Required, Qualifying ADLs checked, Cognitive Decline required
   - Action: Get physician letter supporting qualifying conditions
   - Critical: ADLs on letter MUST match policy ADLs, home care plan, and third party evaluation

5. **Start Care**
   - Always shown
   - Action: Ensure home care agency is LTC insurance company approved

6. **Determine AOB** (Assignment of Benefits)
   - Shown if: Is Home Care covered in my policy? = Yes
   - Driver: Is Home Care covered in my policy?
   - Action: Decide if provider bills insurance directly or family pays and seeks reimbursement

7. **POA Documents**
   - Shown if: POA Name is provided
   - Drivers: POA Name, POA Relationship
   - Action: Gather POA documents for claim packet

8. **Privacy Form**
   - Shown if: POA Name provided OR Home Care provider selected
   - Drivers: POA Name, Care provider
   - Action: Add POA and home care provider to privacy form

9. **Home Care Provider Forms**
   - Shown if: Is Home Care covered in my policy? = Yes
   - Drivers: Is Home Care covered in my policy?, Care Needs, Qualifying ADLs
   - Sub-tasks:
     - Plan of Care (from assessment)
     - State License
     - W9 Form
     - Care Notes (showing care provided for affected ADLs)

10. **Gather Medical Documents**
    - Shown if: Primary Diagnosis selected
    - Driver: Primary Diagnosis
    - Action: Collect discharge documents, medications, diagnosis documentation

11. **Switch to Monthly Premiums**
    - Shown if: Waiver of Premium = Yes
    - Driver: Waiver of Premium
    - Action: Switch from annual to monthly payments to preserve cash flow

12. **Make Copies**
    - Always shown
    - Action: Copy all documentation for records

13. **Label All Documents**
    - Always shown
    - Driver: Policy Number
    - Action: Write policy number on every page

**Stage 1 Ends:** All documentation organized and ready to submit

---

## Stage 2: Filing the Claim (Weeks 4-12)

### Tasks with Conditional Logic

1. **Make Copies of ALL Documents**
   - Always shown
   - Action: Keep backup copies for dispute/refile if needed

2. **Submit Claim Packet**
   - Always shown
   - Driver: LTC Insurance Company
   - Action: Fax/Email to Claims Department with cover sheet

3. **Insurance Review Period**
   - Always shown
   - Timeline: 30-day window
   - Action: Track status with insurance company

4. **Insurance Pulls Medical Records**
   - Always shown
   - Critical: Doctor MUST have signed letter in file
   - Action: Insurance contacts physicians listed in policy

5. **Third Party ADL Evaluation**
   - Always shown
   - Drivers: Qualifying ADLs checked
   - Critical: In-person or Telehealth evaluation
   - Sub-tasks:
     - Home Care Provider Present (if Home Care Covered = Yes)
     - Demonstrate ADL Functions (must SHOW, not just say)
     - **WARNING:** Stating you do things yourself = CLAIM DENIAL

6. **Continue Toward Elimination Period**
   - Always shown
   - Driver: Elimination Period
   - Action: Track care provided during 30-day review window

7. **Receive Determination**
   - Always shown
   - Timeline: Within 30 days (typically written)
   - Outcomes: Approval, Denial, or Conditional

8. **If Approved & Met Elimination Period**
   - Shown if: Claim approved AND Elimination Period met
   - Driver: Daily Maximum
   - Action: Insurance reimburses up to daily max

9. **If Denied**
   - Shown if: Claim denied
   - Options: Dispute determination OR Refile with new reason
   - Note: Refile requires separate documented condition change

---

## Stage 3: Post Approval (Weeks 12+)

### Tasks - TO BE DEFINED TOMORROW

---

## Policy Form Fields Used in Strategy Logic

| Field | Stage 1 | Stage 2 | Stage 3 |
|-------|---------|---------|---------|
| Elimination Period | ✓ | ✓ | |
| Care Coordinator Reduction | ✓ | | |
| Reduction in Care Provided | ✓ | | |
| Look Back Period | ✓ | | |
| LTC Insurance Company | ✓ | ✓ | |
| Min ADLs Required | ✓ | ✓ | |
| Qualifying ADLs | ✓ | ✓ | |
| Cognitive Decline Required | ✓ | ✓ | |
| Is Home Care Covered? | ✓ | ✓ | |
| POA Name | ✓ | | |
| POA Relationship | ✓ | | |
| Care Needs | ✓ | ✓ | |
| Primary Diagnosis | ✓ | ✓ | |
| Waiver of Premium | ✓ | | |
| Policy Number | ✓ | ✓ | |
| Daily Maximum | | ✓ | |

---

## Critical Warnings & Rules

1. **Doctor Letters:** ADLs on letter MUST match policy ADLs, home care plan, and third party evaluation
2. **Third Party Evaluation:** Most common reason for claim denial - must demonstrate ADLs, not just state them
3. **Stating Self-Sufficiency:** Saying you do things yourself = automatic claim denial
4. **Home Care Provider:** Should attend third party evaluation for guidance
5. **Claim Denial:** Can dispute or refile, but refile requires new documented condition change
6. **Copies:** Keep copies of everything for dispute/refile scenarios
