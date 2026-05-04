import { Layout } from "@/components/Layout";
import { LegalDisclaimerFooter } from '@/components/LegalDisclaimerFooter';
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ClipboardList, ArrowRight, ArrowLeft, Save, Loader2, HelpCircle, Info } from "lucide-react";
import {
  generateSessionId,
  createFormSubmission,
  type FormSubmissionData,
} from "@/lib/formPersistence";
import {
  capitalizeWords,
  formatPhoneNumber as formatPhoneUtil,
  isValidPhoneNumber,
  formatDateInput as formatDateUtil,
  isValidDateFormat,
  isValidEmail,
  formatCurrency as formatCurrencyUtil,
  isValidCurrency,
  formatNumberOnly,
  isValidNumberOnly,
  formatDaysWithSuffix,
  extractDaysNumber,
  formatAddressLine,
} from "@/lib/formValidation";

const adlOptions = ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];

// Initialize session ID and form start time (outside component to persist across renders)
const SESSION_ID = generateSessionId();
const FORM_START_TIME = new Date().toISOString();

// Use formatPhoneNumber from validation utilities
const formatPhoneNumber = formatPhoneUtil;

// Use capitalizeWords from validation utilities
const capitalizeFirstLetter = capitalizeWords;

// Use formatCurrency from validation utilities
const formatCurrency = formatCurrencyUtil;
// Use formatDateInput from validation utilities
const formatDateInput = formatDateUtil;

// Helper function to convert MM/DD/YYYY to YYYY-MM-DD for storage
const convertToDateFormat = (value: string): string => {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[1]}-${match[2]}`;
  }
  return value;
};

// Convert stored YYYY-MM-DD to display MM/DD/YYYY
const getDisplayDate = (dateValue: string): string => {
  if (!dateValue) return '';
  const match = dateValue.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[2]}/${match[3]}/${match[1]}`;
  }
  return dateValue;
};

// Helper function to extract numeric value from formatted currency
const parseCurrencyToNumber = (value: string): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const tooltips: Record<string, string> = {
  // Step 0: Insured Person
  insuredFullName: "Enter the full legal name of the person who holds the LTC insurance policy. This is the person who will receive care. Use the name exactly as it appears on the policy.",
  insuredEmail: "The insured person's email address. We'll use this to send you updates, strategy recommendations, and important information about your claim. Keep it current.",
  insuredPhone: "The insured person's phone number. This is the primary contact number for the insurance company and your care team to reach you. Include the area code.",
  insuredDob: "The insured person's date of birth. This is used to verify identity with the insurance company and is required on all claim paperwork.",
  insuredMailingAddress: "The current mailing address of the insured person. The insurance company will send all correspondence, claim packets, and checks to this address. This is also where paperwork and your long-term care strategy can be mailed.",

  insuredMedicareNumber: "The insured person's Medicare ID number (found on their red, white, and blue Medicare card). Some LTC policies coordinate with Medicare, so this may be needed during the claim.",
  insuredMedicaidNumber: "The insured person's Medicaid ID number, if they are enrolled. Medicaid may be a secondary payer or become relevant if LTC benefits are exhausted.",
  powerOfAttorneyPresent: "A Power of Attorney (POA) is a legal document that lets someone make decisions on behalf of the insured. Select 'Yes' if a POA has been signed. You may need to provide a copy to the insurance company.",
  poa_name: "Enter the full name of the person designated as Power of Attorney. This person has legal authority to make decisions on behalf of the insured and will be important for your care strategy.",
  poa_relationship: "What is the Power of Attorney's relationship to the person who is insured and needs care?",
  fillerRelationship: "Select how you are related to the insured person. If you are the insured person filling this out yourself, select 'Self.' The insurance company may ask about this relationship.",

  // Step 1: Carrier Info
  carrierName: "The name of the company that issued the LTC insurance policy (e.g., Genworth, John Hancock, Mutual of Omaha). You can find this on the front page of your policy or on any premium billing statement.",
  carrierAddress1: "The mailing address of your insurance company's claims department. This is where you will send your completed claim packet. Check your policy documents or call the carrier to confirm.",
  carrierAddress2: "Use this for any additional address details like a suite number, floor, or P.O. Box. Leave blank if not applicable.",
  carrierCityStateZip: "The city, state, and ZIP code for your insurance company's claims office. You can find this on your policy declaration page or billing statements.",
  carrierPhone: "The main phone number for your insurance company's LTC claims department. This is the number you'll call to request a claims packet and ask questions about your policy.",
  carrierFax: "The fax number for your insurance company, if available. Some carriers accept claim documents by fax. Check your policy documents or ask when you call.",
  policyNumber: "Your unique LTC policy number. This is printed on your policy declaration page, premium notices, and any correspondence from the carrier. Every document you submit must include this number.",
  claimPreClaimNumber: "When you first contact the insurance company about a claim, they may assign a pre-claim or reference number before the claim is officially opened. Enter it here if you have one; otherwise leave blank.",

  // Step 2: Coverage Details
  eliminationPeriod: "The 'waiting period' before your policy starts paying — measured in days of service, not calendar days. For example, a 90-day elimination period means you must receive (and pay for) 90 days of care before benefits kick in. Check your policy's benefit summary.",
  dailyMaximum: "The most your policy will pay per day of care. For example, if your daily max is $200 and your care costs $250/day, you are responsible for the extra $50. Found on your policy's benefit summary page.",
  monthlyMaximum: "The most your policy will pay per month. Some policies use a monthly cap instead of (or in addition to) a daily cap. Check your benefit summary — if your policy only lists a daily amount, you can leave this blank.",
  lifetimeMaximum: "The total amount your policy will ever pay out over its entire lifetime. Once this amount is reached, benefits end. This is sometimes called the 'benefit pool' or 'maximum lifetime benefit.' Found on your policy summary.",
  minAdlsRequired: "ADLs (Activities of Daily Living) are basic self-care tasks: Bathing, Dressing, Eating, Toileting, Transferring, and Continence. Most policies require that 2 or 3 of these be impaired before benefits begin. Check your policy for the exact number.",
  waiverOfPremium: "If your policy includes a Waiver of Premium, you stop paying your insurance premiums once you begin receiving benefits. This saves money during care. Check your policy — not all policies include this feature.",
  cnaRequired: "Some insurance companies require that your caregiver be a Certified Nursing Assistant (CNA). If your caregiver is not a CNA and the policy requires one, the insurance company may deny payment. Check your policy or ask the carrier.",
  careNotesRequired: "Many insurance companies require daily care logs or 'logsheets' that document what care was provided, when, and by whom. These are submitted along with invoices for reimbursement. Ask your carrier about their specific requirements.",
  paymentCycle: "How often the insurance company reviews and pays claims — usually monthly. You'll submit invoices and care logs on this schedule. Ask your carrier for their preferred billing cycle.",
  assignmentOfBenefits: "With an Assignment of Benefits (AOB), the insurance company pays your care provider directly instead of sending a check to you. Without AOB, you pay the provider yourself and then submit receipts for reimbursement. AOB simplifies the process for most families.",

  // Step 3: Medical & Administrative
  caseManagerName: "The insurance company may assign a Case Manager to your claim. This person determines how many hours of care are approved and checks in periodically to review your case. Enter their name if one has been assigned.",
  thirdPartyAssessmentRequired: "Some policies require an independent nurse (RN) to visit and evaluate the insured person's condition before approving benefits. This is separate from your own doctor's evaluation. Select 'Unknown' if you're not sure.",
  thirdPartyAssessmentWho: "If a third-party assessment is required, enter the name or title of the person who will conduct it (e.g., 'RN from XYZ Assessment Services'). The insurance company will usually arrange this.",
  cognitiveImpairmentTrigger: "Some LTC policies allow benefits to begin if the insured has a cognitive impairment (such as Alzheimer's or dementia) even if they don't meet the ADL requirements. Check your policy or ask the carrier.",
  planOfCareStatus: "A Plan of Care is a document from a healthcare provider that outlines what care the insured person needs. Insurance companies typically require this before approving a claim. Select the current status.",
  ltcCoordinatorAssigned: "Some insurance companies assign an LTC Coordinator (different from a Case Manager) to help guide you through the claims process. Enter their name if one has been assigned to your case.",

  // Step 4: Care Needs & ADLs
  currentCareNeeds: "Describe what kind of help the insured person needs right now. For example: 'Needs help bathing, getting dressed, and preparing meals. Cannot be left alone due to fall risk.' Be specific — this helps build your strategy.",
  diagnosisOrCondition: "List the medical conditions or diagnoses that are causing the need for care. For example: 'Alzheimer's disease, osteoarthritis, history of falls.' Include both physical and cognitive conditions.",
  primaryDiagnosis: "Select the primary medical diagnosis driving the need for long-term care (e.g., Alzheimer's, CHF, COPD, Stroke). This helps us recommend appropriate care levels and may affect waiver of premium eligibility (e.g., hospice may waive the elimination period).",
  adlLimitations: "Activities of Daily Living (ADLs) are the basic tasks of everyday life. Check each one the insured person needs help with. Your policy requires a minimum number of ADL deficits to qualify for benefits.",
  preferredCareType: "Select the type of care the insured person prefers or is currently receiving. Home Care means a caregiver comes to the home. Assisted Living and Nursing Home are residential facilities. Your policy may cover some types but not others.",
  additionalNotes: "Use this space for anything else that might be important — special circumstances, previous claim attempts, family concerns, or questions you want addressed in your strategy. There are no wrong answers here.",
};

