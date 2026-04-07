/**
 * Strategy Task Generator
 * Generates chronological checklist tasks based on policy form data
 * Implements conditional logic from STRATEGY_GENERATION_LOGIC.md
 */

import { Policy } from "../drizzle/schema";

export type StrategyTask = {
  id: string;
  title: string;
  description: string;
  timeline: string; // "Day 1", "Week 1-2", "Week 2-4", "Week 4-12", "Week 12+"
  stage: 1 | 2 | 3;
  completed: boolean;
  critical?: boolean;
  instructions?: string;
  documentsNeeded?: string[];
  notes?: string;
};

/**
 * Generate all strategy tasks based on policy data
 * Returns tasks in chronological order
 */
export function generateStrategyTasks(policy: Policy | null): StrategyTask[] {
  if (!policy) return [];

  const tasks: StrategyTask[] = [];

  // ===== STAGE 1: PRIOR TO CLAIM (Weeks 1-4) =====

  // Day 1 Tasks
  tasks.push({
    id: "stage1-calc-elimination",
    title: "Calculate Effective Elimination Period",
    description: calculateEliminationPeriodDescription(policy),
    timeline: "Day 1",
    stage: 1,
    completed: false,
    critical: true,
    instructions: `Your effective elimination period is ${calculateEffectiveEliminationPeriod(policy)} days. This is the number of days you must pay for care before insurance begins reimbursing.`,
  });

  tasks.push({
    id: "stage1-request-packet",
    title: "Request Claim Packet",
    description: `Contact ${policy.carrierName || "your insurance company"} to request the LTC claim packet by mail.`,
    timeline: "Day 1",
    stage: 1,
    completed: false,
    critical: true,
    instructions: `Call ${policy.carrierPhone || "(phone number)"} or fax ${policy.carrierFax || "(fax number)"} to request the claim packet. DO NOT start a claim on the phone yet.`,
    documentsNeeded: ["Claim packet from insurance company"],
  });

  // Week 1-2 Tasks
  tasks.push({
    id: "stage1-gather-lookback",
    title: "Gather Look Back Documentation",
    description: `Collect all out-of-pocket care expenses from the past ${policy.lookBackPeriodDays || "unknown"} days.`,
    timeline: "Week 1-2",
    stage: 1,
    completed: false,
    instructions: `Gather receipts, invoices, and documentation for any care provided during the look back period. These can help reduce your elimination period.`,
    documentsNeeded: ["Receipts for care expenses", "Invoices from providers", "Documentation of dates and services"],
  });

  // Conditional: Doctors Letters
  if (shouldShowDoctorsLetters(policy)) {
    tasks.push({
      id: "stage1-doctors-letters",
      title: "Get Doctors Letters",
      description: `Get physician letters supporting your qualifying ADLs: ${getQualifyingAdlsList(policy)}`,
      timeline: "Week 1-2",
      stage: 1,
      completed: false,
      critical: true,
      instructions: `Contact your physician(s) and get letters confirming:\n- Patient requires help with these specific ADLs\n- Care is medically necessary for safety/monitoring\n- Continuous care is needed due to these conditions\n\nGet 3 copies: 1 for doctor's file, 1 for claim packet, 1 for your records.`,
      documentsNeeded: ["Signed physician letter(s)", "Copies for records"],
    });
  }

  tasks.push({
    id: "stage1-start-care",
    title: "Start Care",
    description: policy.isHomeCareCovidInPolicy === "yes" 
      ? `Ensure your home care agency is approved by ${policy.carrierName || "your insurance company"}`
      : "Coordinate care with your family/caregivers",
    timeline: "Week 1-2",
    stage: 1,
    completed: false,
    instructions: policy.isHomeCareCovidInPolicy === "yes"
      ? `Contact a home care agency approved by ${policy.carrierName}. Verify they have worked with this insurance company before.`
      : "Arrange care with family members or caregivers",
    documentsNeeded: policy.isHomeCareCovidInPolicy === "yes" ? ["Home care agency contact info", "Approval confirmation"] : [],
  });

  // Week 2-4 Tasks

  // Conditional: Determine AOB
  if (policy.isHomeCareCovidInPolicy === "yes") {
    tasks.push({
      id: "stage1-determine-aob",
      title: "Determine AOB (Assignment of Benefits)",
      description: "Decide if provider bills insurance directly or if you pay and seek reimbursement.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `Decide: Do you want the home care provider to bill insurance directly (AOB)?\n- YES: Request AOB form from ${policy.carrierName} or your provider\n- NO: You pay provider and submit for reimbursement`,
      documentsNeeded: ["AOB form (if applicable)"],
    });
  }

  // Conditional: POA Documents
  if (false) { // POA fields not in current database
    tasks.push({
      id: "stage1-poa-documents",
      title: "Gather POA Documents",
      description: `Gather documents for Power of Attorney`,
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `Gather all POA documents and include with claim packet. The POA must be present for claim evaluation.`,
      documentsNeeded: ["POA document copy", "POA identification"],
    });
  }

  // Conditional: Privacy Form
  if (policy.isHomeCareCovidInPolicy === "yes") {
    tasks.push({
      id: "stage1-privacy-form",
      title: "Complete Privacy Form",
      description: "Add authorized representatives to insurance privacy form.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `In the claim packet privacy form, add:\n${policy.isHomeCareCovidInPolicy === "yes" ? "- Home care provider" : ""}\n\nThis allows them to discuss your claim with the insurance company.`,
      documentsNeeded: ["Completed privacy form"],
    });
  }

  // Conditional: Home Care Provider Forms
  if (policy.isHomeCareCovidInPolicy === "yes") {
    tasks.push({
      id: "stage1-homecare-plan-of-care",
      title: "Get Plan of Care",
      description: "Home care agency assessment converted to Plan of Care document.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `Schedule assessment with home care agency. The assessment results will be converted to a Plan of Care document that shows:\n- Services needed: ${getCareNeedsList(policy)}\n- Frequency and duration\n- Which ADLs are being assisted`,
      documentsNeeded: ["Signed Plan of Care"],
    });

    tasks.push({
      id: "stage1-homecare-license",
      title: "Get Home Care Agency License",
      description: "Obtain home care agency's state license.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: "Request a copy of the home care agency's state license and include with claim packet.",
      documentsNeeded: ["State license copy"],
    });

    tasks.push({
      id: "stage1-homecare-w9",
      title: "Get W9 Tax Form",
      description: "Obtain W9 tax form from home care agency.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: "Request W9 form from home care agency and include with claim packet.",
      documentsNeeded: ["Completed W9 form"],
    });

    tasks.push({
      id: "stage1-homecare-care-notes",
      title: "Ensure Care Notes Documentation",
      description: "Home care provider must maintain daily care notes.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `Ensure home care provider maintains daily care notes showing:\n- Date and time of care\n- Services provided\n- Which ADLs were assisted: ${getQualifyingAdlsList(policy)}\n- Provider signature\n\nCollect all care notes for claim packet.`,
      documentsNeeded: ["Daily care notes", "Provider signatures"],
    });
  }

  // Conditional: Medical Documents
  if (policy.primaryDiagnosis && policy.primaryDiagnosis !== "none" && policy.primaryDiagnosis !== "") {
    tasks.push({
      id: "stage1-medical-documents",
      title: "Gather Medical Documents",
      description: `Collect documentation supporting diagnosis: ${policy.primaryDiagnosis}`,
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `Gather medical documentation including:\n- Hospital discharge summaries\n- Doctor visit notes mentioning diagnosis\n- Medication lists\n- Lab results or imaging reports\n- Any documentation showing admission reason`,
      documentsNeeded: ["Discharge summaries", "Doctor notes", "Medication lists", "Lab/imaging reports"],
    });
  }

  // Conditional: Monthly Premiums
  if (policy.waiverOfPremium === "yes") {
    tasks.push({
      id: "stage1-monthly-premiums",
      title: "Switch to Monthly Premium Payments",
      description: "Switch from annual to monthly premium payments to preserve cash flow.",
      timeline: "Week 2-4",
      stage: 1,
      completed: false,
      instructions: `Your policy includes Waiver of Premium (premiums stop when benefits begin). Switch to monthly payments now so you don't lose unused annual premiums if claim is approved.\n\nCall ${policy.carrierPhone || "(phone number)"} to request monthly billing.`,
      documentsNeeded: ["Confirmation of billing change"],
    });
  }

  // Always shown: Make Copies
  tasks.push({
    id: "stage1-make-copies",
    title: "Make Copies of All Documents",
    description: "Make 2-3 copies of all documentation for records.",
    timeline: "Week 2-4",
    stage: 1,
    completed: false,
    instructions: "Make copies of EVERY document you're submitting. Keep copies for your records and in case documents are lost during transmission.",
    documentsNeeded: ["Complete set of copies"],
  });

  // Always shown: Label Documents
  tasks.push({
    id: "stage1-label-documents",
    title: "Label All Documents with Policy Number",
    description: `Write "${policy.insuredFullName || "Name"}, Policy #${policy.policyNumber || "####"}" on every page.`,
    timeline: "Week 2-4",
    stage: 1,
    completed: false,
    instructions: `On every page of every document, write:\n${policy.insuredFullName || "[Insured Name]"}\nPolicy #${policy.policyNumber || "[Policy Number]"}\n\nIf pages get separated, claims department can route to correct policy.`,
    documentsNeeded: ["All documents labeled"],
  });

  // ===== STAGE 2: FILING THE CLAIM (Weeks 4-12) =====

  tasks.push({
    id: "stage2-make-copies",
    title: "Make Final Copies of All Documents",
    description: "Keep backup copies for dispute/refile if needed.",
    timeline: "Week 4",
    stage: 2,
    completed: false,
    instructions: "Make additional copies of all documentation. Keep these separate in case you need to dispute or refile.",
    documentsNeeded: ["Complete backup set"],
  });

  tasks.push({
    id: "stage2-submit-packet",
    title: "Submit Claim Packet",
    description: `Fax/Email claim packet to ${policy.carrierName || "insurance company"} Claims Department.`,
    timeline: "Week 4",
    stage: 2,
    completed: false,
    critical: true,
    instructions: `Fax to: ${policy.carrierFax || "(fax number)"}\nMailing Address: ${policy.carrierAddress1 || ""}\n\nInclude cover sheet with:\n- Your name: ${policy.insuredFullName || ""}\n- Policy #: ${policy.policyNumber || ""}\n- Date submitted\n- Number of pages\n- Attn: Claims Department`,
    documentsNeeded: ["Signed cover sheet", "All claim documents"],
  });

  tasks.push({
    id: "stage2-insurance-review",
    title: "Insurance Review Period",
    description: "Insurance company reviews application (30-day window).",
    timeline: "Week 4-12",
    stage: 2,
    completed: false,
    critical: true,
    instructions: `Insurance company has 30 days to review. You can call ${policy.carrierPhone || "(phone number)"} for quicker verbal update on status.`,
    documentsNeeded: ["Claim reference number"],
  });

  tasks.push({
    id: "stage2-insurance-pulls-records",
    title: "Insurance Pulls Medical Records",
    description: "Insurance contacts physicians listed in policy.",
    timeline: "Week 4-12",
    stage: 2,
    completed: false,
    critical: true,
    instructions: `Insurance will contact your doctors:\n${policy.primaryCarePhysician ? `- Primary: ${typeof policy.primaryCarePhysician === "string" ? policy.primaryCarePhysician : JSON.stringify(policy.primaryCarePhysician)}` : ""}\n\n⚠️ CRITICAL: Your doctor MUST have the signed letter in their file. Confirm with doctor's office that letter is filed.`,
    documentsNeeded: ["Doctor confirmation"],
  });

  tasks.push({
    id: "stage2-third-party-eval",
    title: "Third Party ADL Evaluation",
    description: "Nurse evaluates your ability to perform ADLs.",
    timeline: "Week 4-12",
    stage: 2,
    completed: false,
    critical: true,
    instructions: `A nurse will evaluate your ADLs (in-person or telehealth):\n- You will be asked to DEMONSTRATE (not just say) how you perform: ${getQualifyingAdlsList(policy)}\n- Examples: shower, walk, get dressed, use bathroom\n\n⚠️ CRITICAL WARNING: Stating you do things yourself = AUTOMATIC CLAIM DENIAL\nBe honest about what you need help with.`,
    documentsNeeded: ["Evaluation report"],
  });

  // Conditional: Home Care Provider at Evaluation
  if (policy.isHomeCareCovidInPolicy === "yes") {
    tasks.push({
      id: "stage2-homecare-at-eval",
      title: "Home Care Provider Attends Evaluation",
      description: "Have home care provider present at third-party evaluation.",
      timeline: "Week 4-12",
      stage: 2,
      completed: false,
      instructions: "Have your home care provider attend the third-party evaluation to provide guidance and support.",
      documentsNeeded: ["Provider attendance confirmation"],
    });
  }

  tasks.push({
    id: "stage2-continue-elimination",
    title: "Continue Toward Elimination Period",
    description: `Track care provided (${calculateEffectiveEliminationPeriod(policy)} days needed).`,
    timeline: "Week 4-12",
    stage: 2,
    completed: false,
    instructions: `Continue tracking care provided. If you meet your elimination period (${calculateEffectiveEliminationPeriod(policy)} days) before the 30-day determination, insurance will start reimbursing.`,
    documentsNeeded: ["Care documentation"],
  });

  tasks.push({
    id: "stage2-receive-determination",
    title: "Receive Determination",
    description: "Insurance provides approval, denial, or conditional decision.",
    timeline: "Week 4-12",
    stage: 2,
    completed: false,
    critical: true,
    instructions: "Insurance typically provides written determination within 30 days. Possible outcomes: Approved, Denied, or Conditional.",
    documentsNeeded: ["Determination letter"],
  });

  // ===== STAGE 3: POST APPROVAL (Weeks 12+) =====
  // TODO: Define Stage 3 tasks

  return tasks;
}

