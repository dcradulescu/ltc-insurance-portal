import type { ClaimCompletionEvidence } from "@shared/claimSchedule";
import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Calendar, ChevronDown, ChevronRight, FileText, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { buildClaimSchedule, isRecurringClaimTask, parseEliminationDays, localDate, localDateKey } from "@shared/claimSchedule";

// ── Types ──────────────────────────────────────────────────────────────────────
type StrategyTask = {
  id: string;
  label: string;
  completed: boolean;
  category: string;
  critical?: boolean;
};

interface ChronologicalChecklistProps {
  stage1Tasks: StrategyTask[];
  stage2Tasks: StrategyTask[];
  stage3Tasks: StrategyTask[];
  eliminationPeriod?: string;
  planStartDate?: Date | string | null;
  taskCompletionDates?: ClaimCompletionEvidence[];
  onToggleTask?: (stageKey: string, taskId: string) => void;
}

// ── Stage colors ───────────────────────────────────────────────────────────────
const STAGE_STYLES = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200", label: "Stage 1: Prior to Claim", lightBg: "bg-blue-50/50" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200", label: "Stage 2: Filing the Claim", lightBg: "bg-amber-50/50" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200", label: "Stage 3: Post-Approval", lightBg: "bg-emerald-50/50" },
];

// ── Document links mapping ─────────────────────────────────────────────────────
// Maps keywords in task labels to document references
const DOCUMENT_LINKS: { pattern: RegExp; label: string; href: string }[] = [
  { pattern: /doctor'?s?\s*letter/i, label: "Doctor's Letter Template", href: "/education#glossary" },
  { pattern: /plan\s*of\s*care/i, label: "Plan of Care Guide", href: "/education#plan-of-care" },
  { pattern: /power\s*of\s*attorney|POA/i, label: "Power of Attorney Info", href: "/education#poa" },
  { pattern: /assignment\s*of\s*benefits|AOB/i, label: "AOB Explanation", href: "/education#aob" },
  { pattern: /HIPAA/i, label: "HIPAA Authorization", href: "/education#hipaa" },
  { pattern: /claim\s*form/i, label: "Claim Form Guide", href: "/education#claim-form" },
  { pattern: /elimination\s*period/i, label: "Elimination Period Guide", href: "/education#elimination-period" },
  { pattern: /log\s*sheet|care\s*log/i, label: "Care Log Template", href: "/education#care-logs" },
  { pattern: /invoice|billing/i, label: "Invoice Requirements", href: "/education#invoicing" },
  { pattern: /appeal/i, label: "Appeals Process Guide", href: "/education#appeals" },
  { pattern: /assessment|evaluation/i, label: "Assessment Info", href: "/education#assessment" },
  { pattern: /waiver\s*of\s*premium/i, label: "Waiver of Premium Info", href: "/education#waiver" },
  { pattern: /inflation\s*rider|inflation\s*protection/i, label: "Inflation Rider Info", href: "/education#inflation" },
];

function getDocumentLinks(label: string) {
  return DOCUMENT_LINKS.filter(d => d.pattern.test(label));
}

// ── Date formatting ────────────────────────────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDateHeader(d: Date) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDateShort(d: Date) {
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Category labels ────────────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  "carrier-contact": "Carrier Contact", "medical-evaluation": "Medical Evaluation",
  "provider-setup": "Provider Setup", "documents": "Document Collection",
  "elimination-period": "Elimination Period", "personal-info": "Personal Information",
  "claim-packet": "Claim Packet", "verification": "Verification",
  "submission": "Submission", "evaluation": "Third-Party Evaluation",
  "post-submission": "Post-Submission", "ongoing": "Ongoing Management",
  "aob-flow": "AOB Flow", "reimbursement-flow": "Reimbursement",
};

// ── Types for internal use ─────────────────────────────────────────────────────
interface ChronoItem {
  task: StrategyTask;
  stage: number; // 1, 2, 3
  stageKey: string; // "stage1Tasks", etc.
  startDay: number;
  duration: number;
  startDate: Date;
  endDate: Date;
  category: string;
}

