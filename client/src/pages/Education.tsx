import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { LegalDisclaimerFooter } from "@/components/LegalDisclaimerFooter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Heart, FileSearch, ClipboardList, CheckCircle2,
  ChevronDown, ChevronUp, AlertCircle, Lightbulb, Info, Printer,
} from "lucide-react";

// ─── Shared sub-components ────────────────────────────────────────────────────

function ExpandableTerm({ term, children }: { term: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 font-semibold underline decoration-dotted underline-offset-2 cursor-pointer transition-colors duration-150"
        style={{ color: "#34B1C4" }}
        aria-expanded={open}
      >
        {term}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <span
          className="block mt-2 mb-1 text-sm leading-relaxed rounded px-3 py-2 border-l-4"
          style={{ background: "#f0fafb", borderColor: "#34B1C4", color: "#555", fontFamily: "'Open Sans', sans-serif" }}
        >
          {children}
        </span>
      )}
    </span>
  );
}

function TipBox({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
  const config = {
    tip:     { icon: Lightbulb,   bg: "#f0fafb", border: "#34B1C4", label: "Helpful Tip" },
    warning: { icon: AlertCircle, bg: "#fff8f0", border: "#e08030", label: "Watch Out" },
    info:    { icon: Info,        bg: "#EBF5FC", border: "#0692D7", label: "Good to Know" },
  }[type];
  const Icon = config.icon;
  return (
    <div
      className="flex gap-3 rounded p-4 my-4 text-sm leading-relaxed"
      style={{ background: config.bg, borderLeft: `4px solid ${config.border}`, fontFamily: "'Open Sans', sans-serif", color: "#555" }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.border }} />
      <div>
        <span className="font-bold block mb-1" style={{ color: "#454545", fontFamily: "'Roboto', sans-serif" }}>{config.label}</span>
        {children}
      </div>
    </div>
  );
}

function VAChecklist({ items }: { items: string[] }) {
  return (
    <ul className="va-checklist my-3">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function StageDivider() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div style={{ height: 2, width: 40, background: "#34B1C4" }} />
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34B1C4" }} />
      <div style={{ height: 2, flex: 1, background: "#F2F6FA" }} />
    </div>
  );
}

function Stage({
  id, number, icon: Icon, title, subtitle, children, bg = "#ffffff",
}: {
  id: string; number: number; icon: React.ElementType; title: string;
  subtitle: string; children: React.ReactNode; bg?: string;
}) {
  return (
    <section id={id} className="py-14 scroll-mt-28" style={{ background: bg }}>
      <div className="container max-w-3xl">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow"
            style={{ background: number % 2 === 0 ? "#0692D7" : "#34B1C4", fontFamily: "'Roboto', sans-serif" }}
          >
            {number}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: number % 2 === 0 ? "#0692D7" : "#34B1C4", fontFamily: "'Open Sans', sans-serif" }}>
              Stage {number}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>
              {title}
            </h2>
            <p className="text-sm mt-1" style={{ color: "#555", fontFamily: "'Open Sans', sans-serif" }}>{subtitle}</p>
          </div>
          <div className="hidden md:flex flex-shrink-0">
            <Icon className="w-10 h-10 opacity-20" style={{ color: number % 2 === 0 ? "#0692D7" : "#34B1C4" }} />
          </div>
        </div>
        <StageDivider />
        <div className="space-y-5 text-base leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: "#555" }}>
          {children}
        </div>
      </div>
    </section>
  );
}

// ─── Sticky stage nav ─────────────────────────────────────────────────────────

const STAGES = [
  { id: "stage-1", label: "Recognizing the Need" },
  { id: "stage-2", label: "Understanding Your Policy" },
  { id: "stage-3", label: "Filing the Claim" },
  { id: "stage-4", label: "After Claim Approval" },
];

