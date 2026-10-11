import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck, BookOpen, AlertTriangle, Heart, ArrowLeft, ExternalLink } from "lucide-react";

const STORAGE_KEY = "ltc_terms_accepted_v1";

type Screen = "terms" | "exit-confirm";

export function TermsGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [screen, setScreen] = useState<Screen>("terms");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === "true");
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setAccepted(true);
  };

  const handleExitClick = () => {
    setScreen("exit-confirm");
  };

  const handleFinalExit = () => {
    window.location.href = "https://www.scvisitingangels.com";
  };

  const handleReturnToTerms = () => {
    setScreen("terms");
  };

  // Still loading from localStorage
  if (accepted === null) return null;

  // Already accepted — render children
  if (accepted) return <>{children}</>;

  // Show terms gate modal
  return (
    <>
      {/* Render children behind the modal (blurred) */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>

      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >

          {/* ── SCREEN 1: Terms of Use ── */}
          {screen === "terms" && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #1B4F8A, #3BBFBF)" }}>
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-navy">
                    Welcome to the LTC Insurance Navigator
                  </DialogTitle>
                </div>
                <DialogDescription className="text-slate-600 leading-relaxed mt-2">
                  Before you begin, please review and accept our Terms of Use.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                    <BookOpen className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-teal-800">Educational Purpose Only</p>
                      <p className="text-xs text-teal-700 mt-0.5">
                        All content, tools, and reports on this site are for educational and informational
                        purposes only. Nothing constitutes legal, financial, or insurance advice.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">No Guarantees of Outcome</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        SC Visiting Angels does not guarantee that any strategy or recommendation will
                        result in approval of an LTC insurance claim. Results vary by policy and carrier.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Limitation of Liability</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        SC Visiting Angels is not liable for any decisions made based on information
                        found on this site. Always consult a licensed professional for your specific situation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Checkbox
                    id="terms-accept"
                    checked={checked}
                    onCheckedChange={(v) => setChecked(!!v)}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="terms-accept" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                      I have read and agree to the{" "}
                      <Link href="/terms" className="text-teal-600 hover:underline font-medium" target="_blank">
                        Terms of Use &amp; Disclaimer
                      </Link>
                      .
                    </Label>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      I understand that this tool is for educational purposes only and does not constitute
                      professional advice.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitClick}
                  className="text-slate-600"
                >
                  Exit
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={!checked}
                  className="text-white"
                  style={{ background: checked ? "linear-gradient(135deg, #1B4F8A, #3BBFBF)" : undefined }}
                >
                  I Accept — Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── SCREEN 2: Soft Exit Confirmation ── */}
          {screen === "exit-confirm" && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #3BBFBF, #1B4F8A)" }}>
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl font-bold" style={{ color: "#1B4F8A" }}>
                    Thank You for Considering Us
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <p className="text-slate-700 leading-relaxed text-sm">
                  We understand that navigating long-term care insurance can feel overwhelming, and
                  we are truly grateful for the opportunity to support you and your family through
                  this process.
                </p>

                <div className="p-4 rounded-lg border border-teal-100 bg-teal-50 space-y-2">
                  <p className="text-sm font-semibold text-teal-800">What this portal offers — at no cost:</p>
                  <ul className="text-xs text-teal-700 space-y-1 list-none">
                    <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">✓</span> A personalized, step-by-step claim strategy based on your specific policy</li>
                    <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">✓</span> Educational guides to help you understand your benefits and coverage</li>
                    <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">✓</span> Checklists, timelines, and tools to keep you organized throughout the process</li>
                    <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">✓</span> A downloadable PDF strategy document you can share with family or providers</li>
                  </ul>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">
                  Our Terms of Use simply clarify that this portal is an educational resource — not
                  legal or insurance advice. We ask for your agreement so we can serve you with
                  complete transparency.
                </p>

                <p className="text-slate-700 text-sm font-medium">
                  We hope you will give us the chance to help. You are not alone in this.
                </p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFinalExit}
                  className="text-slate-500 gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visit scvisitingangels.com
                </Button>
                <Button
                  onClick={handleReturnToTerms}
                  className="text-white gap-1.5"
                  style={{ background: "linear-gradient(135deg, #1B4F8A, #3BBFBF)" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Accept &amp; Continue
                </Button>
              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
