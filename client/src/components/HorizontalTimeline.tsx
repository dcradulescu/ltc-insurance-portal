import { CheckCircle2, Circle, AlertTriangle, Clock, ChevronLeft, ChevronRight, GripHorizontal } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TimelineTask {
  id: string;
  label: string;
  completed: boolean;
  critical?: boolean;
  category: string;
}

interface HorizontalTimelineProps {
  stage1Tasks: TimelineTask[];
  stage2Tasks: TimelineTask[];
  stage3Tasks: TimelineTask[];
  currentStage: number;
  eliminationPeriod?: string;
}

function getProgress(tasks: TimelineTask[]) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
}

function groupByCategory(tasks: TimelineTask[]) {
  const groups: Record<string, TimelineTask[]> = {};
  tasks.forEach(t => {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  });
  return groups;
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  "carrier-contact": { label: "Carrier Contact", icon: "📞" },
  "medical-evaluation": { label: "Medical Evaluation", icon: "🩺" },
  "provider-setup": { label: "Provider Setup", icon: "🏥" },
  "documents": { label: "Document Collection", icon: "📄" },
  "elimination-period": { label: "Elimination Period", icon: "⏱️" },
  "personal-info": { label: "Personal Info", icon: "🔒" },
  "claim-packet": { label: "Claim Packet", icon: "📦" },
  "verification": { label: "Verification", icon: "✅" },
  "submission": { label: "Submission", icon: "📤" },
  "evaluation": { label: "Evaluation", icon: "🔍" },
  "post-submission": { label: "Post-Submission", icon: "📋" },
  "ongoing": { label: "Ongoing Mgmt", icon: "🔄" },
  "aob-flow": { label: "AOB Flow", icon: "💰" },
  "reimbursement-flow": { label: "Reimbursement", icon: "💵" },
};

// Compute dynamic timeframes based on elimination period
// The LTC claim process works as follows:
//   Stage 1: Pre-claim preparation — gather docs, establish medical necessity, set up providers
//   Stage 2: File the claim packet → carrier has 30 days to review (independent of elimination period)
//   Stage 3: Post-approval — manage benefits; elimination period runs separately from when services begin
function computeTimeframes(eliminationDays: number) {
  // Stage 1: Preparation phase — allow enough time to gather everything
  // Use roughly 1/3 of elimination period, with a minimum of 14 days and max of 45 days
  const stage1Days = Math.max(14, Math.min(45, Math.round(eliminationDays / 3)));
  const stage1Start = 1;
  const stage1End = stage1Days;

  // Stage 2: Filing the claim + 30-day carrier review window
  // The 30-day review window starts when the claim packet is submitted — it is NOT tied to the elimination period
  const stage2Start = stage1End + 1;
  const reviewWindowDays = 30;
  const stage2End = stage2Start + reviewWindowDays - 1;

  // Stage 3: Post-approval — begins after the carrier review is complete
  // The elimination period runs separately from when qualifying services begin
  const stage3Start = stage2End + 1;

  return {
    stage1: `Days ${stage1Start}–${stage1End}`,
    stage2: `Days ${stage2Start}–${stage2End}`,
    stage3: `Day ${stage3Start}+`,
    stage1Desc: `Gather documentation, establish medical necessity, and set up care providers (~${stage1Days} days).`,
    stage2Desc: `Submit your complete claim packet. The carrier has 30 days to review your claim after submission.`,
    stage3Desc: `Manage ongoing benefits, submit invoices, and track your ${eliminationDays}-day elimination period (runs from when qualifying services begin).`,
  };
}

