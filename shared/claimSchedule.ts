export interface ClaimCompletionEvidence {
  taskId: string;
  completed: boolean;
  completedAt?: Date | string | null;
}
export interface ClaimScheduleOptions {
  planStartDate?: Date | string | null;
  completedTasks?: readonly ClaimCompletionEvidence[];
  activeTaskIds?: readonly string[];
}
const recurringClaimTasks = new Set(["s3-1", "s3-2", "s3-3", "s3-4", "s3-5", "s3-6", "s3-7", "s3-8", "s3-9", "s3-10"]);
export function isRecurringClaimTask(id: string): boolean { return recurringClaimTasks.has(id); }

/** One canonical estimated schedule used by the claim timeline and checklist.
 * Calendar anchor is supplied by the strategy record, never today's date.
 * Claim and elimination dates require separate carrier/contract verification.
 */
export function parseEliminationDays(raw: string | number | null | undefined): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const value = String(raw).trim();
  if (!/^\d+$/.test(value)) return null;
  const days = Number(value);
  return Number.isSafeInteger(days) && days <= 3650 ? days : null;
}
export function localDate(value?: Date | string | null): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m-1, d);
    if (date.getFullYear() === y && date.getMonth() === m-1 && date.getDate() === d) return date;
  }
  const source = value ? new Date(value) : new Date();
  const date = Number.isNaN(source.getTime()) ? new Date() : source;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
export function localDateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
}
export function calendarDayDifference(a: Date, b: Date): number {
  const dayUTC = (d: Date) => Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
  return Math.round((dayUTC(a)-dayUTC(b))/86400000);
}

export function buildClaimSchedule(eliminationDays: number | null, options: ClaimScheduleOptions = {}) {
  const elimDays = eliminationDays ?? 0;
  const sched: Record<string, [number, number]> = {
    "s1-1": [0, 3], "s1-2": [0, 3], "s1-3": [0, 3],
    "s1-4": [2, 7], "s1-5": [2, 7],
    "s1-6": [3, 5], "s1-7": [5, 5], "s1-8": [5, 10], "s1-9": [7, 7], "s1-10": [7, 10],
    "s1-11": [5, 10], "s1-12": [10, 5],
    "s1-13": [10, 7], "s1-14": [12, 7], "s1-15": [10, 5], "s1-16": [14, 5],
    "s1-17": [18, 1],
    "s1-18": [3, 5], "s1-19": [3, 7], "s1-20": [10, 5], "s1-21": [10, 5],
  };
  const p = 25;
  const s2Sched: Record<string, [number, number]> = {
    "s2-1": [p, 5], "s2-2": [p + 3, 3], "s2-3": [p + 2, 2], "s2-4": [p + 2, 2],
    "s2-5": [p + 3, 2], "s2-6": [p + 3, 2], "s2-7": [p + 3, 2], "s2-8": [p + 4, 2],
    "s2-9": [p + 4, 3], "s2-10": [p + 6, 2], "s2-11": [p + 7, 1],
    "s2-12": [p + 10, 5], "s2-13": [p + 10, 5], "s2-14": [p + 10, 5],
    "s2-15": [p + 10, 5], "s2-16": [p + 10, 5],
    "s2-17": [p + 8, 30], "s2-18": [p + 8, 30],
  };
  const s2End = p + 8 + 30;
  const s3Sched: Record<string, [number, number]> = {
    "s3-1": [s2End, 30], "s3-2": [s2End, 30], "s3-3": [s2End, 30],
    "s3-4": [s2End + 14, 14], "s3-5": [s2End + 14, 14],
    "s3-6": [s2End + 7, 21], "s3-7": [s2End + 14, 21], "s3-8": [s2End + 21, 21],
    "s3-9": [s2End, 30], "s3-10": [s2End, 30],
  };
  const result: Record<string, [number, number]> = { ...sched, ...s2Sched, ...s3Sched };
  // A forecast is not carrier approval. Use task evidence only to delay dependent
  // estimates; never infer carrier approval from checking a task.
  const active = new Set(options.activeTaskIds ?? Object.keys(result));
  const anchor = options.planStartDate ? localDate(options.planStartDate) : null;
  const completions = new Map((options.completedTasks ?? []).filter(c => c.completed).map(c => [c.taskId, c.completedAt]));
  const endExclusive = (id: string): number => {
    const [start, duration] = result[id];
    let day = start + duration;
    const recorded = completions.get(id);
    if (anchor && recorded) {
      const confirmed = new Date(recorded);
      if (!Number.isNaN(confirmed.getTime())) day = Math.max(day, calendarDayDifference(localDate(confirmed), anchor) + 1);
    }
    return day;
  };
  const after = (id: string, deps: string[]) => {
    if (!active.has(id)) return;
    let earliest = result[id][0];
    for (const dependency of deps) {
      if (active.has(dependency)) earliest = Math.max(earliest, endExclusive(dependency));
    }
    result[id] = [earliest, result[id][1]];
  };
  after("s1-14", ["s1-9"]);
  after("s2-1", ["s1-14", "s1-20"]);
  after("s2-2", ["s2-1"]);
  after("s2-9", ["s2-1","s2-2","s2-3","s2-4","s2-5","s2-6","s2-7","s2-8"]);
  after("s2-10", ["s2-9"]);
  after("s2-11", ["s2-10"]);
  for (const id of ["s2-12","s2-13","s2-14","s2-15","s2-16","s2-17","s2-18"]) after(id, ["s2-11"]);
  for (const id of ["s3-1","s3-2","s3-3","s3-4","s3-5","s3-6","s3-7","s3-8","s3-9","s3-10"]) after(id, ["s2-17"]);
  return result;
}
