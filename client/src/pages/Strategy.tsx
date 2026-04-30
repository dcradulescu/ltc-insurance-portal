import { LegalDisclaimerFooter } from "@/components/LegalDisclaimerFooter";
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { CareCalculator } from "@/components/CareCalculator";
import { PdfDeliveryPanel } from "@/components/PdfDeliveryPanel";
import { SMSNotificationManager } from "@/components/SMSNotificationManager";
import { GanttTimeline } from "@/components/GanttTimeline";
import { ChronologicalChecklist } from "@/components/ChronologicalChecklist";
import { PolicySummaryCard } from "@/components/PolicySummaryCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useStageCelebration } from "@/hooks/useStageCelebration";
import {
  FileText, Download, Mail, Loader2, CheckCircle2, AlertTriangle,
  Upload, ArrowRight, Shield, ClipboardCheck, Plus, X, RefreshCw, Target,
  Calculator, MessageCircle, Clock, Activity, Heart, ListChecks, Sparkles, ChevronDown,
} from "lucide-react";

// Care recommendations by diagnosis
const careRecommendations: Record<string, { schedule: string; prevention: string; items: string[] }> = {
  CHF: {
    schedule: "6 days a week for 4 hours a day minimum",
    prevention: "92% hospital readmission prevention if following plan",
    items: ["Prepare Low Sodium Meals", "Daily Weights / Fluid Gain monitoring", "Promote Exercise / Work Balance", "Walking / Transferring Assist", "Bathing, Grooming, Personal Care", "Medication Compliance", "Palliative / Comfort Measures", "Errands and Transportation", "Fall Prevention", "Light Housekeeping"],
  },
  COPD: {
    schedule: "6 days a week for 4 hours a day minimum",
    prevention: "94% hospital readmission prevention if following plan",
    items: ["Oxygen Therapy", "Medication Management", "Breathing Techniques", "Pulmonary Rehabilitation", "Encourage Exercise", "Avoiding Acute Exacerbations", "Avoiding Pneumonia", "Fatigue Related Assistance", "Avoid Smoking", "Oxygen Monitoring"],
  },
  HeartAttack: {
    schedule: "6 days a week for 4 hours a day minimum",
    prevention: "92% hospital readmission prevention if following plan",
    items: ["Transportation to Cardiac Rehab", "Intra-rehab Exercises", "Decrease Anxiety, Stress & Depression", "Help / Support to Stop Smoking", "Treatment of High BP and Cholesterol", "Managing Diabetes / Obesity", "Low Sodium / Fat diet", "Encourage / Promote Activity", "Respond to Warning Signs", "Strict Medication Management"],
  },
  Pneumonia: {
    schedule: "6 days a week for 4 hours a day minimum",
    prevention: "94% hospital readmission prevention if following plan",
    items: ["Respiratory Monitoring", "Medication Management", "Breathing Exercises", "Chest Physiotherapy", "Nutrition Support", "Hydration Management", "Infection Prevention", "Activity Progression", "Symptom Monitoring", "Follow-up Appointments"],
  },
  Stroke: {
    schedule: "5-7 days a week for 3-4 hours minimum",
    prevention: "85% hospital readmission prevention if following plan",
    items: ["Physical Therapy", "Occupational Therapy", "Speech Therapy", "Cognitive Rehabilitation", "Fall Prevention", "Medication Management", "Nutrition Support", "Mobility Assistance", "Communication Support", "Emotional Support"],
  },
  Dementia: {
    schedule: "7 days a week for 8+ hours",
    prevention: "Delays institutional placement by 18-24 months on average",
    items: ["Memory Care", "Medication Management", "Wandering Prevention", "Personal Care Assistance", "Meal Preparation", "Safety Monitoring", "Behavioral Support", "Incontinence Care", "Hygiene Assistance", "Companionship"],
  },
};

type StrategyTask = {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  critical?: boolean;
};

type PlanView = "written" | "timeline" | "checklist" | "financial" | "downloads";

