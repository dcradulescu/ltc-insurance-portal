import { Layout } from "@/components/Layout";
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
  Calculator, MessageCircle, Clock, Activity, Heart, ListChecks, Sparkles,
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
    schedule: "6 days a week for 4 hours a day minimum",
    prevention: "92% hospital readmission prevention if following plan",
    items: ["Physical Therapy", "Speech Therapy Support", "Occupational Therapy", "Medication Compliance", "Fall Prevention", "Mobility Assistance", "Cognitive Rehabilitation", "Nutrition Support", "Swallowing Assessment", "Emotional Support"],
  },
};

// Helper to check if form is complete
function isFormComplete(policy: any) {
  if (!policy) return false;
  const hasBasicInfo = policy.insuredFullName && policy.insuredEmail && policy.insuredPhone &&
                       policy.carrierName && policy.policyNumber;
  if (!hasBasicInfo) return false;
  const hasInsuredName = policy.insuredFullName && policy.insuredFullName.toString().trim() !== "";
  const hasInsuredEmail = policy.insuredEmail && policy.insuredEmail.toString().trim() !== "";
  const hasInsuredPhone = policy.insuredPhone && policy.insuredPhone.toString().trim() !== "";
  const hasCarrierName = policy.carrierName && policy.carrierName.toString().trim() !== "";
  const hasPolicyNumber = policy.policyNumber && policy.policyNumber.toString().trim() !== "";
  const hasEliminationPeriod = policy.eliminationPeriod && policy.eliminationPeriod.toString().trim() !== "";
  const hasWaiverOfPremium = policy.waiverOfPremium && policy.waiverOfPremium.toString().trim() !== "";
  const hasDailyMaximum = policy.dailyMaximum && policy.dailyMaximum.toString().trim() !== "";
  const hasLifetimeMaximum = policy.lifetimeMaximum && policy.lifetimeMaximum.toString().trim() !== "";
  const hasQualifyingAdls = policy.qualifyingAdls && Array.isArray(policy.qualifyingAdls) && policy.qualifyingAdls.length > 0;
  const hasAdlLimitations = policy.adlLimitations && Array.isArray(policy.adlLimitations) && policy.adlLimitations.length > 0;
  const hasAdlsOrCognitive = hasQualifyingAdls || hasAdlLimitations || 
                             (policy.cognitiveImpairmentTrigger && policy.cognitiveImpairmentTrigger.toString().trim() !== "");
  const hasMinAdlsRequired = policy.minAdlsRequired !== undefined && policy.minAdlsRequired !== null && policy.minAdlsRequired.toString().trim() !== "";
  let adlCountValid = true;
  if (hasMinAdlsRequired) {
    const adlArray = policy.qualifyingAdls || policy.adlLimitations || [];
    if (Array.isArray(adlArray)) {
      const minRequired = parseInt(policy.minAdlsRequired);
      adlCountValid = adlArray.length >= minRequired;
    }
  }
  const isComplete = hasInsuredName && hasInsuredEmail && hasInsuredPhone && hasCarrierName && hasPolicyNumber && 
         hasEliminationPeriod && hasWaiverOfPremium && hasDailyMaximum && hasLifetimeMaximum &&
         hasAdlsOrCognitive && hasMinAdlsRequired && adlCountValid;
  console.log('[Strategy Validation] Full Result:', {
    isComplete, hasInsuredName, hasInsuredEmail, hasInsuredPhone, hasCarrierName, hasPolicyNumber,
    hasEliminationPeriod, hasWaiverOfPremium, hasDailyMaximum, hasLifetimeMaximum,
    hasAdlsOrCognitive, hasMinAdlsRequired, adlCountValid
  });
  return isComplete;
}

type StrategyTask = {
  id: string;
  label: string;
  completed: boolean;
  category: string;
  critical?: boolean;
  uploadRequired?: boolean;
};

