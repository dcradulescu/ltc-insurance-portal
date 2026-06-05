import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ClipboardList, ArrowRight, ArrowLeft, Save, Loader2, HelpCircle, Info, PlayCircle, Mail, Sparkles, FileCheck, Map, Download, MessageCircle } from "lucide-react";
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
  insuredFullName: "Enter the full legal name of the person who holds the LTC insurance policy — the person who will receive care. Use the name exactly as it appears on the policy declaration page.",
  insuredEmail: "The insured person's email address. Used to send strategy recommendations and important claim updates. Make sure it is current and checked regularly.",
  insuredPhone: "The insured person's primary phone number including area code, in the format (000) 000-0000. This is the number the insurance company and care team will use to reach you.",
  insuredDob: "The insured person's date of birth in MM/DD/YYYY format. Required on all claim paperwork and used by the insurance company to verify identity.",
  insuredMailingAddress: "The current street address of the insured person. The insurance company will mail all correspondence, claim packets, and reimbursement checks to this address.",
  insuredCity: "The city portion of the insured person's mailing address.",
  insuredState: "The two-letter state abbreviation for the insured person's mailing address (e.g., SC, NC, GA).",
  insuredZip: "The five-digit ZIP code for the insured person's mailing address.",
  powerOfAttorneyPresent: "A Power of Attorney (POA) is a legal document authorizing someone to make decisions on behalf of the insured. Select 'Yes' if a POA has been signed and executed. The insurance company will likely require a copy before speaking with anyone other than the insured.",
  poa_name: "The full legal name of the person designated as Power of Attorney. This person has legal authority to act on behalf of the insured and will be a key contact throughout the claims process.",
  poa_relationship: "The relationship of the Power of Attorney to the insured person (e.g., Spouse, Daughter, Son, Attorney). The insurance company may ask for this information when verifying authority.",

  // Step 1: Carrier Info
  carrierName: "The full name of the insurance company that issued the LTC policy (e.g., Genworth, John Hancock, Mutual of Omaha, Transamerica). Found on the front page of your policy or any premium billing statement.",
  carrierAddress: "The mailing address of the insurance company's LTC claims department. This is where you will send your completed claim packet. If unsure, call the carrier's claims line to confirm the correct address.",
  carrierCity: "The city for the insurance company's claims department mailing address.",
  carrierState: "The two-letter state abbreviation for the insurance company's claims department address.",
  carrierZip: "The ZIP code for the insurance company's claims department mailing address.",
  carrierPhone: "The direct phone number for the insurance company's LTC claims department. This is the number to call when requesting a claims packet, asking about policy provisions, or checking claim status.",
  carrierFax: "The fax number for the insurance company's claims department, if available. Some carriers still accept claim documents by fax. Confirm with the carrier whether fax submissions are accepted.",

  // Step 2: Policy Info
  policyNumber: "Your unique LTC policy identification number. Found on the policy declaration page, premium billing notices, and all carrier correspondence. This number must appear on every document you submit to the insurance company.",
  claimPreClaimNumber: "When you first contact the insurance company to report a potential claim, they may assign a pre-claim or reference number before the claim is officially opened. Enter it here if one has been provided; otherwise leave blank.",
  caseManagerAssigned: "Insurance companies often assign a Case Manager once a claim is opened. This person is the insured's primary contact at the carrier, determines approved hours of care, and periodically reviews the case. Select 'Yes' if one has been assigned.",
  caseManagerName: "The full name of the Case Manager assigned by the insurance company. Having their name makes it easier to reach the right person when calling about your claim status or care approvals.",

  // Step 3: Coverage Details — Financial Benefits
  dailyMaximum: "The maximum dollar amount your policy will pay per day of covered care. If your daily care cost exceeds this amount, you are responsible for the difference. Found on the policy's benefit summary or declaration page.",
  monthlyMaximum: "The maximum dollar amount your policy will pay per month. Some policies use a monthly cap instead of or in addition to a daily cap. If your policy only shows a daily maximum, you may leave this blank.",
  lifetimeMaximum: "The total dollar amount your policy will pay over its entire lifetime — sometimes called the 'benefit pool' or 'maximum lifetime benefit.' Once this amount is exhausted, no further benefits are payable. Found on your policy summary page.",

  // Step 3: Elimination Period
  eliminationPeriod: "The elimination period is the 'waiting period' before your policy begins paying benefits — measured in days of qualifying care received, not calendar days. For example, a 90-day elimination period means you must personally pay for 90 days of covered care before the insurance company starts reimbursing. Found on your policy's benefit summary.",
  lookBackPeriodDays: "Some policies allow care days received within a set window before the formal claim start date to count toward satisfying the elimination period. For example, a 30-day lookback means care provided in the 30 days before the claim was filed may count. Check your policy or ask the carrier.",
  careCoordinatorReducedToDays: "Some policies allow the insurance company's care coordinator to reduce the number of days that count toward the elimination period. For example, if the coordinator determines the insured only needed care 3 days per week, the elimination period effectively takes longer to satisfy. Enter the reduced day count if this provision applies.",
  reductionInCareDaysCountedAs7: "Some policies include a provision that counts any week in which care was received — even if only a few days — as a full 7-day week for elimination period purposes. This can significantly shorten the time to satisfy the elimination period. Enter the minimum days per week required to trigger this provision.",

  // Step 3: Policy Features
  waiverOfPremium: "If your policy includes a Waiver of Premium, your monthly insurance premium payments are suspended once you begin receiving benefits. This can save hundreds of dollars per month during care. Not all policies include this feature — check your policy or ask the carrier.",
  assignmentOfBenefits: "Assignment of Benefits (AOB) allows the insurance company to pay your care provider directly, rather than reimbursing you after the fact. Without AOB, you pay the provider out of pocket and then submit receipts for reimbursement. AOB is simpler for most families and reduces cash flow burden.",

  // Step 3: Qualifying Events
  minAdlsRequired: "Activities of Daily Living (ADLs) are the six basic self-care tasks: Bathing, Dressing, Eating/Feeding, Toileting, Transferring, and Continence. Most LTC policies require that the insured be unable to perform 2 or 3 of these without assistance before benefits begin. Check your policy's benefit trigger section for the exact number.",
  cognitiveImpairmentTrigger: "Many LTC policies allow benefits to begin based on a diagnosis of cognitive impairment (such as Alzheimer's disease or dementia) even if the insured does not meet the ADL requirement. This is a separate qualifying trigger. Check your policy's benefit trigger section or ask the carrier.",

  // Step 3: Home Care Requirements
  inHomeCoverageEnabled: "Indicates whether your LTC policy covers care provided in the insured person's home by a paid caregiver. Some policies only cover facility-based care (nursing home or assisted living). Check your policy's covered services section.",
  cnaRequired: "Some insurance companies require that the home caregiver hold a Certified Nursing Assistant (CNA) credential. If your caregiver is not a CNA and the policy requires one, claims may be denied. Check your policy or ask the carrier before hiring a caregiver.",
  careNotesRequired: "Many insurance companies require that caregivers maintain daily care logs or 'logsheets' documenting what care was provided, when, and for how long. These logs are submitted with invoices as proof of service. Confirm the carrier's specific format and submission requirements.",
  thirdPartyAssessmentRequired: "Some policies require an independent Registered Nurse (RN) — arranged by the insurance company — to visit and evaluate the insured's condition, ADL deficits, and cognitive status before approving benefits. This assessment is separate from your own physician's evaluation. Any inconsistencies between your documentation and the RN's findings can lead to a claim denial.",
  approvedAgencyRequired: "Some insurance companies require that home care be provided through an agency they have pre-approved or that holds a specific state license. Independent or private-pay caregivers may not qualify. Check your policy or ask the carrier whether agency affiliation is required before hiring.",

  // Step 4: Care Needs
  careNeeds: "Select all care services the insured person currently needs. ADLs (Bathing, Dressing, Eating, Toileting, Transferring, Continence) are the six basic personal care tasks that most policies use as benefit triggers. IADLs (Meal Preparation, Medication Management, Housekeeping, etc.) are household and management tasks — important for care planning but generally not counted toward ADL qualification requirements.",
  careNotes: "Use this space to describe the care situation in more detail. For example: 'Needs hands-on assistance with bathing and dressing every morning. Cannot be left alone due to fall risk. Requires medication reminders three times daily.' The more specific you are, the more tailored your strategy will be.",
  diagnosisCheckboxes: "Select all medical diagnoses or conditions that are contributing to the insured person's need for care. Include both physical and cognitive conditions. This information helps build your strategy and may affect benefit trigger eligibility — for example, Alzheimer's or dementia may qualify as a cognitive impairment trigger even without meeting the ADL requirement.",
  diagnosisNotes: "Provide any additional detail about the diagnosis, progression, or treatment. For example: 'Diagnosed with Alzheimer's in 2022, currently in moderate stage. Also has Type 2 diabetes managed with insulin.' This context helps tailor your claim strategy.",
  preferredCareType: "Indicates whether the insured person's LTC policy covers care provided at home by a paid caregiver. Some policies only cover facility-based care (nursing home or assisted living). If 'No,' home care costs will not be reimbursed and a facility placement strategy may be needed.",
  additionalNotes: "Use this space for anything else that may be relevant — special family circumstances, previous claim attempts, caregiver preferences, or questions you want addressed in your strategy. There are no wrong answers here.",

  // Legacy / unused keys kept for backward compatibility
  insuredMedicareNumber: "The insured person's Medicare ID number (found on their red, white, and blue Medicare card). Some LTC policies coordinate with Medicare, so this may be needed during the claim.",
  insuredMedicaidNumber: "The insured person's Medicaid ID number, if enrolled. Medicaid may become relevant if LTC benefits are exhausted.",
  fillerRelationship: "Select how you are related to the insured person. If you are the insured person filling this out yourself, select 'Self.'",
  carrierAddress1: "The mailing address of your insurance company's claims department.",
  carrierAddress2: "Suite number, floor, or P.O. Box if applicable.",
  carrierCityStateZip: "City, state, and ZIP code for the insurance company's claims office.",
  paymentCycle: "How often the insurance company reviews and pays claims — usually monthly.",
  thirdPartyAssessmentWho: "The name or title of the person conducting the third-party assessment.",
  planOfCareStatus: "A Plan of Care outlines what care the insured person needs. Insurance companies typically require this before approving a claim.",
  ltcCoordinatorAssigned: "Some insurance companies assign an LTC Coordinator to help guide you through the claims process.",
  currentCareNeeds: "Describe what kind of help the insured person needs right now.",
  diagnosisOrCondition: "List the medical conditions or diagnoses causing the need for care.",
  primaryDiagnosis: "The primary medical diagnosis driving the need for long-term care.",
  adlLimitations: "Check each ADL the insured person needs help with.",
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
  careNeeds: ["Bathing", "Dressing", "Toileting"], careNotes: "Needs 24/7 supervision due to fall risk",
  diagnosisCheckboxes: ["Alzheimer's Disease", "Osteoarthritis"], diagnosisNotes: "Diagnosed 2 years ago, progressive decline",
  preferredCareType: "Home Care", additionalNotes: "Prefers female caregivers",
};

