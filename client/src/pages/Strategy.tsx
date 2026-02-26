import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  FileText, Download, Mail, Loader2, CheckCircle2, AlertTriangle,
  Upload, ArrowRight, Shield, ClipboardCheck, Plus, X, ChevronDown, ChevronUp, RefreshCw, Target,
} from "lucide-react";

type StrategyTask = {
  id: string;
  label: string;
  completed: boolean;
  category: string;
  critical?: boolean;
  uploadRequired?: boolean;
};

export default function Strategy() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([""]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const strategyContentRef = useRef<HTMLDivElement>(null);

  const policyQuery = trpc.policy.get.useQuery(undefined, { enabled: isAuthenticated });
  const strategyQuery = trpc.strategy.getMine.useQuery(undefined, { enabled: isAuthenticated });
  const generateMutation = trpc.strategy.generate.useMutation({
    onSuccess: () => {
      strategyQuery.refetch();
      toast.success("Your personalized strategy has been generated!");
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
  const policy = policyQuery.data;

  useEffect(() => {
    if (user?.email && emailRecipients.length === 1 && emailRecipients[0] === "") {
      setEmailRecipients([user.email]);
    }
  }, [user?.email]); // eslint-disable-line

  const stage1Tasks: StrategyTask[] = useMemo(() => (strategy?.stage1Tasks as unknown as StrategyTask[]) || [], [strategy?.stage1Tasks]);
  const stage2Tasks: StrategyTask[] = useMemo(() => (strategy?.stage2Tasks as unknown as StrategyTask[]) || [], [strategy?.stage2Tasks]);
  const stage3Tasks: StrategyTask[] = useMemo(() => (strategy?.stage3Tasks as unknown as StrategyTask[]) || [], [strategy?.stage3Tasks]);
  const currentStage = strategy?.currentStage || 1;

  const stageProgress = (tasks: StrategyTask[]) => tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

  const handleGenerate = () => {
    if (!policy) { toast.error("Please complete the Policy Intake Form first."); navigate("/policy-form"); return; }
    generateMutation.mutate({ policyId: policy.id });
  };

  const toggleTask = async (stage: "stage1Tasks" | "stage2Tasks" | "stage3Tasks", tasks: StrategyTask[], taskId: string) => {
    if (!strategy) return;
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    try {
      await updateTasksMutation.mutateAsync({ strategyId: strategy.id, stage, tasks: updated });
      utils.strategy.getMine.invalidate();
    } catch (_e) { toast.error("Failed to update task."); }
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
    </head><body><div class="header"><h1>LTC Insurance Claim Strategy</h1><p>Generated for ${user?.name || "Policy Holder"} on ${new Date().toLocaleDateString()}</p></div>${content}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }, [user?.name]);

  const handleSendEmail = () => {
    const validEmails = emailRecipients.filter(e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
    if (!validEmails.length) { toast.error("Please enter at least one valid email address."); return; }
    if (!strategy?.id) return;
    emailMutation.mutate({ strategyId: strategy.id, recipients: validEmails });
  };

  const addRecipient = () => setEmailRecipients(prev => [...prev, ""]);
  const removeRecipient = (i: number) => setEmailRecipients(prev => prev.filter((_, idx) => idx !== i));
  const updateRecipient = (i: number, v: string) => setEmailRecipients(prev => prev.map((r, idx) => idx === i ? v : r));

  const groupByCategory = (tasks: StrategyTask[]) => {
    const groups: Record<string, StrategyTask[]> = {};
    tasks.forEach(t => { if (!groups[t.category]) groups[t.category] = []; groups[t.category].push(t); });
    return groups;
  };

  const categoryLabels: Record<string, string> = {
    "carrier-contact": "📞 Carrier Contact", "medical-evaluation": "🩺 Medical Evaluation",
    "provider-setup": "🏥 Provider Setup", "documents": "📄 Document Collection",
    "elimination-period": "⏱️ Elimination Period", "personal-info": "🔒 Personal Information",
    "claim-packet": "📦 Claim Packet Assembly", "verification": "✅ Verification",
    "submission": "📤 Submission", "evaluation": "🔍 Third-Party Evaluation",
    "post-submission": "📋 Post-Submission", "ongoing": "🔄 Ongoing Management",
    "aob-flow": "💰 Assignment of Benefits Flow", "reimbursement-flow": "💵 Reimbursement Flow",
  };

  const toggleCategory = (cat: string) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  if (authLoading) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-teal" /></div></Layout>;
  if (!isAuthenticated) {
    return (
      <Layout>
        <section className="py-20 bg-secondary">
          <div className="container max-w-lg text-center">
            <Shield className="w-16 h-16 text-teal mx-auto mb-6" />
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">Please sign in to view your personalized strategy.</p>
            <Button asChild size="lg"><a href={getLoginUrl()}>Sign In to Continue</a></Button>
          </div>
        </section>
      </Layout>
    );
  }

  const renderTaskList = (stage: "stage1Tasks" | "stage2Tasks" | "stage3Tasks", tasks: StrategyTask[]) => {
    const groups = groupByCategory(tasks);
    return (
      <div className="space-y-4">
        {Object.entries(groups).map(([cat, catTasks]) => {
          const isExpanded = expandedCategories[`${stage}-${cat}`] !== false;
          const completedCount = catTasks.filter(t => t.completed).length;
          return (
            <div key={cat} className="border rounded-lg overflow-hidden">
              <button onClick={() => toggleCategory(`${stage}-${cat}`)} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{categoryLabels[cat] || cat}</span>
                  <span className="text-xs text-slate-500">({completedCount}/{catTasks.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${(completedCount / catTasks.length) * 100}%` }} />
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {isExpanded && (
                <div className="p-3 space-y-2">
                  {catTasks.map(task => (
                    <label key={task.id} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${task.completed ? "bg-green-50" : task.critical ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50"}`}>
                      <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(stage, tasks, task.id)} className="mt-0.5" />
                      <div className="flex-1">
                        <span className={`text-sm ${task.completed ? "line-through text-slate-400" : task.critical ? "font-semibold text-amber-800" : "text-slate-700"}`}>
                          {task.critical && !task.completed && <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />}
                          {task.label}
                        </span>
                        {task.uploadRequired && !task.completed && (
                          <span className="block text-xs text-blue-600 mt-0.5"><Upload className="w-3 h-3 inline mr-0.5" /> Document upload recommended</span>
                        )}
                      </div>
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const hasStrategy = strategy?.strategyContent;
  const isGenerating = generateMutation.isPending;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative text-white py-12">
        <div className="absolute inset-0">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/gwMDIGGTHLJRGnPt.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a4a]/85 to-[#1a2a3a]/80" />
        </div>
        <div className="container relative">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardCheck className="w-6 h-6 text-teal" />
            <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Your Strategy</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">Your Customized Claim Strategy</h1>
          <p className="text-white/80 max-w-2xl">A personalized, step-by-step guide with interactive checklists to help you successfully file and manage your long-term care insurance claim.</p>
        </div>
      </section>

      {/* Video */}
      <section className="py-8 bg-secondary">
        <div className="container max-w-4xl">
          <VideoPlaceholder title="Understanding Your Strategy" description="Learn how to use your personalized 3-stage strategy to navigate the claims process" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NXdvbYzcqmcgIfxG.jpg" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/QlCyvRbUBXkLwOND.mp4" />
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-white">
        <div className="container max-w-5xl">
          {!policy && !policyQuery.isLoading ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">No Policy Information Found</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">Please complete the policy intake form first so we can generate a strategy tailored to your specific situation.</p>
              <Button asChild><a href="/policy-form">Complete Policy Form</a></Button>
            </div>
          ) : isGenerating ? (
            <div className="text-center py-16">
              <Loader2 className="w-16 h-16 text-teal mx-auto mb-6 animate-spin" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Generating Your Strategy</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Analyzing your policy details and care needs to create a comprehensive, personalized strategy. This may take a moment...</p>
            </div>
          ) : hasStrategy ? (
            <div>
              {/* Action Bar */}
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-secondary rounded-lg border border-border">
                <Button onClick={handleDownloadPDF} variant="outline"><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline"><Mail className="w-4 h-4 mr-2" /> Email Strategy</Button></DialogTrigger>
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
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</Button>
              </div>

              {/* Stage Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { num: 1, title: "Prior to Claim", tasks: stage1Tasks, desc: "Gather documentation & set up providers" },
                  { num: 2, title: "Filing the Claim", tasks: stage2Tasks, desc: "Submit complete claim packet" },
                  { num: 3, title: "Post-Approval", tasks: stage3Tasks, desc: "Manage ongoing care & reimbursement" },
                ].map(s => (
                  <div key={s.num} className={`p-4 rounded-lg border-2 transition-colors ${currentStage === s.num ? "border-teal bg-teal/5" : currentStage > s.num ? "border-green-300 bg-green-50" : "border-slate-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStage === s.num ? "bg-teal text-white" : currentStage > s.num ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {currentStage > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Stage {s.num}</h3>
                        <p className="text-xs text-slate-500">{s.title}</p>
                      </div>
                    </div>
                    <Progress value={stageProgress(s.tasks)} className="h-2 mb-1" />
                    <p className="text-xs text-slate-500">{stageProgress(s.tasks)}% complete — {s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Tabbed Content */}
              <Tabs defaultValue="tasks" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tasks">Task Checklists</TabsTrigger>
                  <TabsTrigger value="strategy">Full Strategy Document</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-6">
                  {/* Stage 1 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-slate-800">Stage 1: Prior to Claim</h2>
                      {stageProgress(stage1Tasks) === 100 && currentStage === 1 && (
                        <Button size="sm" onClick={() => advanceStage(2)} className="gap-1">Advance to Stage 2 <ArrowRight className="w-3 h-3" /></Button>
                      )}
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-800">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      <strong>Critical:</strong> Do NOT initiate your claim until ALL Stage 1 tasks are complete. Submit everything in ONE packet.
                    </div>
                    {renderTaskList("stage1Tasks", stage1Tasks)}
                  </div>

                  {/* Stage 2 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-slate-800">Stage 2: Filing the Claim</h2>
                      {stageProgress(stage2Tasks) === 100 && currentStage === 2 && (
                        <Button size="sm" onClick={() => advanceStage(3)} className="gap-1">Advance to Stage 3 <ArrowRight className="w-3 h-3" /></Button>
                      )}
                    </div>
                    {currentStage < 2 ? (
                      <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">Complete Stage 1 first before proceeding to claim filing.</p>
                    ) : renderTaskList("stage2Tasks", stage2Tasks)}
                  </div>

                  {/* Stage 3 */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-3">Stage 3: Post-Approval Management</h2>
                    {currentStage < 3 ? (
                      <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">Complete Stage 2 first before proceeding to post-approval management.</p>
                    ) : renderTaskList("stage3Tasks", stage3Tasks)}
                  </div>
                </TabsContent>

                <TabsContent value="strategy">
                  <div
                    ref={strategyContentRef}
                    className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-teal prose-h2:pb-2 prose-h2:mt-10 prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-teal"
                    dangerouslySetInnerHTML={{ __html: strategy?.strategyHtml || "" }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="w-16 h-16 text-teal/30 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Ready to Generate Your Strategy</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">We have your policy information. Click below to generate your personalized LTC insurance claim strategy.</p>
              <Button size="lg" onClick={handleGenerate}><Target className="w-4 h-4 mr-2" /> Generate My Strategy</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
