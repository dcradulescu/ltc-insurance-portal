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
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ClipboardList, ArrowRight, ArrowLeft, Save, Loader2, Shield } from "lucide-react";

const adlOptions = [
  "Bathing",
  "Dressing",
  "Eating",
  "Toileting",
  "Transferring",
  "Continence",
];

const insuranceCompanies = [
  "Genworth",
  "John Hancock",
  "Mutual of Omaha",
  "Northwestern Mutual",
  "New York Life",
  "MassMutual",
  "Unum",
  "Transamerica",
  "Lincoln Financial",
  "Prudential",
  "MetLife",
  "CNA",
  "Bankers Life",
  "State Farm",
  "Other",
];

type FormData = {
  holderFirstName: string;
  holderLastName: string;
  holderDateOfBirth: string;
  holderRelationship: string;
  insuranceCompany: string;
  policyNumber: string;
  policyType: string;
  policyStatus: string;
  effectiveDate: string;
  dailyBenefitAmount: string;
  benefitPeriod: string;
  eliminationPeriod: string;
  inflationProtection: string;
  homeCareCoverage: string;
  facilityCareCoverage: string;
  currentCareNeeds: string;
  diagnosisOrCondition: string;
  adlLimitations: string[];
  cognitiveImpairment: string;
  currentCareReceiving: string;
  preferredCareType: string;
  priorClaimsFiled: string;
  priorClaimsDetails: string;
  additionalNotes: string;
};

const defaultFormData: FormData = {
  holderFirstName: "",
  holderLastName: "",
  holderDateOfBirth: "",
  holderRelationship: "",
  insuranceCompany: "",
  policyNumber: "",
  policyType: "",
  policyStatus: "",
  effectiveDate: "",
  dailyBenefitAmount: "",
  benefitPeriod: "",
  eliminationPeriod: "",
  inflationProtection: "",
  homeCareCoverage: "",
  facilityCareCoverage: "",
  currentCareNeeds: "",
  diagnosisOrCondition: "",
  adlLimitations: [],
  cognitiveImpairment: "",
  currentCareReceiving: "",
  preferredCareType: "",
  priorClaimsFiled: "",
  priorClaimsDetails: "",
  additionalNotes: "",
};

