import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface FormData {
  // Insured Information
  insuredFullName: string;
  insuredDOB: string;
  insuredSSN: string;
  insuredMailingAddress: string;
  insuredCity: string;
  insuredState: string;
  insuredZip: string;

  // Carrier Information
  carrierName: string;
  carrierAddress1: string;
  carrierAddress2: string;
  carrierCity: string;
  carrierState: string;
  carrierZip: string;
  carrierPhone: string;
  carrierFax: string;

  // Policy Identifiers
  policyNumber: string;
  claimPreClaimNumber: string;

  // Coverage Details
  eliminationPeriod: string;
  dailyMaximum: string;
  monthlyMaximum: string;
  lifetimeMaximum: string;
  minAdlsRequired: string;
  waiverOfPremium: string;
  cnaRequired: string;
  logsheetsRequired: string;
  paymentCycle: string;
  assignmentOfBenefits: string;

  // Medical / Administrative
  caseManagerName: string;
  thirdPartyAssessmentRequired: string;
  cognitiveImpairmentTrigger: string;
  planOfCareStatus: string;
  ltcCoordinatorAssigned: string;

  // Primary Care Physician
  pcpName: string;
  pcpPhone: string;
  pcpLastVisitDate: string;

  // Other Providers
  otherProvidersInfo: string;

  // Insurance & Government
  medicareNumber: string;
  medicaidNumber: string;
  powerOfAttorneyPresent: string;

  // Facilities
  facilitiesUsed: string;
  dischargeDocumentation: string;
}

const fieldTooltips: Record<string, string> = {
  insuredFullName: "Full legal name of the person with the LTC policy",
  insuredDOB: "Date of birth (MM/DD/YYYY)",
  insuredSSN: "Social Security Number (last 4 digits minimum)",
  insuredMailingAddress: "Street address for mailing correspondence",
  carrierName: "Name of the insurance company providing LTC coverage",
  carrierPhone: "Main phone number for the insurance company",
  carrierFax: "Fax number for submitting documents",
  policyNumber: "The policy number from your insurance documents",
  claimPreClaimNumber: "Pre-claim number issued when initiating the claim process",
  eliminationPeriod: "Number of days you must pay out of pocket before insurance pays",
  dailyMaximum: "Maximum amount insurance will pay per day of service",
  monthlyMaximum: "Maximum amount insurance will pay per month",
  lifetimeMaximum: "Total lifetime benefit amount available under the policy",
  minAdlsRequired: "Minimum number of ADLs (Activities of Daily Living) required to trigger benefits",
  waiverOfPremium: "Does the policy stop charging premiums once care begins?",
  cnaRequired: "Does the insurance company require a Certified Nursing Assistant?",
  logsheetsRequired: "Must daily care logs be submitted to the insurance company?",
  paymentCycle: "How often does the insurance company review and pay invoices?",
  assignmentOfBenefits: "Does payment go directly to the care provider or to you?",
  caseManagerName: "Name of the assigned case manager at the insurance company",
  thirdPartyAssessmentRequired: "Will an independent nurse evaluate the insured?",
  cognitiveImpairmentTrigger: "Can cognitive decline (like Alzheimer's) trigger benefits?",
  planOfCareStatus: "Has a formal plan of care been created by a healthcare provider?",
  ltcCoordinatorAssigned: "Has an LTC coordinator been assigned?",
  pcpName: "Name of the primary care physician",
  pcpPhone: "Phone number to reach the primary care physician",
  pcpLastVisitDate: "Date of most recent visit to the primary care physician",
  medicareNumber: "Medicare identification number if applicable",
  medicaidNumber: "Medicaid identification number if applicable",
  powerOfAttorneyPresent: "Is there a Power of Attorney document on file?",
};

