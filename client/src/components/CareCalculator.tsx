import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CareCalculatorProps {
  defaultDailyMax?: number | string;
  lifetimeMaximum?: number | string;
}

export function CareCalculator({ defaultDailyMax = "", lifetimeMaximum = "" }: CareCalculatorProps) {
  const [showCalculator, setShowCalculator] = useState(true);
  const [dailyMax, setDailyMax] = useState(defaultDailyMax.toString());
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");

  // Calculate care metrics
  const calculations = useMemo(() => {
    if (!dailyMax || !hourlyRate || !hoursPerDay || !daysPerWeek || !lifetimeMaximum) {
      return null;
    }

    try {
      const daily = parseFloat(dailyMax);
      const hourly = parseFloat(hourlyRate);
      const hours = parseFloat(hoursPerDay);
      const days = parseFloat(daysPerWeek);
      const lifetime = parseFloat(lifetimeMaximum.toString());

      // Validate inputs
      if (isNaN(daily) || isNaN(hourly) || isNaN(hours) || isNaN(days) || isNaN(lifetime)) {
        return null;
      }

      if (daily <= 0 || hourly <= 0 || hours <= 0 || days <= 0 || lifetime <= 0) {
        return null;
      }

      // Calculate available hours per day based on daily max and hourly rate
      const availableHoursPerDay = daily / hourly;
      const recommendedHoursPerDay = Math.min(hours, availableHoursPerDay);

      // Calculate daily costs
      const requestedDailyCost = hours * hourly;
      const insurancePaysDaily = Math.min(daily, requestedDailyCost);
      const userPaysDaily = Math.max(0, requestedDailyCost - daily);

      // Calculate weekly costs
      const insurancePaysWeekly = insurancePaysDaily * days;
      const userPaysWeekly = userPaysDaily * days;

      // Calculate benefit duration
      const weeksOfCare = Math.floor(lifetime / insurancePaysWeekly);
      const monthsOfCare = Math.floor(weeksOfCare / 4.33);
      const yearsOfCare = (weeksOfCare / 52).toFixed(1);

      // Calculate monthly costs
      const insurancePaysMontly = insurancePaysWeekly * 4.33;
      const userPaysMontly = userPaysWeekly * 4.33;

      return {
        availableHoursPerDay: availableHoursPerDay.toFixed(2),
        recommendedHoursPerDay: recommendedHoursPerDay.toFixed(2),
        requestedDailyCost: requestedDailyCost.toFixed(2),
        insurancePaysDaily: insurancePaysDaily.toFixed(2),
        userPaysDaily: userPaysDaily.toFixed(2),
        insurancePaysWeekly: insurancePaysWeekly.toFixed(2),
        userPaysWeekly: userPaysWeekly.toFixed(2),
        insurancePaysMontly: insurancePaysMontly.toFixed(2),
        userPaysMontly: userPaysMontly.toFixed(2),
        weeksOfCare,
        monthsOfCare,
        yearsOfCare,
      };
    } catch (_e) {
      return null;
    }
  }, [dailyMax, hourlyRate, hoursPerDay, daysPerWeek, lifetimeMaximum]);

  return (
    <div className="mb-8 p-6 rounded-lg border border-slate-200 bg-slate-50">
      <button
        onClick={() => setShowCalculator(!showCalculator)}
        className="w-full flex items-center justify-between hover:opacity-75 transition-opacity"
      >
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5" /> Care Cost Calculator
        </h3>
        {showCalculator ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      <p className="text-sm text-slate-600 mt-1">
        Calculate how many hours of care your policy will cover and how long your benefits will last
      </p>

      {showCalculator && (
        <div className="mt-6 space-y-6">
          {/* Input Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dailyMax" className="text-sm font-medium">
                Daily Maximum ($) *
              </Label>
              <Input
                id="dailyMax"
                type="number"
                placeholder="e.g., 100"
                value={dailyMax}
                onChange={(e) => setDailyMax(e.target.value)}
                className="mt-1"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum daily benefit from your policy</p>
            </div>

            <div>
              <Label htmlFor="hourlyRate" className="text-sm font-medium">
                Hourly Care Rate ($) *
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="e.g., 30"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="mt-1"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-slate-500 mt-1">Cost per hour for care services</p>
            </div>

            <div>
              <Label htmlFor="hoursPerDay" className="text-sm font-medium">
                Hours of Care Per Day *
              </Label>
              <Input
                id="hoursPerDay"
                type="number"
                placeholder="e.g., 4"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="mt-1"
                step="0.5"
                min="0"
              />
              <p className="text-xs text-slate-500 mt-1">Requested hours per day</p>
            </div>

            <div>
              <Label htmlFor="daysPerWeek" className="text-sm font-medium">
                Days of Care Per Week *
              </Label>
              <Input
                id="daysPerWeek"
                type="number"
                placeholder="e.g., 4"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
                className="mt-1"
                step="0.5"
                min="0"
                max="7"
              />
              <p className="text-xs text-slate-500 mt-1">Days per week you need care</p>
            </div>
          </div>

          {/* Results */}
          {calculations ? (
            <div className="bg-white p-6 rounded-lg space-y-6 border border-slate-200">
              {/* Available Hours Section */}
              <div className="border-b pb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal" /> Available Care Hours
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-teal/5 p-4 rounded border border-teal/20">
                    <p className="text-sm text-slate-600">Maximum Hours Per Day (based on daily max)</p>
                    <p className="text-2xl font-bold text-teal mt-1">{calculations.availableHoursPerDay} hrs</p>
                    <p className="text-xs text-slate-500 mt-2">
                      ${dailyMax} ÷ ${hourlyRate}/hr = {calculations.availableHoursPerDay} hours
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-sm text-slate-600">Requested Hours Per Day</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{hoursPerDay} hrs</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {parseFloat(hoursPerDay) <= parseFloat(calculations.availableHoursPerDay)
                        ? "✓ Within your daily maximum"
                        : "⚠ Exceeds your daily maximum"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Costs Section */}
              <div className="border-b pb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Daily Costs</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-sm text-slate-600">Total Daily Cost</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${calculations.requestedDailyCost}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {hoursPerDay} hrs × ${hourlyRate}/hr
                    </p>
                  </div>
                  <div className="bg-teal/5 p-4 rounded border border-teal/20">
                    <p className="text-sm text-slate-600">Insurance Pays Daily</p>
                    <p className="text-2xl font-bold text-teal mt-1">${calculations.insurancePaysDaily}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded border border-amber-200">
                    <p className="text-sm text-slate-600">You Pay Daily</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">${calculations.userPaysDaily}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Costs Section */}
              <div className="border-b pb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Weekly Costs</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-teal/5 p-4 rounded border border-teal/20">
                    <p className="text-sm text-slate-600">Insurance Pays Weekly</p>
                    <p className="text-2xl font-bold text-teal mt-1">${calculations.insurancePaysWeekly}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      ${calculations.insurancePaysDaily} × {daysPerWeek} days
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded border border-amber-200">
                    <p className="text-sm text-slate-600">You Pay Weekly</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">${calculations.userPaysWeekly}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      ${calculations.userPaysDaily} × {daysPerWeek} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Costs Section */}
              <div className="border-b pb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Monthly Costs</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-teal/5 p-4 rounded border border-teal/20">
                    <p className="text-sm text-slate-600">Insurance Pays Monthly</p>
                    <p className="text-2xl font-bold text-teal mt-1">${calculations.insurancePaysMontly}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded border border-amber-200">
                    <p className="text-sm text-slate-600">You Pay Monthly</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">${calculations.userPaysMontly}</p>
                  </div>
                </div>
              </div>

              {/* Benefit Duration Section */}
              <div className="bg-gradient-to-r from-teal/5 to-blue/5 p-4 rounded border border-teal/20">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Benefit Duration</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Lifetime Maximum</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${lifetimeMaximum}</p>
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
                  At ${calculations.insurancePaysWeekly}/week, your {lifetimeMaximum} lifetime maximum will cover approximately {calculations.monthsOfCare} months ({calculations.yearsOfCare} years) of care.
                </p>
              </div>
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
