import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck, BookOpen, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "ltc_terms_accepted_v1";

export function TermsGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === "true");
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setAccepted(true);
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
            {/* Key points */}
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
                className="mt-0.5"
              />
              <Label htmlFor="terms-accept" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                I have read and agree to the{" "}
                <Link href="/terms" className="text-teal-600 hover:underline font-medium" target="_blank">
                  Terms of Use & Disclaimer
                </Link>
                . I understand that this tool is for educational purposes only and does not constitute
                professional advice.
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "https://www.scvisitingangels.com"}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
