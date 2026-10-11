import { accountStorage } from "@/lib/accountStorage";
import type { CareInputs } from "@shared/careCalculator";
import { localDate, localDateKey } from "@shared/claimSchedule";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { lazy, Suspense } from "react";
// Heavy components loaded lazily to improve initial page load
const CareCalculator = lazy(() => import("@/components/CareCalculator").then(m => ({ default: m.CareCalculator })));
const PdfDeliveryPanel = lazy(() => import("@/components/PdfDeliveryPanel").then(m => ({ default: m.PdfDeliveryPanel })));
const SMSNotificationManager = lazy(() => import("@/components/SMSNotificationManager").then(m => ({ default: m.SMSNotificationManager })));
const GanttTimeline = lazy(() => import("@/components/GanttTimeline").then(m => ({ default: m.GanttTimeline })));
const ChronologicalChecklist = lazy(() => import("@/components/ChronologicalChecklist").then(m => ({ default: m.ChronologicalChecklist })));
const ClaimMilestonePanel = lazy(() => import("@/components/ClaimMilestonePanel").then(m => ({ default: m.ClaimMilestonePanel })));
const PolicySummaryCard = lazy(() => import("@/components/PolicySummaryCard").then(m => ({ default: m.PolicySummaryCard })));
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { usePolicyContext } from "@/contexts/PolicyContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useStageCelebration } from "@/hooks/useStageCelebration";
import {
  FileText, Download, Mail, Loader2, CheckCircle2, AlertTriangle,
  ArrowRight, Shield, ClipboardCheck, Plus, X, RefreshCw, Target,
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
    schedule: "6 days a week for 4 hours a day minimum",
    prevention: "92% hospital readmission prevention if following plan",
    items: ["Physical Therapy", "Speech Therapy Support", "Occupational Therapy", "Medication Compliance", "Fall Prevention", "Mobility Assistance", "Cognitive Rehabilitation", "Nutrition Support", "Swallowing Assessment", "Emotional Support"],
  },
};

// Helper to check if form is complete
function isFormComplete(policy: any) {
  if (!policy) return false;
  const hasBasicInfo = policy.insuredEmail && policy.insuredPhone &&
                       policy.carrierName && policy.policyNumber;
  if (!hasBasicInfo) return false;
  const hasInsuredEmail = policy.insuredEmail && policy.insuredEmail.toString().trim() !== "";
  const hasInsuredPhone = policy.insuredPhone && policy.insuredPhone.toString().trim() !== "";
  const hasCarrierName = policy.carrierName && policy.carrierName.toString().trim() !== "";
  const hasPolicyNumber = policy.policyNumber && policy.policyNumber.toString().trim() !== "";
  const hasEliminationPeriod = policy.eliminationPeriod && policy.eliminationPeriod.toString().trim() !== "";
  const hasWaiverOfPremium = policy.waiverOfPremium && policy.waiverOfPremium.toString().trim() !== "";
  const hasDailyMaximum = policy.dailyMaximum && policy.dailyMaximum.toString().trim() !== "";
  const hasMonthlyMaximum = policy.monthlyMaximum && policy.monthlyMaximum.toString().trim() !== "";
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
  const isComplete = hasInsuredEmail && hasInsuredPhone && hasCarrierName && hasPolicyNumber &&
         hasEliminationPeriod && hasWaiverOfPremium && (hasDailyMaximum || hasMonthlyMaximum) && hasLifetimeMaximum &&
         hasAdlsOrCognitive && hasMinAdlsRequired && adlCountValid;
  return isComplete;
}

type StrategyTask = {
  id: string;
  label: string;
  completed: boolean;
  category: string;
  critical?: boolean;
};

type PlanView = "written" | "timeline" | "checklist" | "financial" | "downloads" | "send";