export default function PolicyForm() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [policyId, setPolicyId] = useState<number | undefined>();

  const existingPolicy = trpc.policy.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const saveMutation = trpc.policy.save.useMutation({
    onSuccess: (data) => {
      setPolicyId(data.id);
      toast.success("Policy information saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save policy information. Please try again.");
    },
  });

  // Load existing policy data
  useEffect(() => {
    if (existingPolicy.data) {
      const p = existingPolicy.data;
      setPolicyId(p.id);
      setFormData({
        holderFirstName: p.holderFirstName || "",
        holderLastName: p.holderLastName || "",
        holderDateOfBirth: p.holderDateOfBirth || "",
        holderRelationship: p.holderRelationship || "",
        insuranceCompany: p.insuranceCompany || "",
        policyNumber: p.policyNumber || "",
        policyType: p.policyType || "",
        policyStatus: p.policyStatus || "",
        effectiveDate: p.effectiveDate || "",
        dailyBenefitAmount: p.dailyBenefitAmount || "",
        benefitPeriod: p.benefitPeriod || "",
        eliminationPeriod: p.eliminationPeriod || "",
        inflationProtection: p.inflationProtection || "",
        homeCareCoverage: p.homeCareCoverage || "",
        facilityCareCoverage: p.facilityCareCoverage || "",
        currentCareNeeds: p.currentCareNeeds || "",
        diagnosisOrCondition: p.diagnosisOrCondition || "",
        adlLimitations: Array.isArray(p.adlLimitations) ? (p.adlLimitations as string[]) : [],
        cognitiveImpairment: p.cognitiveImpairment || "",
        currentCareReceiving: p.currentCareReceiving || "",
        preferredCareType: p.preferredCareType || "",
        priorClaimsFiled: p.priorClaimsFiled || "",
        priorClaimsDetails: p.priorClaimsDetails || "",
        additionalNotes: p.additionalNotes || "",
      });
    }
  }, [existingPolicy.data]);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAdl = (adl: string) => {
    setFormData((prev) => ({
      ...prev,
      adlLimitations: prev.adlLimitations.includes(adl)
        ? prev.adlLimitations.filter((a) => a !== adl)
        : [...prev.adlLimitations, adl],
    }));
  };

  const handleSave = () => {
    saveMutation.mutate({
      id: policyId,
      ...formData,
    });
  };

  const handleSubmitAndGenerate = () => {
    saveMutation.mutate(
      { id: policyId, ...formData },
      {
        onSuccess: (data) => {
          navigate(`/strategy?policyId=${data.id}`);
        },
      }
    );
  };

  const totalSteps = 4;

  const stepTitles = useMemo(() => [
    "Policy Holder Information",
    "Policy Details & Benefits",
    "Current Care Needs",
    "Additional Information",
  ], []);

  if (!authLoading && !isAuthenticated) {
    return (
      <Layout>
        <section className="py-20 bg-secondary">
          <div className="container max-w-lg text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to access the policy intake form. Your information will be securely saved to your account.
            </p>
            <Button asChild size="lg">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardList className="w-6 h-6 text-primary" />
            <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Policy Intake Form</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
            Tell Us About Your Policy
          </h1>
          <p className="text-white/80 max-w-2xl">
            Complete this form to receive a personalized strategy for filing your long-term care insurance claim. All information is securely stored.
          </p>
        </div>
      </section>

      {/* Video */}
      <section className="py-8 bg-secondary">
        <div className="container max-w-4xl">
          <VideoPlaceholder
            title="How to Complete the Policy Form"
            description="Watch this guide to understand what information you'll need and how to find it in your policy documents"
          />
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-white">
        <div className="container max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-foreground">Step {step} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">{stepTitles[step - 1]}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Policy Holder Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Policy Holder Information</h2>
              <p className="text-muted-foreground">Enter the details of the person covered by the LTC insurance policy.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="holderFirstName">First Name</Label>
                  <Input id="holderFirstName" value={formData.holderFirstName} onChange={(e) => updateField("holderFirstName", e.target.value)} placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holderLastName">Last Name</Label>
                  <Input id="holderLastName" value={formData.holderLastName} onChange={(e) => updateField("holderLastName", e.target.value)} placeholder="Enter last name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="holderDateOfBirth">Date of Birth</Label>
                  <Input id="holderDateOfBirth" type="date" value={formData.holderDateOfBirth} onChange={(e) => updateField("holderDateOfBirth", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holderRelationship">Your Relationship to Policy Holder</Label>
                  <Select value={formData.holderRelationship} onValueChange={(v) => updateField("holderRelationship", v)}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Policy Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Policy Details & Benefits</h2>
              <p className="text-muted-foreground">Enter the details from your LTC insurance policy. You can find most of this information on your policy declarations page.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany">Insurance Company</Label>
                  <Select value={formData.insuranceCompany} onValueChange={(v) => updateField("insuranceCompany", v)}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      {insuranceCompanies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input id="policyNumber" value={formData.policyNumber} onChange={(e) => updateField("policyNumber", e.target.value)} placeholder="Enter policy number" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policyType">Policy Type</Label>
                  <Select value={formData.policyType} onValueChange={(v) => updateField("policyType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traditional">Traditional LTC</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Life/LTC)</SelectItem>
                      <SelectItem value="partnership">Partnership Policy</SelectItem>
                      <SelectItem value="group">Group/Employer Policy</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyStatus">Policy Status</Label>
                  <Select value={formData.policyStatus} onValueChange={(v) => updateField("policyStatus", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Premiums Current)</SelectItem>
                      <SelectItem value="paid-up">Paid Up</SelectItem>
                      <SelectItem value="lapsed">Lapsed</SelectItem>
                      <SelectItem value="reduced">Reduced Paid-Up</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Policy Effective Date</Label>
                <Input id="effectiveDate" type="date" value={formData.effectiveDate} onChange={(e) => updateField("effectiveDate", e.target.value)} />
              </div>

              <hr className="border-border" />
              <h3 className="font-serif text-xl font-bold text-foreground">Benefits</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyBenefitAmount">Daily Benefit Amount</Label>
                  <Input id="dailyBenefitAmount" value={formData.dailyBenefitAmount} onChange={(e) => updateField("dailyBenefitAmount", e.target.value)} placeholder="e.g., $150/day" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benefitPeriod">Benefit Period</Label>
                  <Select value={formData.benefitPeriod} onValueChange={(v) => updateField("benefitPeriod", v)}>
                    <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-years">2 Years</SelectItem>
                      <SelectItem value="3-years">3 Years</SelectItem>
                      <SelectItem value="4-years">4 Years</SelectItem>
                      <SelectItem value="5-years">5 Years</SelectItem>
                      <SelectItem value="6-years">6 Years</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eliminationPeriod">Elimination Period</Label>
                  <Select value={formData.eliminationPeriod} onValueChange={(v) => updateField("eliminationPeriod", v)}>
                    <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-days">0 Days</SelectItem>
                      <SelectItem value="30-days">30 Days</SelectItem>
                      <SelectItem value="60-days">60 Days</SelectItem>
                      <SelectItem value="90-days">90 Days</SelectItem>
                      <SelectItem value="100-days">100 Days</SelectItem>
                      <SelectItem value="180-days">180 Days</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inflationProtection">Inflation Protection</Label>
                  <Select value={formData.inflationProtection} onValueChange={(v) => updateField("inflationProtection", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="simple-3">Simple 3%</SelectItem>
                      <SelectItem value="simple-5">Simple 5%</SelectItem>
                      <SelectItem value="compound-3">Compound 3%</SelectItem>
                      <SelectItem value="compound-5">Compound 5%</SelectItem>
                      <SelectItem value="cpi">CPI-Based</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeCareCoverage">Home Care Coverage</Label>
                  <Select value={formData.homeCareCoverage} onValueChange={(v) => updateField("homeCareCoverage", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityCareCoverage">Facility Care Coverage</Label>
                  <Select value={formData.facilityCareCoverage} onValueChange={(v) => updateField("facilityCareCoverage", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unsure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Care Needs */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Current Care Needs</h2>
              <p className="text-muted-foreground">Help us understand the current care situation so we can tailor your strategy.</p>

              <div className="space-y-2">
                <Label htmlFor="diagnosisOrCondition">Primary Diagnosis or Condition</Label>
                <Textarea id="diagnosisOrCondition" value={formData.diagnosisOrCondition} onChange={(e) => updateField("diagnosisOrCondition", e.target.value)} placeholder="Describe the primary medical condition or diagnosis" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentCareNeeds">Describe Current Care Needs</Label>
                <Textarea id="currentCareNeeds" value={formData.currentCareNeeds} onChange={(e) => updateField("currentCareNeeds", e.target.value)} placeholder="Describe what type of care and assistance is needed on a daily basis" rows={4} />
              </div>

              <div className="space-y-3">
                <Label>Activities of Daily Living (ADL) Limitations</Label>
                <p className="text-sm text-muted-foreground">Select all ADLs that the policy holder needs substantial assistance with:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adlOptions.map((adl) => (
                    <label key={adl} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors">
                      <Checkbox
                        checked={formData.adlLimitations.includes(adl)}
                        onCheckedChange={() => toggleAdl(adl)}
                      />
                      <span className="text-sm text-foreground">{adl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cognitiveImpairment">Cognitive Impairment</Label>
                <Select value={formData.cognitiveImpairment} onValueChange={(v) => updateField("cognitiveImpairment", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - Diagnosed cognitive impairment</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="suspected">Suspected but not formally diagnosed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentCareReceiving">Current Care Being Received</Label>
                <Textarea id="currentCareReceiving" value={formData.currentCareReceiving} onChange={(e) => updateField("currentCareReceiving", e.target.value)} placeholder="Describe any care currently being received (e.g., home health aide 4 hours/day)" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredCareType">Preferred Type of Care</Label>
                <Select value={formData.preferredCareType} onValueChange={(v) => updateField("preferredCareType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select preferred care" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home-care">Home Care</SelectItem>
                    <SelectItem value="assisted-living">Assisted Living Facility</SelectItem>
                    <SelectItem value="nursing-home">Nursing Home</SelectItem>
                    <SelectItem value="adult-day-care">Adult Day Care</SelectItem>
                    <SelectItem value="combination">Combination of Services</SelectItem>
                    <SelectItem value="unsure">Not Sure Yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Additional Info */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Additional Information</h2>
              <p className="text-muted-foreground">Any additional details that may help us create a more effective strategy for you.</p>

              <div className="space-y-2">
                <Label htmlFor="priorClaimsFiled">Have any prior claims been filed on this policy?</Label>
                <Select value={formData.priorClaimsFiled} onValueChange={(v) => updateField("priorClaimsFiled", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unsure">Not Sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.priorClaimsFiled === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="priorClaimsDetails">Prior Claims Details</Label>
                  <Textarea id="priorClaimsDetails" value={formData.priorClaimsDetails} onChange={(e) => updateField("priorClaimsDetails", e.target.value)} placeholder="Describe any previous claims, including outcomes" rows={3} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes or Concerns</Label>
                <Textarea id="additionalNotes" value={formData.additionalNotes} onChange={(e) => updateField("additionalNotes", e.target.value)} placeholder="Any other information you'd like us to know about your situation" rows={4} />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="font-serif font-bold text-foreground mb-2">What Happens Next?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After submitting your information, our system will analyze your policy details and care needs to generate a comprehensive, personalized strategy for filing your LTC insurance claim. You will be able to download this strategy as a PDF and email it to yourself or family members.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Progress
              </Button>
              {step < totalSteps ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmitAndGenerate} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Generate My Strategy <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