type FormData = {
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
  eliminationPeriod: string;
  lookBackPeriodEnabled: boolean;
  lookBackPeriodDays: string;
  careCoordinatorReductionEnabled: boolean;
  careCoordinatorReducedToDays: string;
  reductionInCareProvidedEnabled: boolean;
  reductionInCareDaysCountedAs7: string;
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
  equipmentAllowanceEnabled: boolean;
  equipmentAllowanceAmount: string;
  equipmentAllowanceCoverage: string;
  equipmentAllowanceDeductedFromLifetime: string;
  equipmentAllowanceRelatedAdls: string[];
  equipmentNeeds: string[];
  equipmentAllowanceNotes: string;
  inflationAdjustmentEnabled: boolean;
  inflationType: string;
  inflationPercentagePerYear: string;
  inflationContinuesAfterBenefits: boolean;
  caseManagerAssigned: string;
  caseManagerName: string;
  thirdPartyAssessmentRequired: string;
  cognitiveImpairmentTrigger: string;
  careNeeds: string[];
  careNotes: string;
  diagnosisCheckboxes: string[];
  diagnosisNotes: string;
  preferredCareType: string;
  additionalNotes: string;
};

const defaultForm: FormData = {
  insuredFullName: "", insuredEmail: "", insuredPhone: "", insuredDob: "", insuredMailingAddress: "",
  insuredAddress: "", insuredCity: "", insuredState: "", insuredZip: "",
  powerOfAttorneyPresent: "", poa_name: "", poa_relationship: "",
  carrierName: "", carrierAddress1: "", carrierAddress2: "", carrierCityStateZip: "",
  carrierAddress: "", carrierCity: "", carrierState: "", carrierZip: "",
  carrierPhone: "", carrierFax: "",
  policyNumber: "", claimPreClaimNumber: "",
  eliminationPeriod: "", lookBackPeriodEnabled: false, lookBackPeriodDays: "", careCoordinatorReductionEnabled: false, careCoordinatorReducedToDays: "", reductionInCareProvidedEnabled: false, reductionInCareDaysCountedAs7: "", dailyMaximum: "", monthlyMaximum: "", lifetimeMaximum: "",
  minAdlsRequired: "0", qualifyingAdls: ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"], waiverOfPremium: "", cnaRequired: "", approvedAgencyRequired: "", careNotesRequired: "", careLogsheetsRequired: "", whereToGetClaimsPacket: "", howToSubmitClaimsPacket: "", invoiceReimbursementDelay: "",
  assignmentOfBenefits: "",
  equipmentAllowanceEnabled: false, equipmentAllowanceAmount: "", equipmentAllowanceCoverage: "", equipmentAllowanceDeductedFromLifetime: "", equipmentAllowanceRelatedAdls: [], equipmentNeeds: [], equipmentAllowanceNotes: "",
  inflationAdjustmentEnabled: false, inflationType: "none", inflationPercentagePerYear: "", inflationContinuesAfterBenefits: false,
  caseManagerAssigned: "", caseManagerName: "", thirdPartyAssessmentRequired: "",
  cognitiveImpairmentTrigger: "yes",
  careNeeds: [], careNotes: "",
  diagnosisCheckboxes: [], diagnosisNotes: "",
  preferredCareType: "", additionalNotes: "",
};

