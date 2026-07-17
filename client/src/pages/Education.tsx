import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Heart, FileSearch, ClipboardList, CheckCircle2,
  ChevronDown, ChevronUp, AlertCircle, Lightbulb, Info, Printer,
  BookOpen, HelpCircle, Send, PhoneCall, ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Terms & FAQ Data ─────────────────────────────────────────────────────────

const TERM_STAGES = [
  {
    label: "Recognizing the Need",
    terms: [
      { term: "Activities of Daily Living (ADLs)", definition: "The six basic self-care tasks used by insurance companies to determine care need: bathing, dressing, eating, transferring (moving from bed to chair), toileting, and continence. Most LTC policies require inability to perform at least 2 ADLs to qualify for benefits.", applies: "Your loved one must demonstrate inability to perform the required number of ADLs to trigger your policy's benefit eligibility." },
      { term: "Cognitive Impairment", definition: "A deterioration or loss of intellectual capacity that requires substantial supervision for safety. Alzheimer's disease, dementia, and other neurological conditions typically qualify. This is an alternative trigger to ADL deficits in most policies.", applies: "If ADL deficits are not present but cognitive impairment is, your policy may still pay benefits — check your specific trigger language." },
      { term: "Benefit Trigger", definition: "The specific condition(s) that must be met before your policy begins paying benefits. Most policies use ADL deficits (typically 2 of 6) and/or cognitive impairment as triggers.", applies: "Understanding your policy's exact trigger language is the first step before initiating a claim." },
      { term: "Elimination Period", definition: "A waiting period — similar to a deductible — during which you pay for care out-of-pocket before insurance benefits begin. Common periods are 30, 60, 90, or 100 days. The clock starts when you begin receiving qualifying care.", applies: "You must pay for care during this period. Plan your finances accordingly before benefits kick in." },
    ],
  },
  {
    label: "Understanding Your Policy",
    terms: [
      { term: "Daily Benefit Amount", definition: "The maximum dollar amount your policy will pay per day for qualifying care. For example, $200/day means the policy pays up to $200 for each day of care, regardless of actual cost.", applies: "If your care costs exceed your daily benefit, you pay the difference. If costs are lower, you only receive the actual cost." },
      { term: "Benefit Pool", definition: "The total lifetime maximum your policy will pay, calculated as Daily Benefit × Benefit Period. A $200/day policy with a 3-year benefit period has a pool of approximately $219,000.", applies: "Track your pool balance carefully — once exhausted, benefits end permanently." },
      { term: "Inflation Rider", definition: "An optional policy feature that automatically increases your daily benefit amount each year, typically by 3–5% simple or compound. Compound riders grow significantly faster over time.", applies: "If your policy has this rider, your effective daily benefit today may be higher than the original amount purchased." },
      { term: "Indemnity vs. Reimbursement", definition: "Indemnity policies pay the full daily benefit regardless of actual care costs. Reimbursement policies pay only actual documented care costs up to the daily maximum.", applies: "Knowing your policy type determines how you document and submit care costs for reimbursement." },
      { term: "Waiver of Premium", definition: "A provision that suspends your premium payments once you begin receiving benefits. You continue to be covered without paying premiums during the claim period.", applies: "Stop paying premiums once your claim is approved — contact your carrier immediately to activate this provision." },
    ],
  },
  {
    label: "Filing the Claim",
    terms: [
      { term: "Claims Packet", definition: "The set of forms required to initiate a claim, typically including a Claimant Statement, Attending Physician Statement, and functional assessment form. Incomplete packets are the most common cause of claim delays.", applies: "Gather all required documents before submitting anything. Send everything together with a cover letter listing all enclosed items." },
      { term: "Third-Party Assessment", definition: "An in-person evaluation by an independent registered nurse hired by the insurance company to verify ADL deficits. The assessor looks for consistency between medical records and observed functional ability.", applies: "On assessment day, the insured should present as they normally are — not at their best. Minimizing limitations can result in claim denial." },
      { term: "Case Manager", definition: "A representative assigned by the insurance company to manage your ongoing claim, determine approved care hours, and serve as your primary contact.", applies: "Build a professional relationship with your case manager — they have significant influence over your approved care level." },
      { term: "Assignment of Benefits (AOB)", definition: "An arrangement where the insurance company pays the care provider directly, eliminating the need for the family to front care costs each month.", applies: "Ask your case manager about AOB at approval — it simplifies billing significantly for ongoing home care." },
    ],
  },
  {
    label: "After Claim Approval",
    terms: [
      { term: "Care Logs", definition: "Daily records of every care visit, including date, caregiver name, start/end time, and services provided. Required by most carriers for monthly reimbursement.", applies: "Missing or incomplete care logs are the most common reason for delayed or denied reimbursements after approval." },
      { term: "Periodic Review", definition: "A reassessment conducted by the case manager every 90–180 days to confirm continued eligibility and review the care plan.", applies: "Be prepared to demonstrate ongoing care needs at each review. Significant improvement could affect benefit continuation." },
      { term: "Appeals Process", definition: "A formal process to challenge a claim denial or benefit reduction. Typically requires a written appeal letter, additional medical documentation, and sometimes an independent medical examination.", applies: "Most carriers have a 60–180 day window to file an appeal. Act quickly if benefits are denied or reduced." },
      { term: "Benefit Pool Exhaustion", definition: "When the total lifetime maximum has been paid out and no further benefits are available under the policy.", applies: "Track your running balance carefully. When approaching exhaustion, begin exploring supplemental options — not at the last minute." },
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  { q: "How do I know if my loved one qualifies for LTC insurance benefits?", a: "Most policies require that your loved one cannot perform at least 2 of 6 Activities of Daily Living (ADLs) — bathing, dressing, eating, transferring, toileting, and continence — OR has a cognitive impairment like Alzheimer's or dementia. Review your specific policy's 'benefit trigger' language, as the exact number of ADLs required can vary." },
  { q: "How long does the claims process take?", a: "From initial contact to first benefit payment typically takes 4–8 weeks. The elimination period (usually 30–90 days) must also be satisfied before benefits begin. The most common delays are incomplete claims packets and scheduling the third-party assessment." },
  { q: "Can I use any home care agency, or does it have to be a specific one?", a: "Most policies allow any licensed home care agency. Some policies require a 'licensed care provider' — which typically means a state-licensed home care agency. SC Visiting Angels is fully licensed and works with all major LTC insurance carriers." },
  { q: "What is the elimination period and when does it start?", a: "The elimination period is a waiting period — like a deductible — during which you pay for care out-of-pocket before benefits begin. It starts on the first day you receive qualifying care. A 90-day elimination period means you pay for the first 90 days of care yourself." },
  { q: "What happens if the insurance company denies the claim?", a: "You have the right to appeal. Most carriers have a formal appeals process with a 60–180 day filing window. An appeal typically requires a written appeal letter, additional medical documentation, and sometimes an independent medical examination. If the internal appeal fails, you can escalate to your state's Department of Insurance." },
  { q: "Does SC Visiting Angels help with the paperwork?", a: "Yes. We have guided many families through the entire LTC claims process — from understanding your policy to completing the claims packet, preparing for the third-party assessment, and managing ongoing care logs and invoices. This is a free service we provide to the families we serve." },
  { q: "What if care costs more than my daily benefit amount?", a: "You pay the difference out-of-pocket. For example, if your daily benefit is $200 and care costs $250/day, you pay $50/day. Some families supplement with personal savings, family contributions, or other resources. The LTC Navigator strategy tool will show you exactly how to manage this gap." },
  { q: "Can I use LTC insurance benefits for a family member who provides care?", a: "Generally, no. Most policies require care to be provided by a licensed professional caregiver or home care agency, not a family member. Some policies have 'informal care' provisions — check your specific policy language." },
];

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
    <section id={id} className="py-section scroll-mt-28" style={{ background: bg }}>
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
  const [activeTermStage, setActiveTermStage] = useState(0);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState({ name: "", email: "", question: "" });
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const sendQuestion = trpc.email.sendContactForm.useMutation({
    onSuccess: () => { setQuestionSubmitted(true); setQuestionForm({ name: "", email: "", question: "" }); },
    onError: () => toast.error("Could not send your question. Please try again."),
  });

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

      {/* ── Print-only header (hidden on screen) ── */}
      <div className="hidden print:block" style={{ borderBottom: '3px solid #34B1C4', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/manus-storage/Dove-Trans_bbc93e8e.gif" alt="SC Visiting Angels" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#34B1C4', fontFamily: "'Roboto', sans-serif" }}>SC Visiting Angels</div>
              <div style={{ fontSize: '11px', color: '#555', fontFamily: "'Open Sans', sans-serif" }}>LTC Insurance Education Guide</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#555', fontFamily: "'Open Sans', sans-serif", lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', color: '#34B1C4' }}>(864) 244-6300</div>
            <div>www.scvisitingangels.com</div>
            <div>Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#333', fontFamily: "'Open Sans', sans-serif" }}>
          <strong>Understanding LTC Insurance</strong> — A free guide from SC Visiting Angels, Upstate South Carolina
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative text-white overflow-hidden print:hidden">
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
              <span style={{ color: '#34B1C4' }}>Understanding</span> LTC Insurance
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              Long-term care insurance can feel overwhelming. This guide walks you through the real experience — from the moment you realize a loved one needs help, all the way through what happens after your claim is approved — so you know exactly what to expect at every step.
            </p>
            {/* Video Player */}
            <div className="relative mb-8 rounded-lg overflow-hidden shadow-lg" style={{ background: "rgba(0,0,0,0.3)", aspectRatio: "16/9" }}>
              <video
                controls
                className="w-full h-full object-cover"
                style={{ background: "#000" }}
              >
                <source src="/manus-storage/education-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
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

      {/* ── Sticky stage nav (hidden on print) ── */}
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

      {/* ── Mid-Journey CTA ── */}
      <section
        id="mid-cta"
        className="relative py-16 md:py-20 text-white overflow-hidden print:hidden"
        style={{ background: "linear-gradient(135deg, #34B1C4 0%, #0692D7 100%)" }}
      >
        {/* subtle wave pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)", backgroundSize: "60px 60px, 80px 80px, 50px 50px" }} />
        <div className="container relative text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(255,255,255,0.2)", fontFamily: "'Open Sans', sans-serif" }}>
            ✨ You've learned Stages 1 &amp; 2
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>
            Ready to Create Your Personalized Strategy?
          </h2>
          <p className="text-white/85 text-lg mb-8 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            You now understand your policy and what triggers a claim. Your personalized strategy is just a few questions away — and it's completely free.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => window.location.href = '/policy-form'}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-base font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "#fff", color: "#0692D7", fontFamily: "'Roboto', sans-serif" }}
            >
              Yes, I'm Ready! <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { const el = document.getElementById('stage-3'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-base font-semibold border-2 border-white/60 transition-all duration-200 hover:bg-white/10"
              style={{ color: "#fff", fontFamily: "'Roboto', sans-serif" }}
            >
              No, I Want to Learn More
            </button>
          </div>
        </div>
      </section>

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

      {/* ── Academy Teaser CTA ── */}
      <section className="py-section" style={{ background: "linear-gradient(135deg, #E8F4F8 0%, #F0FAFB 100%)" }}>
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: "rgba(52,177,196,0.2)", color: "#34B1C4", fontFamily: "'Open Sans', sans-serif" }}>
            🎓 Learn Through Video
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: "#393F43" }}>
            Deepen Your Knowledge with the <span style={{ color: "#34B1C4" }}>LTC Academy</span>
          </h2>
          <p className="text-lg mb-8 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: "#555" }}>
            Ready to go deeper? Our LTC Academy features expert-led video lessons that walk you through every stage of the long-term care insurance journey. Learn at your own pace with downloadable guides, checklists, and resources.
          </p>
          <Button asChild size="lg" className="text-base px-8 font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{ background: "#34B1C4", color: "#fff", fontFamily: "'Roboto', sans-serif" }}>
            <Link href="/academy">
              Explore the LTC Academy <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-section text-white" style={{ background: "#393F43" }}>
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

      {/* ── Terms & Definitions ── */}
      <section id="terms" className="py-section" style={{ background: "#ffffff" }}>
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: "#e8f7f9", color: "#34B1C4", fontFamily: "'Open Sans', sans-serif" }}>
              <BookOpen className="w-3.5 h-3.5" /> LTC Insurance Glossary
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: "#393F43" }}>Terms &amp; Definitions</h2>
            <p className="text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif" }}>Click a stage tab, then click any term to see its definition and how it applies to your claim.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Stage tabs */}
            <div className="md:w-56 flex-shrink-0">
              <div className="flex md:flex-col gap-2">
                {TERM_STAGES.map((ts, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveTermStage(i); setActiveTerm(null); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-left transition-all duration-200"
                    style={{
                      background: activeTermStage === i ? (i % 2 === 0 ? "#34B1C4" : "#0692D7") : "#F2F6FA",
                      color: activeTermStage === i ? "#fff" : "#555",
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: activeTermStage === i ? "rgba(255,255,255,0.3)" : "#ddd", color: activeTermStage === i ? "#fff" : "#555" }}>{i + 1}</span>
                    {ts.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Terms list + definition */}
            <div className="flex-1 rounded-xl border overflow-hidden" style={{ borderColor: "#e0dcdc" }}>
              <div className="divide-y divide-gray-100">
                {TERM_STAGES[activeTermStage].terms.map((t) => (
                  <div key={t.term}>
                    <button
                      onClick={() => setActiveTerm(activeTerm === t.term ? null : t.term)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left text-sm font-semibold transition-colors duration-150 hover:bg-blue-50"
                      style={{ fontFamily: "'Roboto', sans-serif", color: "#393F43" }}
                    >
                      <span>{t.term}</span>
                      {activeTerm === t.term ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {activeTerm === t.term && (
                      <div className="px-5 pb-4 pt-1">
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>{t.definition}</p>
                        <p className="text-xs font-semibold rounded px-3 py-2" style={{ background: "#f0fafb", color: "#34B1C4", borderLeft: "3px solid #34B1C4", fontFamily: "'Open Sans', sans-serif" }}>📋 How this applies: {t.applies}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating-balls CTA ── */}
      <section className="relative py-section overflow-hidden print:hidden" style={{ background: "#0692D7" }}>
        {/* floating semi-transparent balls */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            width: `${60 + i * 25}px`, height: `${60 + i * 25}px`,
            background: "rgba(255,255,255,0.08)",
            top: `${[10,60,20,70,5,55,35,80][i]}%`,
            left: `${[5,15,70,80,45,90,30,60][i]}%`,
            transform: "translate(-50%,-50%)",
          }} />
        ))}
        <div className="container relative text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>Feeling Comfortable to Move Forward?</h2>
          <p className="text-white/85 text-lg mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>You've read the journey and learned the terms. Your personalized strategy is ready to be built — it only takes a few minutes.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => window.location.href = '/policy-form'}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-base font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "#fff", color: "#0692D7", fontFamily: "'Roboto', sans-serif" }}
            >Yes, Let's Build My Strategy! <ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => { const el = document.getElementById('faq'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-base font-semibold border-2 border-white/60 transition-all duration-200 hover:bg-white/10"
              style={{ color: "#fff", fontFamily: "'Roboto', sans-serif" }}
            >I Have More Questions</button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-section" style={{ background: "#F2F6FA" }}>
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: "#e8f7f9", color: "#34B1C4", fontFamily: "'Open Sans', sans-serif" }}>
              <HelpCircle className="w-3.5 h-3.5" /> Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: "#393F43" }}>Frequently Asked Questions</h2>
            <p className="text-gray-500" style={{ fontFamily: "'Open Sans', sans-serif" }}>Real questions from families navigating the LTC insurance journey.</p>
          </div>
          <div className="space-y-3 mb-12">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#e0dcdc" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm transition-colors duration-150 hover:bg-blue-50"
                  style={{ fontFamily: "'Roboto', sans-serif", color: "#393F43" }}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-1 text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
          {/* Question submission form */}
          <div className="rounded-2xl border p-6 bg-white" style={{ borderColor: "#34B1C4", borderWidth: 2 }}>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#393F43" }}>Have a Question Not Answered Above?</h3>
            <p className="text-sm text-gray-500 mb-5" style={{ fontFamily: "'Open Sans', sans-serif" }}>Submit your question and we'll get back to you personally — and may add it to our FAQ to help other families.</p>
            {questionSubmitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#e8f7f9" }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: "#34B1C4" }} />
                </div>
                <p className="font-semibold text-gray-700" style={{ fontFamily: "'Roboto', sans-serif" }}>Thank you! We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (!questionForm.name || !questionForm.email || !questionForm.question) { toast.error("Please fill in all fields"); return; } sendQuestion.mutate({ name: questionForm.name, email: questionForm.email, phone: "", subject: "FAQ Question from Education Page", message: questionForm.question }); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>Your Name *</label>
                    <input value={questionForm.name} onChange={e => setQuestionForm(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "#e0dcdc", fontFamily: "'Open Sans', sans-serif" }} placeholder="Jane Smith" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>Email Address *</label>
                    <input type="email" value={questionForm.email} onChange={e => setQuestionForm(p => ({ ...p, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "#e0dcdc", fontFamily: "'Open Sans', sans-serif" }} placeholder="jane@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>Your Question *</label>
                  <textarea value={questionForm.question} onChange={e => setQuestionForm(p => ({ ...p, question: e.target.value }))} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none" style={{ borderColor: "#e0dcdc", fontFamily: "'Open Sans', sans-serif" }} placeholder="What would you like to know about the LTC insurance process?" required />
                </div>
                <button type="submit" disabled={sendQuestion.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60" style={{ background: "#34B1C4", fontFamily: "'Roboto', sans-serif" }}>
                  {sendQuestion.isPending ? "Sending..." : <><Send className="w-4 h-4" /> Submit My Question</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Enhanced Home Care Section ── */}
      <section className="py-section" style={{ background: "#34B1C4" }}>
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontFamily: "'Open Sans', sans-serif" }}>
                🏠 Home Care &amp; Your LTC Claim
              </div>
              <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Roboto', sans-serif" }}>Looking for Home Care?<br />We Can Help.</h2>
              <p className="text-white/90 mb-4 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>Most long-term care insurance policies cover home care services when you can no longer perform at least 2 Activities of Daily Living (ADLs) — such as bathing, dressing, or mobility. This is exactly where SC Visiting Angels comes in.</p>
              <p className="text-white/85 mb-6 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>Our professional caregivers provide the hands-on, documented care that satisfies your policy's ADL requirements — helping you qualify for and maintain your LTC benefits while receiving compassionate care at home. We work alongside your insurance company every step of the way.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5" style={{ background: "#fff", color: "#34B1C4", fontFamily: "'Roboto', sans-serif" }}>
                    <PhoneCall className="w-4 h-4" /> Contact Us
                  </button>
                </Link>
                <a href="https://www.SCVisitingAngels.com" target="_blank" rel="noopener noreferrer">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border-2 border-white/60 transition-all duration-200 hover:bg-white/10" style={{ color: "#fff", fontFamily: "'Roboto', sans-serif" }}>
                    Learn More <ExternalLink className="w-4 h-4" />
                  </button>
                </a>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: 320 }}>
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/lSMqOjgOjuvfRlJs.jpg"
                alt="SC Visiting Angels caregiver providing compassionate home care to a senior"
                className="w-full h-full object-cover"
                style={{ minHeight: 320 }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(52,177,196,0.3) 0%, transparent 60%)" }} />
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
}