export function PolicyFormComprehensive() {
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = localStorage.getItem("policyFormData");
    return saved ? JSON.parse(saved) : {
      insuredFullName: "",
      insuredDOB: "",
      insuredSSN: "",
      insuredMailingAddress: "",
      insuredCity: "",
      insuredState: "",
      insuredZip: "",
      carrierName: "",
      carrierAddress1: "",
      carrierAddress2: "",
      carrierCity: "",
      carrierState: "",
      carrierZip: "",
      carrierPhone: "",
      carrierFax: "",
      policyNumber: "",
      claimPreClaimNumber: "",
      eliminationPeriod: "",
      dailyMaximum: "",
      monthlyMaximum: "",
      lifetimeMaximum: "",
      minAdlsRequired: "",
      waiverOfPremium: "",
      cnaRequired: "",
      logsheetsRequired: "",
      paymentCycle: "",
      assignmentOfBenefits: "",
      caseManagerName: "",
      thirdPartyAssessmentRequired: "",
      cognitiveImpairmentTrigger: "",
      planOfCareStatus: "",
      ltcCoordinatorAssigned: "",
      pcpName: "",
      pcpPhone: "",
      pcpLastVisitDate: "",
      otherProvidersInfo: "",
      medicareNumber: "",
      medicaidNumber: "",
      powerOfAttorneyPresent: "",
      facilitiesUsed: "",
      dischargeDocumentation: "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("policyFormData", JSON.stringify(formData));
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.insuredFullName.trim()) newErrors.insuredFullName = "Insured name is required";
    if (!formData.carrierName.trim()) newErrors.carrierName = "Carrier name is required";
    if (!formData.policyNumber.trim()) newErrors.policyNumber = "Policy number is required";

    // Email validation (if added)
    // Phone validation
    const phoneRegex = /^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\(\d{3}\) \d{3}-\d{4}$/;
    if (formData.carrierPhone && !phoneRegex.test(formData.carrierPhone.replace(/\D/g, ""))) {
      newErrors.carrierPhone = "Invalid phone number format";
    }
    if (formData.pcpPhone && !phoneRegex.test(formData.pcpPhone.replace(/\D/g, ""))) {
      newErrors.pcpPhone = "Invalid phone number format";
    }

    // SSN validation (basic)
    if (formData.insuredSSN && formData.insuredSSN.replace(/\D/g, "").length < 4) {
      newErrors.insuredSSN = "SSN must be at least 4 digits";
    }

    // Currency validation
    if (formData.dailyMaximum && isNaN(parseFloat(formData.dailyMaximum))) {
      newErrors.dailyMaximum = "Must be a valid number";
    }
    if (formData.monthlyMaximum && isNaN(parseFloat(formData.monthlyMaximum))) {
      newErrors.monthlyMaximum = "Must be a valid number";
    }
    if (formData.lifetimeMaximum && isNaN(parseFloat(formData.lifetimeMaximum))) {
      newErrors.lifetimeMaximum = "Must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const { user } = useAuth();
  const submitFormMutation = trpc.policyForm.sendToZapier.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error("You must be logged in to submit the form");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitFormMutation.mutateAsync({ formData, trigger: "completed" as const });
      setSubmitted(true);
      toast.success("Form submitted successfully!");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (
    label: string,
    fieldName: keyof FormData,
    type: string = "text",
    required: boolean = false,
    placeholder: string = ""
  ) => {
    const value = formData[fieldName];
    const error = errors[fieldName];

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldName} className="flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-teal cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{fieldTooltips[fieldName] || "Additional information"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id={fieldName}
          type={type}
          placeholder={placeholder}
          value={value as string}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          className={error ? "border-red-500" : ""}
        />
        {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    fieldName: keyof FormData,
    options: { value: string; label: string }[],
    required: boolean = false
  ) => {
    const value = formData[fieldName];

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldName} className="flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-teal cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{fieldTooltips[fieldName] || "Additional information"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select value={value as string} onValueChange={(val) => handleChange(fieldName, val)}>
          <SelectTrigger id={fieldName}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-8 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Insured Information Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Insured Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Full Name", "insuredFullName", "text", true, "John Doe")}
            {renderField("Date of Birth", "insuredDOB", "date", false)}
            {renderField("Social Security Number", "insuredSSN", "text", false, "XXX-XX-1234")}
            {renderField("Mailing Address", "insuredMailingAddress", "text", false)}
            {renderField("City", "insuredCity", "text", false)}
            {renderField("State", "insuredState", "text", false)}
            {renderField("Zip Code", "insuredZip", "text", false)}
          </div>
        </Card>

        {/* Carrier Information Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Insurance Carrier Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Carrier Name", "carrierName", "text", true, "Insurance Company Name")}
            {renderField("Address Line 1", "carrierAddress1", "text", false)}
            {renderField("Address Line 2", "carrierAddress2", "text", false)}
            {renderField("City", "carrierCity", "text", false)}
            {renderField("State", "carrierState", "text", false)}
            {renderField("Zip Code", "carrierZip", "text", false)}
            {renderField("Phone Number", "carrierPhone", "tel", false, "(555) 123-4567")}
            {renderField("Fax Number", "carrierFax", "tel", false, "(555) 123-4568")}
          </div>
        </Card>

        {/* Policy Identifiers Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Policy Identifiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Policy Number", "policyNumber", "text", true, "POL-123456789")}
            {renderField("Claim/Pre-Claim Number", "claimPreClaimNumber", "text", false, "CLM-123456")}
          </div>
        </Card>

        {/* Coverage Details Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Coverage Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Elimination Period (days)", "eliminationPeriod", "number", false, "90")}
            {renderField("Daily Maximum ($)", "dailyMaximum", "number", false, "200")}
            {renderField("Monthly Maximum ($)", "monthlyMaximum", "number", false, "6000")}
            {renderField("Lifetime Maximum ($)", "lifetimeMaximum", "number", false, "250000")}
            {renderSelect("Min # ADLs Required", "minAdlsRequired", [
              { value: "1", label: "1 ADL" },
              { value: "2", label: "2 ADLs" },
              { value: "3", label: "3 ADLs" },
              { value: "4", label: "4 ADLs" },
            ])}
            {renderSelect("Waiver of Premium", "waiverOfPremium", [
              { value: "yes", label: "Yes - Premiums stop" },
              { value: "no", label: "No - Premiums continue" },
              { value: "unknown", label: "Unknown" },
            ])}
            {renderSelect("CNA Required", "cnaRequired", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "Unknown" },
            ])}
            {renderSelect("Logsheets Required", "logsheetsRequired", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "Unknown" },
            ])}
            {renderSelect("Payment Cycle", "paymentCycle", [
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Bi-weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "unknown", label: "Unknown" },
            ])}
            {renderSelect("Assignment of Benefits", "assignmentOfBenefits", [
              { value: "yes", label: "Yes - Payment to provider" },
              { value: "no", label: "No - Payment to insured" },
              { value: "unknown", label: "Unknown" },
            ])}
          </div>
        </Card>

        {/* Medical / Administrative Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Medical & Administrative</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Case Manager Name", "caseManagerName", "text", false)}
            {renderSelect("Third Party Assessment Required", "thirdPartyAssessmentRequired", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "Unknown" },
            ])}
            {renderSelect("Cognitive Impairment Trigger", "cognitiveImpairmentTrigger", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "Unknown" },
            ])}
            {renderSelect("Plan of Care Status", "planOfCareStatus", [
              { value: "completed", label: "Completed" },
              { value: "pending", label: "Pending" },
              { value: "not-started", label: "Not Started" },
            ])}
            {renderSelect("LTC Coordinator Assigned", "ltcCoordinatorAssigned", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unknown", label: "Unknown" },
            ])}
          </div>
        </Card>

        {/* Healthcare Providers Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Healthcare Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Primary Care Physician Name", "pcpName", "text", false)}
            {renderField("PCP Phone Number", "pcpPhone", "tel", false, "(555) 123-4567")}
            {renderField("Last Visit Date", "pcpLastVisitDate", "date", false)}
            <div className="md:col-span-2">
              {renderField("Other Providers Info", "otherProvidersInfo", "text", false, "Specialists, facilities, etc.")}
            </div>
          </div>
        </Card>

        {/* Insurance & Government Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Insurance & Government Programs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField("Medicare Number", "medicareNumber", "text", false)}
            {renderField("Medicaid Number", "medicaidNumber", "text", false)}
            {renderSelect("Power of Attorney Present", "powerOfAttorneyPresent", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "pending", label: "Pending" },
            ])}
          </div>
        </Card>

        {/* Facilities & Documentation Section */}
        <Card className="p-6">
          <h3 className="font-serif text-xl font-bold mb-4 text-teal">Facilities & Documentation</h3>
          <div className="grid grid-cols-1 gap-4">
            {renderField("Facilities Used", "facilitiesUsed", "text", false, "Hospital, nursing home, etc.")}
            {renderSelect("Discharge Documentation", "dischargeDocumentation", [
              { value: "available", label: "Available" },
              { value: "pending", label: "Pending" },
              { value: "not-applicable", label: "Not Applicable" },
            ])}
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="submit" size="lg" className="bg-teal hover:bg-teal-dark" disabled={isSubmitting || submitted}>
            {submitted ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
            {isSubmitting ? "Submitting..." : submitted ? "Submitted!" : "Submit Form"}
          </Button>
        </div>

        {submitted && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Form submitted successfully! Your information has been saved and sent to our system.
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
