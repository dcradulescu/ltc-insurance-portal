import { describe, it, expect } from "vitest";

// Test care calculator logic
describe("Care Calculator Logic", () => {
  // Helper function to calculate care metrics
  function calculateCareMetrics(
    dailyMax: number,
    hourlyRate: number,
    hoursPerDay: number,
    daysPerWeek: number,
    lifetimeMaximum: number
  ) {
    if (dailyMax <= 0 || hourlyRate <= 0 || hoursPerDay <= 0 || daysPerWeek <= 0 || lifetimeMaximum <= 0) {
      return null;
    }

    const availableHoursPerDay = dailyMax / hourlyRate;
    const requestedDailyCost = hoursPerDay * hourlyRate;
    const insurancePaysDaily = Math.min(dailyMax, requestedDailyCost);
    const userPaysDaily = Math.max(0, requestedDailyCost - dailyMax);
    const insurancePaysWeekly = insurancePaysDaily * daysPerWeek;
    const weeksOfCare = Math.floor(lifetimeMaximum / insurancePaysWeekly);
    const yearsOfCare = (weeksOfCare / 52).toFixed(1);

    return {
      availableHoursPerDay: availableHoursPerDay.toFixed(2),
      requestedDailyCost: requestedDailyCost.toFixed(2),
      insurancePaysDaily: insurancePaysDaily.toFixed(2),
      userPaysDaily: userPaysDaily.toFixed(2),
      insurancePaysWeekly: insurancePaysWeekly.toFixed(2),
      weeksOfCare,
      yearsOfCare,
    };
  }

  it("should calculate available hours per day correctly", () => {
    const result = calculateCareMetrics(100, 25, 4, 5, 50000);
    expect(result?.availableHoursPerDay).toBe("4.00");
  });

  it("should calculate daily costs correctly", () => {
    const result = calculateCareMetrics(100, 25, 4, 5, 50000);
    expect(result?.requestedDailyCost).toBe("100.00");
    expect(result?.insurancePaysDaily).toBe("100.00");
    expect(result?.userPaysDaily).toBe("0.00");
  });

  it("should calculate user pays when care exceeds daily maximum", () => {
    const result = calculateCareMetrics(100, 25, 6, 5, 50000);
    expect(result?.requestedDailyCost).toBe("150.00");
    expect(result?.insurancePaysDaily).toBe("100.00");
    expect(result?.userPaysDaily).toBe("50.00");
  });

  it("should calculate weekly costs correctly", () => {
    const result = calculateCareMetrics(100, 25, 4, 5, 50000);
    expect(result?.insurancePaysWeekly).toBe("500.00");
  });

  it("should calculate benefit duration in weeks", () => {
    const result = calculateCareMetrics(100, 25, 4, 5, 50000);
    expect(result?.weeksOfCare).toBe(100);
  });

  it("should calculate benefit duration in years", () => {
    const result = calculateCareMetrics(100, 25, 4, 5, 50000);
    expect(result?.yearsOfCare).toBe("1.9");
  });

  it("should return null for invalid inputs (zero values)", () => {
    const result = calculateCareMetrics(0, 25, 4, 5, 50000);
    expect(result).toBeNull();
  });

  it("should return null for negative values", () => {
    const result = calculateCareMetrics(-100, 25, 4, 5, 50000);
    expect(result).toBeNull();
  });

  it("should handle high care hours scenario", () => {
    // 8 hours per day at $30/hour = $240/day, but only $100 daily max
    const result = calculateCareMetrics(100, 30, 8, 6, 100000);
    expect(result?.requestedDailyCost).toBe("240.00");
    expect(result?.insurancePaysDaily).toBe("100.00");
    expect(result?.userPaysDaily).toBe("140.00");
  });

  it("should handle low care hours scenario", () => {
    // 2 hours per day at $50/hour = $100/day, exactly matches daily max
    const result = calculateCareMetrics(100, 50, 2, 5, 50000);
    expect(result?.requestedDailyCost).toBe("100.00");
    expect(result?.insurancePaysDaily).toBe("100.00");
    expect(result?.userPaysDaily).toBe("0.00");
  });

  it("should calculate extended benefit duration for large lifetime maximum", () => {
    // $500 daily max, $50/hour, 4 hours/day, 5 days/week = $1000/week
    // With $500,000 lifetime max = 500 weeks = 9.6 years
    const result = calculateCareMetrics(500, 50, 4, 5, 500000);
    expect(result?.weeksOfCare).toBe(500);
    expect(result?.yearsOfCare).toBe("9.6");
  });

  it("should calculate short benefit duration for small lifetime maximum", () => {
    // $100 daily max, $25/hour, 4 hours/day, 5 days/week = $500/week
    // With $5000 lifetime max = 10 weeks = 0.2 years
    const result = calculateCareMetrics(100, 25, 4, 5, 5000);
    expect(result?.weeksOfCare).toBe(10);
    expect(result?.yearsOfCare).toBe("0.2");
  });

  it("should handle part-time care (1 day per week)", () => {
    const result = calculateCareMetrics(100, 25, 4, 1, 50000);
    expect(result?.insurancePaysWeekly).toBe("100.00");
    expect(result?.weeksOfCare).toBe(500);
  });

  it("should handle full-time care (7 days per week)", () => {
    const result = calculateCareMetrics(100, 25, 4, 7, 50000);
    expect(result?.insurancePaysWeekly).toBe("700.00");
    expect(result?.weeksOfCare).toBe(71);
  });
});
