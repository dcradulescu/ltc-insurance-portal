export interface CareInputs {
 dailyMax: string; hourlyRate: string; hoursPerDay: string; daysPerWeek: string;
 lifetimeMax: string; hasWaiverOfPremium: boolean; monthlyPremium: string;
 hasInflationRider: boolean; inflationPercentage: string;
}
export function parseCurrencyValue(value: string | number): number {
 return Number(String(value).replace(/[$,\s]/g, ""));
}
export function calculateCare(input: CareInputs) {
 const {dailyMax,hourlyRate,hoursPerDay,daysPerWeek,lifetimeMax,hasWaiverOfPremium,monthlyPremium,inflationPercentage}=input;
    try {
      const daily = parseCurrencyValue(dailyMax);
      const hourly = parseCurrencyValue(hourlyRate);
      const hours = Number(hoursPerDay);
      const days = Number(daysPerWeek);
      const lifetime = parseCurrencyValue(lifetimeMax);
      const premium = parseCurrencyValue(monthlyPremium || "0");
      const inflation = Number(inflationPercentage || "0");
      if (![daily, hourly, hours, days, lifetime, premium, inflation].every(Number.isFinite)
        || daily <= 0 || hourly <= 0 || lifetime <= 0 || hours <= 0 || hours > 24
        || days <= 0 || days > 7 || premium < 0 || inflation < 0 || inflation > 100) return null;

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

      const netDailyCost = youPayDaily.toFixed(2);
      const netWeeklyCost = youPayWeekly.toFixed(2);
      const netMonthlyCost = youPayMontly.toFixed(2);

      const weeksOfCareWithWaiver = weeksOfCare;
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

}

export function projectCare(input: CareInputs) {
 const calculated = calculateCare(input);
 if (!calculated) return null;
 const months = [];
 let remaining = parseCurrencyValue(input.lifetimeMax);
 const annualRate = input.hasInflationRider ? Number(input.inflationPercentage || 0) / 100 : 0;
 const daysPerMonth = Number(input.daysPerWeek) * 4.33;
 for (let month = 1; month <= 60; month++) {
   const year = Math.floor((month - 1) / 12);
   const cost = Number(calculated.totalDailyCost) * daysPerMonth * Math.pow(1.03, year);
   const cap = parseCurrencyValue(input.dailyMax) * daysPerMonth * Math.pow(1 + annualRate, year);
   if (month > 1 && (month - 1) % 12 === 0) remaining *= 1 + annualRate;
   const payment = Math.min(remaining, cap, cost);
   remaining = Math.max(0, remaining - payment);
   months.push({month: `M${month}`, benefitRemaining: Math.round(remaining), monthlyCost: Math.round(cost), insurancePayment: Math.round(payment), familyCost: Math.round(cost-payment)});
 }
 return months;
}
