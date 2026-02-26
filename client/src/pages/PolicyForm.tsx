import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ClipboardList, ArrowRight, ArrowLeft, Save, Loader2, HelpCircle, Info } from "lucide-react";

const adlOptions = ["Bathing", "Dressing", "Eating/Feeding", "Toileting", "Transferring", "Continence"];

const tooltips: Record<string, string> = {
  carrierName: "The name of your long-term care insurance company.",
  policyNumber: "Your LTC policy number, found on your insurance declaration page.",
  claimPreClaimNumber: "When a claim is initiated, a pre-claim number is issued prior to approval. When approved, it becomes the actual claim number.",
  eliminationPeriod: "The number of service days you must pay out of pocket before your LTC policy begins to pay. This counts days of service, not days since illness.",
  dailyMaximum: "The maximum amount the insurance company will pay per day of service. Amounts above this are your responsibility.",
  monthlyMaximum: "The maximum amount the insurance company will pay per month of service.",
  lifetimeMaximum: "The total amount your policy will pay over its lifetime.",
  minAdlsRequired: "Activities of Daily Living that must be in deficit (typically 2 or 3) to qualify for benefits. ADLs include Bathing, Dressing, Toileting, Feeding, Continence, and Transferring.",
  caseManagerName: "A Case Manager is assigned by the LTC company to determine approved hours of care and monitor the case regularly.",
  waiverOfPremium: "If your policy has Waiver of Premium, your premium payments stop once care begins under the policy.",
  cnaRequired: "Some LTC companies require a Certified Nursing Assistant (CNA) to provide care, or the care may be disallowed.",
  careNotesRequired: "Whether your insurance company requires daily care notes/logsheets to be submitted with invoices.",
  paymentCycle: "The review cycle for invoices and logsheets — typically monthly or at another interval set by the LTC company.",
  assignmentOfBenefits: "Assignment of Benefits (AOB) directs the insurance company to send payment directly to the care provider instead of the insured.",
  thirdPartyAssessmentRequired: "A third-party RN may perform an independent assessment to verify the patient's condition and ADL deficits.",
  cognitiveImpairmentTrigger: "Whether cognitive impairment (e.g., Alzheimer's, dementia) is a qualifying trigger for benefits under this policy.",
  powerOfAttorneyPresent: "Whether a Power of Attorney document exists that authorizes someone to act on behalf of the insured.",
  insuredSsn: "Required for claim processing. This information is stored securely.",
  insuredMedicareNumber: "Your Medicare identification number, if applicable.",
  insuredMedicaidNumber: "Your Medicaid identification number, if applicable.",
};

type FormData = {
  insuredFullName: string;
  insuredDob: string;
  insuredMailingAddress: string;
  insuredSsn: string;
  insuredMedicareNumber: string;
  insuredMedicaidNumber: string;
  powerOfAttorneyPresent: string;
  carrierName: string;
  carrierAddress1: string;
  carrierAddress2: string;
  carrierCityStateZip: string;
  carrierPhone: string;
  carrierFax: string;
  policyNumber: string;
  claimPreClaimNumber: string;
  eliminationPeriod: string;
  dailyMaximum: string;
  monthlyMaximum: string;
  lifetimeMaximum: string;
  minAdlsRequired: string;
  waiverOfPremium: string;
  cnaRequired: string;
  careNotesRequired: string;
  paymentCycle: string;
  assignmentOfBenefits: string;
  caseManagerName: string;
  thirdPartyAssessmentRequired: string;
  thirdPartyAssessmentWho: string;
  cognitiveImpairmentTrigger: string;
  planOfCareStatus: string;
  ltcCoordinatorAssigned: string;
  currentCareNeeds: string;
  diagnosisOrCondition: string;
  adlLimitations: string[];
  preferredCareType: string;
  additionalNotes: string;
  fillerRelationship: string;
};

