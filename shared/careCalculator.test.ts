import { describe, expect, it } from "vitest";
import {
  amountInput,
  calculateCare,
  parseAmount,
  type CareInputs,
} from "./careCalculator";

const fixture = (overrides: Partial<CareInputs> = {}): CareInputs => ({
  paymentType: "reimbursement",
  termsConfirmed: true,
  eligibility: "confirmed",
  startDate: "2026-01-01",
  careDays: [1, 2, 3, 4, 5],
  hourlyRate: "50",
  hoursPerDay: "3",
  capType: "daily",
  dailyMax: "100",
  monthlyMax: "2000",
  totalPool: "500000",
  remainingPool: "500000",
  firstMonthUsed: "0",
  eliminationType: "calendar",
  eliminationRemaining: "0",
  monthlyPremium: "200",
  assumeFullWaiver: false,
  dualWaiver: false,
  spouseMonthlyPremium: "",
  careInflation: "0",
  benefitInflation: "none",
  benefitRate: "3",
  inflationScope: "caps-and-pool",
  nextIncrease: "2027-01-01",
  riderConfirmed: false,
  originalDaily: "100",
  originalMonthly: "2000",
  originalPool: "500000",
  ...overrides,
});
const result = (overrides: Partial<CareInputs> = {}) => {
  const calculated = calculateCare(fixture(overrides));
  expect(calculated.errors).toEqual({});
  expect(calculated.result).not.toBeNull();
  return calculated.result!;
};
const cent = (n: number) => Math.round(n * 100);

describe("strict calculator input parsing", () => {
  it.each([
    "",
    " ",
    "-1",
    "Infinity",
    "NaN",
    "1e3",
    "1abc",
    "1,00",
    "12,34,567",
    "1 000",
    "12.123",
    "$-5",
    "1.2.3",
  ])("rejects %j", value => expect(parseAmount(value)).toBeNull());
  it.each([
    ["$500,000.25", 500000.25],
    ["0", 0],
    [" 123.40 ", 123.4],
    ["$ 1,000", 1000],
  ])("accepts %j", (value, expected) =>
    expect(parseAmount(value)).toBe(expected)
  );
  it("rejects nonfinite numbers and normalizes currency props", () => {
    expect(parseAmount(Infinity)).toBeNull();
    expect(parseAmount(NaN)).toBeNull();
    expect(amountInput("$7,500.00")).toBe("7500");
    expect(amountInput("Unknown")).toBe("");
    expect(amountInput()).toBe("");
  });
  it.each([
    ["hourlyRate", "0"],
    ["hourlyRate", "-20"],
    ["hourlyRate", "10000.01"],
    ["hoursPerDay", "0"],
    ["hoursPerDay", "24.01"],
    ["hoursPerDay", "Infinity"],
    ["dailyMax", "-1"],
    ["monthlyMax", "-1"],
    ["totalPool", "1000000001"],
    ["remainingPool", "500001"],
    ["firstMonthUsed", "2000.01"],
    ["eliminationRemaining", "0.5"],
    ["eliminationRemaining", "-1"],
    ["eliminationRemaining", "3651"],
    ["monthlyPremium", "-10"],
    ["careInflation", "20.01"],
    ["careInflation", "-1"],
    ["startDate", "2026-02-30"],
    ["startDate", "1999-01-01"],
    ["startDate", "2101-01-01"],
    ["paymentType", "other"],
    ["eligibility", ""],
    ["capType", "weekly"],
    ["eliminationType", ""],
    ["benefitInflation", "cpi"],
  ] as const)("blocks invalid %s = %s", (key, value) => {
    const computed = calculateCare(fixture({ capType: "both", [key]: value }));
    expect(computed.errors[key]).toBeTruthy();
    expect(computed.result).toBeNull();
  });
  it.each(
    [[], [1, 1], [7], [-1], [1.5], [NaN], [0, 1, 2, 3, 4, 5, 6, 7]].map(
      careDays => ({ careDays })
    )
  )("rejects invalid weekly schedule $careDays", ({ careDays }) =>
    expect(calculateCare(fixture({ careDays })).errors.careDays).toBeTruthy()
  );
  it("requires terms confirmation", () =>
    expect(
      calculateCare(fixture({ termsConfirmed: false })).result
    ).toBeNull());
});