export default function Strategy() {
  const [, navigate] = useLocation();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([""]);
  const [planView, setPlanView] = useState<PlanView>("timeline");
  const [activeTab, setActiveTab] = useState("timeline");
  const [scheduleStartDraft, setScheduleStartDraft] = useState("");
  const [confirmedCareInputs, setConfirmedCareInputs] = useState<CareInputs | null>(null);
  const strategyContentRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);
  const { celebrateStageCompletion } = useStageCelebration();
  const [celebratedStages, setCelebratedStages] = useState<Set<number>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([1, 2, 3]));

  // Load policy data from localStorage
  const [policyFromStorage, setPolicyFromStorage] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = accountStorage.getItem("ltc_policy_form");
      if (saved) setPolicyFromStorage(JSON.parse(saved));
    } catch (err) {
      console.error("[Strategy] Failed to load policy from localStorage:", err);
    }
  }, []);

  const policyQuery = trpc.policy.get.useQuery(undefined, { enabled: true });
  const strategyQuery = trpc.strategy.getMine.useQuery(undefined, { enabled: true });
  const claimMilestonesQuery = trpc.strategy.listClaimMilestones.useQuery(
    { strategyId: strategyQuery.data?.id || 0 },
    { enabled: !!strategyQuery.data?.id }
  );
  const careScenarioQuery = trpc.strategy.getCareScenario.useQuery(
    {strategyId: strategyQuery.data?.id || 0},
    {enabled: !!strategyQuery.data?.id}
  );
  const saveCareScenarioMutation = trpc.strategy.saveCareScenario.useMutation();
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
        void fetch("/api/trpc/policyForm.sendComprehensiveToZapier", { method: "POST", keepalive: true, credentials: "include", headers: { "Content-Type": "application/json", "x-ltc-request": "1" }, body: JSON.stringify({ json: { trigger: "exit", currentPage: "strategy", sessionDurationSeconds } }) }).catch(() => {});
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
  const saveScheduleStartMutation = trpc.strategy.updateScheduleStartDate.useMutation();
  const emailMutation = trpc.email.sendStrategy.useMutation({
    onSuccess: (data) => { toast.success(data.message); setEmailDialogOpen(false); },
    onError: (error) => toast.error(error.message),
  });
  const utils = trpc.useUtils();

  const strategy = strategyQuery.data;
  const savedStartDate = strategy?.scheduleStartDate ||
    (strategy?.createdAt ? localDateKey(localDate(strategy.createdAt)) : "");
  useEffect(() => {
    setScheduleStartDraft(savedStartDate);
  }, [strategy?.id, savedStartDate]);
  const policy = policyFromStorage || policyQuery.data;
  useEffect(() => {
    // Policy changes invalidate an in-memory financial model immediately.
    setConfirmedCareInputs(null);
  }, [policy?.id]);
  useEffect(() => {
    const saved=careScenarioQuery.data;
    if(!strategy?.id || !saved) return;
    setConfirmedCareInputs(saved.status==="saved_valid" ? saved.inputs : null);
  }, [careScenarioQuery.data, strategy?.id, policy?.id]);

  const persistCareScenario = useCallback(async (inputs:CareInputs) => {
    if(!strategy?.id) throw new Error("Complete and save a strategy before using the calculator.");
    const result=await saveCareScenarioMutation.mutateAsync({
      strategyId:strategy.id,inputs,
    });
    // Future reloads query the account-owned database record.
    if(result.status!=="saved_valid") setConfirmedCareInputs(null);
    else setConfirmedCareInputs(result.inputs);
    return {status:result.status,reason:result.reason};
  }, [strategy?.id, saveCareScenarioMutation]);

  // Share active policy ID with the global ChatWidget
  const { setActivePolicyId } = usePolicyContext();
  useEffect(() => {
    if (policy?.id) setActivePolicyId(policy.id);
    return () => setActivePolicyId(undefined);
  }, [policy?.id, setActivePolicyId]);

  const stage1Tasks: StrategyTask[] = useMemo(() => {
    const tasks = (strategy?.stage1Tasks as unknown as StrategyTask[]) || [];
    const completions = taskCompletionsQuery.data || [];
    return tasks.map(task => ({
      ...task,
      completed: completions.find(c => c.taskId === task.id)?.completed ?? task.completed
    }));
  }, [strategy?.stage1Tasks, taskCompletionsQuery.data]);
  
  const stage2Tasks: StrategyTask[] = useMemo(() => {
    const tasks = (strategy?.stage2Tasks as unknown as StrategyTask[]) || [];
    const completions = taskCompletionsQuery.data || [];
    return tasks.map(task => ({
      ...task,
      completed: completions.find(c => c.taskId === task.id)?.completed ?? task.completed
    }));
  }, [strategy?.stage2Tasks, taskCompletionsQuery.data]);
  
  const stage3Tasks: StrategyTask[] = useMemo(() => {
    const tasks = (strategy?.stage3Tasks as unknown as StrategyTask[]) || [];
    const completions = taskCompletionsQuery.data || [];
    return tasks.map(task => ({
      ...task,
      completed: completions.find(c => c.taskId === task.id)?.completed ?? task.completed
    }));
  }, [strategy?.stage3Tasks, taskCompletionsQuery.data]);
  const hasRecordedCarrierApproval = (claimMilestonesQuery.data || []).some(
    event => event.kind === "carrier_approval" && event.evidenceDocumentId !== null
  );
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

  const savePlanningStartDate = async () => {
    if (!strategy?.id || !scheduleStartDraft || saveScheduleStartMutation.isPending) return;
    try {
      await saveScheduleStartMutation.mutateAsync({
        strategyId: strategy.id,
        startDate: scheduleStartDraft,
      });
      await utils.strategy.getMine.invalidate();
      toast.success("Planning start date saved. The timeline and checklist have been refreshed.");
    } catch (error) {
      toast.error("Unable to save the planning date. Confirm the date and try again.");
    }
  };

  const handleGenerate = () => {
    if (!policy) { toast.error("Please complete the Policy Intake Form first."); navigate("/policy-form"); return; }
    generateMutation.mutate({ policyId: policy.id });
  };

  const toggleTask = async (stage: "stage1Tasks" | "stage2Tasks" | "stage3Tasks", tasks: StrategyTask[], taskId: string) => {
    if (!strategy) return;
    if (stage === "stage3Tasks" && (strategy.currentStage !== 3 ||
      strategy.claimStatus !== "approved" || !hasRecordedCarrierApproval)) {
      toast.info("Stage 3 tasks unlock after explicit carrier approval confirmation.");
      return;
    }
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
    if (newStage === 3) {
      toast.error("Stage 3 is unlocked only by recording the carrier decision and supporting document.");
      return;
    }
    try {
      await updateTasksMutation.mutateAsync({
        strategyId: strategy.id, stage: "stage1Tasks", tasks: stage1Tasks,
        currentStage: newStage,
        claimStatus: newStage === 2 ? "in_progress" : "not_started",
      });
      utils.strategy.getMine.invalidate();
      toast.success(`Advanced to Stage ${newStage}`);
    } catch (_e) { toast.error("Failed to advance stage."); }
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

  const downloadPdfMutation = trpc.pdfDelivery.generatePdf.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = `LTC-Strategy-${(policy?.insuredFullName || "Report").replace(/\s+/g, "-")}.pdf`;
        link.target = "_blank";
        link.click();
        toast.success("PDF downloaded successfully!");
      }
    },
    onError: () => toast.error("Failed to generate PDF. Please try again."),
  });

  const handleDownloadPDF = useCallback(() => {
    if (!policy) { toast.error("Please complete the Policy Intake Form first."); return; }
    downloadPdfMutation.mutate({
      insuredName: "",
      insuredDob: policy.insuredDob || "",
      insuredPhone: policy.insuredPhone || "",
      insuredEmail: policy.insuredEmail || "",
      insuredAddress: policy.insuredMailingAddress || "",
      policyNumber: policy.policyNumber || "",
      claimNumber: policy.claimNumber || "",
      carrierName: policy.carrierName || "",
      carrierPhone: policy.carrierPhone || "",
      eliminationPeriod: policy.eliminationPeriod || "",
      dailyMaximum: parseCurrencyValue(policy.dailyMaximum || 0),
      monthlyMaximum: (() => { const v = parseFloat((policy.monthlyMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(v) ? 0 : v; })(),
      lifetimeMaximum: (() => { const v = parseFloat((policy.lifetimeMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(v) ? 0 : v; })(),
      minAdlsRequired: policy.minAdlsRequired ? parseInt(policy.minAdlsRequired) : undefined,
      waiverOfPremium: policy.waiverOfPremium || "",
      assignmentOfBenefits: policy.assignmentOfBenefits || "",
      adlLimitations: policy.qualifyingAdls || policy.adlLimitations || [],
      diagnosisCheckboxes: policy.diagnosisCheckboxes || [],
      cognitiveImpairmentTrigger: policy.cognitiveImpairmentTrigger || "",
      stage1Tasks: stage1Tasks.map(t => t.label),
      stage1TaskIds: stage1Tasks.map(t => t.id),
      stage2Tasks: stage2Tasks.map(t => t.label),
      stage2TaskIds: stage2Tasks.map(t => t.id),
      stage3Tasks: stage3Tasks.map(t => t.label),
      stage3TaskIds: stage3Tasks.map(t => t.id),
      planStartDate: strategy?.scheduleStartDate ?? (strategy?.createdAt ? new Date(strategy.createdAt).toISOString() : undefined),
      taskCompletionDates: (taskCompletionsQuery.data ?? []).map(c => ({ taskId: c.taskId, completed: c.completed, completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : null })),
      careRecommendations: policy.careRecommendations || "",
      strategyContent: strategy?.strategyContent || "",
      diagnosis: policy.primaryDiagnosis || "",
      caseManagerName: policy.caseManagerName || "",
      thirdPartyAssessmentRequired: policy.thirdPartyAssessmentRequired || "",
      careInputs: confirmedCareInputs ?? undefined,
      issueDate: policy.issueDate || undefined,
      policyStatus: policy.policyStatus || undefined,
      benefitPeriod: policy.benefitPeriod || undefined,
      claimsAddress1: policy.carrierAddress1 || undefined,
      claimsAddress2: policy.carrierAddress2 || undefined,
      claimsCityStateZip: policy.carrierCityStateZip || undefined,
      claimsFax: policy.carrierFax || undefined,
    });
  }, [policy, strategy, stage1Tasks, stage2Tasks, stage3Tasks, downloadPdfMutation, confirmedCareInputs]);

  const handleSendEmail = () => {
    const validEmails = emailRecipients.filter(e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
    if (!validEmails.length) { toast.error("Please enter at least one valid email address."); return; }
    if (!strategy?.id) return;
    emailMutation.mutate({
      strategyId: strategy.id,
      recipients: validEmails,
      policyData: policy ? {
        insuredName: "",
        insuredDob: policy.insuredDob || "",
        insuredPhone: policy.insuredPhone || "",
        insuredEmail: policy.insuredEmail || "",
        insuredAddress: policy.insuredMailingAddress || "",
        policyNumber: policy.policyNumber || "",
        claimNumber: policy.claimNumber || "",
        carrierName: policy.carrierName || "",
        carrierPhone: policy.carrierPhone || "",
        eliminationPeriod: policy.eliminationPeriod || "",
        dailyMaximum: parseCurrencyValue(policy.dailyMaximum || 0),
        monthlyMaximum: (() => { const val = parseFloat((policy.monthlyMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
        lifetimeMaximum: (() => { const val = parseFloat((policy.lifetimeMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
        minAdlsRequired: policy.minAdlsRequired ? parseInt(policy.minAdlsRequired) : undefined,
        waiverOfPremium: policy.waiverOfPremium || "",
        assignmentOfBenefits: policy.assignmentOfBenefits || "",
        diagnosis: policy.primaryDiagnosis || "",
        adlLimitations: policy.qualifyingAdls || policy.adlLimitations || [],
        diagnosisCheckboxes: policy.diagnosisCheckboxes || [],
        cognitiveImpairmentTrigger: policy.cognitiveImpairmentTrigger || "",
        stage1Tasks: stage1Tasks.map(t => t.label),
      stage1TaskIds: stage1Tasks.map(t => t.id),
        stage2Tasks: stage2Tasks.map(t => t.label),
      stage2TaskIds: stage2Tasks.map(t => t.id),
        stage3Tasks: stage3Tasks.map(t => t.label),
      stage3TaskIds: stage3Tasks.map(t => t.id),
      planStartDate: strategy?.scheduleStartDate ?? (strategy?.createdAt ? new Date(strategy.createdAt).toISOString() : undefined),
      taskCompletionDates: (taskCompletionsQuery.data ?? []).map(c => ({ taskId: c.taskId, completed: c.completed, completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : null })),
        careRecommendations: policy.careRecommendations || "",
        strategyContent: strategy.strategyContent || "",
        caseManagerName: policy.caseManagerName || "",
        thirdPartyAssessmentRequired: policy.thirdPartyAssessmentRequired || "",
        careInputs: confirmedCareInputs ?? undefined,
        issueDate: policy.issueDate || undefined,
        policyStatus: policy.policyStatus || undefined,
        benefitPeriod: policy.benefitPeriod || undefined,
        claimsAddress1: policy.carrierAddress1 || undefined,
        claimsAddress2: policy.carrierAddress2 || undefined,
        claimsCityStateZip: policy.carrierCityStateZip || undefined,
        claimsFax: policy.carrierFax || undefined,
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
            <AccordionItem key={cat} value={cat} className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-base">{catInfo.icon}</span>
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-teal transition-colors duration-200">{catInfo.label}</span>
                  <Badge variant={allDone ? "default" : "secondary"} className={`text-xs ${allDone ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}>
                    {completedCount}/{catTasks.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="space-y-1.5">
                  {catTasks.map(task => (
                    <div
                      key={task.id}
                      className={`group/task flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                        task.completed
                          ? "bg-green-50 border border-green-100"
                          : task.critical
                            ? "bg-amber-50 border border-amber-200 hover:border-amber-300 hover:bg-amber-100/50"
                            : "border border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <Checkbox
                        id={`task-${stage}-${task.id}`}
                        aria-label={task.label}
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(stage, tasks, task.id)}
                        className={`mt-0.5 transition-transform duration-150 ${task.completed ? "scale-110" : "group-hover/task:scale-105"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`task-${stage}-${task.id}`} className={`cursor-pointer text-sm leading-relaxed transition-all duration-200 ${
                          task.completed ? "line-through text-slate-400" : task.critical ? "font-medium text-amber-800" : "text-slate-700 group-hover/task:text-slate-900"
                        }`}>
                          {task.critical && !task.completed && (
                            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />
                          )}
                          {task.label}
                        </label>
                        {strategy?.id && <a className="mt-2 block w-fit text-xs font-semibold text-teal-700 underline underline-offset-4" href={`/documents?strategyId=${strategy.id}&taskId=${encodeURIComponent(task.id)}`} aria-label={`Documents for ${task.label}`}>View or upload documents</a>}
                      </div>
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0 animate-scale-in" />}
                    </div>
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

  // One-time arrival celebration when user first reaches the Strategy page
  const [showArrivalBanner, setShowArrivalBanner] = useState(false);
  useEffect(() => {
    const key = "ltc_strategy_arrival_celebrated";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      setShowArrivalBanner(true);
      // Fire confetti burst after a short delay so the page has rendered
      const timer = setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ["#14b8a6", "#0d9488", "#ffffff", "#fbbf24", "#34d399"] });
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { x: 0.1, y: 0.6 }, colors: ["#14b8a6", "#fbbf24"] }), 300);
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { x: 0.9, y: 0.6 }, colors: ["#0d9488", "#34d399"] }), 500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Your Personalized LTC Claim Strategy | SC Visiting Angels</title>
        <meta name="description" content="Your step-by-step long-term care insurance claim strategy from SC Visiting Angels. Track your progress, complete tasks, and file your claim with confidence." />
        <meta property="og:title" content="Your Personalized LTC Claim Strategy" />
        <meta property="og:description" content="Your step-by-step long-term care insurance claim strategy from SC Visiting Angels. Track your progress and file your claim with confidence." />
        <meta property="og:image" content="/media/cdn/gwMDIGGTHLJRGnPt.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Personalized LTC Claim Strategy" />
        <meta name="twitter:description" content="Your step-by-step long-term care insurance claim strategy from SC Visiting Angels. Track your progress and file your claim with confidence." />
        <meta name="twitter:image" content="/media/cdn/gwMDIGGTHLJRGnPt.png" />
      </Helmet>
      {/* Arrival celebration banner — shown once per session on first visit */}
      {showArrivalBanner && (
        <div className="bg-gradient-to-r from-teal to-teal-dark text-white px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="celebration">🎉</span>
            <div>
              <p className="font-bold text-sm">You've completed all 3 steps!</p>
              <p className="text-white/80 text-xs">Your personalized LTC strategy is ready below. You did it!</p>
            </div>
          </div>
          <button
            onClick={() => setShowArrivalBanner(false)}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="relative text-white py-section">
        <div className="absolute inset-0">
          <img src="/media/cdn/gwMDIGGTHLJRGnPt.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a4a]/90 via-[#1a3a4a]/80 to-[#2c5060]/70" />
        </div>
        <div className="container relative max-w-5xl">
          {/* Step progress badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal/20 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-teal" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-white/85 font-medium">Personalized Strategy</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-teal rounded-full px-4 py-1.5 border border-teal/60 shadow-lg">
              <span className="text-sm font-bold text-white">Step 3 of 3 — Your Strategy</span>
            </div>
          </div>
          {/* Step flow indicator */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
              <span className="w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="text-xs font-semibold text-white/85">Learn</span>
            </div>
            <div className="w-6 h-px bg-white/40" />
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
              <span className="w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold flex items-center justify-center">2</span>
              <span className="text-xs font-semibold text-white/85">Form</span>
            </div>
            <div className="w-6 h-px bg-white/40" />
            <div className="flex items-center gap-1.5 bg-teal rounded-lg px-3 py-1.5">
              <span className="w-5 h-5 rounded-full bg-white text-teal text-xs font-bold flex items-center justify-center">3</span>
              <span className="text-xs font-semibold text-white">Strategy</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Your LTC Claim<br className="hidden md:block" /> Strategy Guide
          </h1>
          <p className="text-white/70 max-w-xl text-base md:text-lg leading-relaxed">
            A step-by-step roadmap with interactive checklists, timelines, and tools to help you successfully navigate your long-term care insurance claim.
          </p>
        </div>
      </section>

      {/* Sticky Stage Progress Bar — shown only when strategy exists */}
      {hasStrategy && (
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="container max-w-5xl py-2.5">
            <div className="flex items-center gap-3 md:gap-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block whitespace-nowrap">Progress</span>
              {[
                { num: 1, label: "Pre-Claim", tasks: stage1Tasks },
                { num: 2, label: "Filing", tasks: stage2Tasks },
                { num: 3, label: "Ongoing", tasks: stage3Tasks },
              ].map(({ num, label, tasks }) => {
                const pct = stageProgress(tasks);
                const isActive = currentStage === num;
                const isComplete = pct === 100;
                const isLocked = num > currentStage;
                return (
                  <div key={num} className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold truncate ${
                        isComplete ? "text-teal" : isActive ? "text-slate-800" : "text-slate-400"
                      }`}>
                        <span className="hidden sm:inline">Stage {num}: </span>{label}
                      </span>
                      <span className={`text-xs font-bold ml-1 ${
                        isComplete ? "text-teal" : isActive ? "text-slate-700" : "text-slate-400"
                      }`}>
                        {isLocked ? "—" : `${tasks.filter(t => t.completed).length}/${tasks.length}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? "bg-teal" : isActive ? "bg-teal/60" : "bg-slate-200"
                        }`}
                        style={{ width: isLocked ? "0%" : `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Main Content */}
      <section className="py-section bg-gradient-to-b from-slate-50 to-white">
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
                {["Email Address", "Phone Number", "Insurance Company", "Policy Number", "Elimination Period", "Waiver of Premium", "Daily or Monthly Maximum", "Lifetime Maximum", "ADLs or Cognitive Decline"].map(f => (
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
            <Suspense fallback={
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading your strategy...</p>
                </div>
              </div>
            }>
            <div className="space-y-5 md:space-y-8">
              {/* Policy Summary - Always visible at top */}
              {policy && <PolicySummaryCard policy={policy} />}

              {/* How Do You Want to See Your Custom Plan? */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="text-center mb-8">
                  <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">Your <span style={{ color: '#34B1C4' }}>Personalized Strategy</span></h2>
                  <p className="text-slate-600 max-w-2xl mx-auto text-base leading-relaxed">Below are different ways to view your step-by-step claim plan. Choose the view that works best for you — you can switch between them anytime.</p>
                </div>

                {/* Plan View Selector */}
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                  <button
                    onClick={() => setPlanView("written")}
                    className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
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
                    className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
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
                    className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
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
                    className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
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
                    className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
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
                    className={`p-2 sm:p-4 rounded-xl border-2 transition-all text-center ${
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
                <div className="space-y-5 md:space-y-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal/5 to-cyan-50">
                      <h3 className="font-serif text-xl font-bold text-slate-900">Written Plan</h3>
                      <p className="text-sm text-slate-600 mt-1">Read your complete strategy in one document. Includes care recommendations, next steps, and important details about your policy.</p>
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
                <div className="space-y-5 md:space-y-8">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal/5 to-cyan-50">
                      <h3 className="font-serif text-xl font-bold text-slate-900">Timeline</h3>
                      <p className="text-sm text-slate-600 mt-1">See your claim process on a calendar. Shows when each task should be completed and how long each stage takes.</p>
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div>
                          <Label htmlFor="ltc-plan-start" className="text-xs text-slate-700">Planning start date</Label>
                          <Input
                            id="ltc-plan-start"
                            type="date"
                            min="1900-01-01"
                            max="2100-12-31"
                            value={scheduleStartDraft}
                            onChange={event => setScheduleStartDraft(event.target.value)}
                            className="mt-1 h-9 w-[180px] border-slate-300 bg-white text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!strategy?.id || !scheduleStartDraft || scheduleStartDraft === savedStartDate || saveScheduleStartMutation.isPending}
                          onClick={savePlanningStartDate}
                          className="h-9"
                        >
                          {saveScheduleStartMutation.isPending ? "Saving…" : "Save date"}
                        </Button>
                        <span className="text-xs text-slate-500">This is a planning anchor, not a carrier-approved claim or care start date.</span>
                      </div>
                    </div>
                    <div className="px-4 py-5 md:px-6 overflow-x-auto">
                      <div className="min-w-0">
                      <GanttTimeline
                        stage1Tasks={stage1Tasks}
                        stage2Tasks={stage2Tasks}
                        stage3Tasks={stage3Tasks}
                        eliminationPeriod={policy?.eliminationPeriod}
                        planStartDate={strategy?.scheduleStartDate ?? strategy?.createdAt ?? strategy?.generatedAt}
                        taskCompletionDates={taskCompletionsQuery.data ?? []}
                        onToggleTask={handleToggleTask}
                      />
                      </div>
                    </div>
                  </div>
                  {strategy?.id && (
                    <Suspense fallback={<div className="p-3 text-sm text-slate-500">Loading claim milestones…</div>}>
                      <ClaimMilestonePanel
                        strategyId={strategy.id}
                        policyId={strategy.policyId}
                        variant="history"
                      />
                    </Suspense>
                  )}

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal/5 to-cyan-50">
                      <h3 className="font-serif text-xl font-bold text-slate-900">Understanding Your Strategy</h3>
                      <p className="text-sm text-slate-600 mt-1">Learn how to use your personalized 3-stage strategy</p>
                    </div>
                    <div className="p-4">
                      <VideoPlaceholder
                        title="Understanding Your Strategy"
                        description="Learn how to use your personalized 3-stage strategy to navigate the claims process"
                        thumbnailUrl="/media/cdn/NXdvbYzcqmcgIfxG.png"
                        videoUrl="/media/cdn/QlCyvRbUBXkLwOND.mp4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CHECKLIST VIEW */}
              {planView === "checklist" && (
                <div className="space-y-5 md:space-y-8">
                  <ChronologicalChecklist
                    stage1Tasks={stage1Tasks}
                    stage2Tasks={stage2Tasks}
                    stage3Tasks={stage3Tasks}
                    eliminationPeriod={policy?.eliminationPeriod}
                    planStartDate={strategy?.scheduleStartDate ?? strategy?.createdAt ?? strategy?.generatedAt}
                    taskCompletionDates={taskCompletionsQuery.data ?? []}
                    onToggleTask={handleToggleTask}
                  />

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-50">
                      <h3 className="font-serif text-xl font-bold text-slate-900">Interactive Checklist</h3>
                      <p className="text-sm text-slate-600 mt-1">Check off tasks as you complete them. Organized by the 3 stages of your claim process. Track your progress and see what's next.</p>
                    </div>
                    <div className="p-6 space-y-5 md:space-y-8">
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
                              <span><strong>Critical:</strong> Confirm required claim-notice deadlines with the carrier. Assemble a complete claim packet, but do not delay time-sensitive notice or urgent care solely to finish this checklist.</span>
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
                          {currentStage >= 2 && strategy?.id && (
                            <Suspense fallback={<span className="text-xs text-slate-500">Loading evidence…</span>}>
                              <ClaimMilestonePanel
                                strategyId={strategy.id}
                                policyId={strategy.policyId}
                                variant="approval"
                              />
                            </Suspense>
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

              {/* DOWNLOADS VIEW */}
              {planView === "downloads" && (
                <div className="space-y-5 md:space-y-8">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Download className="w-4.5 h-4.5 text-teal" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-900">Download Your Strategy</h3>
                        <p className="text-sm text-slate-600">Save your complete strategy as a PDF. You can print it, share it with family, or keep it for your records.</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                      <Button onClick={handleDownloadPDF} disabled={downloadPdfMutation.isPending} variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-200 hover:border-teal hover:bg-teal/5">
                        {downloadPdfMutation.isPending
                          ? <Loader2 className="w-6 h-6 text-teal animate-spin" />
                          : <Download className="w-6 h-6 text-teal" />}
                        <span className="font-medium">{downloadPdfMutation.isPending ? "Generating…" : "Download as PDF"}</span>
                        <span className="text-xs text-slate-500">Landscape · All sections · SC Visiting Angels</span>
                      </Button>
                      <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50">
                        <RefreshCw className={`w-6 h-6 text-amber-500 ${isGenerating ? "animate-spin" : ""}`} />
                        <span className="font-medium">Regenerate</span>
                        <span className="text-xs text-slate-500">Create updated version</span>
                      </Button>
                    </div>

                    <PdfDeliveryPanel
                      policyData={{
                        insuredName: "",
                        insuredDob: policy?.insuredDob || "",
                        insuredPhone: policy?.insuredPhone || "",
                        insuredEmail: policy?.insuredEmail || "",
                        insuredAddress: policy?.insuredMailingAddress || "",
                        policyNumber: policy?.policyNumber || "",
                        claimNumber: policy?.claimNumber || "",
                        carrierName: policy?.carrierName || "",
                        carrierPhone: policy?.carrierPhone || "",
                        eliminationPeriod: policy?.eliminationPeriod || "",
                        dailyMaximum: parseCurrencyValue(policy?.dailyMaximum || 0),
                        monthlyMaximum: (() => { const val = parseFloat((policy?.monthlyMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
                        lifetimeMaximum: (() => { const val = parseFloat((policy?.lifetimeMaximum || "0").toString().replace(/[^0-9.]/g, "")); return isNaN(val) ? 0 : val; })(),
                        minAdlsRequired: policy?.minAdlsRequired ? parseInt(policy.minAdlsRequired) : undefined,
                        waiverOfPremium: policy?.waiverOfPremium || "",
                        assignmentOfBenefits: policy?.assignmentOfBenefits || "",
                        adlLimitations: policy?.qualifyingAdls || policy?.adlLimitations || [],
                        diagnosisCheckboxes: policy?.diagnosisCheckboxes || [],
                        cognitiveImpairmentTrigger: policy?.cognitiveImpairmentTrigger || "",
                        stage1Tasks: stage1Tasks.map(t => t.label),
      stage1TaskIds: stage1Tasks.map(t => t.id),
                        stage2Tasks: stage2Tasks.map(t => t.label),
      stage2TaskIds: stage2Tasks.map(t => t.id),
                        stage3Tasks: stage3Tasks.map(t => t.label),
      stage3TaskIds: stage3Tasks.map(t => t.id),
      planStartDate: strategy?.scheduleStartDate ?? (strategy?.createdAt ? new Date(strategy.createdAt).toISOString() : undefined),
      taskCompletionDates: (taskCompletionsQuery.data ?? []).map(c => ({ taskId: c.taskId, completed: c.completed, completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : null })),
                        careRecommendations: policy?.careRecommendations || "",
                        strategyContent: strategy?.strategyContent || "",
                        diagnosis: policy?.primaryDiagnosis || "",
                        caseManagerName: policy?.caseManagerName || "",
                        thirdPartyAssessmentRequired: policy?.thirdPartyAssessmentRequired || "",
                        careInputs: confirmedCareInputs ?? undefined,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* FINANCIAL STRATEGY VIEW */}
              {planView === "financial" && (
                <div className="space-y-5 md:space-y-8">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Calculator className="w-4.5 h-4.5 text-teal" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-900">Care Cost Calculator</h3>
                        <p className="text-sm text-slate-600">Estimate home-care expenses using your actual benefit limits, remaining pool and elimination-period rules.</p>
                      </div>
                    </div>
                    {careScenarioQuery.isLoading && <p className="mb-3 text-sm text-slate-600" role="status">
                      Loading your saved care scenario…
                    </p>}
                    {!careScenarioQuery.isLoading && careScenarioQuery.isError && (
                      <p className="mb-3 text-sm text-red-700" role="alert">
                        Saved care scenario is unavailable. Calculations can be reviewed, but a scenario must be saved before export.
                      </p>
                    )}
                    {!careScenarioQuery.isLoading && !careScenarioQuery.isError && (
                    <CareCalculator
                      policyId={policy?.id}
                      defaultDailyMax={policy?.dailyMaximum || ""}
                      defaultMonthlyMax={policy?.monthlyMaximum || ""}
                      lifetimeMaximum={policy?.lifetimeMaximum || ""}
                      eliminationPeriod={policy?.eliminationPeriod}
                      onConfirmedScenario={setConfirmedCareInputs}
                      initialScenario={careScenarioQuery.data?.inputs ?? null}
                      initialScenarioValidated={careScenarioQuery.data?.status==="saved_valid"}
                      initialScenarioReason={careScenarioQuery.data?.reason}
                      onSaveScenario={persistCareScenario}
                    />
                    )}
                  </div>
                </div>
              )}

              {/* SEND MY PLAN VIEW */}
              {planView === "send" && (
                <div className="space-y-5 md:space-y-8">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Mail className="w-4.5 h-4.5 text-teal" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-slate-900">Share Your Strategy</h3>
                        <p className="text-sm text-slate-600">Email your strategy to family, caregivers, or advisors. You can also set up SMS reminders for important tasks.</p>
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
            </Suspense>

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
    </Layout>
  );
}