/**
 * Helper: Calculate effective elimination period
 */
function calculateEffectiveEliminationPeriod(policy: Policy): number {
  let period = parseInt(policy.eliminationPeriod || "0") || 0;

  // Apply care coordinator reduction if enabled
  if (policy.careCoordinatorReductionEnabled) {
    const reduced = parseInt(policy.careCoordinatorReducedToDays || "0") || 0;
    period = Math.min(period, reduced);
  }

  // Apply reduction in care provided if enabled
  if (policy.reductionInCareProvidedEnabled) {
    const daysPerWeek = parseInt(policy.reductionInCareDaysCountedAs7 || "7") || 7;
    const weeksNeeded = period / 7;
    const actualDaysNeeded = weeksNeeded * daysPerWeek;
    period = Math.min(period, Math.ceil(actualDaysNeeded));
  }

  return period;
}

/**
 * Helper: Generate description for elimination period calculation
 */
function calculateEliminationPeriodDescription(policy: Policy): string {
  const effective = calculateEffectiveEliminationPeriod(policy);
  const stated = parseInt(policy.eliminationPeriod || "0") || 0;

  if (effective === stated) {
    return `Your elimination period is ${effective} days`;
  } else {
    return `Your effective elimination period is ${effective} days (reduced from ${stated} days)`;
  }
}

