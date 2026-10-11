/** Reimbursement planning model. See CALCULATOR_AUDIT_2026-10-09.md for scope. */
export interface CareInputs {
  paymentType: string;
  termsConfirmed: boolean;
  eligibility: string;
  startDate: string;
  careDays: number[]; // JavaScript weekdays, 0 = Sunday
  hourlyRate: string;
  hoursPerDay: string;
  capType: string;
  dailyMax: string;
  monthlyMax: string;
  totalPool: string;
  remainingPool: string;
  firstMonthUsed: string;
  eliminationType: string;
  eliminationRemaining: string;
  monthlyPremium: string;
  assumeFullWaiver: boolean;
  dualWaiver: boolean;
  spouseMonthlyPremium: string;
  careInflation: string;
  benefitInflation: string;
  benefitRate: string;
  inflationScope: string;
  nextIncrease: string;
  riderConfirmed: boolean;
  originalDaily: string;
  originalMonthly: string;
  originalPool: string;
}

/** Full-string parsing: reject partial numbers, malformed currency and non-finite values. */
export function parseAmount(value: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = value.trim().replace(/^\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function amountInput(value?: string | number): string {
  const n = value === undefined ? null : parseAmount(value);
  return n === null ? "" : String(n);
}

const DAY = 86_400_000;
const iso = (date: Date) => date.toISOString().slice(0, 10);
function dateValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && iso(d) === value ? d : null;
}
function anniversary(date: Date, years: number): Date {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(
        date.getUTCDate(),
        new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
      )
    )
  );
}
const cents = (dollars: number) => Math.round((dollars + Number.EPSILON) * 100);

export interface CareMonth {
  month: string;
  from: string;
  through: string;
  careDays: number;
  careCost: number;
  insurance: number;
  outOfPocket: number;
  waitingCost: number;
  benefitRemaining: number;
}

/** Exact policy-anniversary periods, including the first partial calendar month.
 * Accumulated directly from daily cents, never prorated from monthly totals. */
export interface CareRollingYear {
  year: number;
  from: string;
  through: string;
  careDays: number;
  careCost: number;
  insurance: number;
  outOfPocket: number;
  waitingCost: number;
}

