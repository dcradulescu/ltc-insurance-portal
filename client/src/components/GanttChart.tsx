import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface GanttTask {
  id: string;
  label: string;
  phase: "phase1" | "phase2" | "phase3";
  startDay: number;
  endDay: number;
  critical?: boolean;
  completed?: boolean;
  milestone?: boolean;
}

interface GanttChartProps {
  tasks: GanttTask[];
  totalDays?: number;
}

const PHASE_CONFIG = {
  phase1: {
    label: "Phase 1: Pre-Filing",
    color: "bg-blue-100 border-blue-300",
    textColor: "text-blue-900",
    startDay: 1,
    endDay: 17,
    description: "Days 1-17: Prepare documentation and gather requirements",
  },
  phase2: {
    label: "Phase 2: Claim Process",
    color: "bg-amber-100 border-amber-300",
    textColor: "text-amber-900",
    startDay: 18,
    endDay: 48,
    description: "Days 18-48: Insurance review and evaluation (30-day window)",
  },
  phase3: {
    label: "Phase 3: Post-Approval",
    color: "bg-green-100 border-green-300",
    textColor: "text-green-900",
    startDay: 49,
    endDay: 365,
    description: "Day 49+: Ongoing benefit management",
  },
};

export function GanttChart({ tasks, totalDays = 365 }: GanttChartProps) {
  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped: Record<string, GanttTask[]> = {
      phase1: [],
      phase2: [],
      phase3: [],
    };
    tasks.forEach((task) => {
      grouped[task.phase].push(task);
    });
    return grouped;
  }, [tasks]);

  // Calculate pixel width per day (responsive)
  const chartWidth = 1200; // pixels
  const pixelsPerDay = chartWidth / totalDays;

  const getTaskPosition = (startDay: number) => {
    return startDay * pixelsPerDay;
  };

  const getTaskWidth = (startDay: number, endDay: number) => {
    return (endDay - startDay + 1) * pixelsPerDay;
  };

  const renderPhaseSection = (phaseKey: "phase1" | "phase2" | "phase3") => {
    const config = PHASE_CONFIG[phaseKey];
    const phaseTasks = tasksByPhase[phaseKey];

    return (
      <div key={phaseKey} className="mb-8">
        <div className={`p-4 rounded-lg border-2 ${config.color} mb-4`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className={`font-bold text-lg ${config.textColor}`}>{config.label}</h3>
              <p className={`text-sm ${config.textColor} opacity-75`}>{config.description}</p>
            </div>
            <Badge variant="outline" className={config.textColor}>
              Days {config.startDay}-{config.endDay}
            </Badge>
          </div>
        </div>

        {/* Timeline visualization */}
        <div className="relative mb-6 overflow-x-auto">
          <div className="min-w-max" style={{ width: `${chartWidth}px` }}>
            {/* Phase background bar */}
            <div className="relative h-12 bg-gray-100 rounded border border-gray-300 mb-4">
              {/* Day markers */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r border-gray-300 text-xs text-gray-500 p-1"
                    style={{ width: `${pixelsPerDay * 7}px` }}
                  >
                    W{i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {phaseTasks.map((task) => (
                <div key={task.id} className="relative h-10">
                  <div
                    className={`absolute h-full rounded-lg border-2 flex items-center px-3 text-sm font-medium transition-all ${
                      task.critical
                        ? "bg-red-100 border-red-400 text-red-900"
                        : task.completed
                          ? "bg-green-100 border-green-400 text-green-900"
                          : "bg-blue-50 border-blue-400 text-blue-900"
                    }`}
                    style={{
                      left: `${getTaskPosition(task.startDay)}px`,
                      width: `${getTaskWidth(task.startDay, task.endDay)}px`,
                      minWidth: "120px",
                    }}
                    title={`${task.label} (Days ${task.startDay}-${task.endDay})`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {task.critical && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      {task.completed && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                      {task.milestone && <Clock className="w-4 h-4 flex-shrink-0" />}
                      <span className="truncate">{task.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task list */}
        {phaseTasks.length > 0 && (
          <div className="space-y-2">
            {phaseTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {task.critical ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.label}</p>
                  <p className="text-xs text-gray-600">
                    Days {task.startDay}-{task.endDay} ({task.endDay - task.startDay + 1} days)
                  </p>
                </div>
                {task.critical && (
                  <Badge variant="destructive" className="text-xs">
                    Critical
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          LTC Insurance Claim Timeline
        </CardTitle>
        <CardDescription>
          Visual timeline showing all three phases of the claim process with task milestones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
            <span className="text-sm">Regular Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
            <span className="text-sm">Critical Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
            <span className="text-sm">Completed</span>
          </div>
        </div>

        {/* Phase sections */}
        {renderPhaseSection("phase1")}
        {renderPhaseSection("phase2")}
        {renderPhaseSection("phase3")}

        {/* Summary */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Timeline Summary</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Phase 1:</strong> 17 days to prepare and submit claim packet</li>
            <li>• <strong>Phase 2:</strong> 30 days for insurance review and evaluation</li>
            <li>• <strong>Phase 3:</strong> Ongoing benefit management and annual reviews</li>
            <li>• <strong>Total:</strong> 47 days to claim determination, then ongoing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