describe("actual reimbursement and calendar accounting", () => {
  it("computes daily, weekly and January totals independently", () => {
    const r = result();
    expect(r.dailyCareCost).toBe(150);
    expect(r.scheduledWeeklyCost).toBe(750);
    expect(r.dailyLimitHours).toBe(2);
    // January 2026 has 22 weekdays, not 4.33 weeks.
    expect(r.months[0]).toMatchObject({
      careDays: 22,
      careCost: 3300,
      insurance: 2200,
      outOfPocket: 1100,
      benefitRemaining: 497800,
    });
    expect(r.firstBenefitDate).toBe("2026-01-01");
    expect(r.exhaustionDate).toBeNull();
  });
  it.each([
    ["daily", 100, 100],
    ["monthly", 999, 150],
    ["both", 100, 100],
  ])(
    "applies %s limits in a one-care-day pool",
    (capType, dailyMax, expected) => {
      const r = result({
        capType,
        dailyMax: String(dailyMax),
        remainingPool: "150",
      });
      expect(r.months[0].insurance).toBe(150);
      expect(r.exhaustionDate).toBe(
        expected === 150 ? "2026-01-01" : "2026-01-02"
      );
    }
  );
  it("reimburses only the expense when it is below the daily limit", () => {
    const r = result({ dailyMax: "250" });
    expect(r.months[0].insurance).toBe(3300);
    expect(r.months[0].outOfPocket).toBe(0);
  });
  it("applies monthly-only and combined caps, with monthly resets", () => {
    for (const capType of ["monthly", "both"]) {
      const r = result({ capType });
      expect(r.months[0].insurance).toBe(2000);
      expect(r.months[0].outOfPocket).toBe(1300);
      expect(r.months[1].careDays).toBe(20);
      expect(r.months[1].insurance).toBe(2000);
    }
  });
  it("honors first-month usage without subtracting it twice from the pool", () => {
    const r = result({
      capType: "monthly",
      startDate: "2026-01-30",
      firstMonthUsed: "1900",
      remainingPool: "498100",
    });
    expect(r.months[0]).toMatchObject({
      careDays: 1,
      insurance: 100,
      benefitRemaining: 498000,
    });
    expect(r.months[1].insurance).toBe(2000);
  });
  it("zero monthly balance prevents payment until the next month", () => {
    const r = result({
      capType: "monthly",
      firstMonthUsed: "2000",
      remainingPool: "498000",
    });
    expect(r.months[0].insurance).toBe(0);
    expect(r.firstBenefitDate).toBe("2026-02-02");
  });
  it("requires starting-month claims to be reflected in remaining benefits", () => {
    expect(
      calculateCare(fixture({ capType: "monthly", firstMonthUsed: "100" }))
        .errors.firstMonthUsed
    ).toBeTruthy();
  });
  it("uses integer cents and pays a partial final claim exactly", () => {
    const r = result({ remainingPool: "250.55" });
    expect(r.totalInsurance).toBe(250.55);
    expect(r.exhaustionDate).toBe("2026-01-05");
    expect(r.months[0].outOfPocket).toBe(3049.45);
    expect(r.remainingPool).toBe(0);
    expect(r.months[1].insurance).toBe(0);
    expect(r.months[1].outOfPocket).toBe(3000);
  });
  it("rounds each daily bill once, then sums cents", () => {
    const r = result({
      hourlyRate: "33.33",
      hoursPerDay: "1.5",
      dailyMax: "1000",
    });
    expect(r.dailyCareCost).toBe(50);
    expect(r.months[0].careCost).toBe(1100);
  });
  it("accepts an exhausted pool and zero caps without division by zero", () => {
    expect(result({ remainingPool: "0" }).exhaustionDate).toBe("2026-01-01");
    for (const capType of ["daily", "monthly", "both"]) {
      const r = result({ capType, dailyMax: "0", monthlyMax: "0" });
      expect(r.totalInsurance).toBe(0);
      expect(r.exhaustionDate).toBeNull();
    }
  });
  it("does not turn an oversized daily cap into more than 24 hours", () =>
    expect(result({ dailyMax: "5000" }).dailyLimitHours).toBe(24));
  it("never rounds available hours above the dollar cap", () => {
    const r = result({ dailyMax: "250", hourlyRate: "60" });
    expect(r.dailyLimitHours).toBe(4.16); // 4.17 hours would cost $250.20.
    expect(r.dailyLimitHours! * 60).toBeLessThanOrEqual(250);
  });
  it("counts leap days and partial end months without timezone drift", () => {
    const r = result({
      startDate: "2028-02-29",
      careDays: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(r.months[0].careDays).toBe(1);
    expect(r.through).toBe("2033-02-27");
    expect(r.months.find(m => m.month === "2032-02")?.careDays).toBe(29);
    expect(r.months.at(-1)?.careDays).toBe(27);
  });
});

describe("elimination and eligibility conditions", () => {
  it("calendar days include non-service days; the seventh day is unpaid", () => {
    const r = result({ eliminationRemaining: "7" });
    expect(r.firstBenefitDate).toBe("2026-01-08");
    expect(r.waitingCost).toBe(750);
  });
  it("service-day waiting counts only the chosen care days", () => {
    const r = result({ eliminationRemaining: "7", eliminationType: "service" });
    expect(r.firstBenefitDate).toBe("2026-01-12");
    expect(r.waitingCost).toBe(1050);
  });
  it("one remaining day cannot be reimbursed on that day", () => {
    const r = result({ eliminationRemaining: "1", startDate: "2026-01-02" });
    expect(r.firstBenefitDate).toBe("2026-01-05");
    expect(r.waitingCost).toBe(150);
  });
  it("calendar and service methods differ when the start date has no service", () => {
    expect(
      result({ startDate: "2026-01-03", eliminationRemaining: "1" })
        .firstBenefitDate
    ).toBe("2026-01-05");
    expect(
      result({
        startDate: "2026-01-03",
        eliminationRemaining: "1",
        eliminationType: "service",
      }).firstBenefitDate
    ).toBe("2026-01-06");
  });
  it.each(["unconfirmed", "not-eligible"])(
    "assumes no benefits and no waiting credits for %s eligibility",
    eligibility => {
      const r = result({ eligibility, eliminationRemaining: "90" });
      expect(r.totalInsurance).toBe(0);
      expect(r.totalOutOfPocket).toBe(r.totalCare);
      expect(r.eliminationRemaining).toBe(90);
      expect(r.firstBenefitDate).toBeNull();
      expect(r.waitingCost).toBe(0);
    }
  );
  it("does not report exhaustion for a waiting period longer than the horizon", () => {
    const r = result({ eliminationRemaining: "3650" });
    expect(r.totalInsurance).toBe(0);
    expect(r.exhaustionDate).toBeNull();
    expect(r.eliminationRemaining).toBeGreaterThan(0);
  });
});

describe("premium waiver", () => {
  it("deducts a single waived premium from gross care cost before reimbursement", () => {
    const r = result({ assumeFullWaiver: true });
    expect(r.monthlyEffectiveCosts[0]).toEqual({
      month: "2026-01",
      fullMonth: true,
      careCost: 3300,
      insuredPremiumSavings: 200,
      spousePremiumSavings: 0,
      totalPremiumSavings: 200,
      effectiveCareCost: 3100,
    });
    expect(r.months[0].outOfPocket).toBe(1100);
    expect(r.totalMonthlyPremiumPayable).toBe(0);
  });
  it("deducts both premiums under full dual waiver and uses actual calendar costs", () => {
    const r = result({
      assumeFullWaiver: true,
      dualWaiver: true,
      spouseMonthlyPremium: "150",
    });
    expect(r.monthlyEffectiveCosts[0]).toMatchObject({
      insuredPremiumSavings: 200,
      spousePremiumSavings: 150,
      totalPremiumSavings: 350,
      effectiveCareCost: 2950,
    });
    expect(r.monthlyEffectiveCosts[1]).toMatchObject({
      careCost: 3000,
      effectiveCareCost: 2650,
    });
    expect(r.totalMonthlyPremium).toBe(350);
    expect(r.totalMonthlyPremiumPayable).toBe(0);
    expect(r.spouseMonthlyPremiumPayable).toBe(0);
  });
  it("deducts nothing and shows both premiums payable when full waiver is cleared", () => {
    const r = result({ dualWaiver: true, spouseMonthlyPremium: "150" });
    expect(r.monthlyEffectiveCosts[0]).toMatchObject({
      insuredPremiumSavings: 0,
      spousePremiumSavings: 0,
      totalPremiumSavings: 0,
      effectiveCareCost: 3300,
    });
    expect(r.totalMonthlyPremiumPayable).toBe(350);
    expect(r.spouseMonthlyPremiumPayable).toBe(150);
  });
  it.each(["", "bad", "150"])(
    "ignores inactive spouse premium %j",
    spouseMonthlyPremium => {
      const r = result({ assumeFullWaiver: true, spouseMonthlyPremium });
      expect(r.spouseMonthlyPremium).toBe(0);
      expect(r.totalMonthlyPremiumSavings).toBe(200);
      expect(r.monthlyEffectiveCosts[0].effectiveCareCost).toBe(3100);
    }
  );
  it.each(["", "-1", "1e3", "1,00", "NaN", "12.123", "1000000.01"])(
    "rejects invalid active spouse premium %j",
    spouseMonthlyPremium => {
      for (const assumeFullWaiver of [true, false]) {
        const r = calculateCare(
          fixture({ dualWaiver: true, spouseMonthlyPremium, assumeFullWaiver })
        );
        expect(r.result).toBeNull();
        expect(r.errors.spouseMonthlyPremium).toBeTruthy();
      }
    }
  );
  it("allows zero premiums without an invented offset", () => {
    const r = result({
      assumeFullWaiver: true,
      dualWaiver: true,
      monthlyPremium: "0",
      spouseMonthlyPremium: "0",
    });
    expect(r.totalMonthlyPremiumSavings).toBe(0);
    expect(r.monthlyEffectiveCosts[0].effectiveCareCost).toBe(3300);
  });
  it("preserves cents and retains a negative budget offset when savings exceed care cost", () => {
    const r = result({
      assumeFullWaiver: true,
      dualWaiver: true,
      monthlyPremium: "$2,000.10",
      spouseMonthlyPremium: "1500.20",
    });
    expect(r.totalMonthlyPremiumSavings).toBe(3500.3);
    expect(r.monthlyEffectiveCosts[0].effectiveCareCost).toBe(-200.3);
    expect(r.months[0].insurance).toBe(2200);
  });
  it("does not subtract whole-month premiums from partial first or final months", () => {
    const r = result({
      startDate: "2026-01-30",
      assumeFullWaiver: true,
      dualWaiver: true,
      spouseMonthlyPremium: "150",
    });
    expect(r.monthlyEffectiveCosts).toHaveLength(61);
    for (const m of [
      r.monthlyEffectiveCosts[0],
      r.monthlyEffectiveCosts.at(-1)!,
    ]) {
      expect(m).toMatchObject({
        fullMonth: false,
        insuredPremiumSavings: null,
        spousePremiumSavings: null,
        totalPremiumSavings: null,
        effectiveCareCost: null,
      });
    }
    expect(r.monthlyEffectiveCosts[1]).toMatchObject({
      fullMonth: true,
      careCost: 3000,
      effectiveCareCost: 2650,
    });
  });
  it("recognizes full leap February and uses inflated care costs without inflating premiums", () => {
    const r = result({
      startDate: "2027-02-01",
      careDays: [0, 1, 2, 3, 4, 5, 6],
      careInflation: "10",
      assumeFullWaiver: true,
      dualWaiver: true,
      spouseMonthlyPremium: "150",
    });
    expect(
      r.monthlyEffectiveCosts.find(m => m.month === "2028-02")
    ).toMatchObject({
      fullMonth: true,
      careCost: 4785,
      totalPremiumSavings: 350,
      effectiveCareCost: 4435,
    });
  });
  it("keeps every care and pool result unchanged by single or dual waiver assumptions", () => {
    for (const eligibility of ["confirmed", "unconfirmed", "not-eligible"]) {
      const base = {
        remainingPool: "250",
        eligibility,
        eliminationRemaining: "7",
      };
      const before = result(base);
      for (const dualWaiver of [false, true])
        for (const assumeFullWaiver of [false, true]) {
          const after = result({
            ...base,
            dualWaiver,
            assumeFullWaiver,
            spouseMonthlyPremium: "150",
          });
          expect(after.months).toEqual(before.months);
          for (const key of [
            "exhaustionDate",
            "firstBenefitDate",
            "waitingCost",
            "eliminationRemaining",
            "totalInsurance",
            "totalOutOfPocket",
            "totalCare",
            "remainingPool",
            "totalMaximumAtEnd",
          ] as const)
            expect(after[key]).toBe(before[key]);
        }
    }
  });
  it.each(["0", "200", "50000"])(
    "keeps insurer payments, out-of-pocket care and exhaustion unchanged at premium %s",
    monthlyPremium => {
      const before = result({ remainingPool: "250", monthlyPremium });
      const after = result({
        remainingPool: "250",
        monthlyPremium,
        assumeFullWaiver: true,
      });
      expect(after.months).toEqual(before.months);
      expect(after.exhaustionDate).toBe(before.exhaustionDate);
      expect(after.monthlyPremiumPayable).toBe(0);
      expect(after.monthlyPremiumSavings).toBe(Number(monthlyPremium));
      expect(before.monthlyPremiumPayable).toBe(Number(monthlyPremium));
      expect(before.monthlyPremiumSavings).toBe(0);
    }
  );
});

const growing: Partial<CareInputs> = {
  careDays: [0, 1, 2, 3, 4, 5, 6],
  hourlyRate: "200",
  hoursPerDay: "1",
  totalPool: "100000",
  remainingPool: "90000",
  benefitInflation: "compound",
  benefitRate: "10",
  riderConfirmed: true,
};
describe("care inflation and verified benefit riders", () => {
  it("confirms the 3% total-maximum example before further claims", () => {
    const r = result({
      ...growing,
      totalPool: "500000",
      remainingPool: "400000",
      eligibility: "unconfirmed", // No projected claims: isolate the annual increase.
      benefitRate: "3",
      nextIncrease: "2026-01-02",
    });
    expect(r.months[0].insurance).toBe(0);
    expect(r.months[0].benefitRemaining).toBe(415000); // 400000 + 500000 * .03
    expect(r.months.find(m => m.month === "2027-01")?.benefitRemaining).toBe(
      430450
    ); // +515000 * .03
  });

  it("grows the full care expense independently of the insurance cap", () => {
    const r = result({ careInflation: "10", careDays: [0, 1, 2, 3, 4, 5, 6] });
    const jan = r.months.find(m => m.month === "2027-01")!;
    expect(jan.careCost).toBe(5115);
    expect(jan.insurance).toBe(3100);
    expect(jan.outOfPocket).toBe(2015);
  });
  it("increases the total maximum, not the depleted pool", () => {
    const r = result(growing);
    // 90,000 remaining - 365 * 100 + 10,000 total-pool increase - 31 * 110.
    expect(r.months.find(m => m.month === "2027-01")?.benefitRemaining).toBe(
      60090
    );
  });
  it("can grow caps without adding money to the pool", () => {
    const r = result({ ...growing, inflationScope: "caps" });
    expect(r.months.find(m => m.month === "2027-01")?.benefitRemaining).toBe(
      50090
    );
  });
  it("can grow the pool while holding caps fixed", () => {
    const r = result({ ...growing, inflationScope: "pool" });
    expect(r.months.find(m => m.month === "2027-01")?.benefitRemaining).toBe(
      60400
    );
  });
  it("simple inflation uses original amounts, not the current limits", () => {
    const r = result({
      ...growing,
      remainingPool: "100000",
      totalPool: "100000",
      benefitInflation: "simple",
      originalDaily: "50",
      originalPool: "80000",
    });
    expect(r.months.find(m => m.month === "2027-01")?.insurance).toBe(3255); // 31 * (100 + 50 * 10%)
    expect(r.months.find(m => m.month === "2027-01")?.benefitRemaining).toBe(
      68245
    ); // 100000 - 36500 + 8000 - 3255
    expect(r.months.find(m => m.month === "2028-01")?.insurance).toBe(3410); // second increment is still $5
  });
  it("compounds benefits over multiple anniversaries", () => {
    const r = result({
      ...growing,
      totalPool: "500000",
      remainingPool: "500000",
    });
    expect(r.months.find(m => m.month === "2028-01")?.insurance).toBe(3751); // 31 * 121
  });
  it("increases monthly limits and uses the entire revised cap in the anniversary month", () => {
    const r = result({
      ...growing,
      capType: "monthly",
      monthlyMax: "1000",
      nextIncrease: "2026-01-15",
    });
    expect(r.months[0].insurance).toBe(1100);
    expect(r.months.find(m => m.month === "2027-01")?.insurance).toBe(1210);
  });
  it("simple monthly inflation uses its original monthly amount", () => {
    const r = result({
      ...growing,
      capType: "monthly",
      monthlyMax: "2000",
      benefitInflation: "simple",
      inflationScope: "caps",
      originalMonthly: "1000",
    });
    expect(r.months.find(m => m.month === "2027-01")?.insurance).toBe(2100);
  });
  it("does not resurrect benefits after exhaustion", () => {
    const r = result({ ...growing, remainingPool: "100" });
    expect(r.totalInsurance).toBe(100);
    expect(r.remainingPool).toBe(0);
    expect(r.totalMaximumAtEnd).toBe(100000);
  });
  it("a zero starting pool stays exhausted even with a rider", () =>
    expect(result({ ...growing, remainingPool: "0" }).totalInsurance).toBe(0));
  it("requires explicit rider verification", () =>
    expect(
      calculateCare(fixture({ ...growing, riderConfirmed: false })).errors
        .riderConfirmed
    ).toBeTruthy());
  it.each([
    ["benefitRate", "21"],
    ["benefitRate", "-3"],
    ["inflationScope", ""],
    ["nextIncrease", "2026-01-01"],
    ["nextIncrease", "2027-01-02"],
    ["nextIncrease", "2026-02-30"],
    ["originalDaily", "101"],
    ["originalPool", "100001"],
  ] as const)("rejects invalid rider field %s", (key, value) =>
    expect(
      calculateCare(
        fixture({
          ...growing,
          benefitInflation: "simple",
          originalPool: "100000",
          [key]: value,
        })
      ).errors[key]
    ).toBeTruthy()
  );
  it("ignores inactive rider and cap fields", () => {
    const r = result({
      monthlyMax: "bad",
      firstMonthUsed: "bad",
      benefitRate: "bad",
      nextIncrease: "bad",
      originalDaily: "bad",
    });
    expect(r.months[0].insurance).toBe(2200);
  });
});

describe("accounting invariants over the supported branch matrix", () => {
  it("preserves cents, expense caps and pool conservation across 108 scenarios", () => {
    let checked = 0;
    for (const capType of ["daily", "monthly", "both"])
      for (const eliminationType of ["calendar", "service"]) {
        for (const eligibility of ["confirmed", "unconfirmed"])
          for (const benefitInflation of ["none", "simple", "compound"]) {
            for (const inflationScope of ["caps", "pool", "caps-and-pool"]) {
              const r = result({
                ...growing,
                capType,
                eliminationType,
                eligibility,
                benefitInflation,
                inflationScope,
                originalPool: "80000",
                originalDaily: "80",
                originalMonthly: "1000",
                eliminationRemaining: "90",
                careInflation: "7",
                monthlyMax: "2000",
              });
              expect(cent(r.totalCare)).toBe(
                cent(r.totalInsurance) + cent(r.totalOutOfPocket)
              );
              expect(cent(r.remainingPool)).toBe(
                cent(r.totalMaximumAtEnd) - 1000000 - cent(r.totalInsurance)
              ); // $10,000 past claims
              for (const m of r.months) {
                expect(m.insurance).toBeGreaterThanOrEqual(0);
                expect(m.insurance).toBeLessThanOrEqual(m.careCost);
                expect(m.benefitRemaining).toBeGreaterThanOrEqual(0);
                expect(cent(m.careCost)).toBe(
                  cent(m.insurance) + cent(m.outOfPocket)
                );
              }
              checked++;
            }
          }
      }
    expect(checked).toBe(108);
  });
});

describe("Exact policy-anniversary rolling-year totals",()=>{
  const centsValue=(n:number)=>Math.round(n*100);
  it("uses full 12-month anniversaries rather than 12 calendar-month rows",()=>{
    const r=result({startDate:"2026-11-15",careDays:[1,2,3,4,5]});
    expect(r.rollingYears).toHaveLength(5);
    expect(r.rollingYears[0].from).toBe("2026-11-15");
    expect(r.rollingYears[0].through).toBe("2027-11-14");
    expect(r.rollingYears[1].from).toBe("2027-11-15");
    expect(r.rollingYears[1].through).toBe("2028-11-14");
    const monthlyFirstTwelve=r.months.slice(0,12)
      .reduce((sum,row)=>sum+centsValue(row.careCost),0);
    expect(centsValue(r.rollingYears[0].careCost)).not.toBe(monthlyFirstTwelve);
  });
  it("conserves all five years of daily cents against the monthly accounting model",()=>{
    const r=result({startDate:"2026-11-15",careDays:[0,1,2,3,4,5,6],hourlyRate:"54.23",
      hoursPerDay:"6.25",eliminationType:"service",eliminationRemaining:"90",careInflation:"4"});
    for(const key of ["careCost","insurance","outOfPocket","waitingCost"] as const){
      const years=r.rollingYears.reduce((sum,row)=>sum+centsValue(row[key]),0);
      const monthly=r.months.reduce((sum,row)=>sum+centsValue(row[key]),0);
      expect(years).toBe(monthly);
    }
    for(const yr of r.rollingYears){
      expect(centsValue(yr.careCost)).toBe(centsValue(yr.insurance)+centsValue(yr.outOfPocket));
    }
  });
  it("uses the February 28 anniversary rule for Feb 29 start",()=>{
    const r=result({startDate:"2028-02-29"});
    expect(r.rollingYears[0].from).toBe("2028-02-29");
    expect(r.rollingYears[0].through).toBe("2029-02-27");
    expect(r.rollingYears[1].from).toBe("2029-02-28");
    expect(r.rollingYears[1].through).toBe("2030-02-27");
    expect(r.rollingYears[4].through).toBe("2033-02-27");
  });
  it("includes the exact care start day when the scenario begins during a month",()=>{
    const before=result({startDate:"2026-11-01",careDays:[0,1,2,3,4,5,6]});
    const mid=result({startDate:"2026-11-15",careDays:[0,1,2,3,4,5,6]});
    expect(before.rollingYears[0].from).toBe("2026-11-01");
    expect(mid.rollingYears[0].from).toBe("2026-11-15");
    expect(mid.rollingYears[0].careDays).toBeGreaterThan(360);
    expect(centsValue(mid.rollingYears[0].careCost)).toBeGreaterThan(0);
  });
});