type PlanView = "written" | "timeline" | "checklist" | "financial" | "downloads" | "send";

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
    { strategyId: strategyQuery.data?.id || 0 },
    { enabled: !!strategyQuery.data?.id }
  );
  const saveTaskCompletionMutation = trpc.strategy.saveTaskCompletion.useMutation();
  const sendComprehensiveZapier = trpc.policyForm.sendComprehensiveToZapier.useMutation();
  const sessionStartRef = useRef(Date.now());
  const zapierSentRef = useRef(false);

  const sendToZapier = useCallback((trigger: "form_completed" | "strategy_completed" | "exit" | "timeout") => {
    if (zapierSentRef.current) return;
    zapierSentRef.current = true;
    const sessionDurationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
    sendComprehensiveZapier.mutate({ trigger, currentPage: "strategy", sessionDurationSeconds });
  }, [sendComprehensiveZapier]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!zapierSentRef.current) {
        zapierSentRef.current = true;
        const sessionDurationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
        navigator.sendBeacon?.("/api/trpc/policyForm.sendComprehensiveToZapier", new Blob([JSON.stringify({ "0": { json: { trigger: "exit", currentPage: "strategy", sessionDurationSeconds } } })], { type: "application/json" }));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!zapierSentRef.current) sendToZapier("exit");
    };
  }, [sendToZapier]);

  const generateMutation = trpc.strategy.generate.useMutation({
    onSuccess: () => {
      strategyQuery.refetch();
      toast.success("Your personalized strategy has been generated!");
      zapierSentRef.current = false;
      sendToZapier("strategy_completed");
    },
    onError: () => toast.error("Failed to generate strategy. Please try again."),
  });
  const updateTasksMutation = trpc.strategy.updateTasks.useMutation();
  const emailMutation = trpc.email.sendStrategy.useMutation({
    onSuccess: (data) => { toast.success(data.message); setEmailDialogOpen(false); },
    onError: () => toast.error("Failed to send email."),
  });
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

  const primaryDiagnosis = policy?.primaryDiagnosis as keyof typeof careRecommendations | undefined;
  const recommendations = primaryDiagnosis && careRecommendations[primaryDiagnosis] ? careRecommendations[primaryDiagnosis] : null;

  const handleToggleTask = useCallback((stageKey: string, taskId: string) => {
    const taskMap: Record<string, StrategyTask[]> = { stage1Tasks, stage2Tasks, stage3Tasks };
    const tasks = taskMap[stageKey];
    if (tasks) toggleTask(stageKey as "stage1Tasks" | "stage2Tasks" | "stage3Tasks", tasks, taskId);
  }, [stage1Tasks, stage2Tasks, stage3Tasks]);

  const handleGenerate = () => {
    if (!policy) { toast.error("Please complete the Policy Intake Form first."); navigate("/policy-form"); return; }
    generateMutation.mutate({ policyId: policy.id });
  };

  const toggleTask = async (stage: "stage1Tasks" | "stage2Tasks" | "stage3Tasks", tasks: StrategyTask[], taskId: string) => {
    if (!strategy) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.completed;
    const stageNum = parseInt(stage.replace(/\D/g, ''));
    
    try {
      await saveTaskCompletionMutation.mutateAsync({
        strategyId: strategy.id,
        taskId,
        taskTitle: task.label,
        stage: stageNum,
        completed: newCompleted,
      });
      taskCompletionsQuery.refetch();
      
      // Show success toast notification
      if (newCompleted) {
        toast.success(`✓ Task completed: ${task.label}`, {
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

  const advanceStage = async (newStage: number) => {
    if (!strategy) return;
    try {
      await updateTasksMutation.mutateAsync({
        strategyId: strategy.id, stage: "stage1Tasks", tasks: stage1Tasks,
        currentStage: newStage, claimStatus: newStage === 2 ? "in_progress" : newStage === 3 ? "approved" : "not_started",
      });
      utils.strategy.getMine.invalidate();
      toast.success(`Advanced to Stage ${newStage}`);
    } catch (_e) { toast.error("Failed to advance stage."); }
  };

  const handleDownloadPDF = useCallback(() => {
    if (!strategyContentRef.current) return;
    const content = strategyContentRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups to download the PDF."); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>LTC Insurance Claim Strategy</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style>body{font-family:'Roboto',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333;line-height:1.6}h1,h2,h3{font-family:'Roboto Slab',serif;color:#2c3e50}h2{border-bottom:2px solid #3498db;padding-bottom:8px;margin-top:24px}ul,ol{padding-left:1.5em}li{margin:4px 0}strong{color:#2c3e50}.header{text-align:center;margin-bottom:2em;padding-bottom:1em;border-bottom:3px solid #3498db}.header h1{color:#3498db}@media print{body{padding:20px}}</style>
    </head><body><div class="header"><h1>LTC Insurance Claim Strategy</h1><p>Generated on ${new Date().toLocaleDateString()}</p></div>${content}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }, []);

  const handleSendEmail = () => {
    const validEmails = emailRecipients.filter(e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
    if (!validEmails.length) { toast.error("Please enter at least one valid email address."); return; }
    if (!strategy?.id) return;
    emailMutation.mutate({
      strategyId: strategy.id,
      recipients: validEmails,
      policyData: policy ? {
        insuredName: policy.insuredFullName || "",
        policyNumber: policy.policyNumber || "",
        carrierName: policy.carrierName || "",
        dailyMaximum: parseCurrencyValue(policy.dailyMaximum || 0),
        monthlyMaximum: (() => { const val = parseFloat((policy.monthlyMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
        lifetimeMaximum: (() => { const val = parseFloat((policy.lifetimeMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
        diagnosis: "LTC Insurance Claim",
        adlLimitations: policy.qualifyingAdls || policy.adlLimitations || [],
        stage1Tasks: stage1Tasks.map(t => t.label),
        stage2Tasks: stage2Tasks.map(t => t.label),
        stage3Tasks: stage3Tasks.map(t => t.label),
        careRecommendations: policy.careRecommendations || "",
        strategyContent: strategy.strategyContent || "",
      } : undefined,
    });
  };

  const addRecipient = () => setEmailRecipients(prev => [...prev, ""]);
  const removeRecipient = (i: number) => setEmailRecipients(prev => prev.filter((_, idx) => idx !== i));
  const updateRecipient = (i: number, v: string) => setEmailRecipients(prev => prev.map((r, idx) => idx === i ? v : r));

  const groupByCategory = (tasks: StrategyTask[]) => {
    const groups: Record<string, StrategyTask[]> = {};
    tasks.forEach(t => { if (!groups[t.category]) groups[t.category] = []; groups[t.category].push(t); });
    return groups;
  };

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
                        onCheckedChange={() => toggleTask(stage, tasks, task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm leading-relaxed ${
                          task.completed ? "line-through text-slate-400" : task.critical ? "font-medium text-amber-800" : "text-slate-700"
                        }`}>
                          {task.critical && !task.completed && (
                            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />
                          )}
                          {task.label}
                        </span>
                        {task.uploadRequired && !task.completed && (
                          <span className="block text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <Upload className="w-3 h-3" /> Document upload recommended
                          </span>
                        )}
                      </div>
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
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

  const hasStrategy = strategy?.strategyContent;
  const isGenerating = generateMutation.isPending;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative text-white py-14 md:py-20">
        <div className="absolute inset-0">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/gwMDIGGTHLJRGnPt.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a4a]/90 via-[#1a3a4a]/80 to-[#2c5060]/70" />
        </div>
        <div className="container relative max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal/20 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-teal" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">Personalized Strategy</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Your LTC Claim<br className="hidden md:block" /> Strategy Guide
          </h1>
          <p className="text-white/70 max-w-xl text-base md:text-lg leading-relaxed">
            A step-by-step roadmap with interactive checklists, timelines, and tools to help you successfully navigate your long-term care insurance claim.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 bg-gradient-to-b from-slate-50 to-white">
        <div className="container max-w-5xl">
          {/* State: Form incomplete */}
          {policy && !isFormComplete(policy) ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Complete Required Fields</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
                Your strategy requires these fields to be completed in the Policy Form:
              </p>
              <div className="max-w-sm mx-auto mb-8 text-left space-y-1.5">
                {["Full Name", "Email Address", "Phone Number", "Insurance Company", "Policy Number", "Elimination Period", "Waiver of Premium", "Daily Maximum", "Lifetime Maximum", "ADLs or Cognitive Decline"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal/50" />
                    {f}
                  </div>
                ))}
              </div>
              <Button asChild size="lg"><a href="/policy-form">Complete Policy Form <ArrowRight className="w-4 h-4 ml-2" /></a></Button>
            </div>

          ) : !policy && !policyQuery.isLoading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <FileText className="w-14 h-14 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">No Policy Information Found</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
                Please complete the policy intake form first so we can generate a strategy tailored to your specific situation.
              </p>
              <Button asChild size="lg"><a href="/policy-form">Complete Policy Form <ArrowRight className="w-4 h-4 ml-2" /></a></Button>
            </div>

          ) : isGenerating ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-teal/20" />
                <div className="absolute inset-0 rounded-full border-4 border-teal border-t-transparent animate-spin" />
                <Target className="absolute inset-0 m-auto w-8 h-8 text-teal" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Generating Your Strategy</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Analyzing your policy details and care needs to create a comprehensive, personalized strategy. This may take a moment...
              </p>
            </div>

          ) : hasStrategy ? (
            <div className="space-y-8">

              {/* Policy Summary - Always visible at top */}
              {policy && <PolicySummaryCard policy={policy} />}

              {/* How Do You Want to See Your Custom Plan? */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="text-center mb-8">
                  <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">How Do You Want to See Your Custom Plan?</h2>
                  <p className="text-slate-600 max-w-2xl mx-auto">Choose your preferred way to view and interact with your personalized LTC insurance claim strategy</p>
                </div>

                {/* Plan View Selector */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <button
                    onClick={() => setPlanView("written")}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      planView === "written"
                        ? "border-teal bg-teal/5"
                        : "border-slate-200 hover:border-teal/30 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className={`w-6 h-6 mx-auto mb-2 ${planView === "written" ? "text-teal" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${planView === "written" ? "text-teal" : "text-slate-700"}`}>Written Plan</span>
                  </button>

                  <button
                    onClick={() => setPlanView("timeline")}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      planView === "timeline"
                        ? "border-teal bg-teal/5"
                        : "border-slate-200 hover:border-teal/30 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className={`w-6 h-6 mx-auto mb-2 ${planView === "timeline" ? "text-teal" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${planView === "timeline" ? "text-teal" : "text-slate-700"}`}>Timeline</span>
                  </button>

                  <button
                    onClick={() => setPlanView("checklist")}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      planView === "checklist"
                        ? "border-teal bg-teal/5"
                        : "border-slate-200 hover:border-teal/30 hover:bg-slate-50"
                    }`}
                  >
                    <ListChecks className={`w-6 h-6 mx-auto mb-2 ${planView === "checklist" ? "text-teal" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${planView === "checklist" ? "text-teal" : "text-slate-700"}`}>Checklist</span>
                  </button>

                  <button
                    onClick={() => setPlanView("financial")}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      planView === "financial"
                        ? "border-teal bg-teal/5"
                        : "border-slate-200 hover:border-teal/30 hover:bg-slate-50"
                    }`}
                  >
                    <Calculator className={`w-6 h-6 mx-auto mb-2 ${planView === "financial" ? "text-teal" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${planView === "financial" ? "text-teal" : "text-slate-700"}`}>Financial</span>
                  </button>

                  <button
                    onClick={() => setPlanView("downloads")}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      planView === "downloads"
                        ? "border-teal bg-teal/5"
                        : "border-slate-200 hover:border-teal/30 hover:bg-slate-50"
                    }`}
                  >
                    <Download className={`w-6 h-6 mx-auto mb-2 ${planView === "downloads" ? "text-teal" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${planView === "downloads" ? "text-teal" : "text-slate-700"}`}>Downloads</span>
                  </button>

                  <button
                    onClick={() => setPlanView("send")}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      planView === "send"
                        ? "border-teal bg-teal/5"
                        : "border-slate-200 hover:border-teal/30 hover:bg-slate-50"
                    }`}
                  >
                    <Mail className={`w-6 h-6 mx-auto mb-2 ${planView === "send" ? "text-teal" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${planView === "send" ? "text-teal" : "text-slate-700"}`}>Send My Plan</span>
                  </button>
                </div>
              </div>

              {/* WRITTEN PLAN VIEW */}
              {planView === "written" && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal/5 to-cyan-50">
                      <h3 className="font-serif text-xl font-bold text-slate-900">Written Plan</h3>
                      <p className="text-sm text-slate-600 mt-1">Your complete personalized strategy document</p>
                    </div>
                    <div className="p-6">
                      {recommendations && (
                        <div className="mb-8 pb-8 border-b border-slate-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                              <Heart className="w-4.5 h-4.5 text-teal" />
                            </div>
                            <h4 className="font-serif text-lg font-bold text-slate-900">Care Recommendations for {primaryDiagnosis}</h4>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 mb-5">
                            <div className="bg-slate-50 p-4 rounded-xl">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Recommended Schedule</p>
                              <p className="text-sm font-semibold text-slate-900">{recommendations.schedule}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl">
                              <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Readmission Prevention</p>
                              <p className="text-sm font-semibold text-green-700">{recommendations.prevention}</p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recommended Care Services</p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {recommendations.items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 py-1">
                                <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div
                        ref={strategyContentRef}
                        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-teal prose-h2:pb-2 prose-h2:mt-10 prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-teal"
                        dangerouslySetInnerHTML={{ __html: strategy?.strategyHtml || "" }}
                      />
                    </div>
                  </div>
                </div>
              )}

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
                        onToggleTask={handleToggleTask}
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
                    onToggleTask={handleToggleTask}
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
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">1</div>
                            <div>
                              <h4 className="font-serif text-lg font-bold text-slate-900">Stage 1: Prior to Claim</h4>
                              <p className="text-xs text-slate-500">{stageProgress(stage1Tasks)}% complete</p>
                            </div>
                          </div>
                          {stageProgress(stage1Tasks) === 100 && currentStage === 1 && (
                            <Button size="sm" onClick={() => advanceStage(2)} className="gap-1.5">
                              Advance to Stage 2 <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span><strong>Critical:</strong> Do NOT initiate your claim until ALL Stage 1 tasks are complete. Submit everything in ONE packet.</span>
                        </div>
                        {renderTaskChecklist("stage1Tasks", stage1Tasks)}
                      </div>

                      {/* Stage 2 */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStage >= 2 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>2</div>
                            <div>
                              <h4 className={`font-serif text-lg font-bold ${currentStage >= 2 ? "text-slate-900" : "text-slate-400"}`}>Stage 2: Filing the Claim</h4>
                              <p className="text-xs text-slate-500">{stageProgress(stage2Tasks)}% complete</p>
                            </div>
                          </div>
                          {stageProgress(stage2Tasks) === 100 && currentStage === 2 && (
                            <Button size="sm" onClick={() => advanceStage(3)} className="gap-1.5">
                              Advance to Stage 3 <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        {currentStage < 2 ? (
                          <div className="p-6 bg-slate-50 rounded-xl text-center">
                            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Complete Stage 1 first before proceeding to claim filing.</p>
                          </div>
                        ) : renderTaskChecklist("stage2Tasks", stage2Tasks)}
                      </div>

                      {/* Stage 3 */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStage >= 3 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>3</div>
                          <div>
                            <h4 className={`font-serif text-lg font-bold ${currentStage >= 3 ? "text-slate-900" : "text-slate-400"}`}>Stage 3: Post-Approval Management</h4>
                            <p className="text-xs text-slate-500">{stageProgress(stage3Tasks)}% complete</p>
                          </div>
                        </div>
                        {currentStage < 3 ? (
                          <div className="p-6 bg-slate-50 rounded-xl text-center">
                            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Complete Stage 2 first before proceeding to post-approval management.</p>
                          </div>
                        ) : renderTaskChecklist("stage3Tasks", stage3Tasks)}
                      </div>
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

                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                      <Button onClick={handleDownloadPDF} variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-200 hover:border-teal hover:bg-teal/5">
                        <Download className="w-6 h-6 text-teal" />
                        <span className="font-medium">Download as PDF</span>
                        <span className="text-xs text-slate-500">7 pages, includes all sections</span>
                      </Button>
                      <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50">
                        <RefreshCw className={`w-6 h-6 text-amber-500 ${isGenerating ? "animate-spin" : ""}`} />
                        <span className="font-medium">Regenerate</span>
                        <span className="text-xs text-slate-500">Create updated version</span>
                      </Button>
                    </div>

                    <PdfDeliveryPanel
                      policyData={{
                        insuredName: policy?.insuredFullName || "",
                        policyNumber: policy?.policyNumber || "",
                        carrierName: policy?.carrierName || "",
                        dailyMaximum: parseCurrencyValue(policy?.dailyMaximum || 0),
                        monthlyMaximum: (() => { const val = parseFloat((policy?.monthlyMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
                        lifetimeMaximum: (() => { const val = parseFloat((policy?.lifetimeMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
                        diagnosis: "LTC Insurance Claim",
                        adlLimitations: policy?.qualifyingAdls || policy?.adlLimitations || [],
                        stage1Tasks: stage1Tasks.map(t => t.label),
                        stage2Tasks: stage2Tasks.map(t => t.label),
                        stage3Tasks: stage3Tasks.map(t => t.label),
                        careRecommendations: policy?.careRecommendations || "",
                        strategyContent: strategy?.strategyContent || "",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* FINANCIAL STRATEGY VIEW */}
              {planView === "financial" && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Calculator className="w-4.5 h-4.5 text-teal" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-900">Care Cost Calculator</h3>
                        <p className="text-sm text-slate-600">Calculate your potential care costs based on your policy</p>
                      </div>
                    </div>
                    <CareCalculator
                      defaultDailyMax={policy?.dailyMaximum ? parseCurrencyValue(policy.dailyMaximum).toString() : ""}
                      lifetimeMaximum={policy?.lifetimeMaximum || ""}
                    />
                  </div>
                </div>
              )}

              {/* SEND MY PLAN VIEW */}
              {planView === "send" && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Mail className="w-4.5 h-4.5 text-teal" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-900">Send My Plan</h3>
                        <p className="text-sm text-slate-600">Share your strategy with family members or advisors</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-200 hover:border-teal hover:bg-teal/5">
                            <Mail className="w-6 h-6 text-teal" />
                            <span className="font-medium">Email Strategy</span>
                            <span className="text-xs text-slate-500">Send to multiple recipients</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle className="font-serif">Email Your Strategy</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">Send your personalized strategy to yourself or family members.</p>
                            {emailRecipients.map((email, index) => (
                              <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1">
                                  <Label htmlFor={`email-${index}`}>{index === 0 ? "Email Address" : `Recipient ${index + 1}`}</Label>
                                  <Input id={`email-${index}`} type="email" value={email} onChange={e => updateRecipient(index, e.target.value)} placeholder="name@example.com" />
                                </div>
                                {emailRecipients.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeRecipient(index)}><X className="w-4 h-4" /></Button>}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addRecipient} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Another Recipient</Button>
                            <Button onClick={handleSendEmail} disabled={emailMutation.isPending} className="w-full">
                              {emailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />} Send Strategy
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-200 hover:border-teal hover:bg-teal/5">
                            <MessageCircle className="w-6 h-6 text-teal" />
                            <span className="font-medium">SMS Reminders</span>
                            <span className="text-xs text-slate-500">Get task reminders via text</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle className="font-serif">SMS Task Reminders</DialogTitle></DialogHeader>
                          <SMSNotificationManager policyId={policy?.id || 0} insuredName={policy?.insuredFullName || ""} insuredPhone={policy?.insuredPhone} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )}
            </div>

          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-teal" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Ready to Generate Your Strategy</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm">
                We have your policy information. Click below to generate your personalized LTC insurance claim strategy.
              </p>
              <Button size="lg" onClick={handleGenerate} className="gap-2">
                <Target className="w-4 h-4" /> Generate My Strategy
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About Home Care */}
      <AboutHomeCare showStartButton={true} />
      <LegalDisclaimerFooter />
    </Layout>
  );
}
