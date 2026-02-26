import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";
import { Target, Download, Mail, Loader2, RefreshCw, Shield, FileText, Plus, X } from "lucide-react";

export default function Strategy() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const policyId = params.get("policyId") ? Number(params.get("policyId")) : null;

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([""]);
  const strategyContentRef = useRef<HTMLDivElement>(null);

  // Get existing strategy for this policy
  const strategyQuery = trpc.strategy.getByPolicy.useQuery(
    { policyId: policyId! },
    { enabled: isAuthenticated && !!policyId }
  );

  // Get policy data
  const policyQuery = trpc.policy.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const generateMutation = trpc.strategy.generate.useMutation({
    onSuccess: () => {
      strategyQuery.refetch();
      toast.success("Your personalized strategy has been generated!");
    },
    onError: (error) => {
      toast.error("Failed to generate strategy. Please try again.");
      console.error(error);
    },
  });

  const emailMutation = trpc.email.sendStrategy.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setEmailDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to send email. Please try again.");
    },
  });

  // Auto-populate user email
  useEffect(() => {
    if (user?.email && emailRecipients.length === 1 && emailRecipients[0] === "") {
      setEmailRecipients([user.email]);
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = () => {
    if (!policyId) {
      toast.error("No policy found. Please complete the policy form first.");
      return;
    }
    generateMutation.mutate({ policyId });
  };

  const handleDownloadPDF = useCallback(() => {
    if (!strategyContentRef.current) return;

    const content = strategyContentRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download the PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LTC Insurance Claim Strategy</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Roboto Slab', serif;
            color: #2c3e50;
            margin-top: 1.5em;
          }
          h2 { font-size: 1.5em; border-bottom: 2px solid #3498db; padding-bottom: 0.3em; }
          h3 { font-size: 1.2em; color: #34495e; }
          ul, ol { padding-left: 1.5em; }
          li { margin-bottom: 0.5em; }
          strong { color: #2c3e50; }
          p { margin-bottom: 1em; }
          .header { text-align: center; margin-bottom: 2em; padding-bottom: 1em; border-bottom: 3px solid #3498db; }
          .header h1 { color: #3498db; margin-bottom: 0.25em; }
          .header p { color: #666; font-size: 0.9em; }
          @media print {
            body { padding: 20px; }
            h2 { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LTC Insurance Claim Strategy</h1>
          <p>Generated for ${user?.name || "Policy Holder"} on ${new Date().toLocaleDateString()}</p>
          <p>LTC Navigator - Your Personalized Claims Guide</p>
        </div>
        ${content}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [user?.name]);

  const handleSendEmail = () => {
    const validEmails = emailRecipients.filter((e) => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
    if (validEmails.length === 0) {
      toast.error("Please enter at least one valid email address.");
      return;
    }
    if (!strategyQuery.data?.id) return;

    emailMutation.mutate({
      strategyId: strategyQuery.data.id,
      recipients: validEmails,
    });
  };

  const addRecipient = () => {
    setEmailRecipients((prev) => [...prev, ""]);
  };

  const removeRecipient = (index: number) => {
    setEmailRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    setEmailRecipients((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <Layout>
        <section className="py-20 bg-secondary">
          <div className="container max-w-lg text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to view your personalized strategy.
            </p>
            <Button asChild size="lg">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const hasStrategy = strategyQuery.data?.strategyContent;
  const isGenerating = generateMutation.isPending;

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-primary" />
            <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Your Strategy</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
            Your Customized Claim Strategy
          </h1>
          <p className="text-white/80 max-w-2xl">
            A personalized, step-by-step guide to help you successfully file your long-term care insurance claim.
          </p>
        </div>
      </section>

      {/* Video */}
      <section className="py-8 bg-secondary">
        <div className="container max-w-4xl">
          <VideoPlaceholder
            title="Understanding Your Strategy"
            description="Learn how to use your personalized strategy to navigate the claims process effectively"
          />
        </div>
      </section>

      {/* Strategy Content */}
      <section className="py-12 bg-white">
        <div className="container max-w-4xl">
          {!policyId && !policyQuery.data ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">No Policy Information Found</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Please complete the policy intake form first so we can generate a strategy tailored to your specific situation.
              </p>
              <Button asChild>
                <a href="/policy-form">Complete Policy Form</a>
              </Button>
            </div>
          ) : isGenerating ? (
            <div className="text-center py-16">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Generating Your Strategy</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our system is analyzing your policy details and care needs to create a comprehensive, personalized strategy. This may take a moment...
              </p>
            </div>
          ) : hasStrategy ? (
            <div>
              {/* Action bar */}
              <div className="flex flex-wrap gap-3 mb-8 p-4 bg-secondary rounded-lg border border-border">
                <Button onClick={handleDownloadPDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>

                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Mail className="w-4 h-4 mr-2" /> Email Strategy
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Email Your Strategy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Send your personalized strategy to yourself or family members.
                      </p>
                      {emailRecipients.map((email, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <Label htmlFor={`email-${index}`}>
                              {index === 0 ? "Email Address" : `Recipient ${index + 1}`}
                            </Label>
                            <Input
                              id={`email-${index}`}
                              type="email"
                              value={email}
                              onChange={(e) => updateRecipient(index, e.target.value)}
                              placeholder="name@example.com"
                            />
                          </div>
                          {emailRecipients.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeRecipient(index)} className="shrink-0">
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addRecipient} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Another Recipient
                      </Button>
                      <Button onClick={handleSendEmail} disabled={emailMutation.isPending} className="w-full">
                        {emailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                        Send Strategy
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                </Button>
              </div>

              {/* Strategy content */}
              <div
                ref={strategyContentRef}
                className="prose prose-lg max-w-none
                  prose-headings:font-serif prose-headings:text-foreground
                  prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-primary prose-h2:pb-2 prose-h2:mt-10
                  prose-h3:text-xl prose-h3:text-foreground/80
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground
                  prose-strong:text-foreground
                  prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: strategyQuery.data?.strategyContent || "" }}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="w-16 h-16 text-primary/30 mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Ready to Generate Your Strategy</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                We have your policy information. Click below to generate your personalized LTC insurance claim strategy.
              </p>
              <Button size="lg" onClick={handleGenerate}>
                <Target className="w-4 h-4 mr-2" /> Generate My Strategy
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