export function calculateCare(input: CareInputs) {
  const errors: Record<string, string> = {};
  const number = (
    key: keyof CareInputs,
    label: string,
    min: number,
    max: number,
    integer = false
  ) => {
    const n = parseAmount(input[key] as string);
    if (n === null || n < min || n > max || (integer && !Number.isInteger(n))) {
      errors[key] =
        `${label}: enter ${integer ? "a whole number" : "a number"} from ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")}.`;
      return 0;
    }
    return n;
  };
  if (input.paymentType !== "reimbursement")
    errors.paymentType =
      "Select expense reimbursement. Cash, indemnity, hybrid and unknown payment terms need a policy-specific calculation.";
  if (!input.termsConfirmed)
    errors.termsConfirmed =
      "Confirm the model matches your policy terms before using its results.";
  if (!["confirmed", "unconfirmed", "not-eligible"].includes(input.eligibility))
    errors.eligibility = "Select the benefit eligibility status.";
  const start = dateValue(input.startDate);
  if (!start || start.getUTCFullYear() < 2000 || start.getUTCFullYear() > 2100)
    errors.startDate = "Enter a valid start date between 2000 and 2100.";
  if (
    !Array.isArray(input.careDays) ||
    !input.careDays.length ||
    input.careDays.length > 7 ||
    new Set(input.careDays).size !== input.careDays.length ||
    input.careDays.some(d => !Number.isInteger(d) || d < 0 || d > 6)
  )
    errors.careDays = "Choose one to seven different care days.";
  const hourly = number("hourlyRate", "Hourly rate", 0.01, 10000);
  const hours = number("hoursPerDay", "Hours per care day", 0.01, 24);
  const dailyApplies = ["daily", "both"].includes(input.capType);
  const monthlyApplies = ["monthly", "both"].includes(input.capType);
  if (!["daily", "monthly", "both"].includes(input.capType))
    errors.capType = "Choose the actual daily and/or calendar-month limits.";
  const daily = dailyApplies
    ? number("dailyMax", "Daily home-care limit", 0, 1000000)
    : 0;
  const monthly = monthlyApplies
    ? number("monthlyMax", "Monthly home-care limit", 0, 10000000)
    : 0;
  const total = number(
    "totalPool",
    "Current total benefit maximum",
    0,
    1000000000
  );
  const remaining = number(
    "remainingPool",
    "Remaining benefit pool",
    0,
    1000000000
  );
  if (remaining > total)
    errors.remainingPool =
      "Remaining benefits cannot exceed the current total benefit maximum.";
  const firstMonthUsed = monthlyApplies
    ? number(
        "firstMonthUsed",
        "Benefits already used this calendar month",
        0,
        10000000
      )
    : 0;
  if (firstMonthUsed > monthly)
    errors.firstMonthUsed =
      "Benefits already used this month cannot exceed the monthly limit.";
  if (cents(firstMonthUsed) > cents(total) - cents(remaining))
    errors.firstMonthUsed =
      "This month's prior claims must already be deducted from the remaining benefit pool.";
  if (!["calendar", "service"].includes(input.eliminationType))
    errors.eliminationType = "Select calendar days or paid service days.";
  const waiting = number(
    "eliminationRemaining",
    "Elimination days still remaining",
    0,
    3650,
    true
  );
  const premium = number(
    "monthlyPremium",
    "Your monthly premium equivalent",
    0,
    1000000
  );
  const spousePremium = input.dualWaiver
    ? number(
        "spouseMonthlyPremium",
        "Spouse's monthly premium equivalent",
        0,
        1000000
      )
    : 0;
  const careRate =
    number("careInflation", "Annual care-cost increase", 0, 20) / 100;
  const inflation = input.benefitInflation !== "none";
  if (!["none", "simple", "compound"].includes(input.benefitInflation))
    errors.benefitInflation = "Select constant, simple or compound benefits.";
  const rate = inflation
    ? number("benefitRate", "Annual benefit increase", 0, 20) / 100
    : 0;
  const capsGrow =
    inflation && ["caps", "caps-and-pool"].includes(input.inflationScope);
  const poolGrows =
    inflation && ["pool", "caps-and-pool"].includes(input.inflationScope);
  const next = inflation ? dateValue(input.nextIncrease) : null;
  if (inflation) {
    if (!["caps", "pool", "caps-and-pool"].includes(input.inflationScope))
      errors.inflationScope = "Select which policy amounts increase.";
    if (!input.riderConfirmed)
      errors.riderConfirmed =
        "Verify this rider's rate, affected amounts, anniversary, rounding and continuation during this claim.";
    if (!next || (start && (next <= start || next > anniversary(start, 1))))
      errors.nextIncrease =
        "Next benefit increase must be after the start date and within one year. Starting limits must already include any increase on the start date.";
  }
  const simple = input.benefitInflation === "simple";
  const originalDaily =
    simple && capsGrow && dailyApplies
      ? number(
          "originalDaily",
          "Original daily limit for simple inflation",
          0,
          1000000
        )
      : 0;
  const originalMonthly =
    simple && capsGrow && monthlyApplies
      ? number(
          "originalMonthly",
          "Original monthly limit for simple inflation",
          0,
          10000000
        )
      : 0;
  const originalPool =
    simple && poolGrows
      ? number(
          "originalPool",
          "Original total benefit maximum for simple inflation",
          0,
          1000000000
        )
      : 0;
  if (originalDaily > daily)
    errors.originalDaily =
      "Original daily limit cannot exceed the current limit in this model.";
  if (originalMonthly > monthly)
    errors.originalMonthly =
      "Original monthly limit cannot exceed the current limit in this model.";
  if (originalPool > total)
    errors.originalPool =
      "Original total maximum cannot exceed the current maximum in this model.";
  if (Object.keys(errors).length || !start) return { errors, result: null };

  // Integer cents for payments and pool accounting. Annual increases round to cents.
  let dailyLimit = cents(daily),
    monthlyLimit = cents(monthly),
    totalLimit = cents(total);
  let pool = cents(remaining),
    waitLeft = waiting,
    monthUsed = cents(firstMonthUsed);
  let nextBenefit = next,
    benefitIncreases = 0,
    nextCare = anniversary(start, 1),
    careIncreases = 0;
  let firstBenefitDate: string | null = null;
  let exhaustionDate: string | null = pool === 0 ? input.startDate : null;
  const end = anniversary(start, 5);
  const months: CareMonth[] = [];
  const rollingYears: CareRollingYear[] = Array.from({length:5}, (_,index)=>{
    const from=anniversary(start,index),next=anniversary(start,index+1);
    return {
      year:index+1,from:iso(from),
      through:iso(new Date(next.getTime()-DAY)),
      careDays:0,careCost:0,insurance:0,outOfPocket:0,waitingCost:0,
    };
  });
  let currentMonth = "";
  let row: CareMonth;
  for (let time = start.getTime(); time < end.getTime(); time += DAY) {
    const date = new Date(time),
      dateString = iso(date),
      month = dateString.slice(0, 7);
    if (month !== currentMonth) {
      if (currentMonth) monthUsed = 0;
      currentMonth = month;
      row = {
        month,
        from: dateString,
        through: dateString,
        careDays: 0,
        careCost: 0,
        insurance: 0,
        outOfPocket: 0,
        waitingCost: 0,
        benefitRemaining: 0,
      };
      months.push(row);
    }
    row = months[months.length - 1];
    if (time >= nextCare.getTime()) {
      careIncreases++;
      nextCare = anniversary(start, careIncreases + 1);
    }
    // Exhaustion ends coverage here: inflation never revives an exhausted pool.
    if (nextBenefit && time >= nextBenefit.getTime() && !exhaustionDate) {
      const increase = (current: number, original: number) =>
        cents((simple ? original : current / 100) * rate);
      if (capsGrow) {
        dailyLimit += increase(dailyLimit, originalDaily);
        monthlyLimit += increase(monthlyLimit, originalMonthly);
      }
      if (poolGrows) {
        const addition = increase(totalLimit, originalPool);
        totalLimit += addition;
        pool += addition; // Increase the total maximum, then subtract past claims; never compound the remaining balance.
      }
      benefitIncreases++;
      nextBenefit = anniversary(next!, benefitIncreases);
    }
    const careDay = input.careDays.includes(date.getUTCDay());
    const cost = careDay
      ? cents(hourly * hours * (1 + careRate) ** careIncreases)
      : 0;
    const eligible = input.eligibility === "confirmed";
    const waitingToday = eligible && waitLeft > 0;
    const payment =
      eligible && !waitingToday && careDay
        ? Math.min(
            cost,
            dailyApplies ? dailyLimit : cost,
            monthlyApplies ? Math.max(0, monthlyLimit - monthUsed) : cost,
            pool
          )
        : 0;
    // The final elimination day is unpaid. Payment can start on the next scheduled care day.
    if (waitingToday && (input.eliminationType === "calendar" || careDay))
      waitLeft--;
    pool -= payment;
    monthUsed += payment;
    if (payment > 0 && !firstBenefitDate) firstBenefitDate = dateString;
    if (payment > 0 && pool === 0 && !exhaustionDate)
      exhaustionDate = dateString;
    row.through = dateString;
    row.careDays += Number(careDay);
    row.careCost += cost;
    row.insurance += payment;
    row.outOfPocket += cost - payment;
    row.waitingCost += waitingToday ? cost : 0;
    row.benefitRemaining = pool;
    const year=rollingYears[careIncreases];
    if (!year) throw new Error("Daily scenario exceeded its five policy-anniversary periods");
    year.careDays+=Number(careDay);
    year.careCost+=cost;
    year.insurance+=payment;
    year.outOfPocket+=cost-payment;
    year.waitingCost+=waitingToday?cost:0;
  }
  // Convert once for presentation; every accounting operation above uses cents.
  for (const yr of rollingYears)
    for (const key of ["careCost","insurance","outOfPocket","waitingCost"] as const)
      yr[key]/=100;
  for (const m of months)
    for (const key of [
      "careCost",
      "insurance",
      "outOfPocket",
      "waitingCost",
      "benefitRemaining",
    ] as const)
      m[key] /= 100;
  const sum = (key: "careCost" | "insurance" | "outOfPocket" | "waitingCost") =>
    months.reduce((n, m) => n + cents(m[key]), 0) / 100;
  const perDay = cents(hourly * hours) / 100;
  const insuredSavings = input.assumeFullWaiver ? cents(premium) : 0;
  const spouseSavings = input.assumeFullWaiver ? cents(spousePremium) : 0;
  const totalSavings = insuredSavings + spouseSavings;
  // A reviewed-month budget comparison, not a prediction of waiver eligibility
  // or a reduction in covered expenses, claim payments or pool use.
  const monthlyEffectiveCosts = months.map(m => {
    const lastDay = iso(
      new Date(
        Date.UTC(Number(m.month.slice(0, 4)), Number(m.month.slice(5, 7)), 0)
      )
    );
    const fullMonth = m.from === `${m.month}-01` && m.through === lastDay;
    return {
      month: m.month,
      fullMonth,
      careCost: m.careCost,
      // Do not invent prorated waiver benefits for partial calendar months.
      insuredPremiumSavings: fullMonth ? insuredSavings / 100 : null,
      spousePremiumSavings: fullMonth ? spouseSavings / 100 : null,
      totalPremiumSavings: fullMonth ? totalSavings / 100 : null,
      effectiveCareCost: fullMonth
        ? (cents(m.careCost) - totalSavings) / 100
        : null,
    };
  });
  return {
    errors,
    result: {
      months,
      rollingYears,
      firstBenefitDate,
      exhaustionDate,
      through: iso(new Date(end.getTime() - DAY)),
      totalCare: sum("careCost"),
      totalInsurance: sum("insurance"),
      totalOutOfPocket: sum("outOfPocket"),
      waitingCost: sum("waitingCost"),
      remainingPool: pool / 100,
      totalMaximumAtEnd: totalLimit / 100,
      eliminationRemaining: waitLeft,
      dailyCareCost: perDay,
      scheduledWeeklyCost: cents(perDay * input.careDays.length) / 100,
      // Floor to the supported hundredth-hour input precision; rounding up could exceed the dollar cap.
      dailyLimitHours: dailyApplies
        ? Math.min(24, Math.floor((cents(daily) * 100) / cents(hourly)) / 100)
        : null,
      monthlyPremium: premium,
      monthlyPremiumSavings: insuredSavings / 100,
      monthlyPremiumPayable: (cents(premium) - insuredSavings) / 100,
      spouseMonthlyPremium: spousePremium,
      spouseMonthlyPremiumSavings: spouseSavings / 100,
      spouseMonthlyPremiumPayable: (cents(spousePremium) - spouseSavings) / 100,
      totalMonthlyPremium: (cents(premium) + cents(spousePremium)) / 100,
      totalMonthlyPremiumSavings: totalSavings / 100,
      totalMonthlyPremiumPayable:
        (cents(premium) + cents(spousePremium) - totalSavings) / 100,
      monthlyEffectiveCosts,
    },
  };
}
