import { useState, useMemo } from "react";
import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CareCalculatorProps {
  defaultDailyMax?: number | string;
  lifetimeMaximum?: number | string;
}

export function CareCalculator({ defaultDailyMax = 250, lifetimeMaximum = 500000 }: CareCalculatorProps) {
  const [showCalculator, setShowCalculator] = useState(true);
  const [dailyMax, setDailyMax] = useState<string>(String(defaultDailyMax));
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [hoursPerDay, setHoursPerDay] = useState<string>("");
  const [daysPerWeek, setDaysPerWeek] = useState<string>("");
  const [lifetimeMax, setLifetimeMax] = useState<string>(String(lifetimeMaximum));
  const [hasWaiverOfPremium, setHasWaiverOfPremium] = useState(false);
  const [monthlyPremium, setMonthlyPremium] = useState<string>("");
  const [hasInflationRider, setHasInflationRider] = useState(false);
  const [inflationPercentage, setInflationPercentage] = useState<string>("");

  const parseCurrencyValue = (value: string | number): number => {
    if (typeof value === "number") return value;
    const cleaned = String(value).replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculations = useMemo(() => {
    try {
      const daily = parseCurrencyValue(dailyMax);
      const hourly = parseCurrencyValue(hourlyRate);
      const hours = parseFloat(hoursPerDay);
      const days = parseFloat(daysPerWeek);
      const lifetime = parseCurrencyValue(lifetimeMax);

      if (!daily || !hourly || !hours || !days || !lifetime) {
        return null;
      }

      const maxHoursPerDay = daily / hourly;
      const requestedHours = hours;
      const isWithinMax = requestedHours <= maxHoursPerDay;

      const dailyCost = hourly * hours;
      const weeklyCost = dailyCost * days;
      const monthlyCost = weeklyCost * 4.33;

      const insurancePaysDaily = isWithinMax ? dailyCost : daily;
      const youPayDaily = isWithinMax ? 0 : dailyCost - daily;

      const insurancePaysWeekly = insurancePaysDaily * days;
      const youPayWeekly = youPayDaily * days;

      const insurancePaysMontly = insurancePaysWeekly * 4.33;
      const youPayMontly = youPayWeekly * 4.33;

      const weeksOfCare = Math.floor(lifetime / insurancePaysWeekly);
      const yearsOfCare = (weeksOfCare / 52).toFixed(1);
      const monthsOfCare = Math.floor(weeksOfCare / 4.33);

      // Premium waiver calculations
      const premiumAmount = parseCurrencyValue(monthlyPremium);
      // Daily: divide monthly premium by actual care days per month (daysPerWeek * 4.33)
      const careDaysPerMonth = days * 4.33;
      const premiumSavingsDaily = hasWaiverOfPremium ? (premiumAmount / careDaysPerMonth) : 0;
      // Weekly: daily offset × days per week (100% realization of premium waiver)
      const premiumSavingsWeekly = hasWaiverOfPremium ? (premiumSavingsDaily * days) : 0;
      // Monthly: use full premium amount
      const premiumSavingsMonthly = hasWaiverOfPremium ? premiumAmount : 0;

      const netDailyCost = (insurancePaysDaily - premiumSavingsDaily).toFixed(2);
      const netWeeklyCost = (insurancePaysWeekly - premiumSavingsWeekly).toFixed(2);
      const netMonthlyCost = (insurancePaysMontly - premiumSavingsMonthly).toFixed(2);

      const weeksOfCareWithWaiver = hasWaiverOfPremium 
        ? Math.floor(lifetime / (insurancePaysWeekly - premiumSavingsWeekly))
        : weeksOfCare;
      const yearsOfCareWithWaiver = (weeksOfCareWithWaiver / 52).toFixed(1);
      const monthsOfCareWithWaiver = Math.floor(weeksOfCareWithWaiver / 4.33);

      return {
        maxHoursPerDay: maxHoursPerDay.toFixed(2),
        requestedHours: requestedHours.toFixed(2),
        isWithinMax,
        costPerHour: hourly.toFixed(2),
        totalDailyCost: dailyCost.toFixed(2),
        insurancePaysDaily: insurancePaysDaily.toFixed(2),
        youPayDaily: youPayDaily.toFixed(2),
        insurancePaysWeekly: insurancePaysWeekly.toFixed(2),
        youPayWeekly: youPayWeekly.toFixed(2),
        insurancePaysMontly: insurancePaysMontly.toFixed(2),
        youPayMontly: youPayMontly.toFixed(2),
        weeksOfCare,
        yearsOfCare,
        monthsOfCare,
        premiumSavingsDaily: premiumSavingsDaily.toFixed(2),
        premiumSavingsWeekly: premiumSavingsWeekly.toFixed(2),
        premiumSavingsMonthly: premiumSavingsMonthly.toFixed(2),
        netDailyCost,
        netWeeklyCost,
        netMonthlyCost,
        weeksOfCareWithWaiver,
        yearsOfCareWithWaiver,
        monthsOfCareWithWaiver,
      };
    } catch (_e) {
      return null;
    }
  }, [dailyMax, hourlyRate, hoursPerDay, daysPerWeek, lifetimeMax, hasWaiverOfPremium, monthlyPremium, hasInflationRider, inflationPercentage]);

  // Calculate 5-year projection data for chart
  const projectionData = useMemo(() => {
    if (!calculations) return null;
    
    const data = [];
    const monthlyCareCost = parseFloat(calculations.insurancePaysMontly);
    const lifetimeMaximumVal = parseCurrencyValue(lifetimeMax);
    const inflation = hasInflationRider && inflationPercentage ? parseFloat(inflationPercentage) : 0;
    
    let remainingBenefit = lifetimeMaximumVal;
    
    for (let month = 1; month <= 60; month++) {
      const year = Math.ceil(month / 12);
      const annualIncreaseMultiplier = Math.pow(1.10, year - 1);
      const currentMonthCareCost = monthlyCareCost * annualIncreaseMultiplier;
      const inflationMultiplier = inflation > 0 ? Math.pow(1 + inflation / 100, year - 1) : 1;
      
      remainingBenefit = Math.max(0, remainingBenefit - currentMonthCareCost);
      
      data.push({
        month: `M${month}`,
        benefitRemaining: Math.round(remainingBenefit),
        monthlyCost: Math.round(currentMonthCareCost),
      });
    }
    
    return data;
  }, [calculations, lifetimeMax, hasInflationRider, inflationPercentage]);

  return (
    <div className="mb-8 p-6 rounded-lg border border-slate-200 bg-slate-50">
      <button
        onClick={() => setShowCalculator(!showCalculator)}
        className="w-full flex items-center justify-between hover:opacity-75 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal" />
          <h3 className="font-semibold text-slate-900">Care Cost Calculator</h3>
        </div>
        {showCalculator ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {showCalculator && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-slate-600">
            Calculate how many hours of care your policy will cover and how long your benefits will last
          </p>

          {/* Input Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dailyMax" className="text-sm font-medium text-slate-900">
                Daily Maximum ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dailyMax"
                type="number"
                placeholder="e.g., 100"
                value={dailyMax}
                onChange={(e) => setDailyMax(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum daily benefit from your policy</p>
            </div>

            <div>
              <Label htmlFor="hourlyRate" className="text-sm font-medium text-slate-900">
                Hourly Care Rate ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="e.g., 30"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Cost per hour for care services</p>
            </div>

            <div>
              <Label htmlFor="hoursPerDay" className="text-sm font-medium text-slate-900">
                Hours of Care Per Day <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hoursPerDay"
                type="number"
                placeholder="e.g., 4"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Requested hours per day</p>
            </div>

            <div>
              <Label htmlFor="daysPerWeek" className="text-sm font-medium text-slate-900">
                Days of Care Per Week <span className="text-red-500">*</span>
              </Label>
              <Input
                id="daysPerWeek"
                type="number"
                placeholder="e.g., 4"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Days per week you need care</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="lifetimeMax" className="text-sm font-medium text-slate-900">
                Lifetime Maximum ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lifetimeMax"
                type="number"
                placeholder="e.g., 500000"
                value={lifetimeMax}
                onChange={(e) => setLifetimeMax(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Total lifetime benefit from your policy</p>
            </div>
          </div>

          {/* Waiver of Premium Section */}
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Waiver of Premium</h4>
                <p className="text-xs text-slate-600 mt-1">
                  If your policy includes waiver of premium, your premiums are waived during the claim period, providing additional savings.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="waiverToggle"
                  type="checkbox"
                  checked={hasWaiverOfPremium}
                  onChange={(e) => setHasWaiverOfPremium(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="waiverToggle" className="text-sm text-slate-600">
                  {hasWaiverOfPremium ? "Yes" : "No"}
                </label>
              </div>
            </div>

            {hasWaiverOfPremium && (
              <div className="mt-3">
                <Label htmlFor="monthlyPremium" className="text-sm font-medium text-slate-900">
                  Monthly Premium Payment ($)
                </Label>
                <Input
                  id="monthlyPremium"
                  type="number"
                  placeholder="e.g., 150"
                  value={monthlyPremium}
                  onChange={(e) => setMonthlyPremium(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Inflation Rider Section */}
          <div className="bg-amber-50 p-4 rounded border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Inflation Rider</h4>
                <p className="text-xs text-slate-600 mt-1">
                  If your policy includes an inflation rider, your lifetime maximum increases annually to protect against rising care costs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="inflationToggle"
                  type="checkbox"
                  checked={hasInflationRider}
                  onChange={(e) => setHasInflationRider(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="inflationToggle" className="text-sm text-slate-600">
                  {hasInflationRider ? "Yes" : "No"}
                </label>
              </div>
            </div>

            {hasInflationRider && (
              <div className="mt-3">
                <Label htmlFor="inflationPercentage" className="text-sm font-medium text-slate-900">
                  Annual Inflation Percentage (%)
                </Label>
                <Input
                  id="inflationPercentage"
                  type="number"
                  placeholder="e.g., 3"
                  value={inflationPercentage}
                  onChange={(e) => setInflationPercentage(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Results Section */}
          {calculations ? (
            <div className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
              {/* Available Care Hours */}
              <div className="bg-gradient-to-r from-teal/5 to-cyan/5 p-4 rounded border border-teal/20">
                <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal" /> Available Care Hours
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Maximum Hours Per Day (based on daily max)</p>
                    <p className="text-2xl font-bold text-teal mt-1">{calculations.maxHoursPerDay} hrs</p>
                    <p className="text-xs text-slate-500 mt-2">${calculations.costPerHour}/hr ÷ {calculations.maxHoursPerDay} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Requested Hours Per Day</p>
                    <p className="text-2xl font-bold text-teal mt-1">{calculations.requestedHours} hrs</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {calculations.isWithinMax ? "✓ Within your daily maximum" : "✗ Exceeds your daily maximum"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Per Visit */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Cost Per Visit</h4>
                <p className="text-lg text-slate-700">
                  <span className="font-semibold">${calculations.costPerHour}</span> per hour
                </p>
              </div>

              {/* Daily Costs */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Daily Costs</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Daily Cost</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${calculations.totalDailyCost}</p>
                    <p className="text-xs text-slate-500 mt-2">{calculations.requestedHours} hrs × ${calculations.costPerHour}/hr</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-slate-600">Insurance Pays Daily</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">${calculations.insurancePaysDaily}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-sm text-slate-600">You Pay Daily</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">${calculations.youPayDaily}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Costs */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Weekly Costs</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-slate-600">Insurance Pays Weekly</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">${calculations.insurancePaysWeekly}</p>
                    <p className="text-xs text-slate-500 mt-2">${calculations.insurancePaysDaily} × {daysPerWeek} days</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-sm text-slate-600">You Pay Weekly</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">${calculations.youPayWeekly}</p>
                    <p className="text-xs text-slate-500 mt-2">${calculations.youPayDaily} × {daysPerWeek} days</p>
                  </div>
                </div>
              </div>

              {/* Monthly Costs */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Monthly Costs</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-slate-600">Insurance Pays Monthly</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">${calculations.insurancePaysMontly}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-sm text-slate-600">You Pay Monthly</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">${calculations.youPayMontly}</p>
                  </div>
                </div>
              </div>

              {/* Premium Waiver Section */}
              {hasWaiverOfPremium && monthlyPremium && (
                <div className="bg-gradient-to-r from-green/5 to-emerald/5 p-4 rounded border border-green-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Premium Waiver Savings</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Daily Premium Savings</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">${calculations.premiumSavingsDaily}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Weekly Premium Savings</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">${calculations.premiumSavingsWeekly}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Monthly Premium Savings</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">${calculations.premiumSavingsMonthly}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Cost of Care (with Premium Waiver) */}
              {hasWaiverOfPremium && monthlyPremium && (
                <div className="bg-gradient-to-r from-purple/5 to-pink/5 p-4 rounded border border-purple-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Net Cost of Care (After Premium Waiver)</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Net Daily Cost</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">${calculations.netDailyCost}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        ${calculations.insurancePaysDaily} - ${calculations.premiumSavingsDaily}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Net Weekly Cost</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">${calculations.netWeeklyCost}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        ${calculations.insurancePaysWeekly} - ${calculations.premiumSavingsWeekly}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Net Monthly Cost</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">${calculations.netMonthlyCost}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        ${calculations.insurancePaysMontly} - ${calculations.premiumSavingsMonthly}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefit Duration Section */}
              <div className="bg-gradient-to-r from-teal/5 to-blue/5 p-4 rounded border border-teal/20">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Benefit Duration</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Lifetime Maximum</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${lifetimeMax}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Weeks of Care Available</p>
                    <p className="text-2xl font-bold text-teal mt-1">{calculations.weeksOfCare} weeks</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Years of Care Available</p>
                    <p className="text-2xl font-bold text-teal mt-1">{calculations.yearsOfCare} years</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-4">
                  At ${calculations.insurancePaysWeekly}/week, your ${lifetimeMax} lifetime maximum will cover approximately {calculations.monthsOfCare} months ({calculations.yearsOfCare} years) of care.
                </p>
              </div>

              {/* Benefit Duration with Premium Waiver */}
              {hasWaiverOfPremium && monthlyPremium && (
                <div className="bg-gradient-to-r from-green/5 to-emerald/5 p-4 rounded border border-green-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Benefit Duration (With Premium Waiver)</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Weeks of Care Available</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{calculations.weeksOfCareWithWaiver} weeks</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Years of Care Available</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{calculations.yearsOfCareWithWaiver} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Extended Duration</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        +{(calculations.weeksOfCareWithWaiver - calculations.weeksOfCare)} weeks
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-4">
                    With premium waiver savings of ${calculations.premiumSavingsMonthly}/month, your benefits extend to approximately {calculations.monthsOfCareWithWaiver} months ({calculations.yearsOfCareWithWaiver} years) of care.
                  </p>
                </div>
              )}

              {/* 5-Year Projection Chart */}
              {projectionData && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal" /> 5-Year Monthly Projection
                  </h4>
                  <div className="bg-white p-4 rounded border border-slate-200">
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                          formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar dataKey="benefitRemaining" fill="#10b981" name="Benefit Remaining" />
                        <Line type="monotone" dataKey="monthlyCost" stroke="#ef4444" strokeWidth={2} name="Monthly Care Cost" />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-slate-600 mt-4">
                      This chart shows your remaining benefit (green bars) decreasing each month as care costs are paid, and your monthly care cost (red line) increasing 10% annually. The intersection point shows when benefits may be exhausted.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                Enter all values above to see your care cost calculations
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
