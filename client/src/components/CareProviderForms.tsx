import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Download, CheckCircle } from "lucide-react";

interface CareProviderFormsProps {
  policyId: number;
  insuredName: string;
  onFormSubmit?: (formData: any) => void;
}

export function CareProviderForms({ policyId, insuredName, onFormSubmit }: CareProviderFormsProps) {
  const [activeTab, setActiveTab] = useState("plan-of-care");
  const [planOfCareData, setPlanOfCareData] = useState({
    providerName: "",
    providerLicense: "",
    serviceStartDate: "",
    careActivities: [] as string[],
    hoursPerWeek: "",
    costPerHour: "",
    notes: "",
  });

  const [w9Data, setW9Data] = useState({
    businessName: "",
    ein: "",
    ssn: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  });

  const [licenseData, setLicenseData] = useState({
    licenseNumber: "",
    licenseState: "",
    licenseExpiration: "",
    licenseFile: null as File | null,
  });

  const careActivities = [
    "Bathing/Showering",
    "Dressing",
    "Toileting",
    "Transferring",
    "Ambulation",
    "Feeding",
    "Medication Management",
    "Meal Preparation",
    "Housekeeping",
    "Laundry",
    "Shopping",
    "Transportation",
    "Companionship",
    "Other",
  ];

  const handlePlanOfCareChange = (field: string, value: any) => {
    setPlanOfCareData({ ...planOfCareData, [field]: value });
  };

  const handleW9Change = (field: string, value: string) => {
    setW9Data({ ...w9Data, [field]: value });
  };

  const handleLicenseChange = (field: string, value: any) => {
    setLicenseData({ ...licenseData, [field]: value });
  };

  const toggleCareActivity = (activity: string) => {
    const updated = planOfCareData.careActivities.includes(activity)
      ? planOfCareData.careActivities.filter((a) => a !== activity)
      : [...planOfCareData.careActivities, activity];
    handlePlanOfCareChange("careActivities", updated);
  };

  const downloadPlanOfCare = () => {
    const content = `
PLAN OF CARE - ${insuredName}
Policy ID: ${policyId}
Generated: ${new Date().toLocaleDateString()}

CARE PROVIDER INFORMATION
Provider Name: ${planOfCareData.providerName}
License Number: ${planOfCareData.providerLicense}
Service Start Date: ${planOfCareData.serviceStartDate}

CARE ACTIVITIES
${planOfCareData.careActivities.map((a) => `- ${a}`).join("\n")}

CARE SCHEDULE
Hours Per Week: ${planOfCareData.hoursPerWeek}
Cost Per Hour: $${planOfCareData.costPerHour}

ADDITIONAL NOTES
${planOfCareData.notes}
    `;
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan-of-Care-${insuredName}.txt`;
    a.click();
  };

  const downloadW9 = () => {
    const content = `
W-9 FORM - CARE PROVIDER
Policy ID: ${policyId}
Insured: ${insuredName}
Generated: ${new Date().toLocaleDateString()}

BUSINESS INFORMATION
Business Name: ${w9Data.businessName}
EIN/SSN: ${w9Data.ein || w9Data.ssn}

ADDRESS
${w9Data.address}
${w9Data.city}, ${w9Data.state} ${w9Data.zip}

CONTACT INFORMATION
Phone: ${w9Data.phone}
Email: ${w9Data.email}

Note: This is a reference form. Please obtain the official W-9 form from the IRS.
    `;
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `W9-${w9Data.businessName}.txt`;
    a.click();
  };

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plan-of-care">Plan of Care</TabsTrigger>
          <TabsTrigger value="w9">W-9 Form</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
        </TabsList>

        {/* PLAN OF CARE TAB */}
        <TabsContent value="plan-of-care" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan of Care</CardTitle>
              <CardDescription>
                Document the care services, schedule, and activities provided
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Provider Name</label>
                  <Input
                    value={planOfCareData.providerName}
                    onChange={(e) => handlePlanOfCareChange("providerName", e.target.value)}
                    placeholder="Care provider name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">License Number</label>
                  <Input
                    value={planOfCareData.providerLicense}
                    onChange={(e) => handlePlanOfCareChange("providerLicense", e.target.value)}
                    placeholder="License #"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Service Start Date</label>
                <Input
                  type="date"
                  value={planOfCareData.serviceStartDate}
                  onChange={(e) => handlePlanOfCareChange("serviceStartDate", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Care Activities</label>
                <div className="grid grid-cols-2 gap-3">
                  {careActivities.map((activity) => (
                    <label key={activity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planOfCareData.careActivities.includes(activity)}
                        onChange={() => toggleCareActivity(activity)}
                        className="rounded"
                      />
                      <span className="text-sm">{activity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hours Per Week</label>
                  <Input
                    type="number"
                    value={planOfCareData.hoursPerWeek}
                    onChange={(e) => handlePlanOfCareChange("hoursPerWeek", e.target.value)}
                    placeholder="Hours"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost Per Hour</label>
                  <Input
                    type="number"
                    value={planOfCareData.costPerHour}
                    onChange={(e) => handlePlanOfCareChange("costPerHour", e.target.value)}
                    placeholder="$0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Additional Notes</label>
                <Textarea
                  value={planOfCareData.notes}
                  onChange={(e) => handlePlanOfCareChange("notes", e.target.value)}
                  placeholder="Any additional care details or special instructions"
                  rows={4}
                />
              </div>

              <Button onClick={downloadPlanOfCare} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download Plan of Care
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* W-9 FORM TAB */}
        <TabsContent value="w9" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>W-9 Form</CardTitle>
              <CardDescription>
                Request for Taxpayer Identification Number and Certification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Business Name</label>
                <Input
                  value={w9Data.businessName}
                  onChange={(e) => handleW9Change("businessName", e.target.value)}
                  placeholder="Business or individual name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">EIN (if applicable)</label>
                  <Input
                    value={w9Data.ein}
                    onChange={(e) => handleW9Change("ein", e.target.value)}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SSN</label>
                  <Input
                    value={w9Data.ssn}
                    onChange={(e) => handleW9Change("ssn", e.target.value)}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Street Address</label>
                <Input
                  value={w9Data.address}
                  onChange={(e) => handleW9Change("address", e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={w9Data.city}
                    onChange={(e) => handleW9Change("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={w9Data.state}
                    onChange={(e) => handleW9Change("state", e.target.value)}
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ZIP</label>
                  <Input
                    value={w9Data.zip}
                    onChange={(e) => handleW9Change("zip", e.target.value)}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={w9Data.phone}
                    onChange={(e) => handleW9Change("phone", e.target.value)}
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={w9Data.email}
                    onChange={(e) => handleW9Change("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <Button onClick={downloadW9} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download W-9 Reference Form
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LICENSE TAB */}
        <TabsContent value="license" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>State License Verification</CardTitle>
              <CardDescription>
                Upload and track care provider state license information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">License Number</label>
                  <Input
                    value={licenseData.licenseNumber}
                    onChange={(e) => handleLicenseChange("licenseNumber", e.target.value)}
                    placeholder="License number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">License State</label>
                  <Input
                    value={licenseData.licenseState}
                    onChange={(e) => handleLicenseChange("licenseState", e.target.value)}
                    placeholder="State abbreviation"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">License Expiration Date</label>
                <Input
                  type="date"
                  value={licenseData.licenseExpiration}
                  onChange={(e) => handleLicenseChange("licenseExpiration", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Upload License Document</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <input
                    type="file"
                    onChange={(e) => handleLicenseChange("licenseFile", e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>

              {licenseData.licenseFile && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">{licenseData.licenseFile.name}</span>
                </div>
              )}

              <Button className="w-full">Save License Information</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
