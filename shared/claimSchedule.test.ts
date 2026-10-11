import { describe, expect, it } from "vitest";
import {
  parseEliminationDays, localDate, localDateKey, calendarDayDifference,
  buildClaimSchedule, isRecurringClaimTask,
} from "./claimSchedule";

describe("LTC claim planning schedule", () => {
  it.each([
    ["0", 0], [0, 0], ["90", 90], [90, 90], [" 30 ", 30],
    ["", null], [undefined, null], [null, null], ["90abc", null],
    ["-5", null], ["1.5", null], ["99999", null], ["NaN", null],
  ])("parses elimination value %s as %s without 90-day fallback", (raw, expected) => {
    expect(parseEliminationDays(raw)).toBe(expected);
  });

  it("never represents insurance elimination days as a calendar-day duration", () => {
    const zero = buildClaimSchedule(0);
    const ninety = buildClaimSchedule(90);
    expect(zero["s1-17"][1]).toBe(1);
    expect(ninety["s1-17"][1]).toBe(1);
    expect(zero["s3-1"][1]).toBe(30);
    expect(ninety["s3-1"][1]).toBe(30);
  });

  it("keeps prerequisite chains in logical order before submission", () => {
    const t = buildClaimSchedule(30);
    expect(t["s1-14"][0]).toBeGreaterThanOrEqual(t["s1-9"][0] + t["s1-9"][1]);
    expect(t["s2-1"][0]).toBeGreaterThanOrEqual(t["s1-14"][0] + t["s1-14"][1]);
    expect(t["s2-2"][0]).toBeGreaterThanOrEqual(t["s2-1"][0] + t["s2-1"][1]);
    expect(t["s2-10"][0]).toBeGreaterThanOrEqual(t["s2-9"][0] + t["s2-9"][1]);
    expect(t["s2-11"][0]).toBeGreaterThanOrEqual(t["s2-10"][0] + t["s2-10"][1]);
    expect(t["s2-17"][0]).toBeGreaterThanOrEqual(t["s2-11"][0] + t["s2-11"][1]);
    expect(t["s3-4"][0]).toBeGreaterThanOrEqual(t["s2-17"][0] + t["s2-17"][1]);
  });

  it("shifts downstream tasks after a late recorded completion", () => {
    const original = buildClaimSchedule(90);
    const delayed = buildClaimSchedule(90, {
      planStartDate: "2026-10-01",
      completedTasks: [{ taskId: "s1-14", completed: true, completedAt: "2026-12-01T18:00:00Z" }],
    });
    expect(delayed["s2-1"][0]).toBeGreaterThan(original["s2-1"][0]);
    expect(delayed["s2-11"][0]).toBeGreaterThan(original["s2-11"][0]);
    expect(delayed["s3-4"][0]).toBeGreaterThan(original["s3-4"][0]);
  });

  it("ignores an uncompleted or undated task when projecting shifts", () => {
    const orig = buildClaimSchedule(90);
    const projected = buildClaimSchedule(90, {
      planStartDate: "2026-10-01",
      completedTasks: [{ taskId: "s1-14", completed: false, completedAt: "2026-12-01T18:00:00Z" }],
    });
    expect(projected).toEqual(orig);
  });

  it("does not impose conditional AOB and nurse tasks on unrelated policies", () => {
    const withoutConditional = buildClaimSchedule(90, {
      activeTaskIds: ["s1-1", "s1-9", "s1-14", "s1-20",
        "s2-1","s2-2","s2-3","s2-4","s2-6","s2-7","s2-8","s2-9","s2-10","s2-11","s2-17","s3-4"],
    });
    expect(withoutConditional["s2-11"][0]).toBeGreaterThan(withoutConditional["s2-10"][0]);
    expect(withoutConditional["s3-4"][0]).toBeGreaterThan(withoutConditional["s2-17"][0]);
  });

  it("retains duration at least 1 day for all currently scheduled activity markers", () => {
    for (const days of [0,30,90,365,null]) {
      for (const [start,duration] of Object.values(buildClaimSchedule(days))) {
        expect(start).toBeGreaterThanOrEqual(0);
        expect(duration).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("marks recurring care and billing tasks explicitly", () => {
    expect(isRecurringClaimTask("s3-4")).toBe(true);
    expect(isRecurringClaimTask("s3-9")).toBe(true);
    expect(isRecurringClaimTask("s2-11")).toBe(false);
  });

  it("uses local date keys without shifting to a prior UTC calendar date", () => {
    const date = localDate("2026-11-01");
    expect(localDateKey(date)).toBe("2026-11-01");
    expect(calendarDayDifference(localDate("2026-11-02"),date)).toBe(1);
  });

  it("handles daylight savings transitions by calendar date rather than hours", () => {
    const march = calendarDayDifference(localDate("2026-03-09"),localDate("2026-03-08"));
    const november = calendarDayDifference(localDate("2026-11-02"),localDate("2026-11-01"));
    expect(march).toBe(1);
    expect(november).toBe(1);
  });

  it("prevents invalid YYYY-MM-DD input from being treated as a confirmed milestone", () => {
    expect(localDateKey(localDate("2026-02-30"))).not.toBe("2026-02-30");
  });
});