const defaultForm: FormData = {
  insuredFullName: "", insuredDob: "", insuredMailingAddress: "", insuredSsn: "",
  insuredMedicareNumber: "", insuredMedicaidNumber: "", powerOfAttorneyPresent: "",
  carrierName: "", carrierAddress1: "", carrierAddress2: "", carrierCityStateZip: "",
  carrierPhone: "", carrierFax: "",
  policyNumber: "", claimPreClaimNumber: "",
  eliminationPeriod: "", dailyMaximum: "", monthlyMaximum: "", lifetimeMaximum: "",
  minAdlsRequired: "", waiverOfPremium: "", cnaRequired: "", careNotesRequired: "",
  paymentCycle: "", assignmentOfBenefits: "",
  caseManagerName: "", thirdPartyAssessmentRequired: "", thirdPartyAssessmentWho: "",
  cognitiveImpairmentTrigger: "", planOfCareStatus: "", ltcCoordinatorAssigned: "",
  currentCareNeeds: "", diagnosisOrCondition: "", adlLimitations: [],
  preferredCareType: "", additionalNotes: "", fillerRelationship: "",
};

function TooltipField({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  const tip = tooltips[name];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={name} className="text-sm font-medium text-slate-700">{label}</Label>
        {tip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

export default function PolicyForm() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const policyQuery = trpc.policy.get.useQuery(undefined, { enabled: isAuthenticated });
  const saveMutation = trpc.policy.save.useMutation();

  const completionPct = useMemo(() => {
    const fields = Object.entries(form).filter(([k]) => k !== "adlLimitations");
    const filled = fields.filter(([, v]) => typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : !!v);
    return Math.round((filled.length / fields.length) * 100);
  }, [form]);

  useEffect(() => {
    if (policyQuery.data) {
      const p = policyQuery.data;
      setPolicyId(p.id);
      setForm({
        insuredFullName: p.insuredFullName || "",
        insuredDob: p.insuredDob || "",
        insuredMailingAddress: p.insuredMailingAddress || "",
        insuredSsn: p.insuredSsn || "",
        insuredMedicareNumber: p.insuredMedicareNumber || "",
        insuredMedicaidNumber: p.insuredMedicaidNumber || "",
        powerOfAttorneyPresent: p.powerOfAttorneyPresent || "",
        carrierName: p.carrierName || "",
        carrierAddress1: p.carrierAddress1 || "",
        carrierAddress2: p.carrierAddress2 || "",
        carrierCityStateZip: p.carrierCityStateZip || "",
        carrierPhone: p.carrierPhone || "",
        carrierFax: p.carrierFax || "",
        policyNumber: p.policyNumber || "",
        claimPreClaimNumber: p.claimPreClaimNumber || "",
        eliminationPeriod: p.eliminationPeriod || "",
        dailyMaximum: p.dailyMaximum || "",
        monthlyMaximum: p.monthlyMaximum || "",
        lifetimeMaximum: p.lifetimeMaximum || "",
        minAdlsRequired: p.minAdlsRequired || "",
        waiverOfPremium: p.waiverOfPremium || "",
        cnaRequired: p.cnaRequired || "",
        careNotesRequired: p.careNotesRequired || "",
        paymentCycle: p.paymentCycle || "",
        assignmentOfBenefits: p.assignmentOfBenefits || "",
        caseManagerName: p.caseManagerName || "",
        thirdPartyAssessmentRequired: p.thirdPartyAssessmentRequired || "",
        thirdPartyAssessmentWho: p.thirdPartyAssessmentWho || "",
        cognitiveImpairmentTrigger: p.cognitiveImpairmentTrigger || "",
        planOfCareStatus: p.planOfCareStatus || "",
        ltcCoordinatorAssigned: p.ltcCoordinatorAssigned || "",
        currentCareNeeds: p.currentCareNeeds || "",
        diagnosisOrCondition: p.diagnosisOrCondition || "",
        adlLimitations: Array.isArray(p.adlLimitations) ? (p.adlLimitations as string[]) : [],
        preferredCareType: p.preferredCareType || "",
        additionalNotes: p.additionalNotes || "",
        fillerRelationship: p.fillerRelationship || "",
      });
    }
  }, [policyQuery.data]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></Layout>;
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="text-center py-20">
          <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to access the policy intake form.</p>
          <a href={getLoginUrl()}><Button>Sign In to Continue</Button></a>
        </div>
      </Layout>
    );
  }

  const update = (field: keyof FormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveMutation.mutateAsync({ ...form, id: policyId || undefined });
      if (!policyId) setPolicyId(result.id);
      toast.success("Policy information saved successfully");
    } catch (e) { toast.error("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const steps = [
    { title: "Insured Person", icon: "👤" },
    { title: "Carrier Info", icon: "🏢" },
    { title: "Coverage Details", icon: "📋" },
    { title: "Medical & Admin", icon: "🏥" },
    { title: "Care Needs & ADLs", icon: "❤️" },
    { title: "Review & Submit", icon: "✅" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-primary/80 text-white py-12">
        <div className="container">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-3">
            <ClipboardList className="w-4 h-4" /> POLICY INTAKE FORM
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-3">Tell Us About Your Policy</h1>
          <p className="text-slate-300 max-w-2xl">Complete this form to receive a personalized strategy for filing your long-term care insurance claim. All information is securely stored and can be edited at any time.</p>
        </div>
      </section>

      {/* Video */}
      <section className="bg-slate-50 py-8">
        <div className="container max-w-3xl">
          <VideoPlaceholder title="How to Complete the Policy Form" description="Watch this guide to understand what information you'll need and how to find it in your policy documents" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/prngCKWDVnvVgXBI.jpg" />
        </div>
      </section>

      {/* Form */}
      <section className="py-10 bg-white">
        <div className="container max-w-4xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Step {step + 1} of {steps.length}</span>
              <span className="text-sm font-medium text-primary">{completionPct}% Complete</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-3">
              {steps.map((s, i) => (
                <button key={i} onClick={() => setStep(i)} className={`text-xs text-center flex-1 px-1 ${i === step ? "text-primary font-semibold" : i < step ? "text-green-600" : "text-slate-400"}`}>
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
                <TooltipField label="Full Name of Insured" name="insuredFullName">
                  <Input id="insuredFullName" value={form.insuredFullName} onChange={e => update("insuredFullName", e.target.value)} placeholder="Enter full legal name" />
                </TooltipField>
                <TooltipField label="Date of Birth" name="insuredDob">
                  <Input id="insuredDob" type="date" value={form.insuredDob} onChange={e => update("insuredDob", e.target.value)} />
                </TooltipField>
              </div>
              <TooltipField label="Mailing Address" name="insuredMailingAddress">
                <Textarea id="insuredMailingAddress" value={form.insuredMailingAddress} onChange={e => update("insuredMailingAddress", e.target.value)} placeholder="Full mailing address" rows={2} />
              </TooltipField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TooltipField label="Social Security Number" name="insuredSsn">
                  <Input id="insuredSsn" value={form.insuredSsn} onChange={e => update("insuredSsn", e.target.value)} placeholder="XXX-XX-XXXX" type="password" />
                </TooltipField>
                <TooltipField label="Medicare Number" name="insuredMedicareNumber">
                  <Input id="insuredMedicareNumber" value={form.insuredMedicareNumber} onChange={e => update("insuredMedicareNumber", e.target.value)} placeholder="Medicare #" />
                </TooltipField>
                <TooltipField label="Medicaid Number" name="insuredMedicaidNumber">
                  <Input id="insuredMedicaidNumber" value={form.insuredMedicaidNumber} onChange={e => update("insuredMedicaidNumber", e.target.value)} placeholder="Medicaid #" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Power of Attorney Present?" name="powerOfAttorneyPresent">
                  <Select value={form.powerOfAttorneyPresent} onValueChange={v => update("powerOfAttorneyPresent", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                <TooltipField label="Your Relationship to Insured" name="fillerRelationship">
                  <Select value={form.fillerRelationship} onValueChange={v => update("fillerRelationship", v)}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self (I am the insured)</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Adult Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="poa">Power of Attorney</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipField>
              </div>
            </div>
          )}

          {/* Step 1: Carrier Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Insurance Carrier Information</h2>
              <p className="text-sm text-slate-600">Enter the details of your LTC insurance carrier. This information can be found on your policy declaration page.</p>
              <TooltipField label="Carrier Name" name="carrierName">
                <Input id="carrierName" value={form.carrierName} onChange={e => update("carrierName", e.target.value)} placeholder="e.g., Genworth, John Hancock, Mutual of Omaha" />
              </TooltipField>
              <TooltipField label="Address Line 1" name="carrierAddress1">
                <Input id="carrierAddress1" value={form.carrierAddress1} onChange={e => update("carrierAddress1", e.target.value)} placeholder="Street address" />
              </TooltipField>
              <TooltipField label="Address Line 2" name="carrierAddress2">
                <Input id="carrierAddress2" value={form.carrierAddress2} onChange={e => update("carrierAddress2", e.target.value)} placeholder="Suite, unit, etc." />
              </TooltipField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TooltipField label="City, State, Zip" name="carrierCityStateZip">
                  <Input id="carrierCityStateZip" value={form.carrierCityStateZip} onChange={e => update("carrierCityStateZip", e.target.value)} placeholder="City, ST 00000" />
                </TooltipField>
                <TooltipField label="Phone Number" name="carrierPhone">
                  <Input id="carrierPhone" value={form.carrierPhone} onChange={e => update("carrierPhone", e.target.value)} placeholder="(000) 000-0000" />
                </TooltipField>
                <TooltipField label="Fax Number" name="carrierFax">
                  <Input id="carrierFax" value={form.carrierFax} onChange={e => update("carrierFax", e.target.value)} placeholder="(000) 000-0000" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Policy Number" name="policyNumber">
                  <Input id="policyNumber" value={form.policyNumber} onChange={e => update("policyNumber", e.target.value)} placeholder="Your policy number" />
                </TooltipField>
                <TooltipField label="Claim / Pre-Claim Number" name="claimPreClaimNumber">
                  <Input id="claimPreClaimNumber" value={form.claimPreClaimNumber} onChange={e => update("claimPreClaimNumber", e.target.value)} placeholder="If already assigned" />
                </TooltipField>
              </div>
            </div>
          )}

          {/* Step 2: Coverage Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Coverage Details</h2>
              <p className="text-sm text-slate-600">Enter the coverage details from your LTC insurance policy. These are critical for generating your personalized strategy.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Elimination Period" name="eliminationPeriod">
                  <Input id="eliminationPeriod" value={form.eliminationPeriod} onChange={e => update("eliminationPeriod", e.target.value)} placeholder="e.g., 90 days of service" />
                </TooltipField>
                <TooltipField label="Daily Maximum ($)" name="dailyMaximum">
                  <Input id="dailyMaximum" value={form.dailyMaximum} onChange={e => update("dailyMaximum", e.target.value)} placeholder="$ per day" />
                </TooltipField>
                <TooltipField label="Monthly Maximum ($)" name="monthlyMaximum">
                  <Input id="monthlyMaximum" value={form.monthlyMaximum} onChange={e => update("monthlyMaximum", e.target.value)} placeholder="$ per month" />
                </TooltipField>
                <TooltipField label="Lifetime Maximum ($)" name="lifetimeMaximum">
                  <Input id="lifetimeMaximum" value={form.lifetimeMaximum} onChange={e => update("lifetimeMaximum", e.target.value)} placeholder="$ lifetime" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Min # ADLs Compromised Required" name="minAdlsRequired">
                  <Select value={form.minAdlsRequired} onValueChange={v => update("minAdlsRequired", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                <TooltipField label="Payment Cycle" name="paymentCycle">
                  <Input id="paymentCycle" value={form.paymentCycle} onChange={e => update("paymentCycle", e.target.value)} placeholder="e.g., Monthly, Bi-weekly" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <TooltipField label="Waiver of Premium" name="waiverOfPremium">
                  <Select value={form.waiverOfPremium} onValueChange={v => update("waiverOfPremium", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes — Stop Payments</SelectItem><SelectItem value="no">No — Continue Payments</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                <TooltipField label="CNA Caregiver Required?" name="cnaRequired">
                  <Select value={form.cnaRequired} onValueChange={v => update("cnaRequired", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                <TooltipField label="Care Notes / Logsheets Required?" name="careNotesRequired">
                  <Select value={form.careNotesRequired} onValueChange={v => update("careNotesRequired", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
              </div>
              <TooltipField label="Assignment of Benefits (AOB)" name="assignmentOfBenefits">
                <Select value={form.assignmentOfBenefits} onValueChange={v => update("assignmentOfBenefits", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — Provider receives payment directly</SelectItem>
                    <SelectItem value="no">No — Insured pays provider, then submits for reimbursement</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipField>
              {form.assignmentOfBenefits && (
                <div className={`p-3 rounded-lg text-sm ${form.assignmentOfBenefits === "yes" ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
                  <Info className="w-4 h-4 inline mr-1" />
                  {form.assignmentOfBenefits === "yes"
                    ? "With AOB, your care provider will submit claims and receive payment directly from the insurance company."
                    : "Without AOB, you will pay your provider directly and then submit documentation to the insurance company for reimbursement."}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Medical & Administrative */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Medical & Administrative Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Case Manager Name" name="caseManagerName">
                  <Input id="caseManagerName" value={form.caseManagerName} onChange={e => update("caseManagerName", e.target.value)} placeholder="If assigned" />
                </TooltipField>
                <TooltipField label="LTC Coordinator Assigned" name="ltcCoordinatorAssigned">
                  <Input id="ltcCoordinatorAssigned" value={form.ltcCoordinatorAssigned} onChange={e => update("ltcCoordinatorAssigned", e.target.value)} placeholder="If assigned" />
                </TooltipField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Third Party Assessment Required?" name="thirdPartyAssessmentRequired">
                  <Select value={form.thirdPartyAssessmentRequired} onValueChange={v => update("thirdPartyAssessmentRequired", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                {form.thirdPartyAssessmentRequired === "yes" && (
                  <TooltipField label="Third Party Assessor (Who?)" name="thirdPartyAssessmentWho">
                    <Input id="thirdPartyAssessmentWho" value={form.thirdPartyAssessmentWho} onChange={e => update("thirdPartyAssessmentWho", e.target.value)} placeholder="Name of assessor if known" />
                  </TooltipField>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TooltipField label="Cognitive Impairment Trigger?" name="cognitiveImpairmentTrigger">
                  <Select value={form.cognitiveImpairmentTrigger} onValueChange={v => update("cognitiveImpairmentTrigger", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </TooltipField>
                <TooltipField label="Plan of Care Status" name="planOfCareStatus">
                  <Select value={form.planOfCareStatus} onValueChange={v => update("planOfCareStatus", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="submitted">Submitted to Carrier</SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipField>
              </div>
              {form.thirdPartyAssessmentRequired === "yes" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">⚠️ Third-Party Assessment Notice</h4>
                  <p className="text-sm text-amber-700">Your policy requires a third-party assessment. An independent RN will evaluate the insured's condition, ADL deficits, mobility, and cognitive function. <strong>Any inconsistencies between your documentation and the assessment may lead to denial.</strong> Your strategy will include detailed preparation guidance.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Care Needs & ADLs */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Care Needs & ADL Assessment</h2>
              <p className="text-sm text-slate-600">Describe the current care needs and identify which Activities of Daily Living (ADLs) are compromised.</p>
              <TooltipField label="Current Care Needs" name="currentCareNeeds">
                <Textarea id="currentCareNeeds" value={form.currentCareNeeds} onChange={e => update("currentCareNeeds", e.target.value)} placeholder="Describe current care needs and level of assistance required..." rows={3} />
              </TooltipField>
              <TooltipField label="Diagnosis or Condition" name="diagnosisOrCondition">
                <Textarea id="diagnosisOrCondition" value={form.diagnosisOrCondition} onChange={e => update("diagnosisOrCondition", e.target.value)} placeholder="Primary diagnosis, conditions, or cognitive impairments..." rows={3} />
              </TooltipField>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">ADL Limitations (Select all that apply — minimum {form.minAdlsRequired || "2"} required)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {adlOptions.map(adl => (
                    <label key={adl} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.adlLimitations.includes(adl) ? "bg-primary/10 border-primary" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <Checkbox checked={form.adlLimitations.includes(adl)} onCheckedChange={checked => {
                        update("adlLimitations", checked ? [...form.adlLimitations, adl] : form.adlLimitations.filter(a => a !== adl));
                      }} />
                      <span className="text-sm font-medium">{adl}</span>
                    </label>
                  ))}
                </div>
                {form.minAdlsRequired && form.adlLimitations.length > 0 && form.adlLimitations.length < parseInt(form.minAdlsRequired) && (
                  <p className="text-amber-600 text-sm mt-2">⚠️ Your policy requires at least {form.minAdlsRequired} ADLs to be in deficit. You've selected {form.adlLimitations.length}.</p>
                )}
              </div>
              <TooltipField label="Preferred Care Type" name="preferredCareType">
                <Select value={form.preferredCareType} onValueChange={v => update("preferredCareType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select preferred care type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home-care">Home Care</SelectItem>
                    <SelectItem value="assisted-living">Assisted Living</SelectItem>
                    <SelectItem value="nursing-home">Nursing Home</SelectItem>
                    <SelectItem value="adult-day-care">Adult Day Care</SelectItem>
                    <SelectItem value="combination">Combination</SelectItem>
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
                  { title: "Insured Person", items: [["Name", form.insuredFullName], ["DOB", form.insuredDob], ["Address", form.insuredMailingAddress], ["POA", form.powerOfAttorneyPresent], ["Relationship", form.fillerRelationship]] },
                  { title: "Carrier", items: [["Carrier", form.carrierName], ["Phone", form.carrierPhone], ["Policy #", form.policyNumber], ["Claim #", form.claimPreClaimNumber]] },
                  { title: "Coverage", items: [["Elimination Period", form.eliminationPeriod], ["Daily Max", form.dailyMaximum], ["Monthly Max", form.monthlyMaximum], ["Lifetime Max", form.lifetimeMaximum], ["Min ADLs", form.minAdlsRequired], ["AOB", form.assignmentOfBenefits], ["Waiver of Premium", form.waiverOfPremium]] },
                  { title: "Medical", items: [["Case Manager", form.caseManagerName], ["3rd Party Assessment", form.thirdPartyAssessmentRequired], ["Cognitive Trigger", form.cognitiveImpairmentTrigger], ["Plan of Care", form.planOfCareStatus]] },
                  { title: "Care Needs", items: [["ADLs", form.adlLimitations.join(", ") || "None selected"], ["Preferred Care", form.preferredCareType], ["Diagnosis", form.diagnosisOrCondition]] },
                ].map(section => (
                  <div key={section.title} className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">{section.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {section.items.map(([label, value]) => (
                        <div key={label as string}><span className="text-slate-500">{label}:</span> <span className="font-medium text-slate-700">{(value as string) || "—"}</span></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/education")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> {step > 0 ? "Previous" : "Education"}
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Progress
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => { handleSave(); setStep(step + 1); }} className="gap-1">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => { handleSave().then(() => navigate("/strategy")); }} className="gap-1 bg-green-600 hover:bg-green-700">
                Generate Strategy <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