function TooltipField({ label, name, children, isRequired = false, videoUrl }: { label: string; name: string; children: React.ReactNode; isRequired?: boolean; videoUrl?: string }) {
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
        {tip && (
          videoUrl ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 hover:text-teal-600 transition-colors"
              title="Watch a video explanation"
            >
              <PlayCircle className="w-3.5 h-3.5 text-teal-400 cursor-pointer hover:text-teal-600" />
            </a>
          ) : (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50 hover:text-teal-600 transition-colors"
              title="Video explanation coming soon"
              onClick={() => toast.info('Video explanation coming soon for this field.')}
            >
              <PlayCircle className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-teal-400" />
            </button>
          )
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [zapierSent, setZapierSent] = useState(false);
  const [showAdlModal, setShowAdlModal] = useState(false);
  const [pendingAdlAdvance, setPendingAdlAdvance] = useState(false);
  const [showSaveLinkDialog, setShowSaveLinkDialog] = useState(false);
  const [saveLinkEmail, setSaveLinkEmail] = useState("");
  const [saveLinkSending, setSaveLinkSending] = useState(false);
  const prevAdlRef = useRef<string[]>([]);
  const prevIadlRef = useRef<string[]>([]);
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
  const sendSaveLinkMutation = trpc.email.sendSaveLink.useMutation();
  const notifyStepProgressMutation = trpc.email.notifyStepProgress.useMutation();
  // Resume token from URL query string
  const resumeToken = useMemo(() => new URLSearchParams(window.location.search).get('resume'), []);
  const resumeQuery = trpc.email.getResumeData.useQuery(
    { token: resumeToken! },
    { enabled: !!resumeToken, retry: false }
  );

  const completionPct = useMemo(() => {
    const fields = Object.entries(form).filter(([k]) => k !== "adlLimitations");
    const filled = fields.filter(([, v]) => typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : !!v);
    return Math.round((filled.length / fields.length) * 100);
  }, [form]);

  // Track whether initial load has happened
  const initialLoadDone = useRef(false);
  const resumeApplied = useRef(false);

  // Restore from server-side resume token (takes priority over localStorage)
  useEffect(() => {
    if (resumeQuery.data?.found && !resumeApplied.current) {
      resumeApplied.current = true;
      initialLoadDone.current = true; // prevent localStorage from overwriting
      const data = resumeQuery.data;
      if (data.formData && typeof data.formData === 'object') {
        setForm(prev => ({ ...prev, ...(data.formData as any) }));
      }
      if (typeof data.currentStep === 'number') {
        setStep(data.currentStep);
      }
      if (data.email) setSaveLinkEmail(data.email);
      toast.success('Progress restored!', { description: `Resuming from Step ${(data.currentStep || 0) + 1}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [resumeQuery.data]);

  // Load form data from localStorage on component mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      try {
        const savedForm = localStorage.getItem('ltc_policy_form');
        const savedStep = localStorage.getItem('ltc_policy_step');
        if (savedForm) {
          const parsed = JSON.parse(savedForm);
          // Migrate old free-text careNeeds to exact ADL checkbox values
          const validCareNeedsValues = [
            "Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence",
            "Meal Preparation", "Medication Management", "Housekeeping/Cleaning", "Laundry",
            "Shopping/Errands", "Transportation", "Money Management", "Telephone Use",
            "NoneADL", "NoneIADL"
          ];
          if (Array.isArray(parsed.careNeeds)) {
            // Migrate old "None" sentinel to "NoneADL"
            parsed.careNeeds = parsed.careNeeds
              .map((v: string) => v === "None" ? "NoneADL" : v)
              .filter((v: string) => validCareNeedsValues.includes(v));
          }
          setForm(parsed);
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

  // Scroll to top whenever the user navigates to a new step
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Per-step validation — returns true if the step is valid, false otherwise
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!form.insuredFullName.trim()) errors.insuredFullName = "Full name is required.";
      if (!form.insuredEmail.trim()) {
        errors.insuredEmail = "Email address is required.";
      } else if (!isValidEmail(form.insuredEmail)) {
        errors.insuredEmail = "Please enter a valid email address.";
      }
      if (!form.insuredPhone.trim()) {
        errors.insuredPhone = "Phone number is required.";
      } else if (!isValidPhoneNumber(form.insuredPhone)) {
        errors.insuredPhone = "Please enter a valid phone number: (000) 000-0000.";
      }
    }

    if (currentStep === 1) {
      if (!form.carrierName.trim()) errors.carrierName = "Insurance company name is required.";
    }

    if (currentStep === 2) {
      if (!form.policyNumber.trim()) errors.policyNumber = "Policy number is required.";
    }

    if (currentStep === 3) {
      if (!form.dailyMaximum.trim()) errors.dailyMaximum = "Daily maximum benefit is required.";
      if (!form.lifetimeMaximum.trim()) errors.lifetimeMaximum = "Lifetime maximum benefit is required.";
      if (!form.eliminationPeriod.trim()) errors.eliminationPeriod = "Elimination period is required.";
    }

    if (currentStep === 4) {
      const cn = form.careNeeds || [];
      const hasAdlSelection = cn.some(v => ["Bathing","Dressing","Eating/Feeding","Toileting","Transferring","Continence"].includes(v)) || cn.includes("NoneADL");
      if (!hasAdlSelection) {
        errors.careNeeds = "Please select at least one ADL or choose \"None of these ADLs apply\".";
      }
      if (!form.diagnosisCheckboxes || form.diagnosisCheckboxes.length === 0) {
        errors.diagnosisCheckboxes = "Please select at least one diagnosis or condition.";
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please complete all required fields before continuing.", { duration: 4000 });
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  // Clear a single field error when user edits it
  const clearError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  // Save to database only (no validation required, no Zapier)
  const handleSendSaveLink = async () => {
    if (!saveLinkEmail) return;
    setSaveLinkSending(true);
    try {
      await handleSave();
      await sendSaveLinkMutation.mutateAsync({
        email: saveLinkEmail,
        insuredName: form.insuredFullName || undefined,
        stepTitle: steps[step]?.title || `Step ${step + 1}`,
        origin: window.location.origin,
        formData: form as Record<string, any>,
        currentStep: step,
      });
      toast.success(`Resume link sent to ${saveLinkEmail}`);
      setShowSaveLinkDialog(false);
    } catch {
      toast.error("Failed to send link. Please try again.");
    } finally {
      setSaveLinkSending(false);
    }
  };

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

  // Navigate to next step — validate first, then save to DB silently
  const handleNext = () => {
    // Run per-step validation first — block if errors found
    if (!validateStep(step)) return;

    // ADL Validation: If on step 4 (Care Needs), check ADL requirements
    if (step === 4) {
      const minAdlsRequired = parseInt(form.minAdlsRequired || "0");
      const adlList = ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];
      
      // Get qualifying ADLs (checked in Coverage Details - Qualifying Events section)
      const qualifyingAdls = form.qualifyingAdls || [];
      
      // Get actual ADLs selected in Care Needs (Claims Info step)
      const actualAdls = form.careNeeds?.filter(need => adlList.includes(need)) || [];
      const actualAdlCount = actualAdls.length;
      
      // Check if ADL None is selected
      const noneSelected = form.careNeeds?.includes("NoneADL") || false;
      
      // Check 1: Is there at least the minimum number of ADLs?
      // Check 2: Are all selected ADLs in the qualifying list?
      const allAdlsQualify = actualAdls.every(adl => qualifyingAdls.includes(adl));
      
            if (minAdlsRequired > 0 && (actualAdlCount < minAdlsRequired || !allAdlsQualify || noneSelected)) {
        // Save all data first before showing modal
        const { poa_name, poa_relationship, ...validFormData } = form;
        const submission = createFormSubmission(validFormData, step, "page_transition", SESSION_ID, FORM_START_TIME);
        localStorage.setItem(`ltc_form_step_${step}`, JSON.stringify(submission));
        localStorage.setItem("ltc_form_current", JSON.stringify(submission));
        saveMutation.mutate({ ...form, id: policyId || undefined } as any, {
          onSuccess: (result) => { if (!policyId) setPolicyId(result.id); },
          onError: (e) => { console.error("Background save failed:", e); },
        });
        // Show modal — do NOT advance step yet
        setShowAdlModal(true);
        return;
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

    // Notify owner of step progress (fire-and-forget)
    notifyStepProgressMutation.mutate({
      stepNumber: step + 1,
      stepTitle: steps[step]?.title || `Step ${step + 1}`,
      formData: form as unknown as Record<string, any>,
    });

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
    { title: "Care Needs", icon: "📞" },
    { title: "Review & Submit", icon: "✅" },
  ];

  return (
    <Layout>
      {/* Hero Section with Nested Video */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="/manus-storage/policy-form-hero_314c2717.jpg" alt="Senior couple reviewing insurance documents" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a4a]/85 via-[#1a3a4a]/70 to-[#1a2a3a]/50" />
        </div>
        <div className="container relative py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Step progress badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 text-primary-foreground/70 text-sm">
                  <ClipboardList className="w-4 h-4" /> POLICY INTAKE FORM
                </div>
                <div className="inline-flex items-center gap-2 bg-teal rounded-full px-4 py-1.5 border border-teal/60 shadow-lg">
                  <span className="text-sm font-bold text-white">Step 2 of 3 — Complete the Form</span>
                </div>
              </div>
              {/* Step flow indicator */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
                  <span className="w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <span className="text-xs font-semibold text-white/85">Learn</span>
                </div>
                <div className="w-6 h-px bg-white/40" />
                <div className="flex items-center gap-1.5 bg-teal rounded-lg px-3 py-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-teal text-xs font-bold flex items-center justify-center">2</span>
                  <span className="text-xs font-semibold text-white">Form</span>
                </div>
                <div className="w-6 h-px bg-white/40" />
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
                  <span className="w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <span className="text-xs font-semibold text-white/85">Strategy</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4 leading-tight">Tell Us About Your <span className="text-teal">Policy</span></h1>
              <p className="text-white/90 max-w-lg text-base leading-relaxed">Complete this form to receive a personalized strategy for filing your long-term care insurance claim. All information is securely stored and can be edited at any time.</p>
            </div>
            <div className="hidden lg:block">
              <VideoPlaceholder title="How to Complete the Policy Form" description="Watch this guide to understand what information you'll need and how to find it in your policy documents" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/prngCKWDVnvVgXBI.jpg" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/UZLuXdBXwBOgyGSg.mp4" />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile video */}
      <section className="lg:hidden py-section bg-secondary">
        <div className="container">
          <VideoPlaceholder title="How to Complete the Policy Form" description="Watch this guide to understand what information you'll need and how to find it in your policy documents" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/prngCKWDVnvVgXBI.jpg" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/UZLuXdBXwBOgyGSg.mp4" />
        </div>
      </section>

      {/* ✨ What You Get Section */}
      <section className="py-section" style={{ background: '#f8f9fa' }}>
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-4" style={{ background: 'rgba(6,146,215,0.12)', border: '1px solid rgba(6,146,215,0.3)' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#0692D7' }} />
              <span className="text-sm font-bold" style={{ color: '#0692D7', fontFamily: "'Open Sans', sans-serif" }}>This is where the magic happens</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: '#454545' }}>
              Here's What You'll <span style={{ color: '#0692D7' }}>Receive</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif", color: '#555555' }}>
              Answer a few simple questions about your policy and care needs — and we'll create everything below, personalized just for your family.
            </p>
          </div>

          {/* Benefit cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {[
              {
                icon: FileCheck,
                title: "Your Custom Claim Strategy",
                desc: "A written, step-by-step plan built specifically around your policy, your insurance company, and your loved one's care needs. No guesswork — just clear next steps.",
                highlight: true,
              },
              {
                icon: Map,
                title: "A Personalized Timeline",
                desc: "Know exactly what to do and when to do it. Your timeline maps out every task from first contact with your insurer all the way to approved benefits.",
                highlight: false,
              },
              {
                icon: Download,
                title: "Downloadable PDF Checklist",
                desc: "Print it out, share it with family, or keep it on your phone. Your checklist makes it easy to track every step and never miss a deadline.",
                highlight: false,
              },
              {
                icon: MessageCircle,
                title: "Live Support Chat",
                desc: "Have a question while you're working through your strategy? Our LTC Support Assistant is right here to help — available any time, day or night.",
                highlight: false,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-5 p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg"
                style={{
                  borderColor: item.highlight ? '#0692D7' : '#e8e8e8',
                  background: item.highlight ? 'rgba(6,146,215,0.05)' : '#ffffff',
                }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: item.highlight ? 'rgba(6,146,215,0.15)' : 'rgba(6,146,215,0.08)' }}>
                  <item.icon className="w-6 h-6" style={{ color: i % 2 === 0 ? '#0692D7' : '#34B1C4' }} />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1.5" style={{ fontFamily: "'Roboto', sans-serif", color: '#454545' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: '#666666' }}>{item.desc}</p>
                </div>
                {item.highlight && (
                  <div className="absolute" />
                )}
              </div>
            ))}
          </div>

          {/* Sample strategy preview card */}
          <div className="rounded-2xl border-2 overflow-hidden shadow-xl" style={{ borderColor: '#34B1C4' }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: '#34B1C4' }}>
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-base" style={{ fontFamily: "'Roboto', sans-serif" }}>Sample: Your Custom Strategy Preview</span>
              <span className="ml-auto text-white/80 text-xs font-medium">What you'll receive after completing Step 2</span>
            </div>
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "Week 1", title: "Notify Your Insurer", tasks: ["Call claims department", "Request claim forms", "Confirm elimination period"] },
                  { step: "Week 2", title: "Gather Documentation", tasks: ["Physician certification", "ADL assessment form", "Care plan from provider"] },
                  { step: "Week 3", title: "Submit & Follow Up", tasks: ["Submit complete claim packet", "Confirm receipt in writing", "Track approval timeline"] },
                ].map((phase, i) => (
                  <div key={i} className="rounded-lg p-4 border" style={{ borderColor: '#e8e8e8', background: '#f9f9f9' }}>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: i === 1 ? '#0692D7' : '#34B1C4', fontFamily: "'Open Sans', sans-serif" }}>{phase.step}</div>
                    <div className="font-bold text-sm mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: '#454545' }}>{phase.title}</div>
                    <ul className="space-y-1.5">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs" style={{ color: '#666666', fontFamily: "'Open Sans', sans-serif" }}>
                          <span className="mt-0.5 flex-shrink-0" style={{ color: i === 1 ? '#0692D7' : '#34B1C4' }}>&#10003;</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: '#e8e8e8' }}>
                <p className="text-xs italic" style={{ color: '#999', fontFamily: "'Open Sans', sans-serif" }}>This is a sample preview. Your actual strategy will be tailored to your specific policy and care situation.</p>
                <a href="#policy-form-start" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#0692D7', fontFamily: "'Open Sans', sans-serif" }}>
                  Get My Real Strategy <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="policy-form-start" className="py-section bg-white">
        <div className="container max-w-4xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500 font-medium">Step {step + 1} of {steps.length}</span>
              <span className="text-sm font-bold text-teal">{completionPct}% Complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal to-teal-dark h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-4">
              {steps.map((s, i) => {
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <button
                    key={i}
                    onClick={() => { if (i < step) setStep(i); }}
                    disabled={i > step}
                    className={`group text-xs text-center flex-1 px-1 transition-all duration-200 ${
                      isActive ? "text-teal font-semibold" : isDone ? "text-green-600 cursor-pointer hover:text-teal" : "text-slate-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span className={`block text-lg mb-0.5 transition-transform duration-200 ${
                      isActive ? "scale-125" : isDone ? "group-hover:scale-110" : ""
                    }`}>
                      {isDone ? "✅" : s.icon}
                    </span>
                    <span className="hidden sm:block">{s.title}</span>
                    {isActive && (
                      <span className="block w-1.5 h-1.5 rounded-full bg-teal mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 0: Insured Person */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Insured Person Information</h2>
              <p className="text-sm text-slate-600">Enter the details of the person covered by the LTC insurance policy.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Full Name of Insured" name="insuredFullName" isRequired>
                  <Input id="insuredFullName" value={form.insuredFullName} onChange={e => { update("insuredFullName", e.target.value); clearError("insuredFullName"); }} placeholder="Enter full legal name" className={fieldErrors.insuredFullName ? "border-red-500 focus-visible:ring-red-500" : ""} />
                  {fieldErrors.insuredFullName && <p className="text-xs text-red-600 mt-1">{fieldErrors.insuredFullName}</p>}
                </TooltipField>
                <TooltipField label="Date of Birth" name="insuredDob">
                  <Input id="insuredDob" type="text" value={getDisplayDate(form.insuredDob)} onChange={e => handleDateChange(e.target.value)} placeholder="MM/DD/YYYY" pattern="\d{2}/\d{2}/\d{4}" title="Please enter date in format MM/DD/YYYY" maxLength={10} />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Email Address" name="insuredEmail" isRequired>
                  <Input id="insuredEmail" type="email" value={form.insuredEmail} onChange={e => { update("insuredEmail", e.target.value); clearError("insuredEmail"); }} placeholder="your.email@example.com" className={fieldErrors.insuredEmail ? "border-red-500 focus-visible:ring-red-500" : ""} />
                  {fieldErrors.insuredEmail && <p className="text-xs text-red-600 mt-1">{fieldErrors.insuredEmail}</p>}
                </TooltipField>
                <TooltipField label="Phone Number" name="insuredPhone" isRequired>
                  <Input id="insuredPhone" type="tel" value={form.insuredPhone} onChange={e => { update("insuredPhone", e.target.value); clearError("insuredPhone"); }} placeholder="(000) 000-0000" className={fieldErrors.insuredPhone ? "border-red-500 focus-visible:ring-red-500" : ""} />
                  {fieldErrors.insuredPhone && <p className="text-xs text-red-600 mt-1">{fieldErrors.insuredPhone}</p>}
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
                <Input id="carrierName" value={form.carrierName} onChange={e => { update("carrierName", e.target.value); clearError("carrierName"); }} placeholder="e.g., Genworth, John Hancock, Mutual of Omaha" className={fieldErrors.carrierName ? "border-red-500 focus-visible:ring-red-500" : ""} />
                {fieldErrors.carrierName && <p className="text-xs text-red-600 mt-1">{fieldErrors.carrierName}</p>}
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
                  <Input id="policyNumber" value={form.policyNumber} onChange={e => { update("policyNumber", e.target.value); clearError("policyNumber"); }} placeholder="Your policy number" className={fieldErrors.policyNumber ? "border-red-500 focus-visible:ring-red-500" : ""} />
                  {fieldErrors.policyNumber && <p className="text-xs text-red-600 mt-1">{fieldErrors.policyNumber}</p>}
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

              {/* Claims Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
                <h3 className="text-base font-semibold text-slate-800">Claims Info</h3>
                <p className="text-xs text-slate-500">These details help us tailor your strategy with carrier-specific submission guidance.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TooltipField label="Where Can I Get the Claims Packet?" name="whereToGetClaimsPacket">
                    <Input id="whereToGetClaimsPacket" value={form.whereToGetClaimsPacket} onChange={e => update("whereToGetClaimsPacket", e.target.value)} placeholder="e.g., Call carrier, online portal" />
                  </TooltipField>
                  <TooltipField label="How Do I Submit the Claims Packet?" name="howToSubmitClaimsPacket">
                    <Input id="howToSubmitClaimsPacket" value={form.howToSubmitClaimsPacket} onChange={e => update("howToSubmitClaimsPacket", e.target.value)} placeholder="e.g., Mail, fax, online portal" />
                  </TooltipField>
                </div>
                <TooltipField label="Invoice Reimbursement Delay" name="invoiceReimbursementDelay">
                  <Input id="invoiceReimbursementDelay" value={form.invoiceReimbursementDelay} onChange={e => update("invoiceReimbursementDelay", e.target.value)} placeholder="e.g., 30 days, 2-4 weeks" />
                </TooltipField>
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
                    <Input id="dailyMaximum" type="text" value={form.dailyMaximum} onChange={e => { update("dailyMaximum", formatCurrency(e.target.value)); clearError("dailyMaximum"); }} placeholder="$0.00" className={`bg-white${fieldErrors.dailyMaximum ? " border-red-500 focus-visible:ring-red-500" : ""}`} />
                    {fieldErrors.dailyMaximum && <p className="text-xs text-red-600 mt-1">{fieldErrors.dailyMaximum}</p>}
                  </TooltipField>
                  <TooltipField label="Monthly Maximum" name="monthlyMaximum">
                    <Input id="monthlyMaximum" type="text" value={form.monthlyMaximum || ''} onChange={e => update("monthlyMaximum", formatCurrency(e.target.value))} placeholder="$0.00" className="bg-white" />
                  </TooltipField>
                  <TooltipField label="Lifetime Maximum" name="lifetimeMaximum" isRequired>
                    <Input id="lifetimeMaximum" type="text" value={form.lifetimeMaximum} onChange={e => { update("lifetimeMaximum", formatCurrency(e.target.value)); clearError("lifetimeMaximum"); }} placeholder="$0.00" className={`bg-white${fieldErrors.lifetimeMaximum ? " border-red-500 focus-visible:ring-red-500" : ""}`} />
                    {fieldErrors.lifetimeMaximum && <p className="text-xs text-red-600 mt-1">{fieldErrors.lifetimeMaximum}</p>}
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
                          clearError("eliminationPeriod");
                        }
                      }} placeholder="0-999" className={`bg-white${fieldErrors.eliminationPeriod ? " border-red-500 focus-visible:ring-red-500" : ""}`} />
                      {fieldErrors.eliminationPeriod && <p className="text-xs text-red-600 mt-1">{fieldErrors.eliminationPeriod}</p>}
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <TooltipField label="Home Care Covered?" name="inHomeCoverageEnabled">
                    <Select value={form.equipmentAllowanceEnabled === true ? "yes" : form.equipmentAllowanceEnabled === false ? "no" : ""} onValueChange={v => update("equipmentAllowanceEnabled", v === "yes" ? true : v === "no" ? false : false)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                    </Select>
                  </TooltipField>
                  {form.equipmentAllowanceEnabled === true && (
                    <>
                      <TooltipField label="Approved Agency Required?" name="approvedAgencyRequired">
                        <Select value={form.approvedAgencyRequired || "no"} onValueChange={v => update("approvedAgencyRequired", v)}>
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                        </Select>
                      </TooltipField>
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
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Is it likely that I&apos;ll qualify?</h2>

              {/* Qualification context banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Why are we asking these questions?</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Long-term care insurance policies require the insured to meet specific <strong>benefit triggers</strong> before a claim can be initiated. Most policies require that the insured needs assistance with a minimum number of <strong>Activities of Daily Living (ADLs)</strong> &mdash; such as bathing, dressing, or toileting &mdash; or has a <strong>diagnosis of cognitive impairment</strong> (e.g., Alzheimer&apos;s or dementia) that requires substantial supervision.
                </p>
                <p className="text-sm text-blue-800 leading-relaxed mt-2">
                  The selections you make below will be compared against your policy&apos;s requirements from the Coverage Details step. If the current care needs do not meet the policy&apos;s benefit triggers, you will be notified and given the option to continue for <strong>informational purposes only</strong> &mdash; so you can still receive a strategy and understand what to expect when the time comes.
                </p>
              </div>

              {/* Diagnosis Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-base font-semibold text-slate-800">Primary Diagnosis or Condition</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">Select all medical diagnoses or conditions contributing to the insured's need for care. A cognitive impairment diagnosis (e.g., Alzheimer's, Dementia) may qualify as a separate benefit trigger even without meeting the ADL requirement.</TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Select all diagnoses that apply. Cognitive conditions may qualify as a separate benefit trigger independent of ADL requirements.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Arthritis", "Congestive Heart Failure (CHF)", "Heart Disease", "Diabetes", "Alzheimer's Disease", "Dementia", "COPD", "Stroke", "Cancer", "Parkinson's Disease", "Pneumonia", "Kidney Disease", "Liver Disease", "Osteoporosis", "Hypertension", "Other"].map(diagnosis => {
                    const diagnosisCheckboxes = form.diagnosisCheckboxes || [];
                    return (
                      <label key={diagnosis} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${diagnosisCheckboxes.includes(diagnosis) ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <Checkbox checked={diagnosisCheckboxes.includes(diagnosis)} onCheckedChange={checked => {
                          update("diagnosisCheckboxes", checked ? [...diagnosisCheckboxes, diagnosis] : diagnosisCheckboxes.filter(d => d !== diagnosis));
                          clearError("diagnosisCheckboxes");
                        }} />
                        <span className="text-sm font-medium">{diagnosis}</span>
                      </label>
                    );
                  })}
                </div>
                {fieldErrors.diagnosisCheckboxes && <p className="text-xs text-red-600 mt-2">{fieldErrors.diagnosisCheckboxes}</p>}
              </div>
              <TooltipField label="Diagnosis Notes" name="diagnosisNotes">
                <Textarea id="diagnosisNotes" value={form.diagnosisNotes} onChange={e => update("diagnosisNotes", e.target.value)} placeholder="Additional details about the diagnosis, conditions, or cognitive impairments..." rows={3} />
              </TooltipField>

              {/* ADLs Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-base font-semibold text-slate-800">Activities of Daily Living (ADLs)</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">ADLs are the six fundamental personal care tasks used by most LTC policies as benefit triggers. Select every ADL with which the insured currently needs assistance.</TooltipContent>
                  </Tooltip>
                  <span className="text-red-500">*</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Select all ADLs the insured needs help with. These are compared against your policy&apos;s qualifying ADL list and minimum requirement.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"].map(service => {
                    const careNeeds = form.careNeeds || [];
                    return (
                      <label key={service} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${careNeeds.includes(service) ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <Checkbox checked={careNeeds.includes(service)} onCheckedChange={checked => {
                          // Selecting any ADL removes NoneADL
                          const withoutNoneAdl = careNeeds.filter(s => s !== "NoneADL");
                          update("careNeeds", checked ? [...withoutNoneAdl, service] : withoutNoneAdl.filter(s => s !== service));
                          clearError("careNeeds");
                        }} />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    );
                  })}
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors col-span-2 md:col-span-1 ${(form.careNeeds || []).includes("NoneADL") ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                    <Checkbox checked={(form.careNeeds || []).includes("NoneADL")} onCheckedChange={checked => {
                      const adlItems = ["Bathing","Dressing","Eating/Feeding","Toileting","Transferring","Continence"];
                      const current = form.careNeeds || [];
                      if (checked) {
                        // Remember current ADL selections before clearing
                        prevAdlRef.current = current.filter(v => adlItems.includes(v));
                        update("careNeeds", [...current.filter(v => !adlItems.includes(v)), "NoneADL"]);
                      } else {
                        // Restore previous ADL selections
                        const withoutNoneAdl = current.filter(v => v !== "NoneADL");
                        update("careNeeds", [...withoutNoneAdl, ...prevAdlRef.current]);
                        prevAdlRef.current = [];
                      }
                      clearError("careNeeds");
                    }} />
                    <span className="text-sm font-medium text-amber-800">None of these ADLs apply</span>
                  </label>
                </div>
              </div>
              {fieldErrors.careNeeds && <p className="text-xs text-red-600 -mt-2 mb-2">{fieldErrors.careNeeds}</p>}
              {/* ADL Qualification Alert - derived directly from live form state */}
              {(() => {
                const minAdlsRequired = parseInt(form.minAdlsRequired || "0");
                if (minAdlsRequired === 0) return null;
                const qualifyingAdls = (form.qualifyingAdls && form.qualifyingAdls.length > 0)
                  ? form.qualifyingAdls
                  : ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];
                const adlList = ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];
                const careNeedsNow = form.careNeeds || [];
                const noneSelected = careNeedsNow.includes("NoneADL");
                const actualAdls = careNeedsNow.filter(need => adlList.includes(need));
                const actualAdlCount = actualAdls.length;
                const nonQualifyingAdls = actualAdls.filter(adl => !qualifyingAdls.includes(adl));
                const countOk = !noneSelected && actualAdlCount >= minAdlsRequired;
                const listOk = nonQualifyingAdls.length === 0;
                const qualificationMet = countOk && listOk;
                if (qualificationMet) return null;
                return (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">ADL Qualification Alert</h4>
                      <p className="text-sm text-red-700 mb-2">
                        Your policy requires a minimum of <strong>{minAdlsRequired} ADL(s)</strong> from the following qualifying list:
                      </p>
                      <p className="text-sm text-red-700 mb-3 font-medium">
                        {qualifyingAdls.join(", ")}
                      </p>
                      {noneSelected && (
                        <p className="text-sm text-red-700">"None of these ADLs apply" is selected. Please select at least {minAdlsRequired} ADL(s) from the qualifying list above to meet the benefit trigger.</p>
                      )}
                      {!noneSelected && actualAdlCount < minAdlsRequired && (
                        <p className="text-sm text-red-700">Currently {actualAdlCount} qualifying ADL(s) selected &mdash; you need at least {minAdlsRequired} to meet the benefit trigger.</p>
                      )}
                      {!noneSelected && actualAdlCount >= minAdlsRequired && !listOk && (
                        <p className="text-sm text-red-700">Some selected ADLs are not on the qualifying list: <strong>{nonQualifyingAdls.join(", ")}</strong>. Only ADLs from the qualifying list count toward the benefit trigger.</p>
                      )}
                    </div>

                  </div>
                );
              })()}
              {/* IADLs Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-base font-semibold text-slate-800">Instrumental Activities of Daily Living (IADLs)</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/50">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">IADLs are household and life-management tasks. While most LTC policies do not count IADLs toward the ADL benefit trigger, they are important for care planning and documenting the full scope of care needed.</TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-slate-500 mb-3">Select any additional household or management tasks the insured needs help with. These do not count toward ADL qualification but are important for care planning.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Meal Preparation", "Medication Management", "Housekeeping/Cleaning", "Laundry", "Shopping/Errands", "Transportation", "Money Management", "Telephone Use"].map(service => {
                    const careNeeds = form.careNeeds || [];
                    return (
                      <label key={service} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${careNeeds.includes(service) ? "bg-teal/10 border-teal" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                        <Checkbox checked={careNeeds.includes(service)} onCheckedChange={checked => {
                          // Selecting any IADL removes NoneIADL
                          const withoutNoneIadl = careNeeds.filter(s => s !== "NoneIADL");
                          update("careNeeds", checked ? [...withoutNoneIadl, service] : withoutNoneIadl.filter(s => s !== service));
                          clearError("careNeeds");
                        }} />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    );
                  })}
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors col-span-2 md:col-span-1 ${(form.careNeeds || []).includes("NoneIADL") ? "bg-slate-100 border-slate-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                    <Checkbox checked={(form.careNeeds || []).includes("NoneIADL")} onCheckedChange={checked => {
                      const iadlItems = ["Meal Preparation","Medication Management","Housekeeping/Cleaning","Laundry","Shopping/Errands","Transportation","Money Management","Telephone Use"];
                      const current = form.careNeeds || [];
                      if (checked) {
                        // Remember current IADL selections before clearing
                        prevIadlRef.current = current.filter(v => iadlItems.includes(v));
                        update("careNeeds", [...current.filter(v => !iadlItems.includes(v)), "NoneIADL"]);
                      } else {
                        // Restore previous IADL selections
                        const withoutNoneIadl = current.filter(v => v !== "NoneIADL");
                        update("careNeeds", [...withoutNoneIadl, ...prevIadlRef.current]);
                        prevIadlRef.current = [];
                      }
                      clearError("careNeeds");
                    }} />
                    <span className="text-sm font-medium text-slate-600">None of these IADLs apply</span>
                  </label>
                </div>
              </div>



              
              <TooltipField label="Care Notes" name="careNotes">
                <Textarea id="careNotes" value={form.careNotes} onChange={e => update("careNotes", e.target.value)} placeholder="Any additional notes about the care services selected..." rows={3} />
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
                  { title: "LTC Insurance Company", items: [["Carrier", form.carrierName], ["Phone", form.carrierPhone], ["Policy #", form.policyNumber], ["Claim #", form.claimPreClaimNumber]] },
                  { title: "Claims Info", items: [["Case Manager", form.caseManagerAssigned], ["Case Manager Name", form.caseManagerName], ["Claims Packet", form.whereToGetClaimsPacket || "\u2014"], ["Submit Via", form.howToSubmitClaimsPacket || "\u2014"], ["Reimbursement Delay", form.invoiceReimbursementDelay || "\u2014"]] },
                  { title: "Coverage Details", items: [["Elimination Period", form.eliminationPeriod], ["Daily Max", form.dailyMaximum], ["Monthly Max", form.monthlyMaximum], ["Lifetime Max", form.lifetimeMaximum], ["Min ADLs", form.minAdlsRequired], ["AOB", form.assignmentOfBenefits], ["Waiver of Premium", form.waiverOfPremium], ["Cognitive Impairment Trigger", form.cognitiveImpairmentTrigger]] },
                  { title: "Qualifying (Care Needs)", items: [["Care Services", (form.careNeeds || []).join(", ") || "None selected"], ["Diagnosis", (form.diagnosisCheckboxes || []).join(", ") || "None selected"], ["Home Care Covered", form.equipmentAllowanceEnabled === true ? "Yes" : form.equipmentAllowanceEnabled === false ? "No" : "\u2014"], ["Approved Agency Req.", form.approvedAgencyRequired || "\u2014"], ["CNA Required", form.cnaRequired || "\u2014"], ["Care Notes Required", form.careNotesRequired || "\u2014"], ["RN Assessment", form.thirdPartyAssessmentRequired || "\u2014"]] },
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSaveLinkEmail(form.insuredEmail || "");
                  setShowSaveLinkDialog(true);
                }}
                className="gap-1 text-teal-600 hover:text-teal-700 border-teal-200 hover:border-teal-400"
              >
                <Mail className="w-4 h-4" /> Email Link
              </Button>
            </div>
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

      {/* ADL Informational Purposes Modal */}
      <Dialog open={showAdlModal} onOpenChange={open => { if (!open) setShowAdlModal(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="text-amber-500">⚠</span> ADL Benefit Trigger Not Met
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2 leading-relaxed">
              Based on your current care needs, you do not appear to meet the minimum ADL requirement
              to initiate a claim under this policy at this time.
              <br /><br />
              <strong>This does not mean your journey ends here.</strong> Many families use this tool
              to plan ahead — understanding your policy now means you will be fully prepared when
              the time comes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium text-slate-700 mb-3">Would you like to continue for informational purposes?</p>
            <div className="grid grid-cols-1 gap-3">
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => {
                  setShowAdlModal(false);
                  setStep(prev => prev + 1);
                }}
              >
                Yes — continue for informational purposes
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700"
                onClick={() => {
                  setShowAdlModal(false);
                  setPendingAdlAdvance(true);
                }}
              >
                No — I am done for now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thank-you exit modal */}
      <Dialog open={pendingAdlAdvance} onOpenChange={open => { if (!open) setPendingAdlAdvance(false); }}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">Thank You for Using LTC Navigator</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2 leading-relaxed">
              We hope this has been a helpful learning experience. Your information has been saved —
              whenever your care needs change or you are ready to revisit, simply return and pick up
              right where you left off.
              <br /><br />
              Wishing you and your family all the best.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 justify-center">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                setPendingAdlAdvance(false);
                navigate("/");
              }}
            >
              Return to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save & Return Email Dialog */}
      <Dialog open={showSaveLinkDialog} onOpenChange={setShowSaveLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              Email a Resume Link
            </DialogTitle>
            <DialogDescription>
              We'll email you a link so you can return to this form on any device and pick up right where you left off. Your progress is already saved in this browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2">
            <div className="space-y-1.5">
              <Label htmlFor="save-link-email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="save-link-email"
                type="email"
                placeholder="your@email.com"
                value={saveLinkEmail}
                onChange={e => setSaveLinkEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && saveLinkEmail) handleSendSaveLink(); }}
              />
            </div>
            <p className="text-xs text-slate-500">
              The link will take you back to the beginning of the form — your saved data will reload automatically from this browser's storage.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSaveLinkDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSendSaveLink}
              disabled={!saveLinkEmail || saveLinkSending}
              className="gap-1"
              style={{ background: saveLinkEmail && !saveLinkSending ? "linear-gradient(135deg, #1B4F8A, #3BBFBF)" : undefined, color: "white" }}
            >
              {saveLinkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
