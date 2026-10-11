/** Identical stage task generation shared by legacy and anonymous public flows. */
type StrategyTask = { id: string; label: string; completed: boolean; category: string; critical?: boolean; uploadRequired?: boolean };

export function buildStage1Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s1-1", label: "Contact insurance company and request claims packet by mail", completed: false, category: "carrier-contact" },
    { id: "s1-2", label: "Confirm claim-notice deadlines; promptly file any required notice while gathering documents", completed: false, category: "carrier-contact", critical: true },
    { id: "s1-3", label: "Confirm whether Assignment of Benefits (AOB) is permitted; request form only if applicable", completed: false, category: "carrier-contact" },
    { id: "s1-4", label: "Evaluate long-term care need and identify physical/cognitive decline", completed: false, category: "medical-evaluation" },
    { id: "s1-5", label: "Document applicable ADL limitations and review policy benefit trigger (" + (policy.minAdlsRequired || "2") + " ADLs noted; verify policy terms and cognitive alternatives)", completed: false, category: "medical-evaluation" },
    { id: "s1-6", label: "Identify all healthcare providers (PCP, specialists, facilities)", completed: false, category: "provider-setup" },
    { id: "s1-7", label: "Notify all providers IN WRITING of intent to file LTC claim", completed: false, category: "provider-setup" },
    { id: "s1-8", label: "Request documented decline records from providers", completed: false, category: "provider-setup" },
    { id: "s1-9", label: "Schedule visit with PCP to document current condition", completed: false, category: "provider-setup" },
    { id: "s1-10", label: "Request chart documentation from all providers", completed: false, category: "provider-setup" },
    { id: "s1-11", label: "Secure home care provider with LTC insurance experience", completed: false, category: "provider-setup" },
    { id: "s1-12", label: "Confirm provider is familiar with LTC insurance requirements", completed: false, category: "provider-setup" },
    { id: "s1-13", label: "Collect provider license", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-14", label: "Obtain Plan of Care from provider", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-15", label: "Collect provider W-9", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-16", label: "Ensure invoicing and daily care log system is in place", completed: false, category: "documents" },
    { id: "s1-17", label: "Verify what counts toward the elimination period before arranging qualifying care (" + (policy.eliminationPeriod || "check policy") + ")", completed: false, category: "elimination-period" },
    { id: "s1-18", label: "Identify carrier-required identifiers; collect sensitive numbers only when necessary through secure channels", completed: false, category: "personal-info" },
    { id: "s1-19", label: "Obtain Power of Attorney documentation (if applicable)", completed: false, category: "personal-info", uploadRequired: true },
    { id: "s1-20", label: "Collect insurance declaration page", completed: false, category: "documents", uploadRequired: true },
    { id: "s1-21", label: "Gather discharge paperwork (if applicable)", completed: false, category: "documents", uploadRequired: true },
  ];
  return tasks;
}

export function buildStage2Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s2-1", label: "Complete the claim packet thoroughly", completed: false, category: "claim-packet" },
    { id: "s2-2", label: "Create document index listing all attachments", completed: false, category: "claim-packet" },
    { id: "s2-3", label: "Attach Power of Attorney (POA) only if applicable", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-4", label: "Attach carrier-required privacy authorizations, if applicable", completed: false, category: "claim-packet", uploadRequired: true },
  ];

  if (policy.assignmentOfBenefits === "yes") {
    tasks.push({ id: "s2-5", label: "Attach signed Assignment of Benefits (AOB) form", completed: false, category: "claim-packet", uploadRequired: true });
  }

  tasks.push(
    { id: "s2-6", label: "Attach provider license", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-7", label: "Attach insurance declaration page", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-8", label: "Attach Plan of Care", completed: false, category: "claim-packet", uploadRequired: true },
    { id: "s2-9", label: "Attach all Stage 1 supporting documentation", completed: false, category: "claim-packet" },
    { id: "s2-10", label: "VERIFY: Policy number appears on EVERY page", completed: false, category: "verification", critical: true },
    { id: "s2-11", label: "SUBMIT: File claim materials promptly; preserve proof of notice and supplement documents if needed", completed: false, category: "submission", critical: true },
  );

  if (policy.thirdPartyAssessmentRequired === "yes") {
    tasks.push(
      { id: "s2-12", label: "Prepare for third-party nurse evaluation", completed: false, category: "evaluation" },
      { id: "s2-13", label: "Review ADL demonstration expectations", completed: false, category: "evaluation" },
      { id: "s2-14", label: "Review mobility demonstration expectations", completed: false, category: "evaluation" },
      { id: "s2-15", label: "Prepare for cognitive questioning (if applicable)", completed: false, category: "evaluation" },
      { id: "s2-16", label: "Understand: inconsistencies may lead to denial", completed: false, category: "evaluation", critical: true },
    );
  }

  tasks.push(
    { id: "s2-17", label: "Verify the carrier's actual review deadlines and document each status update", completed: false, category: "post-submission" },
    { id: "s2-18", label: "Review denial and appeal rights, evidence requirements and applicable deadlines", completed: false, category: "post-submission", critical: true },
  );

  return tasks;
}

export function buildStage3Tasks(policy: any): StrategyTask[] {
  const tasks: StrategyTask[] = [
    { id: "s3-1", label: "Confirm remaining elimination requirements and the insured's payment responsibilities", completed: false, category: "ongoing" },
    { id: "s3-2", label: "Organize and retain all paid invoices", completed: false, category: "ongoing" },
    { id: "s3-3", label: "Confirm care notes document minimum ADL assistance (" + (policy.minAdlsRequired || "2") + "+ ADLs)", completed: false, category: "ongoing" },
    { id: "s3-4", label: "Submit invoices and care logs per payment cycle (" + (policy.paymentCycle || "check policy") + ")", completed: false, category: "submission" },
    { id: "s3-5", label: "Ensure policy number appears on every submitted page", completed: false, category: "submission", critical: true },
  ];

  if (policy.assignmentOfBenefits === "yes") {
    tasks.push(
      { id: "s3-6", label: "Confirm accepted AOB and provider eligibility before submitting direct claims", completed: false, category: "aob-flow" },
      { id: "s3-7", label: "Track carrier direct payments only after AOB acceptance is confirmed", completed: false, category: "aob-flow" },
    );
  } else {
    tasks.push(
      { id: "s3-6", label: "Pay provider directly for services", completed: false, category: "reimbursement-flow" },
      { id: "s3-7", label: "Submit paid invoices and documentation to insurance company", completed: false, category: "reimbursement-flow" },
      { id: "s3-8", label: "Track reimbursement payments from insurance company", completed: false, category: "reimbursement-flow" },
    );
  }

  tasks.push(
    { id: "s3-9", label: "Maintain ongoing communication with case manager", completed: false, category: "ongoing" },
    { id: "s3-10", label: "Keep all records organized for potential audits", completed: false, category: "ongoing" },
  );

  return tasks;
}
