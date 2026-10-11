import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

type MilestoneKind =
  "claim_notice" | "claim_submitted" | "care_started" |
  "elimination_evidence_sent" | "first_payment_received";

const milestones: { kind: MilestoneKind; label: string }[] = [
  { kind: "claim_notice", label: "Claim notice given to carrier" },
  { kind: "claim_submitted", label: "Claim packet submitted" },
  { kind: "care_started", label: "Actual care began" },
  { kind: "elimination_evidence_sent", label: "Elimination evidence sent" },
  { kind: "first_payment_received", label: "First benefit payment received" },
];

const labelFor = (kind: string) => kind === "carrier_approval"
  ? "Carrier approval reported" : milestones.find(m => m.kind === kind)?.label || kind;

interface ClaimMilestonePanelProps {
  strategyId: number;
  policyId: number;
  variant: "approval" | "history";
}

export function ClaimMilestonePanel({ strategyId, policyId, variant }: ClaimMilestonePanelProps) {
  const utils = trpc.useUtils();
  const history = trpc.strategy.listClaimMilestones.useQuery({ strategyId }, { enabled: strategyId > 0 });
  const documents = trpc.documents.list.useQuery(undefined, { enabled: strategyId > 0 });
  const approval = trpc.strategy.recordCarrierApproval.useMutation();
  const record = trpc.strategy.recordActualMilestone.useMutation();

  const [open, setOpen] = useState(false);
  const [decisionDate, setDecisionDate] = useState("");
  const [reference, setReference] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [attested, setAttested] = useState(false);

  const [kind, setKind] = useState<MilestoneKind>("claim_notice");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [milestoneReference, setMilestoneReference] = useState("");
  const [milestoneEvidenceId, setMilestoneEvidenceId] = useState("");

  const available = useMemo(() => (documents.data || []).filter(doc =>
    doc.policyId === policyId &&
    (doc.strategyId === null || doc.strategyId === strategyId) &&
    ["application/pdf", "image/jpeg", "image/png"].includes(doc.mimeType || "")
  ), [documents.data, policyId, strategyId]);
  const evidenceRecorded = (history.data || []).some(item =>
    item.kind === "carrier_approval" && item.evidenceDocumentId !== null
  );
  const refresh = async () => {
    await Promise.all([
      utils.strategy.listClaimMilestones.invalidate({ strategyId }),
      utils.strategy.getMine.invalidate(),
      utils.documents.list.invalidate(),
    ]);
  };
  const saveApproval = async () => {
    if (!decisionDate || !reference.trim() || !evidenceId || !attested) {
      toast.error("Approval date, carrier reference, uploaded letter, and confirmation are required.");
      return;
    }
    try {
      await approval.mutateAsync({
        strategyId,
        effectiveDate: decisionDate,
        carrierReference: reference.trim(),
        evidenceDocumentId: Number(evidenceId),
        attestationConfirmed: true,
      });
      await refresh();
      setOpen(false);
      toast.success("Carrier decision evidence recorded and Stage 3 enabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the approval evidence.");
    }
  };
  const saveActualMilestone = async () => {
    if (!milestoneDate) { toast.error("Choose the actual milestone date."); return; }
    try {
      await record.mutateAsync({
        strategyId, kind, effectiveDate: milestoneDate,
        carrierReference: milestoneReference.trim() || undefined,
        evidenceDocumentId: milestoneEvidenceId ? Number(milestoneEvidenceId) : undefined,
      });
      await refresh();
      setMilestoneDate("");
      setMilestoneReference("");
      setMilestoneEvidenceId("");
      toast.success("Milestone added to the claim history.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record milestone.");
    }
  };

  const fileChoices = (placeholder: string) => (
    <>
      <option value="">{placeholder}</option>
      {available.map(doc =>
        <option key={doc.id} value={String(doc.id)}>{doc.fileName}</option>
      )}
    </>
  );

  if (variant === "approval") return (
    <>
      {evidenceRecorded ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
          <CheckCircle2 className="w-4 h-4" /> Approval evidence on file
        </span>
      ) : (
        <Button size="sm" type="button" onClick={() => setOpen(true)}
          className="h-9 gap-1.5 bg-teal-700 text-white hover:bg-teal-800">
          <FileText className="w-4 h-4" /> Record Carrier Approval
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record carrier approval evidence</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Enter details from the actual insurer decision. Completing the checklist does not establish approval.
            This is user-submitted documentation, not independent carrier verification.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="carrier-decision-date">Date shown on approval decision *</Label>
              <Input id="carrier-decision-date" type="date" value={decisionDate}
                onChange={e => setDecisionDate(e.target.value)} min="1900-01-01" max="2100-12-31"/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="carrier-decision-reference">Carrier claim / decision reference *</Label>
              <Input id="carrier-decision-reference" value={reference} maxLength={128}
                onChange={e => setReference(e.target.value)}
                placeholder="Reference number from decision letter"/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="carrier-decision-file">Previously uploaded decision letter *</Label>
              <select id="carrier-decision-file" value={evidenceId}
                onChange={e => setEvidenceId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                {fileChoices("Select a policy-linked PDF or image")}
              </select>
              <Link href="/documents" className="text-xs text-teal-700 underline underline-offset-2">
                Upload or manage supporting documents
              </Link>
              {available.length === 0 && <p className="text-xs text-amber-700">
                No eligible decision documents found. Upload a PDF or image linked to this policy first.
              </p>}
            </div>
            <label htmlFor="carrier-attestation" className="flex items-start gap-2 text-sm text-slate-700">
              <Checkbox id="carrier-attestation" checked={attested} onCheckedChange={v => setAttested(v === true)}/>
              <span>I confirm this uploaded document is the insurer's actual approval decision for this insured and policy.</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" disabled={approval.isPending || !decisionDate || !reference.trim() || !evidenceId || !attested}
                onClick={saveApproval}>{approval.isPending ? "Recording…" : "Record approval & enter Stage 3"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6" aria-label="Claim milestone audit history">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-teal-700"/>
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate-900">Claim milestone history</h3>
          <p className="text-xs text-slate-500">Append-only, user-reported event dates. Insurer confirmation must be documented separately.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(150px,1.3fr)_150px_minmax(130px,1fr)_auto]">
        <div className="space-y-1">
          <Label htmlFor="claim-milestone-kind">Event</Label>
          <select id="claim-milestone-kind" value={kind} onChange={e => setKind(e.target.value as MilestoneKind)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
            {milestones.map(m => <option key={m.kind} value={m.kind}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="claim-milestone-date">Actual date</Label>
          <Input id="claim-milestone-date" type="date" value={milestoneDate}
            onChange={e=>setMilestoneDate(e.target.value)} min="1900-01-01" max="2100-12-31"/>
        </div>
        <div className="space-y-1">
          <Label htmlFor="claim-milestone-reference">Reference (optional)</Label>
          <Input id="claim-milestone-reference" maxLength={128} value={milestoneReference}
            onChange={e=>setMilestoneReference(e.target.value)} placeholder="Carrier confirmation #"/>
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={saveActualMilestone} disabled={!milestoneDate || record.isPending}
            className="w-full gap-1.5">
            <Plus className="h-4 w-4"/>{record.isPending ? "Saving…" : "Add event"}
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="claim-milestone-evidence">Supporting document (optional)</Label>
        <select id="claim-milestone-evidence" value={milestoneEvidenceId}
          onChange={e=>setMilestoneEvidenceId(e.target.value)}
          className="mt-1 w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
          {fileChoices("No document selected")}
        </select>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-3">
        {history.isLoading ? <p className="text-sm text-slate-500">Loading claim history…</p> :
          history.isError ? <p className="text-sm text-red-700">Claim history is unavailable. No dates were inferred.</p> :
          history.data?.length ? (
            <ol className="max-h-64 space-y-2 overflow-y-auto" aria-label="Recorded claim milestones">
              {history.data.map(item => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2 text-sm">
                  <span className="font-medium text-slate-900">{labelFor(item.kind)}</span>
                  <span className="text-slate-600">{item.effectiveDate}</span>
                  {item.carrierReference && <span className="text-xs text-slate-500">Ref: {item.carrierReference}</span>}
                  <span className="text-[11px] text-slate-500">User-submitted · {item.evidenceDocumentId ? "File referenced" : "No document"}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">No claim milestones have been recorded.</p>}
        <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
          Enter actual events only. These records do not calculate payable benefits or prove carrier approval.
        </p>
      </div>
    </section>
  );
}