function buildStages(eliminationDays: number) {
  const tf = computeTimeframes(eliminationDays);
  return [
    {
      stage: 1,
      title: "Prior to Claim",
      subtitle: "Prepare & Gather",
      timeframe: tf.stage1,
      description: tf.stage1Desc,
      color: "blue" as const,
      icon: "📋",
      bgGradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      borderColor: "border-blue-200",
      activeBorder: "border-blue-400",
      textColor: "text-blue-700",
      badgeColor: "bg-blue-100 text-blue-700",
      progressColor: "bg-blue-500",
      ringColor: "ring-blue-200",
    },
    {
      stage: 2,
      title: "Filing the Claim",
      subtitle: "Submit & Track",
      timeframe: tf.stage2,
      description: tf.stage2Desc,
      color: "amber" as const,
      icon: "📤",
      bgGradient: "from-amber-500 to-amber-600",
      lightBg: "bg-amber-50",
      borderColor: "border-amber-200",
      activeBorder: "border-amber-400",
      textColor: "text-amber-700",
      badgeColor: "bg-amber-100 text-amber-700",
      progressColor: "bg-amber-500",
      ringColor: "ring-amber-200",
    },
    {
      stage: 3,
      title: "Post-Approval",
      subtitle: "Manage & Maintain",
      timeframe: tf.stage3,
      description: tf.stage3Desc,
      color: "green" as const,
      icon: "✅",
      bgGradient: "from-green-500 to-green-600",
      lightBg: "bg-green-50",
      borderColor: "border-green-200",
      activeBorder: "border-green-400",
      textColor: "text-green-700",
      badgeColor: "bg-green-100 text-green-700",
      progressColor: "bg-green-500",
      ringColor: "ring-green-200",
    },
  ];
}

