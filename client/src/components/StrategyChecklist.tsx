import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface StrategyTask {
  id: string;
  label: string;
  completed: boolean;
  category: string;
  critical?: boolean;
  phase: "phase1" | "phase2" | "phase3";
  timeline: string; // e.g., "Day 1", "Week 1-2", "Week 4-12"
  details?: string;
  subTasks?: string[];
  documents?: string[];
}

interface StrategyChecklistProps {
  tasks: StrategyTask[];
  policyId: number;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
}

const PHASE_LABELS = {
  phase1: "Phase 1: Pre-Filing (Days 1-17)",
  phase2: "Phase 2: Claim Process (Days 18-48)",
  phase3: "Phase 3: Post-Approval (Ongoing)",
};

const PHASE_COLORS = {
  phase1: "bg-blue-50 border-blue-200",
  phase2: "bg-amber-50 border-amber-200",
  phase3: "bg-green-50 border-green-200",
};

const PHASE_BADGE_COLORS = {
  phase1: "bg-blue-100 text-blue-800",
  phase2: "bg-amber-100 text-amber-800",
  phase3: "bg-green-100 text-green-800",
};

export function StrategyChecklist({ tasks, policyId, onTaskToggle }: StrategyChecklistProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});

  // Load persisted state from localStorage
  useEffect(() => {
    const storageKey = `strategy-checklist-${policyId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setTaskStates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load checklist state:", e);
      }
    } else {
      // Initialize from tasks
      const initial: Record<string, boolean> = {};
      tasks.forEach(task => {
        initial[task.id] = task.completed;
      });
      setTaskStates(initial);
    }
  }, [policyId, tasks]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const storageKey = `strategy-checklist-${policyId}`;
    localStorage.setItem(storageKey, JSON.stringify(taskStates));
  }, [taskStates, policyId]);

  const handleTaskToggle = (taskId: string) => {
    const newState = !taskStates[taskId];
    setTaskStates(prev => ({
      ...prev,
      [taskId]: newState,
    }));
    onTaskToggle?.(taskId, newState);
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Group tasks by phase and timeline
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Record<string, StrategyTask[]>> = {
      phase1: {},
      phase2: {},
      phase3: {},
    };

    tasks.forEach(task => {
      if (!groups[task.phase]) {
        groups[task.phase] = {};
      }
      if (!groups[task.phase][task.timeline]) {
        groups[task.phase][task.timeline] = [];
      }
      groups[task.phase][task.timeline].push(task);
    });

    return groups;
  }, [tasks]);

  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = Object.values(taskStates).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const renderPhaseSection = (phase: "phase1" | "phase2" | "phase3") => {
    const phaseTasks = groupedTasks[phase];
    if (!phaseTasks || Object.keys(phaseTasks).length === 0) {
      return null;
    }

    const timelines = Object.keys(phaseTasks).sort((a, b) => {
      // Custom sort for timeline order
      const order = ["Day 1", "Day 2-3", "Day 3-9", "Day 4-21", "Day 5-20", "Day 10", "Day 12-13", "Day 14", "Day 15-16", "Day 17", "Day 18-48"];
      return order.indexOf(a) - order.indexOf(b);
    });

    return (
      <div key={phase} className={`border rounded-lg p-6 mb-6 ${PHASE_COLORS[phase]}`}>
        <h2 className={`text-xl font-bold mb-4 px-3 py-1 rounded w-fit ${PHASE_BADGE_COLORS[phase]}`}>
          {PHASE_LABELS[phase]}
        </h2>

        {timelines.map(timeline => (
          <div key={`${phase}-${timeline}`} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {timeline}
            </h3>

            <div className="space-y-2 ml-6">
              {phaseTasks[timeline].map(task => (
                <div key={task.id} className="bg-white rounded border border-gray-200 hover:border-gray-300 transition">
                  <div className="flex items-start gap-3 p-3">
                    <Checkbox
                      checked={taskStates[task.id] || false}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <label
                          className={`text-sm font-medium cursor-pointer flex-1 ${
                            taskStates[task.id] ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                          onClick={() => handleTaskToggle(task.id)}
                        >
                          {task.label}
                        </label>

                        {task.critical && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            Critical
                          </span>
                        )}
                      </div>

                      {task.details && (
                        <button
                          onClick={() => toggleExpanded(task.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          {expandedTasks.has(task.id) ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Show Details
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedTasks.has(task.id) && task.details && (
                    <div className="border-t border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-700 mb-3">{task.details}</p>

                      {task.subTasks && task.subTasks.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Sub-tasks:</p>
                          <ul className="text-xs text-gray-600 space-y-1 ml-4">
                            {task.subTasks.map((subTask, idx) => (
                              <li key={idx} className="list-disc">
                                {subTask}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {task.documents && task.documents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Documents Needed:</p>
                          <ul className="text-xs text-gray-600 space-y-1 ml-4">
                            {task.documents.map((doc, idx) => (
                              <li key={idx} className="list-disc">
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Progress</CardTitle>
          <CardDescription>Track your LTC insurance claim journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-semibold">{completedTasks} / {totalTasks} tasks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">{progressPercent}% complete</p>
            </div>

            {/* Critical Tasks Alert */}
            {tasks.some(t => t.critical && !taskStates[t.id]) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  You have {tasks.filter(t => t.critical && !taskStates[t.id]).length} critical task(s) that need attention.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Sections */}
      <div className="space-y-6">
        {renderPhaseSection("phase1")}
        {renderPhaseSection("phase2")}
        {renderPhaseSection("phase3")}
      </div>

      {/* Completion Message */}
      {completedTasks === totalTasks && totalTasks > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Congratulations! You have completed all tasks in your LTC insurance strategy.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