/**
 * Helper: Check if Doctors Letters task should be shown
 */
function shouldShowDoctorsLetters(policy: Policy): boolean {
  const minAdls = parseInt(policy.minAdlsRequired || "0") || 0;
  const hasCognitive = policy.cognitiveImpairmentTrigger === "yes";
  return minAdls > 0 || hasCognitive;
}

/**
 * Helper: Get list of qualifying ADLs
 */
function getQualifyingAdlsList(policy: Policy): string {
  // Use adlLimitations if available
  if (!policy.adlLimitations) return "ADLs as specified in policy";
  
  try {
    const adls = typeof policy.adlLimitations === "string" 
      ? JSON.parse(policy.adlLimitations) 
      : policy.adlLimitations;
    
    if (Array.isArray(adls)) {
      return adls.join(", ");
    }
  } catch (e) {
    // Fall through to default
  }
  
  return "ADLs as specified in policy";
}

/**
 * Helper: Get list of care needs
 */
function getCareNeedsList(policy: Policy): string {
  if (!policy.currentCareNeeds) return "care services as needed";
  
  try {
    // currentCareNeeds is a text field, not JSON
    if (typeof policy.currentCareNeeds === "string") {
      return policy.currentCareNeeds;
    }
  } catch (e) {
    // Fall through to default
  }
  
  return "care services as needed";
}
