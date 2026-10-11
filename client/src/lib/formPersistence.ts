import { accountStorage } from "@/lib/accountStorage";
/**
 * Form Persistence & Zapier Integration
 * Handles saving form data to JSON format for Zapier webhook integration
 */

export interface FormData {
  // Step 0: Insured Person Information
  insuredFullName: string;
  insuredEmail: string;
  insuredPhone: string;
  insuredDob: string;
  insuredMailingAddress: string;
  insuredAddress: string;
  insuredCity: string;
  insuredState: string;
  insuredZip: string;

  powerOfAttorneyPresent: string;
  poa_name?: string;
  poa_relationship?: string;

  // Step 1: Insurance Carrier Information
  carrierName: string;
  carrierAddress1: string;
  carrierAddress2: string;
  carrierCityStateZip: string;
  carrierAddress: string;
  carrierCity: string;
  carrierState: string;
  carrierZip: string;
  carrierPhone: string;
  carrierFax: string;
  policyNumber: string;
  claimPreClaimNumber: string;

  // Step 2: Coverage Details
  eliminationPeriod: string;
  dailyMaximum: string;
  monthlyMaximum: string;
  lifetimeMaximum: string;
  minAdlsRequired: string;
  qualifyingAdls: string[];
  waiverOfPremium: string;
  cnaRequired: string;
  approvedAgencyRequired: string;
  careNotesRequired: string;
  careLogsheetsRequired: string;
  whereToGetClaimsPacket: string;
  howToSubmitClaimsPacket: string;
  invoiceReimbursementDelay: string;
  assignmentOfBenefits: string;

  // Step 3: Medical & Administrative Information
  caseManagerAssigned: string;
  caseManagerName: string;
  thirdPartyAssessmentRequired: string;
  cognitiveImpairmentTrigger: string;

  // Step 4: Care Needs & ADL Assessment
  careNeeds: string[];
  careNotes: string;
  diagnosisCheckboxes: string[];
  diagnosisNotes: string;
  preferredCareType: string;
  additionalNotes: string;
}

export interface FormSubmissionData {
  // Metadata
  submissionId: string;
  timestamp: string;
  userAgent: string;
  formVersion: string;

  // Form data
  formData: FormData;

  // Submission context
  submissionType: "auto_save" | "manual_save" | "form_complete" | "form_exit" | "page_transition";
  currentStep: number;
  completionPercentage: number;
  exitReason?: "browser_back" | "browser_close" | "navigation" | "manual_exit" | "unknown";

  // Timestamps for tracking
  formStartTime: string;
  lastModifiedTime: string;
  submissionTime: string;

  // Session info
  sessionId: string;
  deviceInfo: {
    isMobile: boolean;
    screenWidth: number;
    screenHeight: number;
  };
}

/**
 * Generate a unique submission ID
 */
export const generateSubmissionId = (): string => {
  return `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get device information
 */
export const getDeviceInfo = () => {
  return {
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  };
};

/**
 * Calculate form completion percentage
 */
export const calculateCompletionPercentage = (formData: FormData, currentStep: number): number => {
  const totalSteps = 5;
  const stepPercentage = (currentStep / totalSteps) * 100;

  // Count filled required fields
  const requiredFields = [
    formData.insuredFullName,
    formData.insuredEmail,
    formData.insuredPhone,
    formData.carrierName,
    formData.policyNumber,
    formData.eliminationPeriod,
    formData.dailyMaximum,
    formData.lifetimeMaximum,
    formData.minAdlsRequired,
    formData.waiverOfPremium,
    formData.cnaRequired,
    formData.careNotesRequired,
    formData.assignmentOfBenefits,
    formData.caseManagerAssigned,
    formData.cognitiveImpairmentTrigger,
    formData.preferredCareType,
  ];

  const filledFields = requiredFields.filter(field => field && field.trim() !== "").length;
  const fieldPercentage = (filledFields / requiredFields.length) * 100;

  // Combine step progress (70%) and field completion (30%)
  return Math.round(stepPercentage * 0.7 + fieldPercentage * 0.3);
};

/**
 * Create a formatted JSON submission object
 */
export const createFormSubmission = (
  formData: FormData,
  currentStep: number,
  submissionType: FormSubmissionData["submissionType"],
  sessionId: string,
  formStartTime: string,
  exitReason?: FormSubmissionData["exitReason"]
): FormSubmissionData => {
  const now = new Date().toISOString();

  return {
    submissionId: generateSubmissionId(),
    timestamp: now,
    userAgent: navigator.userAgent,
    formVersion: "1.0",

    formData,

    submissionType,
    currentStep,
    completionPercentage: calculateCompletionPercentage(formData, currentStep),
    exitReason,

    formStartTime,
    lastModifiedTime: now,
    submissionTime: now,

    sessionId,
    deviceInfo: getDeviceInfo(),
  };
};

/**
 * Save form data to localStorage
 */
export const saveFormToLocalStorage = (formData: FormData, sessionId: string, formStartTime: string): void => {
  const submission = createFormSubmission(
    formData,
    0, // Will be updated when actually saving
    "auto_save",
    sessionId,
    formStartTime
  );

  accountStorage.setItem("ltc_form_data", JSON.stringify(submission));
};

/**
 * Load form data from localStorage
 */
export const loadFormFromLocalStorage = (): FormSubmissionData | null => {
  const stored = accountStorage.getItem("ltc_form_data");
  return stored ? JSON.parse(stored) : null;
};

/**
 * Clear form data from localStorage
 */
export const clearFormFromLocalStorage = (): void => {
  accountStorage.removeItem("ltc_form_data");
};

/**
 * Send form data to Zapier webhook
 */
export const sendToZapier = async (submission: FormSubmissionData): Promise<boolean> => {
  const response = await fetch("/api/trpc/policyForm.sendToZapier", {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "x-ltc-request": "1" },
    body: JSON.stringify({ json: { trigger: "completed", formData: submission } }),
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result?.result?.data?.json?.success === true;
};