function StickyStageNav({ active }: { active: string }) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="sticky top-0 z-30 shadow-sm border-b print:hidden" style={{ background: "#ffffff", borderColor: "#e0dcdc" }}>
      <div className="container overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap"
              style={{
                fontFamily: "'Roboto', sans-serif",
                color: active === s.id ? (i % 2 === 0 ? "#34B1C4" : "#0692D7") : "#555",
                borderBottomColor: active === s.id ? (i % 2 === 0 ? "#34B1C4" : "#0692D7") : "transparent",
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: active === s.id ? (i % 2 === 0 ? "#34B1C4" : "#0692D7") : "#aaa", fontSize: "10px" }}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Education() {
  const [activeStage, setActiveStage] = useState("stage-1");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveStage(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    STAGES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>LTC Insurance Education Center — Free Guides & Resources | SC Visiting Angels</title>
        <meta name="description" content="Understand the LTC insurance journey in four stages: recognizing the need for care, understanding your policy, filing the claim, and what happens after approval. Free guides from SC Visiting Angels." />
        <meta property="og:title" content="LTC Insurance Education Center — Free Guides & Resources" />
        <meta property="og:description" content="Free education on long-term care insurance: understand your policy, benefits, ADLs, elimination periods, and how to file a claim." />
        <meta property="og:image" content="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/og-education-5pEx3gNnpSRGB9hKqZu9Pb.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LTC Insurance Education Center — Free Guides & Resources" />
        <meta name="twitter:description" content="Free education on long-term care insurance: understand your policy, benefits, ADLs, elimination periods, and how to file a claim." />
        <meta name="twitter:image" content="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/og-education-5pEx3gNnpSRGB9hKqZu9Pb.png" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/lSMqOjgOjuvfRlJs.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(57,63,67,0.92) 0%, rgba(57,63,67,0.75) 60%, rgba(57,63,67,0.5) 100%)" }} />
        </div>
        <div className="container relative py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#34B1C4", fontFamily: "'Open Sans', sans-serif" }}>
              Your Journey, Step by Step
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>
              Understanding LTC Insurance
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              Long-term care insurance can feel overwhelming. This guide walks you through the real experience — from the moment you realize a loved one needs help, all the way through what happens after your claim is approved — so you know exactly what to expect at every step.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {STAGES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { const el = document.getElementById(s.id); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all duration-200 hover:opacity-90"
                  style={{ background: i === 0 ? "#34B1C4" : "rgba(255,255,255,0.15)", color: "#fff", fontFamily: "'Roboto', sans-serif", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors duration-150 print:hidden"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <Printer className="w-4 h-4" />
              Print this guide
            </button>
          </div>
        </div>
      </section>

      {/* ── Sticky stage nav ── */}
      <StickyStageNav active={activeStage} />

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 1 — Recognizing the Need
      ══════════════════════════════════════════════════════════════════════ */}
      <Stage
        id="stage-1"
        number={1}
        icon={Heart}
        title="Recognizing the Need for Care"
        subtitle="Something has changed. Your loved one needs more help than the family can provide alone."
        bg="#ffffff"
      >
        <p>
          It often starts quietly. Mom is having trouble getting dressed in the morning. Dad fell last week and can't manage the stairs safely. A diagnosis — Parkinson's, Alzheimer's, a stroke — has shifted what daily life looks like. This moment, when you realize professional care is needed, is also the moment your LTC insurance policy becomes relevant.
        </p>

        <p>
          Long-term care insurance was designed for exactly this situation. It helps pay for professional in-home care, assisted living, or memory care when a person can no longer perform certain basic daily activities on their own. These activities are called{" "}
          <ExpandableTerm term="Activities of Daily Living (ADLs)">
            ADLs are the six fundamental self-care tasks that insurance companies use to measure the need for care: <strong>Bathing, Dressing, Eating, Toileting, Transferring</strong> (moving from bed to chair), and <strong>Continence</strong>. Most LTC policies require that a person be unable to perform at least 2 of these 6 ADLs without substantial assistance before benefits can begin.
          </ExpandableTerm>.
        </p>

        <TipBox type="info">
          You do not need to wait for a crisis to start the process. If your loved one is struggling with two or more ADLs — even with some assistance — it is worth pulling out the policy and beginning to understand what it covers.
        </TipBox>

        <p>
          In addition to ADL deficits, many policies also cover care triggered by a{" "}
          <ExpandableTerm term="Cognitive Impairment">
            A cognitive impairment trigger (such as Alzheimer's disease or dementia) is a separate pathway to benefits that does not require ADL deficits. If a licensed healthcare practitioner certifies that the insured has a severe cognitive impairment requiring substantial supervision, benefits may begin regardless of ADL status.
          </ExpandableTerm>{" "}
          such as Alzheimer's disease or dementia. If a doctor has documented a diagnosis, that documentation will be important throughout the claims process.
        </p>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>What to do right now</h3>
        <VAChecklist items={[
          "Locate the original LTC insurance policy document",
          "Note the insurance company name, policy number, and customer service phone number",
          "Write down which ADLs your loved one is currently struggling with",
          "Ask the primary care physician to document the care needs in writing",
          "Contact the insurance company to request a claims packet — this does not commit you to filing",
        ]} />

        <TipBox type="tip">
          Calling the insurance company to request a claims packet is a low-stakes first step. It starts the clock on their response time and gives you the exact forms you will need, without triggering a formal claim yet.
        </TipBox>
      </Stage>

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 2 — Understanding Your Policy
      ══════════════════════════════════════════════════════════════════════ */}
      <Stage
        id="stage-2"
        number={2}
        icon={FileSearch}
        title="Understanding Your Policy"
        subtitle="Before you file anything, you need to know exactly what your policy covers — and what it doesn't."
        bg="#F2F6FA"
      >
        <p>
          LTC insurance policies were written years — sometimes decades — ago, and they can be dense. But there are a handful of key numbers and terms that determine almost everything about how your claim will work. Taking an hour to understand these now will save weeks of confusion later.
        </p>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>The numbers that matter most</h3>

        <p>
          Your policy has a{" "}
          <ExpandableTerm term="Daily Maximum Benefit">
            The Daily Maximum is the most the insurance company will pay per day for covered care. For example, if your Daily Maximum is $250 and your care costs $300/day, you pay the $50 difference. Some policies express this as a monthly maximum instead — divide by 30 to get the daily equivalent.
          </ExpandableTerm>{" "}
          — the most it will pay per day for covered care. There is also a{" "}
          <ExpandableTerm term="Lifetime Maximum (Benefit Pool)">
            The Lifetime Maximum (also called the Benefit Pool or Lifetime Benefit Amount) is the total dollar amount the policy will ever pay out. Once this pool is exhausted, no further benefits are available. A policy with a $250/day benefit and a 4-year benefit period has a Lifetime Maximum of roughly $365,000.
          </ExpandableTerm>{" "}
          — the total amount the policy will ever pay. These two numbers together define the financial ceiling of your coverage.
        </p>

        <p>
          Before benefits begin, most policies require you to satisfy an{" "}
          <ExpandableTerm term="Elimination Period">
            The Elimination Period is the number of qualifying care days you must pay for out-of-pocket before insurance benefits kick in. It works like a deductible measured in days, not dollars. A 90-day elimination period means you pay for the first 90 days of qualifying care yourself. Important: days are counted only when qualifying care is actually received — not calendar days. Weekends and days without care do not count.
          </ExpandableTerm>.{" "}
          This is like a deductible measured in days. A 90-day elimination period is common — meaning you pay for the first 90 qualifying care days yourself before the insurance begins paying.
        </p>

        <TipBox type="warning">
          The elimination period counts <em>qualifying care days</em>, not calendar days. If your loved one receives care 5 days per week, a 90-day elimination period takes about 18 weeks (4.5 months) to satisfy — not 3 months. Keep meticulous records of every care day from day one.
        </TipBox>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>What type of care is covered?</h3>
        <p>
          Most modern LTC policies cover{" "}
          <ExpandableTerm term="Home Health Care">
            Home health care means professional care provided in the insured's own home by a licensed or certified caregiver. This includes personal care aides (PCAs), certified nursing assistants (CNAs), home health aides, and licensed nurses. The care provider must typically be a licensed home care agency — not a private individual — for the costs to be reimbursable.
          </ExpandableTerm>,{" "}
          assisted living, adult day care, and nursing home care. Check your policy's "covered services" section carefully. Some older policies only cover nursing home care, which would not apply to in-home care situations.
        </p>

        <p>
          Two features that significantly affect the value of your policy are the{" "}
          <ExpandableTerm term="Inflation Rider">
            An inflation rider automatically increases your benefit amounts each year to help keep pace with rising care costs. A 3% compound inflation rider on a $200/day benefit in 2005 would be worth about $350/day today. Check your policy for the specific percentage and whether it compounds (grows on the growing amount) or is simple (grows on the original amount only).
          </ExpandableTerm>{" "}
          and the{" "}
          <ExpandableTerm term="Waiver of Premium">
            The waiver of premium benefit suspends your monthly premium payments once you are actively receiving benefits under the policy. This means you stop paying into the policy at the exact moment you start drawing from it. Not all policies include this feature — check your policy's riders section. Contact your carrier to confirm when the waiver activates.
          </ExpandableTerm>.{" "}
          If your policy has these, they can meaningfully extend how far your benefits go.
        </p>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>What to gather before moving forward</h3>
        <VAChecklist items={[
          "Daily Maximum Benefit (or Monthly Maximum)",
          "Lifetime Maximum (total benefit pool in dollars)",
          "Elimination Period (number of qualifying days)",
          "Covered care settings (home care, assisted living, nursing home)",
          "Inflation rider percentage (if any)",
          "Waiver of premium provision (yes/no)",
          "List of qualifying ADLs per your specific policy",
          "Insurance company claims department phone number and fax number",
        ]} />

        <TipBox type="tip">
          Use the LTC Insurance Navigator's Policy Intake Form to enter all of these details in one place. The system will use them to generate your personalized strategy — including exactly how many days your elimination period will take and how long your benefit pool will last at your current care costs.
        </TipBox>
      </Stage>

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 3 — Filing the Claim
      ══════════════════════════════════════════════════════════════════════ */}
      <Stage
        id="stage-3"
        number={3}
        icon={ClipboardList}
        title="Filing the Claim"
        subtitle="This is where most families feel overwhelmed. A clear process makes all the difference."
        bg="#ffffff"
      >
        <p>
          Filing an LTC insurance claim is not like filing a car insurance claim. It involves multiple parties, specific documentation requirements, and a formal assessment process. Understanding the sequence of events before you begin will help you move through it with confidence.
        </p>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Step 1 — Request the claims packet</h3>
        <p>
          Call the insurance company's claims department and ask them to send a{" "}
          <ExpandableTerm term="Claims Packet">
            The claims packet is the set of forms the insurance company requires you to complete to initiate a claim. It typically includes: (1) a Claimant Statement completed by the insured or their representative, (2) an Attending Physician Statement completed by the primary care doctor, and (3) sometimes a functional assessment form. Completing these accurately and completely is critical — incomplete packets are the most common cause of delays.
          </ExpandableTerm>.{" "}
          This packet contains all the forms you need. When you call, ask them to assign you a{" "}
          <ExpandableTerm term="Pre-Claim Number">
            A pre-claim number is a reference number assigned when you first contact the insurance company about a potential claim, before formal approval. It becomes your official claim number once the claim is approved. Always reference this number in all correspondence and keep a record of every phone call (date, time, representative's name, and what was discussed).
          </ExpandableTerm>{" "}
          so all future communications are tracked under one reference.
        </p>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Step 2 — Complete the packet carefully</h3>
        <p>
          The Attending Physician Statement is the most important document in the packet. It must clearly document the specific ADL deficits and — if applicable — the cognitive impairment diagnosis. Vague language like "patient needs assistance" is not sufficient. The physician should state specifically which ADLs the patient cannot perform and why.
        </p>

        <TipBox type="warning">
          Do not submit an incomplete packet. Insurance companies are permitted to deny claims for incomplete documentation. Gather every required document before submitting anything, and send everything together in a single package with a cover letter listing all enclosed items.
        </TipBox>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Step 3 — The third-party assessment</h3>
        <p>
          After receiving your completed packet, the insurance company will schedule a{" "}
          <ExpandableTerm term="Third-Party Assessment">
            A third-party assessment is an in-person evaluation conducted by an independent registered nurse (RN) or assessor hired by the insurance company. The assessor visits the insured at home and evaluates their functional abilities — specifically their ADL deficits. The assessor looks for consistency between what the medical records say and what they observe in person. This assessment is a critical gate in the claims process.
          </ExpandableTerm>.{" "}
          An independent RN will visit your loved one at home to evaluate their functional abilities. This is not an adversarial process, but it is important to be prepared.
        </p>

        <VAChecklist items={[
          "Have the insured demonstrate their actual limitations — do not minimize or compensate for the assessor",
          "Ensure the home environment reflects the real care needs (mobility aids, grab bars, etc. should be visible)",
          "Have a family member or care coordinator present to answer questions",
          "Provide the assessor with a copy of the physician's statement",
          "Ask the assessor for their name and contact information before they leave",
        ]} />

        <TipBox type="tip">
          The assessor is looking for consistency. If the physician's notes say the patient cannot dress independently but the patient dresses themselves during the visit to "look presentable," the assessor may note an inconsistency. On assessment day, the insured should present as they normally are — not at their best.
        </TipBox>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Step 4 — Approval and the Case Manager</h3>
        <p>
          Once the claim is approved, the insurance company will assign a{" "}
          <ExpandableTerm term="Case Manager">
            A case manager is a representative assigned by the insurance company to manage your ongoing claim. They determine the approved number of care hours, review the care plan, and serve as your primary contact for all claim-related questions. Case managers conduct periodic reviews — typically every 90 to 180 days — to reassess the care needs and confirm continued eligibility.
          </ExpandableTerm>.{" "}
          This person will determine the approved hours of care and become your main point of contact. Build a professional relationship with them — they have significant influence over your claim.
        </p>

        <p>
          At this point, you may also want to set up{" "}
          <ExpandableTerm term="Assignment of Benefits (AOB)">
            Assignment of Benefits (AOB) is an arrangement where the insurance company pays the care provider directly, instead of reimbursing you after you pay the provider. With AOB in place, the care agency submits invoices directly to the insurance company and receives payment directly. This eliminates the need for the family to front the cost of care each month. Not all policies or carriers support AOB — ask your case manager.
          </ExpandableTerm>{" "}
          so the insurance company pays your care provider directly, eliminating the need to front the cost of care each month.
        </p>
      </Stage>

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE 4 — After Claim Approval
      ══════════════════════════════════════════════════════════════════════ */}
      <Stage
        id="stage-4"
        number={4}
        icon={CheckCircle2}
        title="After Claim Approval"
        subtitle="Benefits are flowing. Now the focus shifts to maintaining them and making the most of what you have."
        bg="#F2F6FA"
      >
        <p>
          Once the claim is approved and care begins, many families feel a wave of relief — and then quickly realize there is ongoing administrative work required to keep the benefits flowing. This stage is about maintaining compliance, tracking your benefit usage, and planning ahead.
        </p>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Documenting care every day</h3>
        <p>
          Most insurance companies require ongoing{" "}
          <ExpandableTerm term="Care Logs">
            Care logs (also called service logs or log sheets) are daily records of the care services provided. They typically include: date, caregiver name, start and end time, and a description of services rendered (bathing, dressing, meal preparation, etc.). These logs are submitted with monthly invoices and are audited by the insurance company. Missing or incomplete logs are the most common reason for delayed or denied reimbursements after approval.
          </ExpandableTerm>{" "}
          — daily records of every care visit. These logs are submitted monthly with invoices and are audited by the insurance company. A missing log sheet can delay your entire month's reimbursement.
        </p>

        <VAChecklist items={[
          "Ensure every care visit is logged with date, caregiver name, start/end time, and services provided",
          "Have the caregiver sign the log sheet after each visit",
          "Submit logs and invoices together on the same day each month",
          "Keep copies of everything you submit — both logs and invoices",
          "Track the running total of your benefit pool usage",
        ]} />

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Submitting invoices correctly</h3>
        <p>
          Invoices must meet specific requirements to be reimbursable. A proper invoice includes the care agency's name and license number, the insured's name and claim number, the date of service, the type of service, the number of hours, and the hourly rate. Some carriers have specific invoice templates — ask your case manager if there is a preferred format.
        </p>

        <TipBox type="warning">
          Delays in submitting invoices can delay reimbursement by an entire billing cycle. Set a recurring calendar reminder on the same day each month to submit logs and invoices together.
        </TipBox>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Staying ahead of your benefit pool</h3>
        <p>
          Your benefit pool is finite. As care costs accumulate, the pool shrinks. If your policy has an{" "}
          <ExpandableTerm term="Inflation Rider">
            An inflation rider automatically increases your daily benefit amount each year. A 3% compound rider on a $250/day benefit grows to roughly $280/day after 4 years. This growth also increases the effective size of your benefit pool over time, helping offset rising care costs.
          </ExpandableTerm>,{" "}
          your daily benefit grows each year — which helps offset rising care costs and extends the life of your pool. Use the Care Calculator on the Strategy page to project exactly how long your benefits will last at your current care level.
        </p>

        <p>
          If your care needs increase significantly, contact your case manager to request a reassessment. If a claim is ever denied or benefits are reduced, you have the right to{" "}
          <ExpandableTerm term="Appeal">
            The appeals process allows you to formally challenge a claim denial or benefit reduction. An appeal typically requires: a written appeal letter, additional medical documentation supporting the care need, and sometimes an independent medical examination. Most carriers have a 60–180 day window to file an appeal after a denial. If the internal appeal is unsuccessful, you can escalate to your state's Department of Insurance.
          </ExpandableTerm>{" "}
          the decision. Most carriers have a formal appeals process and a defined window — typically 60 to 180 days — to file.
        </p>

        <TipBox type="info">
          SC Visiting Angels works with families throughout this entire process — from understanding your policy to managing ongoing documentation. If you are feeling overwhelmed at any stage, reach out. We have guided many families through exactly this journey.
        </TipBox>

        <h3 className="text-lg font-bold mt-6 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#454545" }}>Planning for the long term</h3>
        <VAChecklist items={[
          "Review your benefit pool balance quarterly",
          "Reassess care needs with the case manager at each periodic review",
          "Explore whether additional care settings (adult day care, respite care) could extend your benefit pool",
          "Keep all policy documents, correspondence, and care logs in a single organized binder or digital folder",
          "If benefits are approaching exhaustion, begin exploring supplemental options early — not at the last minute",
        ]} />
      </Stage>

      {/* ── CTA ── */}
      <section className="py-14 text-white" style={{ background: "#393F43" }}>
        <div className="container text-center max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div style={{ height: 2, width: 40, background: "#34B1C4" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34B1C4" }} />
            <div style={{ height: 2, width: 40, background: "#34B1C4" }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>
            Ready to Create Your Strategy?
          </h2>
          <p className="text-lg text-white/80 mb-8 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Now that you understand the journey, complete the Policy Intake Form to generate your personalized, step-by-step action plan — tailored to your exact policy and care situation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{ background: "#34B1C4", color: "#fff", fontFamily: "'Roboto', sans-serif" }}>
              <Link href="/policy-form">
                Complete the Policy Form <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 font-semibold border-white/40 text-white hover:bg-white/10 bg-transparent transition-all duration-200 hover:-translate-y-0.5" style={{ fontFamily: "'Roboto', sans-serif" }}>
              <Link href="/contact">Talk to Someone</Link>
            </Button>
          </div>
        </div>
      </section>

      <AboutHomeCare />
      <LegalDisclaimerFooter />
    </Layout>
  );
}
