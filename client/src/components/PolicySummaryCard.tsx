import { Shield, User, Building2, DollarSign, Calendar, FileText, Activity, Brain } from "lucide-react";

interface PolicySummaryCardProps {
  policy: {
    insuredFullName?: string;
    insuredDob?: string;
    insuredEmail?: string;
    insuredPhone?: string;
    carrierName?: string;
    policyNumber?: string;
    claimPreClaimNumber?: string;
    eliminationPeriod?: string;
    dailyMaximum?: string | number;
    monthlyMaximum?: string | number;
    lifetimeMaximum?: string | number;
    waiverOfPremium?: string;
    assignmentOfBenefits?: string;
    qualifyingAdls?: string[];
    adlLimitations?: string[];
    cognitiveImpairmentTrigger?: string;
    caseManagerName?: string;
    thirdPartyAssessmentRequired?: string;
    diagnosisOrCondition?: string;
    primaryDiagnosis?: string;
  };
}

function formatCurrency(val: string | number | undefined): string {
  if (!val) return "N/A";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return String(val);
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PolicySummaryCard({ policy }: PolicySummaryCardProps) {
  const adls = policy.qualifyingAdls || policy.adlLimitations || [];
  const hasCognitive = policy.cognitiveImpairmentTrigger === "yes" || policy.cognitiveImpairmentTrigger === "Yes";
  const diagnosis = policy.diagnosisOrCondition || policy.primaryDiagnosis || "Not specified";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header band */}
      <div className="bg-gradient-to-r from-[#1a3a4a] to-[#2c5060] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">{policy.insuredFullName || "Insured"}</h2>
              <p className="text-white/85 text-sm">Policy #{policy.policyNumber || "N/A"}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/85 text-xs uppercase tracking-wider">Carrier</p>
            <p className="text-white font-medium text-sm">{policy.carrierName || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Benefits row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Daily Max</p>
          <p className="text-xl font-bold text-teal">{formatCurrency(policy.dailyMaximum)}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Monthly Max</p>
          <p className="text-xl font-bold text-teal">{formatCurrency(policy.monthlyMaximum)}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lifetime Max</p>
          <p className="text-xl font-bold text-teal">{formatCurrency(policy.lifetimeMaximum)}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        <DetailRow icon={<Calendar className="w-4 h-4" />} label="Elimination Period" value={policy.eliminationPeriod || "N/A"} />
        <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Waiver of Premium" value={policy.waiverOfPremium || "N/A"} />
        <DetailRow icon={<FileText className="w-4 h-4" />} label="Assignment of Benefits" value={policy.assignmentOfBenefits === "yes" ? "Yes — Provider billed directly" : policy.assignmentOfBenefits === "no" ? "No — Reimbursement model" : "N/A"} />
        <DetailRow icon={<User className="w-4 h-4" />} label="Case Manager" value={policy.caseManagerName || "Not assigned"} />
        <DetailRow icon={<Building2 className="w-4 h-4" />} label="Third-Party Assessment" value={policy.thirdPartyAssessmentRequired === "yes" ? "Required" : policy.thirdPartyAssessmentRequired === "no" ? "Not required" : "N/A"} />
        <DetailRow icon={<Activity className="w-4 h-4" />} label="Primary Diagnosis" value={diagnosis} />
      </div>

      {/* ADLs & Cognitive */}
      {(adls.length > 0 || hasCognitive) && (
        <div className="px-5 pb-5">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Qualifying Conditions</p>
            <div className="flex flex-wrap gap-2">
              {adls.map((adl, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-teal/10 text-teal font-medium">
                  {adl}
                </span>
              ))}
              {hasCognitive && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Cognitive Impairment
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="text-slate-400 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-500">{label}</span>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