const sampleForm: FormData = {
  insuredFullName: "John Smith", insuredEmail: "john@example.com", insuredPhone: "(555) 123-4567", insuredDob: "1950-06-15", insuredMailingAddress: "123 Main St, Charleston, SC 29401", insuredAddress: "123 Main St", insuredCity: "Charleston", insuredState: "SC", insuredZip: "29401",
  powerOfAttorneyPresent: "Yes", poa_name: "Jane Smith", poa_relationship: "Daughter",
  carrierName: "Genworth", carrierAddress1: "123 Insurance Blvd", carrierAddress2: "Suite 100", carrierCityStateZip: "Richmond, VA 23219", carrierAddress: "123 Insurance Blvd Suite 100", carrierCity: "Richmond", carrierState: "VA", carrierZip: "23219",
  carrierPhone: "(800) 555-1234", carrierFax: "(804) 555-5678",
  policyNumber: "POL123456", claimPreClaimNumber: "PRE789",
  eliminationPeriod: "90", lookBackPeriodEnabled: true, lookBackPeriodDays: "30", careCoordinatorReductionEnabled: false, careCoordinatorReducedToDays: "", reductionInCareProvidedEnabled: false, reductionInCareDaysCountedAs7: "", dailyMaximum: "$250.00", monthlyMaximum: "$7500.00", lifetimeMaximum: "$500000.00",
  minAdlsRequired: "2", qualifyingAdls: ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"], waiverOfPremium: "Yes", cnaRequired: "No", approvedAgencyRequired: "No", careNotesRequired: "Yes", careLogsheetsRequired: "No", whereToGetClaimsPacket: "Contact carrier", howToSubmitClaimsPacket: "Mail or fax", invoiceReimbursementDelay: "30 days",
  assignmentOfBenefits: "Yes",
  equipmentAllowanceEnabled: true, equipmentAllowanceAmount: "$100.00", equipmentAllowanceCoverage: "Annually", equipmentAllowanceDeductedFromLifetime: "No", equipmentAllowanceRelatedAdls: ["Bathing"], equipmentNeeds: ["Shower chair", "Walker"], equipmentAllowanceNotes: "Covers mobility aids",
  inflationAdjustmentEnabled: true, inflationType: "compound", inflationPercentagePerYear: "3", inflationContinuesAfterBenefits: true,
  caseManagerAssigned: "Yes", caseManagerName: "Sarah Johnson", thirdPartyAssessmentRequired: "Yes",
  cognitiveImpairmentTrigger: "Yes",
  careNeeds: ["Assistance with bathing", "Help with dressing", "Toileting assistance"], careNotes: "Needs 24/7 supervision due to fall risk",
  diagnosisCheckboxes: ["Alzheimer's Disease", "Osteoarthritis"], diagnosisNotes: "Diagnosed 2 years ago, progressive decline",
  preferredCareType: "Home Care", additionalNotes: "Prefers female caregivers",
};

