import { CheckCircle2, Circle, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TimelineTask {
  id: string;
  label: string;
  completed: boolean;
  critical?: boolean;
  category: string;
}

interface ClaimTimelineProps {
  stage1Tasks: TimelineTask[];
  stage2Tasks: TimelineTask[];
  stage3Tasks: TimelineTask[];
  currentStage: number;
}

const PHASES = [
  {
    stage: 1,
    title: "Prior to Claim",
    subtitle: "Prepare & Gather",
    timeframe: "Days 1–17",
    description: "Gather documentation, establish medical necessity, and set up care providers before initiating your claim.",
    color: "blue",
    icon: "📋",
  },
  {
    stage: 2,
    title: "Filing the Claim",
    subtitle: "Submit & Track",
    timeframe: "Days 18–48",
    description: "Submit your complete claim packet and track the 30-day insurance review window.",
    color: "amber",
    icon: "📤",
  },
  {
    stage: 3,
    title: "Post-Approval",
    subtitle: "Manage & Maintain",
    timeframe: "Day 49+",
    description: "Manage ongoing benefits, submit invoices, and maintain documentation for continued coverage.",
    color: "green",
    icon: "✅",
  },
];

function getProgress(tasks: TimelineTask[]) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
}

export function ClaimTimeline({ stage1Tasks, stage2Tasks, stage3Tasks, currentStage }: ClaimTimelineProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(currentStage);
  const allTasks = [stage1Tasks, stage2Tasks, stage3Tasks];

  return (
    <div className="relative">
      {/* Overall progress bar */}
      <div className="mb-8 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-bold text-slate-900">Claim Progress</h3>
          <Badge variant="outline" className="text-xs font-medium">
            Stage {currentStage} of 3
          </Badge>
        </div>
        <div className="flex gap-1 mb-2">
          {PHASES.map((phase, i) => {
            const progress = getProgress(allTasks[i]);
            const isActive = currentStage === phase.stage;
            const isComplete = currentStage > phase.stage || progress === 100;
            return (
              <div key={phase.stage} className="flex-1">
                <div className={`h-2 rounded-full transition-all ${
                  isComplete ? "bg-green-500" : isActive ? "bg-teal" : "bg-slate-200"
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? "bg-green-500" : "bg-teal"
                    }`}
                    style={{ width: isComplete ? "100%" : isActive ? `${progress}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Pre-Filing</span>
          <span>Claim Process</span>
          <span>Post-Approval</span>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-8 md:pl-12">
        {/* Vertical line */}
        <div className="absolute left-3 md:left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-amber-300 to-green-300" />

        {PHASES.map((phase, i) => {
          const tasks = allTasks[i];
          const progress = getProgress(tasks);
          const isActive = currentStage === phase.stage;
          const isComplete = currentStage > phase.stage || progress === 100;
          const isPending = currentStage < phase.stage;
          const isExpanded = expandedPhase === phase.stage;
          const completedCount = tasks.filter(t => t.completed).length;
          const criticalPending = tasks.filter(t => t.critical && !t.completed).length;

          const colorMap: Record<string, { bg: string; border: string; text: string; dot: string; badge: string }> = {
            blue: {
              bg: isActive ? "bg-blue-50" : "bg-white",
              border: isActive ? "border-blue-300" : isComplete ? "border-green-200" : "border-slate-200",
              text: "text-blue-700",
              dot: isComplete ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-slate-300",
              badge: isComplete ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700",
            },
            amber: {
              bg: isActive ? "bg-amber-50" : "bg-white",
              border: isActive ? "border-amber-300" : isComplete ? "border-green-200" : "border-slate-200",
              text: "text-amber-700",
              dot: isComplete ? "bg-green-500" : isActive ? "bg-amber-500" : "bg-slate-300",
              badge: isComplete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
            },
            green: {
              bg: isActive ? "bg-green-50" : "bg-white",
              border: isActive ? "border-green-300" : isComplete ? "border-green-200" : "border-slate-200",
              text: "text-green-700",
              dot: isComplete ? "bg-green-500" : isActive ? "bg-green-500" : "bg-slate-300",
              badge: isComplete ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700",
            },
          };
          const colors = colorMap[phase.color];

          return (
            <div key={phase.stage} className={`relative mb-6 last:mb-0 ${isPending ? "opacity-60" : ""}`}>
              {/* Timeline dot */}
              <div className={`absolute -left-8 md:-left-12 top-5 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${colors.dot}`}>
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                ) : isActive ? (
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-pulse" />
                ) : (
                  <Circle className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                )}
              </div>

              {/* Phase card */}
              <div className={`rounded-xl border-2 transition-all ${colors.bg} ${colors.border} ${isActive ? "shadow-md" : "shadow-sm"}`}>
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.stage)}
                  className="w-full text-left p-4 md:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{phase.icon}</span>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                          Stage {phase.stage}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                          {phase.timeframe}
                        </span>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal font-semibold animate-pulse">
                            Current
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-slate-900">{phase.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{phase.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{completedCount}/{tasks.length}</span>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-teal"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      {criticalPending > 0 && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {criticalPending} critical
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </button>

                {/* Expanded task preview */}
                {isExpanded && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-slate-100">
                    <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                      {tasks.slice(0, 8).map(task => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-2.5 py-1.5 px-2 rounded-lg text-sm ${
                            task.completed ? "text-slate-400" : task.critical ? "text-amber-800 bg-amber-50" : "text-slate-700"
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : task.critical ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={task.completed ? "line-through" : ""}>{task.label}</span>
                        </div>
                      ))}
                      {tasks.length > 8 && (
                        <p className="text-xs text-slate-400 pl-6 pt-1">
                          + {tasks.length - 8} more tasks — see Task Checklists below
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline summary */}
      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-semibold text-slate-900 text-lg">{getProgress(stage1Tasks)}%</p>
            <p className="text-xs">Pre-Filing</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-lg">{getProgress(stage2Tasks)}%</p>
            <p className="text-xs">Claim Process</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-lg">{getProgress(stage3Tasks)}%</p>
            <p className="text-xs">Post-Approval</p>
          </div>
        </div>
      </div>
    </div>
  );
}
