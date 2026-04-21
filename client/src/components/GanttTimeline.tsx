import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type StrategyTask = {
  id: string;
  label: string;
  completed: boolean;
  category: string;
  critical?: boolean;
  uploadRequired?: boolean;
};

interface GanttTimelineProps {
  stage1Tasks: StrategyTask[];
  stage2Tasks: StrategyTask[];
  stage3Tasks: StrategyTask[];
  eliminationPeriod?: string;
  onToggleTask?: (stageKey: string, taskId: string) => void;
}

interface GanttRow {
  task: StrategyTask;
  stage: number;
  stageKey: string;
  startDay: number;
  duration: number;
  categoryLabel: string;
}

// ── Pastel palette per category ────────────────────────────────────────────────
const CAT: Record<string, { bg: string; border: string; text: string }> = {
  "carrier-contact":    { bg: "#DBEAFE", border: "#93C5FD", text: "#1E40AF" },
  "medical-evaluation": { bg: "#FCE7F3", border: "#F9A8D4", text: "#9D174D" },
  "provider-setup":     { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
  "documents":          { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
  "elimination-period": { bg: "#E0E7FF", border: "#A5B4FC", text: "#3730A3" },
  "personal-info":      { bg: "#F3E8FF", border: "#C4B5FD", text: "#5B21B6" },
  "claim-packet":       { bg: "#FFEDD5", border: "#FDBA74", text: "#9A3412" },
  "verification":       { bg: "#CFFAFE", border: "#67E8F9", text: "#155E75" },
  "submission":         { bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B" },
  "evaluation":         { bg: "#ECFCCB", border: "#BEF264", text: "#3F6212" },
  "post-submission":    { bg: "#E0F2FE", border: "#7DD3FC", text: "#0C4A6E" },
  "ongoing":            { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
  "aob-flow":           { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
  "reimbursement-flow": { bg: "#FCE7F3", border: "#F9A8D4", text: "#9D174D" },
};
const COMPLETED_BG = "#E5E7EB";
const COMPLETED_BORDER = "#D1D5DB";

const CAT_LABELS: Record<string, string> = {
  "carrier-contact": "Carrier Contact", "medical-evaluation": "Medical Evaluation",
  "provider-setup": "Provider Setup", "documents": "Document Collection",
  "elimination-period": "Elimination Period", "personal-info": "Personal Information",
  "claim-packet": "Claim Packet", "verification": "Verification",
  "submission": "Submission", "evaluation": "Third-Party Evaluation",
  "post-submission": "Post-Submission", "ongoing": "Ongoing Management",
  "aob-flow": "AOB Flow", "reimbursement-flow": "Reimbursement",
};

const STAGE_LABELS = ["Stage 1: Prior to Claim", "Stage 2: Filing the Claim", "Stage 3: Post-Approval"];
const STAGE_COLORS = [
  { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },
  { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E" },
  { bg: "#ECFDF5", border: "#10B981", text: "#065F46" },
];

// ── Dimensions ─────────────────────────────────────────────────────────────────
const DAY_W = 36;
const ROW_H = 36;
const HEADER_H = 48;
const STAGE_H = 30;
const LEFT_W = 340;
const MAX_VISIBLE_H = 600; // max height of the scrollable body

// ── Build Gantt rows ───────────────────────────────────────────────────────────
function buildRows(s1: StrategyTask[], s2: StrategyTask[], s3: StrategyTask[], elimDays: number) {
  const rows: GanttRow[] = [];
  const stageInserts: { beforeRowIdx: number; stage: number }[] = [];

  const sched: Record<string, [number, number]> = {
    "s1-1": [0, 3], "s1-2": [0, 3], "s1-3": [0, 3],
    "s1-4": [2, 7], "s1-5": [2, 7],
    "s1-6": [3, 5], "s1-7": [5, 5], "s1-8": [5, 10], "s1-9": [7, 7], "s1-10": [7, 10],
    "s1-11": [5, 10], "s1-12": [10, 5],
    "s1-13": [10, 7], "s1-14": [12, 7], "s1-15": [10, 5], "s1-16": [14, 5],
    "s1-17": [18, Math.max(elimDays, 14)],
    "s1-18": [3, 5], "s1-19": [3, 7], "s1-20": [10, 5], "s1-21": [10, 5],
  };
  const p = 25; // stage 1 prep end
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
    "s3-1": [s2End, elimDays], "s3-2": [s2End, elimDays], "s3-3": [s2End, elimDays],
    "s3-4": [s2End + 14, 14], "s3-5": [s2End + 14, 14],
    "s3-6": [s2End + 7, 21], "s3-7": [s2End + 14, 21], "s3-8": [s2End + 21, 21],
    "s3-9": [s2End, 30], "s3-10": [s2End, 30],
  };
  const all = { ...sched, ...s2Sched, ...s3Sched };

  const push = (tasks: StrategyTask[], stage: number, key: string, fallback: [number, number]) => {
    for (const t of tasks) {
      const [start, dur] = all[t.id] || fallback;
      rows.push({ task: t, stage, stageKey: key, startDay: start, duration: dur, categoryLabel: CAT_LABELS[t.category] || t.category });
    }
  };

  push(s1, 1, "stage1Tasks", [0, 7]);
  const s2Start = rows.length;
  stageInserts.push({ beforeRowIdx: s2Start, stage: 2 });
  push(s2, 2, "stage2Tasks", [p, 5]);
  const s3Start = rows.length;
  stageInserts.push({ beforeRowIdx: s3Start, stage: 3 });
  push(s3, 3, "stage3Tasks", [s2End, 14]);

  let maxDay = 0;
  for (const r of rows) { const e = r.startDay + r.duration; if (e > maxDay) maxDay = e; }

  return { rows, totalDays: Math.max(maxDay + 7, 60), stageInserts };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (d: Date) => `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const fmtShort = (d: Date) => `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}`;
const dayName = (d: Date) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];

// ── Component ──────────────────────────────────────────────────────────────────
export function GanttTimeline({ stage1Tasks, stage2Tasks, stage3Tasks, eliminationPeriod, onToggleTask }: GanttTimelineProps) {
  const leftBodyRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const syncingRef = useRef(false);

  const elimDays = eliminationPeriod ? parseInt(eliminationPeriod, 10) || 90 : 90;
  const startDate = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const { rows, totalDays, stageInserts } = useMemo(() => buildRows(stage1Tasks, stage2Tasks, stage3Tasks, elimDays), [stage1Tasks, stage2Tasks, stage3Tasks, elimDays]);

  // Build a flat list of visual items: stage headers + task rows
  type VisualItem = { type: "stage"; stage: number } | { type: "task"; rowIdx: number };
  const visualItems = useMemo(() => {
    const items: VisualItem[] = [];
    items.push({ type: "stage", stage: 1 });
    for (let i = 0; i < rows.length; i++) {
      const ins = stageInserts.find(s => s.beforeRowIdx === i);
      if (ins) items.push({ type: "stage", stage: ins.stage });
      items.push({ type: "task", rowIdx: i });
    }
    return items;
  }, [rows, stageInserts]);

  const contentH = visualItems.reduce((h, item) => h + (item.type === "stage" ? STAGE_H : ROW_H), 0);
  const bodyH = Math.min(contentH, MAX_VISIBLE_H);

  // Synchronized vertical scrolling
  const syncScroll = useCallback((source: "left" | "right") => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const from = source === "left" ? leftBodyRef.current : rightPaneRef.current;
    const to = source === "left" ? rightPaneRef.current : leftBodyRef.current;
    if (from && to) to.scrollTop = from.scrollTop;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const getDateForDay = useCallback((i: number) => { const d = new Date(startDate); d.setDate(d.getDate() + i); return d; }, [startDate]);

  const totalTasks = rows.length;
  const completedTasks = rows.filter(r => r.task.completed).length;
  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const scrollRight = useCallback(() => {
    if (rightPaneRef.current) rightPaneRef.current.scrollBy({ left: DAY_W * 7, behavior: "smooth" });
  }, []);
  const scrollLeft = useCallback(() => {
    if (rightPaneRef.current) rightPaneRef.current.scrollBy({ left: -DAY_W * 7, behavior: "smooth" });
  }, []);

  // Render a stage header row
  const renderStageHeader = (stage: number, key: string) => {
    const c = STAGE_COLORS[stage - 1];
    return (
      <div key={key} className="flex items-center px-3 font-semibold text-xs border-b" style={{ height: STAGE_H, backgroundColor: c.bg, borderColor: c.border, color: c.text }}>
        <div className="w-1 h-4 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: c.border }} />
        {STAGE_LABELS[stage - 1]}
      </div>
    );
  };

  // Render a stage header bar (right side)
  const renderStageBar = (stage: number, key: string) => {
    const c = STAGE_COLORS[stage - 1];
    return <div key={key} className="border-b" style={{ height: STAGE_H, backgroundColor: c.bg, borderColor: c.border }} />;
  };

  // Render a task row (left side)
  const renderTaskLeft = (row: GanttRow, idx: number) => {
    const isHovered = hoveredRow === idx;
    const done = row.task.completed;
    const cc = CAT[row.task.category] || CAT["documents"];
    return (
      <div
        key={row.task.id}
        className={`flex items-center gap-2 px-3 border-b border-border/40 transition-colors cursor-pointer group ${isHovered ? "bg-accent/50" : done ? "bg-muted/20" : ""}`}
        style={{ height: ROW_H }}
        onMouseEnter={() => setHoveredRow(idx)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={() => onToggleTask?.(row.stageKey, row.task.id)}
      >
        <div className={`flex-shrink-0 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${done ? "bg-emerald-500 border-emerald-500" : "border-gray-300 group-hover:border-gray-400"}`}>
          {done && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: done ? "#9CA3AF" : cc.border }} />
        <span className={`text-[11px] leading-tight truncate ${done ? "line-through text-muted-foreground/50" : "text-foreground"}`} title={row.task.label}>
          {row.task.label}
        </span>
        {row.task.critical && !done && <span className="flex-shrink-0 text-[8px] font-bold text-red-500 bg-red-50 px-1 rounded">!</span>}
      </div>
    );
  };

  // Render a task bar (right side)
  const renderTaskBar = (row: GanttRow, idx: number) => {
    const isHovered = hoveredRow === idx;
    const done = row.task.completed;
    const cc = CAT[row.task.category] || CAT["documents"];
    const bg = done ? COMPLETED_BG : cc.bg;
    const border = done ? COMPLETED_BORDER : cc.border;
    const barLeft = row.startDay * DAY_W + 2;
    const barW = Math.max(row.duration * DAY_W - 4, 10);

    return (
      <div
        key={row.task.id}
        className={`relative border-b border-border/30 transition-colors ${isHovered ? "bg-accent/20" : ""}`}
        style={{ height: ROW_H }}
        onMouseEnter={() => setHoveredRow(idx)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <div
          className={`absolute top-[5px] rounded-[4px] border transition-all ${done ? "opacity-45" : "opacity-90 hover:opacity-100"} ${isHovered ? "shadow-md" : "shadow-sm"}`}
          style={{ left: barLeft, width: barW, height: ROW_H - 10, backgroundColor: bg, borderColor: border }}
          onClick={() => onToggleTask?.(row.stageKey, row.task.id)}
          title={`${row.task.label}\n${row.categoryLabel} · Day ${row.startDay + 1}–${row.startDay + row.duration} (${row.duration} days)`}
        >
          {barW > 90 && (
            <div className="absolute inset-0 flex items-center px-1.5 overflow-hidden">
              {done && <CheckCircle2 className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />}
              <span className={`text-[9px] font-medium truncate ${done ? "text-gray-400 line-through" : ""}`} style={{ color: done ? "#9CA3AF" : cc.text }}>
                {row.task.label}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">Claim Timeline</h3>
            <p className="text-xs text-muted-foreground">Starting {fmtDate(startDate)} &middot; {totalDays} days &middot; {elimDays}-day elimination period</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{completedTasks}/{totalTasks} tasks ({pct}%)</span>
          </div>
          <div className="flex gap-1">
            <button onClick={scrollLeft} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Scroll left 1 week"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={scrollRight} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Scroll right 1 week"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* ── Gantt body: two-pane layout ──────────────────────────── */}
      <div className="flex" style={{ height: bodyH + HEADER_H }}>

        {/* ── LEFT PANE (frozen task names) ─────────────────────── */}
        <div className="flex-shrink-0 flex flex-col border-r-2 border-border bg-card z-20" style={{ width: LEFT_W }}>
          {/* Corner header */}
          <div className="flex items-center px-3 border-b border-border bg-muted/50 font-medium text-[10px] text-muted-foreground uppercase tracking-wider flex-shrink-0" style={{ height: HEADER_H }}>
            Task
          </div>
          {/* Scrollable task list */}
          <div ref={leftBodyRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }} onScroll={() => syncScroll("left")}>
            {visualItems.map((item, i) =>
              item.type === "stage"
                ? renderStageHeader(item.stage, `ls-${i}`)
                : renderTaskLeft(rows[item.rowIdx], item.rowIdx)
            )}
          </div>
        </div>

        {/* ── RIGHT PANE (scrollable days + bars) ──────────────── */}
        <div ref={rightPaneRef} className="flex-1 overflow-auto" onScroll={() => syncScroll("right")}>
          <div style={{ width: totalDays * DAY_W, minHeight: contentH + HEADER_H }}>
            {/* Day headers (sticky) */}
            <div className="sticky top-0 z-10 flex border-b border-border bg-card" style={{ height: HEADER_H }}>
              {Array.from({ length: totalDays }, (_, i) => {
                const d = getDateForDay(i);
                const wknd = d.getDay() === 0 || d.getDay() === 6;
                const today = i === 0;
                const fom = d.getDate() === 1;
                return (
                  <div key={i} className={`flex-shrink-0 flex flex-col items-center justify-center border-r ${today ? "bg-primary/10 border-primary/30" : wknd ? "bg-muted/40 border-border/30" : "border-border/30"} ${fom ? "border-l border-l-border/60" : ""}`} style={{ width: DAY_W }}>
                    <span className={`text-[8px] leading-none ${today ? "font-bold text-primary" : wknd ? "text-muted-foreground/40" : "text-muted-foreground/60"}`}>{dayName(d)}</span>
                    <span className={`text-[10px] font-medium leading-tight mt-0.5 ${today ? "text-primary font-bold" : wknd ? "text-muted-foreground/50" : "text-foreground/80"}`}>{d.getDate()}</span>
                    <span className={`text-[7px] leading-none ${today ? "text-primary/80" : "text-muted-foreground/40"}`}>{(fom || i === 0) ? fmtShort(d).split(" ")[0] : ""}</span>
                  </div>
                );
              })}
            </div>

            {/* Bars area */}
            <div className="relative">
              {/* Weekend shading */}
              {Array.from({ length: totalDays }, (_, i) => {
                const d = getDateForDay(i);
                if (d.getDay() !== 0 && d.getDay() !== 6) return null;
                return <div key={`w-${i}`} className="absolute top-0 bg-muted/15" style={{ left: i * DAY_W, width: DAY_W, height: contentH }} />;
              })}

              {/* Today line */}
              <div className="absolute top-0 z-10 pointer-events-none" style={{ left: DAY_W / 2 - 1, width: 2, height: contentH, background: "linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--primary) / 0.2))" }} />

              {/* Visual rows */}
              {visualItems.map((item, i) =>
                item.type === "stage"
                  ? renderStageBar(item.stage, `rs-${i}`)
                  : renderTaskBar(rows[item.rowIdx], item.rowIdx)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2 border-t border-border bg-muted/20">
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Categories:</span>
        {Object.entries(CAT_LABELS).map(([key, label]) => {
          const c = CAT[key];
          if (!c || !rows.some(r => r.task.category === key)) return null;
          return (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm border" style={{ backgroundColor: c.bg, borderColor: c.border }} />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
          <div className="w-3 h-2 rounded-sm bg-gray-200 border border-gray-300" />
          <span className="text-[9px] text-muted-foreground">Completed</span>
        </div>
      </div>
    </div>
  );
}