export default function Strategy() {
  const [, navigate] = useLocation();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([""]);
  const [planView, setPlanView] = useState<PlanView>("timeline");
  const [activeTab, setActiveTab] = useState("timeline");
  const strategyContentRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);
  const { celebrateStageCompletion } = useStageCelebration();
  const [celebratedStages, setCelebratedStages] = useState<Set<number>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([1, 2, 3]));

  // Load policy data from localStorage
  const [policyFromStorage, setPolicyFromStorage] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ltc_policy_form");
      if (saved) setPolicyFromStorage(JSON.parse(saved));
    } catch (err) {
      console.error("[Strategy] Failed to load policy from localStorage:", err);
    }
  }, []);

  const policyQuery = trpc.policy.get.useQuery(undefined, { enabled: true });
  const strategyQuery = trpc.strategy.getMine.useQuery(undefined, { enabled: true });
  const taskCompletionsQuery = trpc.strategy.getTaskCompletions.useQuery(
    { strategyId: typeof strategyQuery.data?.id === 'string' ? parseInt(strategyQuery.data.id) : (strategyQuery.data?.id || 0) },
    { enabled: !!strategyQuery.data?.id }
  );
  // const updateTasksMutation = trpc.strategy.update.useMutation();
  const saveTaskCompletionMutation = trpc.strategy.saveTaskCompletion.useMutation();
  const utils = trpc.useUtils();

  const strategy = strategyQuery.data;
  const policy = policyFromStorage || policyQuery.data;

  const stage1Tasks: StrategyTask[] = useMemo(() => {
    const tasks = (strategy?.stage1Tasks as unknown as StrategyTask[]) || [];
    const completions = taskCompletionsQuery.data || [];
    return tasks.map(task => ({
      ...task,
      completed: completions.some(c => c.taskId === task.id && c.completed) || task.completed
    }));
  }, [strategy?.stage1Tasks, taskCompletionsQuery.data]);
  
  const stage2Tasks: StrategyTask[] = useMemo(() => {
    const tasks = (strategy?.stage2Tasks as unknown as StrategyTask[]) || [];
    const completions = taskCompletionsQuery.data || [];
    return tasks.map(task => ({
      ...task,
      completed: completions.some(c => c.taskId === task.id && c.completed) || task.completed
    }));
  }, [strategy?.stage2Tasks, taskCompletionsQuery.data]);
  
  const stage3Tasks: StrategyTask[] = useMemo(() => {
    const tasks = (strategy?.stage3Tasks as unknown as StrategyTask[]) || [];
    const completions = taskCompletionsQuery.data || [];
    return tasks.map(task => ({
      ...task,
      completed: completions.some(c => c.taskId === task.id && c.completed) || task.completed
    }));
  }, [strategy?.stage3Tasks, taskCompletionsQuery.data]);
  const currentStage = strategy?.currentStage || 1;

  const stageProgress = (tasks: StrategyTask[]) => tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

  // Check if a stage is complete and trigger celebration
  useEffect(() => {
    if (!stage1Tasks || !stage2Tasks || !stage3Tasks) return;

    const checkStageCompletion = (tasks: StrategyTask[], stageNum: number) => {
      const allComplete = tasks.length > 0 && tasks.every(t => t.completed);
      if (allComplete && !celebratedStages.has(stageNum)) {
        celebrateStageCompletion(`Stage ${stageNum}`);
        setCelebratedStages(prev => {
          const newSet = new Set(prev);
          newSet.add(stageNum);
          return newSet;
        });
        toast.success(`🎉 Stage ${stageNum} Complete!`, {
          description: "Excellent progress on your claim strategy!",
          duration: 4000,
        });
      }
    };

    checkStageCompletion(stage1Tasks, 1);
    checkStageCompletion(stage2Tasks, 2);
    checkStageCompletion(stage3Tasks, 3);
  }, [stage1Tasks, stage2Tasks, stage3Tasks, celebratedStages, celebrateStageCompletion]);

  const parseCurrencyValue = (value: string | number): number => {
    if (typeof value === "number") return value;
    const cleaned = value.toString().replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const groupByCategory = (tasks: StrategyTask[]) => {
    const groups: Record<string, StrategyTask[]> = {};
    tasks.forEach(task => {
      if (!groups[task.category]) groups[task.category] = [];
      groups[task.category].push(task);
    });
    return groups;
  };

  const handleToggleTask = async (task: StrategyTask) => {
    if (!strategy) return;
    try {
      const newCompleted = !task.completed;
      await saveTaskCompletionMutation.mutateAsync({
        strategyId: typeof strategy.id === 'string' ? parseInt(strategy.id) : strategy.id,
        taskId: task.id,
        taskTitle: task.label,
        stage: parseInt(task.category),
        completed: newCompleted,
      });
      utils.strategy.getTaskCompletions.invalidate();
      if (newCompleted) {
        toast.success(`✓ ${task.label}`, {
          description: "Great progress on your claim strategy!",
          duration: 3000,
        });
      } else {
        toast.info(`Task marked incomplete: ${task.label}`, {
          duration: 2000,
        });
      }
    } catch (_e) { 
      toast.error("Failed to update task.");
    }
  };

  const handleGanttToggleTask = (stageKey: string, taskId: string) => {
    let allTasks: StrategyTask[] = [];
    if (stageKey === "stage1") allTasks = stage1Tasks;
    else if (stageKey === "stage2") allTasks = stage2Tasks;
    else if (stageKey === "stage3") allTasks = stage3Tasks;
    
    const task = allTasks.find(t => t.id === taskId);
    if (task) handleToggleTask(task);
  };

  const toggleStageExpanded = (stageNum: number) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageNum)) {
        newSet.delete(stageNum);
      } else {
        newSet.add(stageNum);
      }
      return newSet;
    });
  };

  const advanceStage = async (newStage: number) => {
    if (!strategy) return;
    toast.info(`Stage advancement to Stage ${newStage} coming soon`);
  };

  const handleDownloadPDF = useCallback(() => {
    if (!strategyContentRef.current) return;
    const content = strategyContentRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups to download the PDF."); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>LTC Insurance Claim Strategy</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style>body { font-family: 'Roboto', sans-serif; margin: 20px; color: #333; } h1, h2, h3, h4 { font-family: 'Roboto Slab', serif; } .stage { margin: 30px 0; page-break-inside: avoid; } .task { margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 4px solid #0891b2; } .completed { background: #dcfce7; border-left-color: #16a34a; } </style>
      </head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }, []);

  const categoryLabels: Record<string, { label: string; icon: string }> = {
    "carrier-contact": { label: "Carrier Contact", icon: "📞" },
    "medical-evaluation": { label: "Medical Evaluation", icon: "🩺" },
    "provider-setup": { label: "Provider Setup", icon: "🏥" },
    "documents": { label: "Document Collection", icon: "📄" },
    "elimination-period": { label: "Elimination Period", icon: "⏱️" },
    "personal-info": { label: "Personal Information", icon: "🔒" },
    "claim-packet": { label: "Claim Packet Assembly", icon: "📦" },
    "verification": { label: "Verification", icon: "✅" },
    "submission": { label: "Submission", icon: "📤" },
    "evaluation": { label: "Third-Party Evaluation", icon: "🔍" },
    "post-submission": { label: "Post-Submission", icon: "📋" },
    "ongoing": { label: "Ongoing Management", icon: "🔄" },
    "aob-flow": { label: "Assignment of Benefits Flow", icon: "💰" },
    "reimbursement-flow": { label: "Reimbursement Flow", icon: "💵" },
  };

  const renderTaskChecklist = (stage: "stage1Tasks" | "stage2Tasks" | "stage3Tasks", tasks: StrategyTask[]) => {
    const groups = groupByCategory(tasks);
    return (
      <Accordion type="multiple" defaultValue={Object.keys(groups)} className="space-y-2">
        {Object.entries(groups).map(([cat, catTasks]) => {
          const completedCount = catTasks.filter(t => t.completed).length;
          const catInfo = categoryLabels[cat] || { label: cat, icon: "📌" };
          const allDone = completedCount === catTasks.length;
          return (
            <AccordionItem key={cat} value={cat} className="border rounded-xl overflow-hidden bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-base">{catInfo.icon}</span>
                  <span className="text-sm font-semibold text-slate-800">{catInfo.label}</span>
                  <Badge variant={allDone ? "default" : "secondary"} className={`text-xs ${allDone ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}>
                    {completedCount}/{catTasks.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="space-y-1.5">
                  {catTasks.map(task => (
                    <label
                      key={task.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        task.completed
                          ? "bg-green-50/50"
                          : task.critical
                            ? "bg-amber-50 border border-amber-200"
                            : "hover:bg-slate-50"
                      }`}
                    >
                      <Checkbox
                        checked={task.completed}
                        onChange={() => handleToggleTask(task)}
                        className="mt-0.5"
                      />
                      <span className={`text-sm ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                        {task.label}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  if (strategyQuery.isLoading) {
    return <div className="p-8 text-center">Loading your strategy...</div>;
  }

  if (!strategy) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 mb-4">No strategy found. Create one from the Policy Form.</p>
        <Button onClick={() => navigate("/policy-form")}>Go to Policy Form</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div ref={strategyContentRef} className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-slate-900 mb-2">Your Claim Strategy</h1>
          <p className="text-slate-600">Your personalized 3-stage roadmap to successfully file your LTC insurance claim</p>
        </div>

        {/* Plan View Selector */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-6 gap-2">
          {(["timeline", "checklist", "financial", "written", "downloads"] as const).map(view => (
            <button
              key={view}
              onClick={() => setPlanView(view)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                planView === view
                  ? "bg-teal text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-teal"
              }`}
            >
              {view === "timeline" && "Timeline"}
              {view === "checklist" && "Checklist"}
              {view === "financial" && "Financial"}
              {view === "written" && "Written"}
              {view === "downloads" && "Downloads"}
            </button>
          ))}
        </div>

        {/* TIMELINE VIEW */}
        {planView === "timeline" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal/5 to-cyan-50">
                <h3 className="font-serif text-xl font-bold text-slate-900">Timeline</h3>
                <p className="text-sm text-slate-600 mt-1">Interactive Gantt chart showing your 3-stage claim process</p>
              </div>
              <div className="px-4 py-5 md:px-6">
                <GanttTimeline
                  stage1Tasks={stage1Tasks}
                  stage2Tasks={stage2Tasks}
                  stage3Tasks={stage3Tasks}
                  eliminationPeriod={policy?.eliminationPeriod}
                  onToggleTask={handleGanttToggleTask}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal/5 to-cyan-50">
                <h3 className="font-serif text-xl font-bold text-slate-900">Understanding Your Strategy</h3>
                <p className="text-sm text-slate-600 mt-1">Learn how to use your personalized 3-stage strategy</p>
              </div>
              <div className="p-4">
                <VideoPlaceholder
                  title="Understanding Your Strategy"
                  description="Learn how to use your personalized 3-stage strategy to navigate the claims process"
                  thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NXdvbYzcqmcgIfxG.jpg"
                  videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/QlCyvRbUBXkLwOND.mp4"
                />
              </div>
            </div>
          </div>
        )}

        {/* CHECKLIST VIEW */}
        {planView === "checklist" && (
          <div className="space-y-8">
            <ChronologicalChecklist
              stage1Tasks={stage1Tasks}
              stage2Tasks={stage2Tasks}
              stage3Tasks={stage3Tasks}
              eliminationPeriod={policy?.eliminationPeriod}
              onToggleTask={handleGanttToggleTask}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-50">
                <h3 className="font-serif text-xl font-bold text-slate-900">By Stage</h3>
                <p className="text-sm text-slate-600 mt-1">View and manage tasks organized by claim stage</p>
              </div>
              <div className="p-6 space-y-8">
                {/* Stage 1 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleStageExpanded(1)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-75 transition-opacity"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform ${
                          expandedStages.has(1) ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">1</div>
                      <div>
                        <h4 className="font-serif text-lg font-bold text-slate-900">Stage 1: Prior to Claim</h4>
                        <p className="text-xs text-slate-500">{stageProgress(stage1Tasks)}% complete</p>
                      </div>
                    </button>
                    {stageProgress(stage1Tasks) === 100 && currentStage === 1 && (
                      <Button size="sm" onClick={() => advanceStage(2)} className="gap-1.5">
                        Advance to Stage 2 <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  {expandedStages.has(1) && (
                    <>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Critical:</strong> Do NOT initiate your claim until ALL Stage 1 tasks are complete. Submit everything in ONE packet.</span>
                      </div>
                      {renderTaskChecklist("stage1Tasks", stage1Tasks)}
                    </>
                  )}
                </div>

                {/* Stage 2 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleStageExpanded(2)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-75 transition-opacity"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform ${
                          expandedStages.has(2) ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStage >= 2 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>2</div>
                      <div>
                        <h4 className={`font-serif text-lg font-bold ${currentStage >= 2 ? "text-slate-900" : "text-slate-400"}`}>Stage 2: Filing the Claim</h4>
                        <p className="text-xs text-slate-500">{stageProgress(stage2Tasks)}% complete</p>
                      </div>
                    </button>
                    {stageProgress(stage2Tasks) === 100 && currentStage === 2 && (
                      <Button size="sm" onClick={() => advanceStage(3)} className="gap-1.5">
                        Advance to Stage 3 <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  {expandedStages.has(2) && (
                    <>
                      {currentStage < 2 ? (
                        <div className="p-6 bg-slate-50 rounded-xl text-center">
                          <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Complete Stage 1 first before proceeding to claim filing.</p>
                        </div>
                      ) : renderTaskChecklist("stage2Tasks", stage2Tasks)}
                    </>
                  )}
                </div>

                {/* Stage 3 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleStageExpanded(3)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-75 transition-opacity"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 transition-transform ${
                          expandedStages.has(3) ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStage >= 3 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>3</div>
                      <div>
                        <h4 className={`font-serif text-lg font-bold ${currentStage >= 3 ? "text-slate-900" : "text-slate-400"}`}>Stage 3: Post-Approval Management</h4>
                        <p className="text-xs text-slate-500">{stageProgress(stage3Tasks)}% complete</p>
                      </div>
                    </button>
                  </div>
                  {expandedStages.has(3) && (
                    <>
                      {currentStage < 3 ? (
                        <div className="p-6 bg-slate-50 rounded-xl text-center">
                          <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Complete Stage 2 first before proceeding to post-approval management.</p>
                        </div>
                      ) : renderTaskChecklist("stage3Tasks", stage3Tasks)}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FINANCIAL VIEW */}
        {planView === "financial" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">Care Cost Calculator</h3>
                    <p className="text-sm text-slate-600">Estimate your monthly care costs based on your diagnosis</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <CareCalculator />
              </div>
            </div>
          </div>
        )}

        {/* DOWNLOADS VIEW */}
        {planView === "downloads" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                  <Download className="w-4.5 h-4.5 text-teal" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">Download Your Plan</h3>
                  <p className="text-sm text-slate-600">Download your strategy as a PDF for offline access</p>
                </div>
              </div>
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="w-4 h-4" /> Download as PDF
              </Button>
            </div>
          </div>
        )}

        {/* WRITTEN VIEW */}
        {planView === "written" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-serif text-xl font-bold text-slate-900">Your Written Strategy</h3>
              </div>
              <div className="p-6 prose max-w-none">
                <p>Your personalized claim strategy has been created based on your specific situation.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <LegalDisclaimerFooter />
    </div>
  );
}