interface DateGroup {
  date: Date;
  dayNumber: number; // Day 1, Day 2, etc.
  items: ChronoItem[];
  isToday: boolean;
  isPast: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ChronologicalChecklist({
  stage1Tasks,
  stage2Tasks,
  stage3Tasks,
  eliminationPeriod,
  planStartDate,
  taskCompletionDates,
  onToggleTask,
}: ChronologicalChecklistProps) {
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [filterStage, setFilterStage] = useState<number | null>(null); // null = all
  const [showCompleted, setShowCompleted] = useState(true);

  const elimDays = parseEliminationDays(eliminationPeriod);
  const startDate = useMemo(() => localDate(planStartDate), [planStartDate]);
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Build chronological items from all stages
  const { dateGroups, totalTasks, completedTasks } = useMemo(() => {
    const schedule = buildClaimSchedule(elimDays, { planStartDate: startDate, completedTasks: taskCompletionDates, activeTaskIds: [...stage1Tasks, ...stage2Tasks, ...stage3Tasks].map(t => t.id) });
    const allItems: ChronoItem[] = [];

    const addTasks = (tasks: StrategyTask[], stage: number, stageKey: string) => {
      for (const task of tasks) {
        const [start, dur] = schedule[task.id] || [0, 7];
        const sd = new Date(startDate);
        sd.setDate(sd.getDate() + start);
        const ed = new Date(startDate);
        ed.setDate(ed.getDate() + start + dur - 1);
        allItems.push({
          task, stage, stageKey, startDay: start, duration: dur,
          startDate: sd, endDate: ed, category: task.category,
        });
      }
    };

    addTasks(stage1Tasks, 1, "stage1Tasks");
    addTasks(stage2Tasks, 2, "stage2Tasks");
    addTasks(stage3Tasks, 3, "stage3Tasks");

    // Sort by start day, then by stage, then by task id
    allItems.sort((a, b) => a.startDay - b.startDay || a.stage - b.stage || a.task.id.localeCompare(b.task.id));

    // Group by start date
    const groupMap = new Map<string, DateGroup>();
    for (const item of allItems) {
      const key = localDateKey(item.startDate);
      if (!groupMap.has(key)) {
        const dayNum = item.startDay + 1;
        groupMap.set(key, {
          date: new Date(item.startDate),
          dayNumber: dayNum,
          items: [],
          isToday: isSameDay(item.startDate, today),
          isPast: item.startDate < today,
        });
      }
      groupMap.get(key)!.items.push(item);
    }

    const groups = Array.from(groupMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    const total = allItems.length;
    const completed = allItems.filter(i => i.task.completed).length;

    return { dateGroups: groups, totalTasks: total, completedTasks: completed };
  }, [stage1Tasks, stage2Tasks, stage3Tasks, elimDays, startDate, today, taskCompletionDates]);

  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter logic
  const filteredGroups = useMemo(() => {
    return dateGroups.map(group => {
      let items = group.items;
      if (filterStage !== null) items = items.filter(i => i.stage === filterStage);
      if (!showCompleted) items = items.filter(i => !i.task.completed);
      return { ...group, items };
    }).filter(g => g.items.length > 0);
  }, [dateGroups, filterStage, showCompleted]);

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey); else next.add(dateKey);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">Chronological Checklist</h3>
            <p className="text-xs text-muted-foreground">
              All tasks sorted by date &middot; {completedTasks}/{totalTasks} complete ({pct}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs text-muted-foreground font-medium">{pct}%</span>
        </div>
      </div>

      <p className="px-5 py-2 text-[10px] text-muted-foreground border-b">Dates are preliminary estimates. Carrier approval and elimination counting must be confirmed before relying on the schedule.</p>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/10">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Filter:</span>
        <button
          onClick={() => setFilterStage(null)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            filterStage === null
              ? "bg-slate-800 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Stages
        </button>
        {STAGE_STYLES.map((s, i) => (
          <button
            key={i}
            onClick={() => setFilterStage(filterStage === i + 1 ? null : i + 1)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
              filterStage === i + 1
                ? `${s.badge} shadow-sm`
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            Stage {i + 1}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              showCompleted ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? "linear-gradient(90deg, #10B981, #059669)"
                  : "linear-gradient(90deg, #3B82F6, #8B5CF6, #10B981)",
              }}
            />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{completedTasks} of {totalTasks}</span>
        </div>
      </div>

      {/* Date groups */}
      <div className="max-h-[700px] overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <p className="text-sm font-medium">{totalTasks === 0 ? "No scheduled tasks" : "No tasks match these filters"}</p>
            <p className="text-xs mt-1">Adjust the filters to review your tasks.</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const dateKey = localDateKey(group.date);
            const isCollapsed = collapsedDates.has(dateKey);
            const groupCompleted = group.items.filter(i => i.task.completed).length;
            const groupTotal = group.items.length;
            const allDone = groupCompleted === groupTotal;

            return (
              <div key={dateKey} className={`border-b border-border/50 last:border-b-0 ${group.isToday ? "bg-primary/[0.02]" : ""}`}>
                {/* Date header */}
                <button
                  onClick={() => toggleDateCollapse(dateKey)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-muted/30 ${
                    group.isToday ? "bg-primary/5" : ""
                  }`}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}

                  {/* Day number circle */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    group.isToday
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : allDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                    {group.dayNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${group.isToday ? "text-primary" : "text-foreground"}`}>
                        {formatDateHeader(group.date)}
                      </span>
                      {group.isToday && (
                        <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 hover:bg-primary/10">Today</Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Day {group.dayNumber} &middot; {groupCompleted}/{groupTotal} tasks complete
                    </span>
                  </div>

                  {/* Stage dots for this date */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {[1, 2, 3].map(s => {
                      const hasStage = group.items.some(i => i.stage === s);
                      if (!hasStage) return null;
                      return (
                        <div
                          key={s}
                          className={`w-2.5 h-2.5 rounded-full ${STAGE_STYLES[s - 1].dot}`}
                          title={STAGE_STYLES[s - 1].label}
                        />
                      );
                    })}
                  </div>

                  {/* Mini progress */}
                  <div className="flex-shrink-0 w-16">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${groupTotal ? (groupCompleted / groupTotal) * 100 : 0}%`,
                          backgroundColor: allDone ? "#10B981" : "#3B82F6",
                        }}
                      />
                    </div>
                  </div>
                </button>

                {/* Tasks */}
                {!isCollapsed && (
                  <div className="px-5 pb-3 space-y-1">
                    {group.items.map((item) => {
                      const stageStyle = STAGE_STYLES[item.stage - 1];
                      const done = item.task.completed;
                      const docLinks = getDocumentLinks(item.task.label);
                      const catLabel = CAT_LABELS[item.category] || item.category;

                      return (
                        <div
                          key={item.task.id}
                          className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                            done
                              ? "bg-slate-50/80"
                              : item.task.critical
                                ? `${stageStyle.lightBg} border ${stageStyle.border}`
                                : `hover:${stageStyle.lightBg} hover:border ${stageStyle.border.replace("border-", "hover:border-")}`
                          }`}
                          onClick={() => onToggleTask?.(item.stageKey, item.task.id)}
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 mt-0.5">
                            <Checkbox
                              checked={done}
                              aria-label={item.task.label}
                              onCheckedChange={() => onToggleTask?.(item.stageKey, item.task.id)}
                              className={done ? "" : `${stageStyle.ring}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Stage indicator dot */}
                          <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${done ? "bg-gray-300" : stageStyle.dot}`}
                            title={stageStyle.label}
                          />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <span className={`text-sm leading-relaxed ${
                                done
                                  ? "line-through text-muted-foreground/50"
                                  : item.task.critical
                                    ? `font-medium ${stageStyle.text}`
                                    : "text-foreground"
                              }`}>
                                {item.task.critical && !done && (
                                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                                )}
                                {item.task.label}
                              </span>
                            </div>

                            {/* Meta row: category, duration, stage badge */}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${done ? "bg-gray-100 text-gray-400" : stageStyle.badge}`}>
                                {stageStyle.label.split(":")[0]}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {catLabel}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                &middot; {isRecurringClaimTask(item.task.id) ? "Recurring activity · dates estimated; verify billing cadence" : (
                                  <>{formatDateShort(item.startDate)} – {formatDateShort(item.endDate)} ({item.duration} {item.duration === 1 ? "day" : "days"})</>
                                )}
                              </span>
                            </div>

                            {/* Document links */}
                            {docLinks.length > 0 && !done && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {docLinks.map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc.href}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                                  >
                                    <FileText className="w-3 h-3" />
                                    {doc.label}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            )}

                          </div>

                          {/* Completed check */}
                          {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 border-t border-border bg-muted/20">
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Stages:</span>
        {STAGE_STYLES.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
          <FileText className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] text-muted-foreground">= Document link available</span>
        </div>
      </div>
    </div>
  );
}