export function HorizontalTimeline({ stage1Tasks, stage2Tasks, stage3Tasks, currentStage, eliminationPeriod }: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  // Parse elimination period to number of days (default 90 if not specified)
  const elimDays = eliminationPeriod ? parseInt(eliminationPeriod, 10) || 90 : 90;
  const STAGES = buildStages(elimDays);

  const allTasks = [stage1Tasks, stage2Tasks, stage3Tasks];
  const totalTasks = stage1Tasks.length + stage2Tasks.length + stage3Tasks.length;
  const totalCompleted = stage1Tasks.filter(t => t.completed).length + stage2Tasks.filter(t => t.completed).length + stage3Tasks.filter(t => t.completed).length;
  const overallProgress = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const resizeObs = new ResizeObserver(checkScroll);
    resizeObs.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      resizeObs.disconnect();
    };
  }, [checkScroll]);

  // Auto-scroll to current stage on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const stageIndex = Math.max(0, currentStage - 1);
    const cards = el.querySelectorAll("[data-stage-card]");
    if (cards[stageIndex]) {
      const card = cards[stageIndex] as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const containerCenter = el.clientWidth / 2;
      el.scrollTo({ left: cardCenter - containerCenter, behavior: "smooth" });
    }
  }, [currentStage]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragStartX.current;
    scrollRef.current.scrollLeft = scrollStartX.current - dx;
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative">
      {/* Overall Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
            <Badge variant="outline" className="text-xs font-semibold">
              {overallProgress}%
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Stage {currentStage} of 3
          </Badge>
          {eliminationPeriod && (
            <Badge variant="outline" className="text-xs text-slate-500">
              {eliminationPeriod} day elimination
            </Badge>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-green-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Scroll container with navigation */}
      <div className="relative group">
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 -ml-3"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 -mr-3"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* Left fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}

        {/* Right fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable timeline track */}
        <div
          ref={scrollRef}
          className={`overflow-x-auto scrollbar-hide pb-4 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-0 min-w-max px-2 py-2">
            {STAGES.map((stage, i) => {
              const tasks = allTasks[i];
              const progress = getProgress(tasks);
              const isActive = currentStage === stage.stage;
              const isComplete = currentStage > stage.stage || progress === 100;
              const isPending = currentStage < stage.stage;
              const completedCount = tasks.filter(t => t.completed).length;
              const criticalPending = tasks.filter(t => t.critical && !t.completed).length;
              const groups = groupByCategory(tasks);

              return (
                <div key={stage.stage} className="flex items-stretch" data-stage-card>
                  {/* Stage card */}
                  <div
                    className={`w-[380px] md:w-[420px] rounded-2xl border-2 transition-all flex flex-col ${
                      isActive
                        ? `${stage.lightBg} ${stage.activeBorder} shadow-lg ring-4 ${stage.ringColor}/30`
                        : isComplete
                          ? "bg-white border-green-200 shadow-sm"
                          : "bg-white border-slate-200 shadow-sm"
                    } ${isPending ? "opacity-60" : ""}`}
                  >
                    {/* Stage header */}
                    <div className={`px-5 py-4 rounded-t-xl bg-gradient-to-r ${
                      isComplete ? "from-green-500 to-green-600" : stage.bgGradient
                    } text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{stage.icon}</span>
                          <div>
                            <div className="text-xs font-medium text-white/70 uppercase tracking-wider">Stage {stage.stage}</div>
                            <h3 className="text-lg font-bold leading-tight">{stage.title}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{progress}%</div>
                          <div className="text-xs text-white/70">{completedCount}/{tasks.length} tasks</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{stage.timeframe}</span>
                        {isActive && (
                          <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            Current Stage
                          </span>
                        )}
                        {isComplete && (
                          <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </span>
                        )}
                      </div>
                      {/* Progress bar within header */}
                      <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/80 rounded-full transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="px-5 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500 leading-relaxed">{stage.description}</p>
                      {criticalPending > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="font-medium">{criticalPending} critical task{criticalPending > 1 ? "s" : ""} pending</span>
                        </div>
                      )}
                    </div>

                    {/* Category milestones */}
                    <div className="px-5 py-3 flex-1 overflow-y-auto max-h-[280px]">
                      <div className="space-y-2">
                        {Object.entries(groups).map(([cat, catTasks]) => {
                          const catCompleted = catTasks.filter(t => t.completed).length;
                          const catTotal = catTasks.length;
                          const catProgress = Math.round((catCompleted / catTotal) * 100);
                          const catInfo = categoryLabels[cat] || { label: cat, icon: "📌" };
                          const allDone = catCompleted === catTotal;

                          return (
                            <div
                              key={cat}
                              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                                allDone ? "bg-green-50" : "bg-slate-50 hover:bg-slate-100"
                              }`}
                            >
                              <span className="text-base flex-shrink-0">{catInfo.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-semibold truncate ${allDone ? "text-green-700" : "text-slate-700"}`}>
                                    {catInfo.label}
                                  </span>
                                  <span className={`text-xs font-medium flex-shrink-0 ${allDone ? "text-green-600" : "text-slate-500"}`}>
                                    {catCompleted}/{catTotal}
                                  </span>
                                </div>
                                <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : stage.progressColor}`}
                                    style={{ width: `${catProgress}%` }}
                                  />
                                </div>
                              </div>
                              {allDone && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage footer with key tasks preview */}
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">
                          {Object.keys(groups).length} categories
                        </span>
                        {isActive && (
                          <span className="text-xs text-teal font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector arrow between stages */}
                  {i < STAGES.length - 1 && (
                    <div className="flex items-center px-3 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-12 h-0.5 ${
                          isComplete ? "bg-green-400" : "bg-slate-200"
                        }`} />
                        <ChevronRight className={`w-5 h-5 ${
                          isComplete ? "text-green-400" : "text-slate-300"
                        }`} />
                        <div className={`w-12 h-0.5 ${
                          isComplete ? "bg-green-400" : "bg-slate-200"
                        }`} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
          <GripHorizontal className="w-4 h-4" />
          <span>Scroll or drag to navigate the timeline</span>
        </div>
      </div>

      {/* Timeline summary bar */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {STAGES.map((stage, i) => {
          const progress = getProgress(allTasks[i]);
          const isActive = currentStage === stage.stage;
          const isComplete = currentStage > stage.stage || progress === 100;
          return (
            <button
              key={stage.stage}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const cards = el.querySelectorAll("[data-stage-card]");
                if (cards[i]) {
                  const card = cards[i] as HTMLElement;
                  const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                  const containerCenter = el.clientWidth / 2;
                  el.scrollTo({ left: cardCenter - containerCenter, behavior: "smooth" });
                }
              }}
              className={`p-3 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                isActive
                  ? `${stage.lightBg} ${stage.activeBorder}`
                  : isComplete
                    ? "bg-green-50 border-green-200"
                    : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-lg mb-0.5">{stage.icon}</div>
              <div className="text-xs font-semibold text-slate-700">{stage.title}</div>
              <div className={`text-lg font-bold mt-1 ${
                isComplete ? "text-green-600" : isActive ? stage.textColor : "text-slate-400"
              }`}>
                {progress}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