function TooltipField({ label, name, children, isRequired = false }: { label: string; name: string; children: React.ReactNode; isRequired?: boolean }) {
  const tip = tooltips[name];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

// Inactivity timeout in milliseconds (15 minutes)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export default function PolicyForm() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [zapierSent, setZapierSent] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const zapierSentRef = useRef(false);

  const policyQuery = trpc.policy.get.useQuery(undefined, { enabled: true });
  const saveMutation = trpc.policy.save.useMutation({
    onError: (error) => {
      console.error("tRPC mutation error:", error);
      if ((error.data as any)?.zodError) {
        console.error("Zod validation error:", (error.data as any).zodError);
      }
    }
  });
  const sendComprehensiveZapier = trpc.policyForm.sendComprehensiveToZapier.useMutation();

  const completionPct = useMemo(() => {
    const fields = Object.entries(form).filter(([k]) => k !== "adlLimitations");
    const filled = fields.filter(([, v]) => typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : !!v);
    return Math.round((filled.length / fields.length) * 100);
  }, [form]);

  // Track whether initial load has happened
  const initialLoadDone = useRef(false);

  // Load form data from localStorage on component mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      try {
        const savedForm = localStorage.getItem('ltc_policy_form');
        const savedStep = localStorage.getItem('ltc_policy_step');
        if (savedForm) {
          setForm(JSON.parse(savedForm));
        }
        if (savedStep) {
          setStep(parseInt(savedStep, 10));
        }
      } catch (err) {
        console.error('[Form] Failed to restore from localStorage:', err);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('ltc_policy_form', JSON.stringify(form));
    } catch (err) {
      console.error('[Form] Failed to save to localStorage:', err);
    }
  }, [form]);

  // Save current step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ltc_policy_step', step.toString());
    } catch (err) {
      console.error('[Form] Failed to save step to localStorage:', err);
    }
  }, [step]);

  // Load existing policy data (only on initial load, not on refetch after save)
  useEffect(() => {
    if (policyQuery.data && policyQuery.data !== null && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const p = policyQuery.data;
      setPolicyId(p.id);
      setForm({
        insuredFullName: p.insuredFullName || "",
        insuredEmail: p.insuredEmail || "",
        insuredPhone: p.insuredPhone || "",
        insuredDob: p.insuredDob || "",
        insuredMailingAddress: p.insuredMailingAddress || "",
        insuredAddress: p.insuredAddress || "",
        insuredCity: p.insuredCity || "",
        insuredState: p.insuredState || "",
        insuredZip: p.insuredZip || "",

        powerOfAttorneyPresent: p.powerOfAttorneyPresent || "",
        poa_name: p.poa_name || "",
        poa_relationship: p.poa_relationship || "",
        carrierName: p.carrierName || "",
        carrierAddress1: p.carrierAddress1 || "",
        carrierAddress2: p.carrierAddress2 || "",
        carrierCityStateZip: p.carrierCityStateZip || "",
        carrierAddress: p.carrierAddress || "",
        carrierCity: p.carrierCity || "",
        carrierState: p.carrierState || "",
        carrierZip: p.carrierZip || "",
        carrierPhone: p.carrierPhone || "",
        carrierFax: p.carrierFax || "",
        policyNumber: p.policyNumber || "",
        claimPreClaimNumber: p.claimPreClaimNumber || "",
        eliminationPeriod: p.eliminationPeriod || "",
        lookBackPeriodEnabled: p.lookBackPeriodEnabled || false,
        lookBackPeriodDays: p.lookBackPeriodDays || "",
        careCoordinatorReductionEnabled: p.careCoordinatorReductionEnabled || false,
        careCoordinatorReducedToDays: p.careCoordinatorReducedToDays || "",
        reductionInCareProvidedEnabled: p.reductionInCareProvidedEnabled || false,
        reductionInCareDaysCountedAs7: p.reductionInCareDaysCountedAs7 || "",
        dailyMaximum: p.dailyMaximum || "",
        monthlyMaximum: p.monthlyMaximum || "",
        lifetimeMaximum: p.lifetimeMaximum || "",
        minAdlsRequired: p.minAdlsRequired || "",
        qualifyingAdls: Array.isArray(p.qualifyingAdls) ? (p.qualifyingAdls as string[]) : [],
        waiverOfPremium: p.waiverOfPremium || "",
        cnaRequired: p.cnaRequired || "",
        approvedAgencyRequired: p.approvedAgencyRequired || "",
        careNotesRequired: p.careNotesRequired || "",
        careLogsheetsRequired: p.careLogsheetsRequired || "",
        whereToGetClaimsPacket: p.whereToGetClaimsPacket || "",
        howToSubmitClaimsPacket: p.howToSubmitClaimsPacket || "",
        invoiceReimbursementDelay: p.invoiceReimbursementDelay || "",

        assignmentOfBenefits: p.assignmentOfBenefits || "",
        equipmentAllowanceEnabled: p.equipmentAllowanceEnabled || false,
        equipmentAllowanceAmount: p.equipmentAllowanceAmount || "",
        equipmentAllowanceCoverage: p.equipmentAllowanceCoverage || "",
        equipmentAllowanceDeductedFromLifetime: p.equipmentAllowanceDeductedFromLifetime || "",
        equipmentAllowanceRelatedAdls: Array.isArray(p.equipmentAllowanceRelatedAdls) ? (p.equipmentAllowanceRelatedAdls as string[]) : [],
        equipmentNeeds: Array.isArray(p.equipmentNeeds) ? (p.equipmentNeeds as string[]) : [],
        equipmentAllowanceNotes: p.equipmentAllowanceNotes || "",
        inflationAdjustmentEnabled: p.inflationAdjustmentEnabled || false,
        inflationType: p.inflationType || "none",
        inflationPercentagePerYear: p.inflationPercentagePerYear || "",
        inflationContinuesAfterBenefits: p.inflationContinuesAfterBenefits || false,
        caseManagerAssigned: p.caseManagerAssigned || "",
        caseManagerName: p.caseManagerName || "",
        thirdPartyAssessmentRequired: p.thirdPartyAssessmentRequired || "",
        cognitiveImpairmentTrigger: p.cognitiveImpairmentTrigger || "",
        careNeeds: Array.isArray(p.careNeeds) ? (p.careNeeds as string[]) : [],
        careNotes: p.careNotes || "",
        diagnosisCheckboxes: Array.isArray(p.diagnosisCheckboxes) ? (p.diagnosisCheckboxes as string[]) : [],
        diagnosisNotes: p.diagnosisNotes || "",
        preferredCareType: p.preferredCareType || "",
        additionalNotes: p.additionalNotes || "",
      });
    }
  }, [policyQuery.data]);

  // Send comprehensive data to Zapier (called once on completion, exit, or timeout)
  const sendToZapier = useCallback(async (trigger: "form_completed" | "exit" | "timeout") => {
    if (zapierSentRef.current) return; // Prevent duplicate sends
    zapierSentRef.current = true;
    setZapierSent(true);

    const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);

    try {
      await sendComprehensiveZapier.mutateAsync({
        trigger,
        currentPage: "policy-form",
        formStep: step,
        sessionDurationSeconds: sessionDuration,
        unsavedFormData: form as unknown as Record<string, any>,
      });
      console.log(`[Form] Comprehensive Zapier webhook sent (trigger: ${trigger})`);
    } catch (err) {
      console.error("[Form] Zapier send failed (non-blocking):", err);
    }
  }, [form, step, sendComprehensiveZapier]);

  // Track user activity for timeout
  useEffect(() => {
    const resetActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("click", resetActivity);
    window.addEventListener("scroll", resetActivity);

    // Check for inactivity every 60 seconds
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS && !zapierSentRef.current) {
        console.log("[Form] Inactivity timeout — sending to Zapier");
        sendToZapier("timeout");
      }
    }, 60_000);

    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("click", resetActivity);
      window.removeEventListener("scroll", resetActivity);
      clearInterval(interval);
    };
  }, [sendToZapier]);

  // Send to Zapier on page unload / navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!zapierSentRef.current) {
        zapierSentRef.current = true;
        const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);
        // Use sendBeacon for reliable delivery on page close (tRPC batch format)
        navigator.sendBeacon?.(
          "/api/trpc/policyForm.sendComprehensiveToZapier",
          new Blob(
            [JSON.stringify({ "0": { json: { trigger: "exit", currentPage: "policy-form", formStep: step, sessionDurationSeconds: sessionDuration } } })],
            { type: "application/json" }
          )
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step]);

  const update = (field: keyof FormData, value: any) => {
    lastActivityRef.current = Date.now();
    
    // Apply formatting based on field type
    
    // Phone number fields: format to (###)###-####
    if (field === 'insuredPhone' || field === 'carrierPhone' || field === 'carrierFax') {
      value = formatPhoneNumber(value);
    }
    
    // Name fields: capitalize first letter of each word
    if (field === 'insuredFullName' || field === 'carrierName' || field === 'caseManagerName' || field === 'poa_name' || field === 'poa_relationship') {
      value = capitalizeFirstLetter(value);
    }
    
    // Address fields: capitalize first letter of each word
    if (field === 'carrierAddress1' || field === 'carrierAddress2') {
      value = formatAddressLine(value);
    }
    
    // Currency fields: format to $###.##
    if (field === 'dailyMaximum' || field === 'monthlyMaximum' || field === 'lifetimeMaximum') {
      value = formatCurrency(value);
    }
    
    // Days fields with "Days" suffix
    if (field === 'lookBackPeriodDays' || field === 'careCoordinatorReducedToDays' || field === 'reductionInCareDaysCountedAs7') {
      const numOnly = formatNumberOnly(value);
      if (numOnly) {
        value = `${numOnly} Days`;
      } else {
        value = '';
      }
    }
    
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle date input with MM/DD/YYYY display format
  const handleDateChange = (displayValue: string) => {
    lastActivityRef.current = Date.now();
    const formatted = formatDateInput(displayValue);
    const dateValue = convertToDateFormat(formatted);
    setForm(prev => ({ ...prev, insuredDob: dateValue }));
  };

  // Save to database only (no validation required, no Zapier)
  const handleSave = async () => {
    setSaving(true);
    try {
      // Create and save form submission
      const submission = createFormSubmission(
        form,
        step,
        "manual_save",
        SESSION_ID,
        FORM_START_TIME
      );
      localStorage.setItem("ltc_form_current", JSON.stringify(submission));
      localStorage.setItem(`ltc_form_step_${step}`, JSON.stringify(submission));

      // Filter out fields that don't exist in the database schema
      const { poa_name, poa_relationship, ...validFormData } = form;
      
      // Also save to database
      const result = await saveMutation.mutateAsync({ ...validFormData, id: policyId || undefined });
      if (!policyId) setPolicyId(result.id);
      
      toast.success("Form saved successfully!");
      
      // Send to Zapier asynchronously (don't block on this)
      try {
        const blob = new Blob([JSON.stringify(submission, null, 2)], { type: "application/json" });
        const formData = new FormData();
        formData.append("file", blob, `ltc_form_${submission.submissionId}.json`);
        // You can send this to Zapier webhook here
      } catch (err) {
        console.error("Error preparing Zapier data:", err);
      }
    } catch (e) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Navigate to next step — save to DB silently, no validation blocking
  const handleNext = () => {
    // ADL Validation: If on step 3 (Coverage Details), check ADL requirements
    if (step === 3) {
      const minAdlsRequired = parseInt(form.minAdlsRequired || "0");
      const adlList = ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];
      
      // Get qualifying ADLs (checked in Coverage Details - Qualifying Events section)
      const qualifyingAdls = form.qualifyingAdls || [];
      
      // Get actual ADLs selected in Care Needs (Claims Info step)
      const actualAdls = form.careNeeds?.filter(need => adlList.includes(need)) || [];
      const actualAdlCount = actualAdls.length;
      
      // Check if "None - No care is needed" is selected
      const noneSelected = form.careNeeds?.includes("None") || false;
      
      // Check 1: Is there at least the minimum number of ADLs?
      // Check 2: Are all selected ADLs in the qualifying list?
      const allAdlsQualify = actualAdls.every(adl => qualifyingAdls.includes(adl));
      
      if (minAdlsRequired > 0 && (actualAdlCount < minAdlsRequired || !allAdlsQualify || noneSelected)) {
        let alertMessage = `Qualification Alert: `;
        
        if (noneSelected) {
          alertMessage += `No care services are selected. Your policy requires a minimum of ${minAdlsRequired} ADL(s) from the following list: ${qualifyingAdls.join(", ")}. You will not qualify for benefits with this level of care need.`;
        } else {
          if (actualAdlCount < minAdlsRequired) {
            alertMessage += `Your policy requires a minimum of ${minAdlsRequired} ADL(s), but only ${actualAdlCount} ADL(s) are selected. `;
          }
          
          if (!allAdlsQualify) {
            const nonQualifyingAdls = actualAdls.filter(adl => !qualifyingAdls.includes(adl));
            alertMessage += `The following ADL(s) are not covered by your policy: ${nonQualifyingAdls.join(", ")}. `;
          }
          
          alertMessage += `You will not qualify for benefits with this level of care need.`;
        }
        
        toast.error(alertMessage, { duration: 6000 });
      }
    }

    // Create and save form submission for page transition
    const { poa_name, poa_relationship, ...validFormData } = form;
    const submission = createFormSubmission(
      validFormData,
      step,
      "page_transition",
      SESSION_ID,
      FORM_START_TIME
    );
    localStorage.setItem(`ltc_form_step_${step}`, JSON.stringify(submission));
    localStorage.setItem("ltc_form_current", JSON.stringify(submission));

    // Advance step immediately (non-blocking)
    setStep(prev => prev + 1);
    // Save to DB in background (fire-and-forget)
      saveMutation.mutate({ ...form, id: policyId || undefined } as any, {
      onSuccess: (result) => {
        if (!policyId) setPolicyId(result.id);
      },
      onError: (e) => {
        console.error("Background save failed:", e);
      },
    });
  };

  // Navigate to previous step
  const handlePrev = () => {
    if (step > 0) {
      // Create and save form submission for page transition
      const submission = createFormSubmission(
        form,
        step,
        "page_transition",
        SESSION_ID,
        FORM_START_TIME
      );
      localStorage.setItem(`ltc_form_step_${step}`, JSON.stringify(submission));
      localStorage.setItem("ltc_form_current", JSON.stringify(submission));
      setStep(prev => prev - 1);
    } else {
      // Send to Zapier when navigating away from form
      sendToZapier("exit");
      navigate("/education");
    }
  };

  // Final submission — save, send to Zapier, then navigate
  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save to DB - send form data as-is (strings)
      const result = await saveMutation.mutateAsync({ ...form, id: policyId || undefined });
      if (!policyId) setPolicyId(result.id);

      // Send comprehensive data to Zapier
      await sendToZapier("form_completed");

      toast.success("Form submitted successfully!");
      navigate("/strategy");
    } catch (e) {
      console.error("Save error:", e);
      if (e instanceof Error) {
        console.error("Error message:", e.message);
        console.error("Error stack:", e.stack);
      }
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: "Insured Person", icon: "👤" },
    { title: "LTC Ins Company", icon: "🏢" },
    { title: "Policy Info", icon: "📄" },
    { title: "Coverage Details", icon: "📋" },
    { title: "Claims Info", icon: "📞" },
    { title: "Qualifying", icon: "✓" },
    { title: "Review & Submit", icon: "✅" },
  ];

  return (
    <Layout>
      {/* Hero Section with Nested Video */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/TlLdtWuMnzKTLvjM.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a4a]/85 via-[#1a3a4a]/70 to-[#1a2a3a]/50" />
        </div>
        <div className="container relative py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
                <ClipboardList className="w-4 h-4" /> POLICY INTAKE FORM
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4 leading-tight">Tell Us About Your <span className="text-teal">Policy</span></h1>
              <p className="text-slate-300 max-w-lg text-base leading-relaxed">Complete this form to receive a personalized strategy for filing your long-term care insurance claim. All information is securely stored and can be edited at any time.</p>
            </div>
            <div className="hidden lg:block">
              <VideoPlaceholder title="How to Complete the Policy Form" description="Watch this guide to understand what information you'll need and how to find it in your policy documents" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/prngCKWDVnvVgXBI.jpg" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/UZLuXdBXwBOgyGSg.mp4" />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile video */}
      <section className="lg:hidden py-8 bg-secondary">
        <div className="container">
          <VideoPlaceholder title="How to Complete the Policy Form" description="Watch this guide to understand what information you'll need and how to find it in your policy documents" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/prngCKWDVnvVgXBI.jpg" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/UZLuXdBXwBOgyGSg.mp4" />
        </div>
      </section>

      {/* Form */}
      <section className="py-10 bg-white">
        <div className="container max-w-4xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Step {step + 1} of {steps.length}</span>
              <span className="text-sm font-medium text-teal">{completionPct}% Complete</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-teal h-2 rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-3">
              {steps.map((s, i) => (
                <button key={i} onClick={() => setStep(i)} className={`text-xs text-center flex-1 px-1 ${i === step ? "text-teal font-semibold" : i < step ? "text-green-600" : "text-slate-400"}`}>
                  <span className="block text-lg mb-0.5">{s.icon}</span>
                  <span className="hidden sm:block">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 0: Insured Person */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Insured Person Information</h2>
              <p className="text-sm text-slate-600">Enter the details of the person covered by the LTC insurance policy.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Full Name of Insured" name="insuredFullName" isRequired>
                  <Input id="insuredFullName" value={form.insuredFullName} onChange={e => update("insuredFullName", e.target.value)} placeholder="Enter full legal name" />
                </TooltipField>
                <TooltipField label="Date of Birth" name="insuredDob">
                  <Input id="insuredDob" type="text" value={getDisplayDate(form.insuredDob)} onChange={e => handleDateChange(e.target.value)} placeholder="MM/DD/YYYY" pattern="\d{2}/\d{2}/\d{4}" title="Please enter date in format MM/DD/YYYY" maxLength={10} />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Email Address" name="insuredEmail" isRequired>
                  <Input id="insuredEmail" type="email" value={form.insuredEmail} onChange={e => update("insuredEmail", e.target.value)} placeholder="your.email@example.com" title="Please enter a valid email address" />
                </TooltipField>
                <TooltipField label="Phone Number" name="insuredPhone" isRequired>
                  <Input id="insuredPhone" type="tel" value={form.insuredPhone} onChange={e => update("insuredPhone", e.target.value)} placeholder="(000) 000-0000" pattern="\\(\\d{3}\\)\\d{3}-\\d{4}" title="Please enter a valid phone number in format (000) 000-0000" />
                </TooltipField>
              </div>
              <TooltipField label="Mailing Address" name="insuredMailingAddress">
                <Input id="insuredAddress" value={form.insuredAddress} onChange={e => update("insuredAddress", e.target.value)} placeholder="Street address" />
              </TooltipField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TooltipField label="City" name="insuredCity">
                  <Input id="insuredCity" value={form.insuredCity} onChange={e => update("insuredCity", e.target.value)} placeholder="City" />
                </TooltipField>
                <TooltipField label="State" name="insuredState">
                  <Input id="insuredState" value={form.insuredState} onChange={e => update("insuredState", e.target.value.toUpperCase())} placeholder="ST" maxLength={2} />
                </TooltipField>
                <TooltipField label="Zip Code" name="insuredZip">
                  <Input id="insuredZip" value={form.insuredZip} onChange={e => update("insuredZip", e.target.value)} placeholder="00000" />
                </TooltipField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <TooltipField label="Power of Attorney Present?" name="powerOfAttorneyPresent">
                  <Select value={form.powerOfAttorneyPresent || "no"} onValueChange={v => update("powerOfAttorneyPresent", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                {form.powerOfAttorneyPresent === "yes" && (
                  <>
                    <TooltipField label="POA Name" name="poa_name">
                      <Input id="poa_name" value={form.poa_name} onChange={e => update("poa_name", e.target.value)} placeholder="Full name" />
                    </TooltipField>
                    <TooltipField label="POA Relationship" name="poa_relationship">
                      <Input id="poa_relationship" value={form.poa_relationship} onChange={e => update("poa_relationship", e.target.value)} placeholder="e.g., Spouse, Child" />
                    </TooltipField>
                  </>
                )}
              </div>

            </div>
          )}

          {/* Step 1: LTC Ins Company */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Long Term Care Insurance Company</h2>
              <p className="text-sm text-slate-600">Enter the details of your LTC insurance carrier. This information can be found on your policy declaration page.</p>
              <TooltipField label="LTC Insurance Company Name" name="carrierName" isRequired>
                <Input id="carrierName" value={form.carrierName} onChange={e => update("carrierName", e.target.value)} placeholder="e.g., Genworth, John Hancock, Mutual of Omaha" />
              </TooltipField>
              <TooltipField label="Address" name="carrierAddress">
                <Input id="carrierAddress" value={form.carrierAddress} onChange={e => update("carrierAddress", e.target.value)} placeholder="Street address" />
              </TooltipField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TooltipField label="City" name="carrierCity">
                  <Input id="carrierCity" value={form.carrierCity} onChange={e => update("carrierCity", e.target.value)} placeholder="City" />
                </TooltipField>
                <TooltipField label="State" name="carrierState">
                  <Input id="carrierState" value={form.carrierState} onChange={e => update("carrierState", e.target.value.toUpperCase())} placeholder="ST" maxLength={2} />
                </TooltipField>
                <TooltipField label="Zip Code" name="carrierZip">
                  <Input id="carrierZip" value={form.carrierZip} onChange={e => update("carrierZip", e.target.value)} placeholder="00000" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="LTC Claims Dept. Phone Number" name="carrierPhone">
                  <Input id="carrierPhone" value={form.carrierPhone} onChange={e => update("carrierPhone", e.target.value)} placeholder="(000) 000-0000" />
                </TooltipField>
                <TooltipField label="LTC Claims Dept Fax Number" name="carrierFax">
                  <Input id="carrierFax" value={form.carrierFax} onChange={e => update("carrierFax", e.target.value)} placeholder="(000) 000-0000" />
                </TooltipField>
              </div>
            </div>
          )}

          {/* Step 2: Policy Info */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Policy Info</h2>
              <p className="text-sm text-slate-600">Enter your policy identification and case management information.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Policy Number" name="policyNumber" isRequired>
                  <Input id="policyNumber" value={form.policyNumber} onChange={e => update("policyNumber", e.target.value)} placeholder="Your policy number" />
                </TooltipField>
                <TooltipField label="Claim / Pre-Claim Number" name="claimPreClaimNumber">
                  <Input id="claimPreClaimNumber" value={form.claimPreClaimNumber} onChange={e => update("claimPreClaimNumber", e.target.value)} placeholder="If already assigned" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Case Manager Assigned?" name="caseManagerAssigned">
                  <Select value={form.caseManagerAssigned || "no"} onValueChange={v => update("caseManagerAssigned", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                {form.caseManagerAssigned === "yes" && (
                  <TooltipField label="Case Manager Name" name="caseManagerName">
                    <Input id="caseManagerName" value={form.caseManagerName} onChange={e => update("caseManagerName", e.target.value)} placeholder="Enter case manager name" />
                  </TooltipField>
                )}
              </div>

            </div>
          )}

          {/* Step 3: Coverage Details */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Coverage Details</h2>
              <p className="text-sm text-slate-600">Enter the coverage details from your LTC insurance policy. These are critical for generating your personalized strategy.</p>
              <div className="bg-teal/10 border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <TooltipField label="Daily Maximum" name="dailyMaximum" isRequired>
                    <Input id="dailyMaximum" type="text" value={form.dailyMaximum} onChange={e => update("dailyMaximum", formatCurrency(e.target.value))} placeholder="$0.00" className="bg-white" />
                  </TooltipField>
                  <TooltipField label="Monthly Maximum" name="monthlyMaximum">
                    <Input id="monthlyMaximum" type="text" value={form.monthlyMaximum || ''} onChange={e => update("monthlyMaximum", formatCurrency(e.target.value))} placeholder="$0.00" className="bg-white" />
                  </TooltipField>
                  <TooltipField label="Lifetime Maximum" name="lifetimeMaximum" isRequired>
                    <Input id="lifetimeMaximum" type="text" value={form.lifetimeMaximum} onChange={e => update("lifetimeMaximum", formatCurrency(e.target.value))} placeholder="$0.00" className="bg-white" />
                  </TooltipField>
                </div>
                <div className="border-t border-gray-300 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Elimination Period Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <TooltipField label="Elimination Period" name="eliminationPeriod" isRequired>
                      <Input id="eliminationPeriod" type="number" min="0" max="999" value={form.eliminationPeriod} onChange={e => {
                        const val = e.target.value;
                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 999)) {
                          update("eliminationPeriod", val);
                        }
                      }} placeholder="0-999" className="bg-white" />
                    </TooltipField>
                    {form.eliminationPeriod && (
                      <>
                        <TooltipField label="Lookback Period" name="lookBackPeriodDays">
                          <Input id="lookBackPeriodDays" type="text" value={form.lookBackPeriodDays} onChange={e => update("lookBackPeriodDays", e.target.value)} placeholder="### Days" className="bg-white" />
                        </TooltipField>
                        <TooltipField label="Coordinator Reduction" name="careCoordinatorReducedToDays">
                          <Input id="careCoordinatorReducedToDays" type="text" value={form.careCoordinatorReducedToDays} onChange={e => update("careCoordinatorReducedToDays", e.target.value)} placeholder="### Days" className="bg-white" />
                        </TooltipField>
                        <TooltipField label="Count Days/Wk as 7" name="reductionInCareDaysCountedAs7">
                          <Input id="reductionInCareDaysCountedAs7" type="text" value={form.reductionInCareDaysCountedAs7} onChange={e => update("reductionInCareDaysCountedAs7", e.target.value)} placeholder="### Days" className="bg-white" />
                        </TooltipField>
                      </>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TooltipField label="Waiver of Premium on Policy" name="waiverOfPremium" isRequired>
                      <Select value={form.waiverOfPremium || "no"} onValueChange={v => update("waiverOfPremium", v)}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                      </Select>
                    </TooltipField>
                    <TooltipField label="Assignment of Benefits (AOB) Available?" name="assignmentOfBenefits" isRequired>
                      <Select value={form.assignmentOfBenefits || "no"} onValueChange={v => update("assignmentOfBenefits", v)}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </TooltipField>
                  </div>
                  {form.assignmentOfBenefits && (
                    <div className={`p-3 rounded-lg text-sm mt-4 ${form.assignmentOfBenefits === "yes" ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
                      <Info className="w-4 h-4 inline mr-1" />
                      {form.assignmentOfBenefits === "yes"
                        ? "With AOB, your care provider will submit claims and receive payment directly from the insurance company."
                        : "Without AOB, you will pay your provider directly and then submit documentation to the insurance company for reimbursement."}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Qualifying Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <TooltipField label="Min # ADLs Compromised Required" name="minAdlsRequired" isRequired>
                    <Select value={form.minAdlsRequired || "0"} onValueChange={v => update("minAdlsRequired", v)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="0">0 (No ADL requirement)</SelectItem><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
                    </Select>
                  </TooltipField>
                </div>
                {parseInt(form.minAdlsRequired || "0") > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Label className="text-sm font-medium text-slate-700">Which ADLs qualify as valid triggers for this policy?</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">Select which of the 6 standard ADLs your policy recognizes as valid triggers for initiating a claim.</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {adlOptions.map(adl => {
                      const qualifyingAdls = form.qualifyingAdls || [];
                      return (
                        <label key={adl} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${qualifyingAdls.includes(adl) ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                          <Checkbox checked={qualifyingAdls.includes(adl)} onCheckedChange={checked => {
                            update("qualifyingAdls", checked ? [...qualifyingAdls, adl] : qualifyingAdls.filter(a => a !== adl));
                          }} />
                          <span className="text-sm font-medium">{adl}</span>
                        </label>
                      );
                    })}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 mt-6">
                  <TooltipField label="Is a diagnosis of Cognitive Impairment able to initiate a claim?" name="cognitiveImpairmentTrigger" isRequired>
                    <Select value={form.cognitiveImpairmentTrigger || "yes"} onValueChange={v => update("cognitiveImpairmentTrigger", v)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TooltipField>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Home Care Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <TooltipField label="Home Care Covered?" name="inHomeCoverageEnabled">
                    <Select value={form.equipmentAllowanceEnabled === true ? "yes" : form.equipmentAllowanceEnabled === false ? "no" : ""} onValueChange={v => update("equipmentAllowanceEnabled", v === "yes" ? true : v === "no" ? false : false)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TooltipField>
                  {form.equipmentAllowanceEnabled === true && (
                    <>
                      <TooltipField label="CNA Required?" name="cnaRequired">
                        <Select value={form.cnaRequired || "no"} onValueChange={v => update("cnaRequired", v)}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                        </Select>
                      </TooltipField>
                      <TooltipField label="Care Notes Required?" name="careNotesRequired" isRequired>
                        <Select value={form.careNotesRequired || "no"} onValueChange={v => update("careNotesRequired", v)}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                        </Select>
                      </TooltipField>
                      <TooltipField label="RN Assessment?" name="thirdPartyAssessmentRequired">
                        <Select value={form.thirdPartyAssessmentRequired || "no"} onValueChange={v => update("thirdPartyAssessmentRequired", v)}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                        </Select>
                      </TooltipField>
                    </>
                  )}
                </div>
                {form.equipmentAllowanceEnabled === true && form.thirdPartyAssessmentRequired === "yes" && (
                  <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Third-Party Assessment Notice</h4>
                    <p className="text-sm text-red-700">Your policy requires a third-party assessment. An independent RN will evaluate the insured's condition, ADL deficits, mobility, and cognitive function. <strong>Any inconsistencies between your documentation and the assessment may lead to denial.</strong> Your strategy will include detailed preparation guidance.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Qualifying */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Care Needs & ADL Assessment</h2>
              <p className="text-sm text-slate-600">Describe the current care needs and identify which Activities of Daily Living (ADLs) are compromised.</p>
              
              {/* Care Needs Checkboxes */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Label className="text-sm font-medium text-slate-700">What care services are needed? (Select all that apply)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">Select all home care services needed by the insured, including both ADLs (personal care) and IADLs (household/management tasks).</TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { category: "ADLs", items: ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"] },
                    { category: "IADLs", items: ["Meal Preparation", "Medication Management", "Housekeeping/Cleaning", "Laundry", "Shopping/Errands", "Transportation", "Money Management", "Telephone Use"] }
                  ].flatMap(group => group.items).map(service => {
                    const careNeeds = form.careNeeds || [];
                    return (
                      <label key={service} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${careNeeds.includes(service) ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <Checkbox checked={careNeeds.includes(service)} onCheckedChange={checked => {
                          update("careNeeds", checked ? [...careNeeds, service] : careNeeds.filter(s => s !== service));
                        }} />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    );
                  })}
                  {(() => {
                    const careNeeds = form.careNeeds || [];
                    return (
                      <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${careNeeds.includes("None") ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <Checkbox checked={careNeeds.includes("None")} onCheckedChange={checked => {
                          update("careNeeds", checked ? ["None"] : []);
                        }} />
                        <span className="text-sm font-medium">None - No care is needed</span>
                      </label>
                    );
                  })()}
                </div>
              </div>
              
              {(() => {
                const minAdlsRequired = parseInt(form.minAdlsRequired || "0");
                const qualifyingAdls = form.qualifyingAdls || [];
                const adlList = ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];
                const actualAdls = form.careNeeds?.filter(need => adlList.includes(need)) || [];
                const actualAdlCount = actualAdls.length;
                const noneSelected = form.careNeeds?.includes("None") || false;
                const allAdlsQualify = actualAdls.every(adl => qualifyingAdls.includes(adl));
                
                const qualificationMet = minAdlsRequired > 0 && actualAdlCount >= minAdlsRequired && allAdlsQualify && !noneSelected;
                
                if (!qualificationMet && minAdlsRequired > 0) {
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">ADL Qualification Alert</h4>
                      <p className="text-sm text-red-700 mb-2">
                        Your policy requires a minimum of <strong>{minAdlsRequired} ADL(s)</strong> from the following list to qualify for benefits:
                      </p>
                      <p className="text-sm text-red-700 mb-3">
                        <strong>{qualifyingAdls.join(", ")}</strong>
                      </p>
                      {noneSelected && (
                        <p className="text-sm text-red-700">Currently: No care services are selected. Please select at least {minAdlsRequired} ADL(s) from the qualifying list above.</p>
                      )}
                      {!noneSelected && actualAdlCount < minAdlsRequired && (
                        <p className="text-sm text-red-700">Currently: {actualAdlCount} ADL(s) selected. You need at least {minAdlsRequired} ADL(s) to qualify.</p>
                      )}
                      {!noneSelected && actualAdlCount >= minAdlsRequired && !allAdlsQualify && (
                        <p className="text-sm text-red-700">Currently: {actualAdlCount} ADL(s) selected, but some are not on the qualifying list. Please select only ADLs from the list above.</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
              
              <TooltipField label="Care Notes" name="careNotes">
                <Textarea id="careNotes" value={form.careNotes} onChange={e => update("careNotes", e.target.value)} placeholder="Any additional notes about the care services selected..." rows={3} />
              </TooltipField>
              
              {/* Diagnosis Checkboxes */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Label className="text-sm font-medium text-slate-700">What is the primary diagnosis or condition? (Select all that apply)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">Select the primary medical diagnosis or condition(s) that necessitate long-term care.</TooltipContent>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Arthritis", "Congestive Heart Failure (CHF)", "Heart Disease", "Diabetes", "Alzheimer's Disease", "Dementia", "COPD", "Stroke", "Cancer", "Parkinson's Disease", "Pneumonia", "Kidney Disease", "Liver Disease", "Osteoporosis", "Hypertension", "Other"].map(diagnosis => {
                    const diagnosisCheckboxes = form.diagnosisCheckboxes || [];
                    return (
                      <label key={diagnosis} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosisCheckboxes.includes(diagnosis) ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <Checkbox checked={diagnosisCheckboxes.includes(diagnosis)} onCheckedChange={checked => {
                          update("diagnosisCheckboxes", checked ? [...diagnosisCheckboxes, diagnosis] : diagnosisCheckboxes.filter(d => d !== diagnosis));
                        }} />
                        <span className="text-sm font-medium">{diagnosis}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <TooltipField label="Diagnosis Notes" name="diagnosisNotes">
                <Textarea id="diagnosisNotes" value={form.diagnosisNotes} onChange={e => update("diagnosisNotes", e.target.value)} placeholder="Additional details about the diagnosis, conditions, or cognitive impairments..." rows={3} />
              </TooltipField>
              <TooltipField label="Is Home Care covered in my policy?" name="preferredCareType" isRequired>
                <Select value={form.preferredCareType || "no"} onValueChange={v => update("preferredCareType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipField>
              <TooltipField label="Additional Notes" name="additionalNotes">
                <Textarea id="additionalNotes" value={form.additionalNotes} onChange={e => update("additionalNotes", e.target.value)} placeholder="Any additional information that may be relevant..." rows={3} />
              </TooltipField>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Review Your Information</h2>
              <p className="text-sm text-slate-600">Review the information below. You can go back to any step to make changes. Once you're satisfied, save and proceed to generate your personalized strategy.</p>
              <div className="grid gap-4">
                {[
                  { title: "Insured Person", items: [["Name", form.insuredFullName], ["DOB", form.insuredDob], ["Address", form.insuredMailingAddress], ["POA", form.powerOfAttorneyPresent], ["POA Name", form.poa_name], ["POA Relationship", form.poa_relationship]] },
                  { title: "Carrier", items: [["Carrier", form.carrierName], ["Phone", form.carrierPhone], ["Policy #", form.policyNumber], ["Claim #", form.claimPreClaimNumber]] },
                  { title: "Coverage", items: [["Elimination Period", form.eliminationPeriod], ["Daily Max", form.dailyMaximum], ["Monthly Max", form.monthlyMaximum], ["Lifetime Max", form.lifetimeMaximum], ["Min ADLs", form.minAdlsRequired], ["AOB", form.assignmentOfBenefits], ["Waiver of Premium", form.waiverOfPremium]] },
                  { title: "Medical", items: [["Case Manager", form.caseManagerAssigned], ["Case Manager Name", form.caseManagerName], ["3rd Party Assessment", form.thirdPartyAssessmentRequired], ["Cognitive Impairment Trigger", form.cognitiveImpairmentTrigger]] },
                  { title: "Care Needs", items: [["Care Services", (form.careNeeds || []).join(", ") || "None selected"], ["Diagnosis", (form.diagnosisCheckboxes || []).join(", ") || "None selected"], ["Home Care Covered", form.preferredCareType]] },
                ].map(section => (
                  <div key={section.title} className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">{section.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {section.items.map(([label, value]) => {
                        // Display values as-is (monetary fields already formatted with $)
                        let displayValue = (value as string) || "—";
                        return (
                          <div key={label as string}><span className="text-slate-500">{label}:</span> <span className="font-medium text-slate-700">{displayValue}</span></div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrev} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> {step > 0 ? "Previous" : "Education"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setForm(sampleForm);
                  localStorage.setItem('ltc_policy_form', JSON.stringify(sampleForm));
                  toast.success('Sample data loaded. You can now test the form.');
                }} 
                className="gap-1 text-blue-600 hover:text-blue-700"
              >
                Fill Sample Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
                    localStorage.removeItem('ltc_policy_form');
                    localStorage.removeItem('ltc_calculator_state');
                    toast.success('All data cleared. Form reset.');
                    window.location.href = '/policy-form';
                  }
                }} 
                className="gap-1 text-destructive hover:text-destructive"
              >
                Clear All Data
              </Button>
            </div>
            <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Progress
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="gap-1">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={saving} className="gap-1 bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate Strategy <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* About Home Care */}
      <AboutHomeCare />
          <LegalDisclaimerFooter />
    </Layout>
  );
}
