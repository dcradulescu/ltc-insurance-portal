# LTC Insurance Portal - Strategy Section Remaining Work

## Current Status
- ✅ Physician Letter Generator (server utility + tRPC endpoint) - COMPLETE
- ✅ Strategy Checklist Component (React component with localStorage) - COMPLETE
- ✅ Strategy Logic Documentation (Phase 1-2 tasks defined) - COMPLETE
- ✅ Equipment Allowance & Inflation Adjustment fields - ADDED TO SCHEMA
- ⚠️ Database schema sync issues - NEEDS MIGRATION

---

## Remaining Work (5 Major Components)

### 1. **Fix Database Schema Sync** (BLOCKER)
**Status:** ⚠️ CRITICAL - Blocks all other work

**What needs to be done:**
- Run database migrations to add missing columns:
  - `insuredEmail`, `insuredPhone`, `insuredMailingAddress`
  - `insuredSsn`, `insuredMedicareNumber`, `insuredMedicaidNumber`
  - `powerOfAttorneyPresent`, `poa_name`, `poa_relationship`
  - `equipmentAllowanceEnabled`, `equipmentAllowanceAmount`, `equipmentAllowanceCoverage`
  - `equipmentAllowanceDeductedFromLifetime`, `equipmentAllowanceRelatedAdls`
  - `inflationAdjustmentEnabled`, `inflationType`, `inflationPercentagePerYear`
  - `inflationContinuesAfterBenefits`, `qualifyingAdls`, `careNeeds`, `equipmentNeeds`
  - `equipmentAllowanceNotes`, `fillerRelationship`

**Why it matters:** Without this, the strategy generation fails because queries try to select columns that don't exist

**Estimated effort:** 15-30 minutes (once database credits are available)

---

### 2. **Integrate Strategy Checklist into Strategy Page**
**Status:** ❌ NOT STARTED

**What needs to be done:**
- Replace current Strategy.tsx task rendering with StrategyChecklist component
- Pass policy data from form to checklist
- Wire up conditional task display based on policy fields
- Connect to strategy.generate tRPC mutation

**Key files to modify:**
- `client/src/pages/Strategy.tsx` - Main strategy page
- `client/src/components/StrategyChecklist.tsx` - Already built, just needs integration

**Expected output:**
- Users see chronological task list (Day 1, Week 1-2, Week 2-4, Week 4-12)
- Tasks appear/disappear based on their policy data
- Checkboxes persist progress to localStorage
- Expandable sections show task details and required documents

**Estimated effort:** 1-2 hours

---

### 3. **Add Physician Letter PDF Download**
**Status:** ❌ NOT STARTED

**What needs to be done:**
- Create modal/dialog component to preview generated physician letter
- Add "Download as PDF" button
- Integrate html2pdf or similar library for PDF generation
- Add button to Strategy page: "Generate Physician Letter"

**Key files to create:**
- `client/src/components/PhysicianLetterPreview.tsx` - Modal with letter preview
- `client/src/hooks/usePhysicianLetter.ts` - Hook to fetch generated letter via tRPC

**Expected output:**
- User clicks "Generate Physician Letter" button
- Modal opens showing formatted letter
- User can download as PDF or copy to clipboard
- Letter includes all policy data (diagnosis, ADLs, cognitive decline, etc.)

**Estimated effort:** 2-3 hours

---

### 4. **Build Gantt Chart Timeline Visualization**
**Status:** ❌ NOT STARTED

**What needs to be done:**
- Create Gantt chart component showing three phases:
  - **Phase 1 (Days 1-17):** Pre-Filing Claim Packet
  - **Phase 2 (Days 18-48):** Claim Process & Insurance Review
  - **Phase 3 (Weeks 12+):** Post-Approval (ongoing)
- Show task bars with dependencies
- Color-code by phase (blue, amber, green)
- Show milestone markers (claim packet received, third-party evaluation, determination)
- Make it interactive (hover for details, click to expand)

**Key files to create:**
- `client/src/components/StrategyGanttChart.tsx` - Main Gantt chart component
- Could use React-based charting library (recharts, visx, or custom SVG)

**Expected output:**
- Visual timeline showing all phases and tasks
- Users understand the full timeline at a glance
- Can see task dependencies and critical path
- Helps users plan around key dates

**Estimated effort:** 3-4 hours

---

### 5. **Define Stage 3 Tasks (Post-Approval Workflow)**
**Status:** ❌ NOT STARTED

**What needs to be done:**
- Define all tasks that occur AFTER claim approval
- Examples may include:
  - Start receiving reimbursements
  - Track benefit usage against lifetime maximum
  - Monitor inflation adjustments
  - Annual policy reviews
  - Benefit modification requests
  - Claim resubmission if needed
  - Care provider changes
  - Equipment allowance tracking
  - Premium payment management

**Key files to update:**
- `server/strategyGenerator.ts` - Add Stage 3 task generation logic
- `STRATEGY_EXTRACTED.md` - Document Stage 3 timeline and tasks

**Expected output:**
- Complete strategy workflow from Day 1 through ongoing care
- Users understand what happens after approval
- Clear guidance on managing benefits long-term

**Estimated effort:** 2-3 hours (depends on complexity of Stage 3 requirements)

---

## Additional Features (Lower Priority)

### 6. **PDF/Email Delivery of Strategy**
- Generate complete strategy as PDF (all phases, tasks, timelines)
- Email strategy to insured or POA
- Save strategy to user account for future reference

**Estimated effort:** 2-3 hours

### 7. **Care Provider Forms Generation**
- Plan of Care template (auto-filled with policy data)
- W9 form template
- State License verification checklist
- Care notes template

**Estimated effort:** 3-4 hours

### 8. **Strategy Persistence & Editing**
- Save generated strategy to database
- Allow users to edit/customize strategy
- Track strategy versions
- Compare different scenarios

**Estimated effort:** 2-3 hours

---

## Implementation Priority

**Phase A (CRITICAL - Blocks everything):**
1. Fix database schema sync

**Phase B (CORE - Completes strategy engine):**
2. Integrate StrategyChecklist into Strategy page
3. Define Stage 3 tasks
4. Add Physician Letter PDF download

**Phase C (ENHANCEMENT - Improves UX):**
5. Build Gantt chart visualization
6. PDF/email delivery
7. Care provider forms
8. Strategy persistence

---

## Estimated Total Effort
- **Phase A:** 15-30 minutes
- **Phase B:** 5-8 hours
- **Phase C:** 7-10 hours
- **Total:** 12-18 hours of development

---

## Success Criteria for "Strategy Section Complete"
- ✅ Users can fill out policy form
- ✅ Strategy is generated with all Phase 1-2 tasks
- ✅ Tasks appear/disappear based on policy data
- ✅ Users can check off completed tasks
- ✅ Physician letter is generated and downloadable
- ✅ Timeline is visualized (Gantt chart)
- ✅ Stage 3 post-approval workflow is defined
- ✅ All data persists across sessions
- ✅ No database errors when generating strategy
