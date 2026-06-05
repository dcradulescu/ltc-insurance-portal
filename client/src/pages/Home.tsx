import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { LegalDisclaimerFooter } from '@/components/LegalDisclaimerFooter';
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Heart,
  ArrowRight,
  ClipboardList,
  Target,
  Quote,
  Star,
  MessageSquare,
  Share2,
  BookOpen,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

// VA Brand constants
const VA_TEAL = "#34B1C4";
const VA_TEAL_DARK = "#2a8fa0";
const VA_BLUE = "#0692D7";
const VA_BLUE_DARK = "#0578b3";
const VA_CHARCOAL = "#393F43";
const VA_GREY_BG = "#F2F6FA";
const VA_HEADING = "#454545";
const VA_BODY = "#555555";



const testimonials = [
  { name: "Margaret S.", relation: "Daughter of policyholder", text: "When my father needed home care, I had no idea where to start with his LTC policy. Visiting Angels walked us through every step. Within weeks, we had a clear strategy and the claim was approved.", rating: 5 },
  { name: "Robert & Linda K.", relation: "Policyholders", text: "We had been paying premiums for 15 years and were terrified of the claims process. The personalized strategy made everything so clear. We couldn't have done it without this guidance.", rating: 5 },
  { name: "Susan T.", relation: "Caregiver for her mother", text: "Mom's insurance company kept asking for more paperwork. Visiting Angels helped us understand exactly what was needed and organized everything. The claim was approved on the second submission.", rating: 5 },
  { name: "James & Patricia W.", relation: "Family caregivers", text: "The education resources alone were worth it. We finally understood what ADLs meant, what our policy actually covered, and how to document everything properly. A true lifesaver for our family.", rating: 5 },
  { name: "Carol D.", relation: "Wife of policyholder", text: "After my husband's stroke, I was overwhelmed. The step-by-step checklist kept me on track. Every task was clear, and I always knew what to do next. I felt supported the entire time.", rating: 5 },
  { name: "Thomas M.", relation: "Son of policyholder", text: "Dad's claim was initially denied. Using the strategy from this portal, we appealed with the right documentation and it was overturned. This service literally saved us tens of thousands of dollars.", rating: 5 },
];

const storyQuotes = [
  "Years ago, Jim told me it was smart to take out this policy. I called the insurance company, but we couldn't make heads or tails of what to do.",
  "Jim was starting to decline and we needed home care services to help keep him at home, but I felt completely overwhelmed!",
  "We have paid on this long-term care policy for years, and it made sense at the time, but now it's so hard to understand.",
  "Not only did I have to coordinate care, take over all of the additional things that Jim was doing, but now I had this on top of it! I felt hopeless…",
  "Thankfully, Visiting Angels was able to help us to understand what the policy is, how to start and file a claim and even created a specific strategy just for us!",
  "If it wasn't for Visiting Angels, I would have given up. Who knows if we could have kept Jim home.",
  "Now there is light at the end of the tunnel. Jim is getting great care and the insurance company is providing the financial safety net it was meant to.",
  "What an absolute blessing to have Visiting Angels figure all of this out with us! There is no way we could have done this without you!",
];

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return { count, ref };
}

// VA-styled section heading with teal underline divider
function VaSectionHeading({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className="text-center mb-10 md:mb-14">
      <h2 style={{ fontFamily: "'Roboto', sans-serif", color: light ? '#ffffff' : VA_HEADING }} className="text-3xl md:text-4xl font-bold mb-3">
        {children}
      </h2>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div style={{ height: 2, width: 40, background: VA_TEAL }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: VA_TEAL }} />
        <div style={{ height: 2, width: 40, background: VA_TEAL }} />
      </div>
    </div>
  );
}

// VA teal checkmark bullet list item
function VaCheckItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 group">
      <span className="text-xl font-bold flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110" style={{ color: VA_TEAL }}>✔</span>
      <div>
        <h3 className="font-bold mb-0.5 transition-colors duration-200" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>{desc}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeQuote, setActiveQuote] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stepsRef = useReveal();
  const statsRef = useReveal();
  const storyLeftRef = useReveal();
  const storyRightRef = useReveal();
  const aboutLeftRef = useReveal();
  const aboutRightRef = useReveal();
  const testimonialsHeaderRef = useReveal();
  const ctaRef = useReveal();
  const eduLeftRef = useReveal();
  const eduRightRef = useReveal();
  const intakeLeftRef = useReveal();
  const intakeRightRef = useReveal();
  const stratLeftRef = useReveal();
  const stratRightRef = useReveal();
  const chatLeftRef = useReveal();
  const chatRightRef = useReveal();

  const stat1 = useCountUp(500);
  const stat2 = useCountUp(98);
  const stat3 = useCountUp(15);
  const stat4 = useCountUp(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuote((prev) => (prev + 1) % storyQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>LTC Insurance Navigator — Free Resource for Families | SC Visiting Angels</title>
        <meta name="description" content="SC Visiting Angels helps families navigate long-term care insurance claims with free education, a personalized strategy, and step-by-step guidance. No cost, ever." />
        <meta property="og:title" content="LTC Insurance Navigator — Free Resource for Families" />
        <meta property="og:description" content="SC Visiting Angels helps families navigate long-term care insurance claims with free education, a personalized strategy, and step-by-step guidance." />
        <meta property="og:image" content="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/og-home-YpxVsqvUs5V8rFXhkJW7Dx.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LTC Insurance Navigator — Free Resource for Families" />
        <meta name="twitter:description" content="SC Visiting Angels helps families navigate long-term care insurance claims with free education, a personalized strategy, and step-by-step guidance." />
        <meta name="twitter:image" content="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/og-home-YpxVsqvUs5V8rFXhkJW7Dx.png" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="/manus-storage/home-hero_8fb65dbf.jpg" alt="Caregiver helping senior at home" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(57,63,67,0.82)' }} />
        </div>
        <div className="container relative py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-3 mb-6 animate-float-up">
                <div className="inline-flex items-center gap-2 rounded px-4 py-2 border" style={{ background: 'rgba(52,177,196,0.18)', borderColor: 'rgba(52,177,196,0.35)' }}>
                  <Heart className="w-4 h-4" style={{ color: VA_TEAL }} />
                  <span className="text-sm text-white/90" style={{ fontFamily: "'Open Sans', sans-serif" }}>Supportive Guidance for Families</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-float-up animate-delay-100" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>
                Navigating Long Term Care Insurance{" "}
                <span style={{ color: VA_TEAL }}>with Confidence!</span>
              </h1>
              <p className="text-lg text-white/85 leading-relaxed mb-4 max-w-lg animate-float-up animate-delay-200" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Filing a long-term care insurance claim can be overwhelming. We provide the education, tools, and personalized strategies your family needs to successfully navigate the process.
              </p>
              <div className="rounded px-5 py-4 mb-8 max-w-lg animate-float-up animate-delay-300 border" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                <p className="text-white font-semibold text-base mb-1" style={{ fontFamily: "'Roboto', sans-serif" }}>This is a completely free resource.</p>
                <p className="text-white/80 text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>There is no charge, no subscription, and no hidden fees — ever. SC Visiting Angels provides this portal as a gift to families navigating long-term care insurance, because no family should face this process alone.</p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-float-up animate-delay-400">
                <Link href="/education" className="va-btn text-base px-8 py-4 w-full sm:w-auto text-center shadow-lg">
                  Start Here — Learn First
                </Link>
                <Link href="/policy-form" className="va-btn va-btn-outline text-base px-8 py-4 w-full sm:w-auto text-center" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}>
                  Already Educated? Share My Policy Details
                </Link>
                <button
                  className="va-btn va-btn-outline text-base px-6 py-4 flex items-center justify-center gap-2 w-full sm:w-auto"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}
                  onClick={async () => {
                    const shareData = { title: "LTC Insurance Navigator — Free Resource", text: "SC Visiting Angels offers a completely free tool to help families navigate long-term care insurance claims.", url: window.location.origin };
                    if (navigator.share && navigator.canShare?.(shareData)) {
                      try { await navigator.share(shareData); } catch {}
                    } else {
                      await navigator.clipboard.writeText(window.location.origin);
                      toast.success("Link copied to clipboard!", { description: "Share it with family members who need help navigating LTC insurance." });
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share This Free Resource
                </button>
              </div>
            </div>
            <div className="hidden lg:block animate-fade-in-scale animate-delay-300">
              <VideoPlaceholder
                title="Welcome to LTC Navigator"
                description="Watch our brief introduction to learn how we can help your family"
                thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg"
                videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/MjPhBEQZfvIrfZms.mp4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile video */}
      <section className="lg:hidden py-5" style={{ background: VA_GREY_BG }}>
        <div className="container">
          <VideoPlaceholder
            title="Welcome to LTC Navigator"
            description="Watch our brief introduction to learn how we can help your family"
            thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg"
            videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/MjPhBEQZfvIrfZms.mp4"
          />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-10 md:py-14 text-white" style={{ background: VA_CHARCOAL }}>
        <div ref={statsRef} className="reveal container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {[
              { ref: stat1.ref, count: stat1.count, suffix: "+", label: "Families Helped", accent: VA_TEAL },
              { ref: stat2.ref, count: stat2.count, suffix: "%", label: "Claim Success Rate", accent: VA_BLUE },
              { ref: stat3.ref, count: stat3.count, suffix: "+", label: "Years of Experience", accent: VA_TEAL },
              { ref: stat4.ref, count: stat4.count, suffix: "+", label: "Years Serving Upstate SC", accent: VA_BLUE },
            ].map((stat, i) => (
              <div key={i} className="stat-card p-4 md:p-5 rounded border hover:bg-white/10 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <div className="text-3xl md:text-4xl font-bold mb-1" style={{ fontFamily: "'Roboto', sans-serif", color: stat.accent }}>
                  <span ref={stat.ref!}>{stat.count}</span>{stat.suffix}
                </div>
                <div className="text-xs md:text-sm text-white/90" style={{ fontFamily: "'Open Sans', sans-serif" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 Easy Steps ── */}
      <section className="py-14 md:py-20" style={{ background: '#ffffff' }}>
        <div ref={stepsRef} className="reveal container">
          <VaSectionHeading>It's as Easy as <span style={{ color: VA_TEAL }}>1 — 2 — 3</span></VaSectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
              {
                num: "1",
                icon: BookOpen,
                title: "Learn",
                subtitle: "Understand Your Coverage",
                desc: "Start in our free Education section. In just a few minutes you'll understand your policy, your benefits, and exactly what to expect — no insurance jargon.",
                color: VA_TEAL,
                href: "/education",
                cta: "Start Learning",
              },
              {
                num: "2",
                icon: FileText,
                title: "Tell Us About Your Policy",
                subtitle: "Share Your Policy Details",
                desc: "Answer a few simple questions about your policy and care needs. No complicated forms — just the information we need to build your personal plan.",
                color: VA_BLUE,
                href: "/policy-form",
                cta: "Share My Policy Details",
              },
              {
                num: "3",
                icon: Sparkles,
                title: "Get Your Strategy",
                subtitle: "Your Personalized Claim Plan",
                desc: "Receive a step-by-step, personalized strategy built just for your situation — a clear roadmap that takes the guesswork out of filing your claim.",
                color: VA_TEAL_DARK,
                href: "/strategy",
                cta: "See a Sample Strategy",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="relative flex flex-col rounded-xl border-2 p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: i === 1 ? VA_BLUE : (i === 2 ? VA_TEAL : '#e8e8e8'), background: i === 1 ? 'rgba(6,146,215,0.04)' : (i === 2 ? 'rgba(52,177,196,0.04)' : '#fff') }}
              >
                {/* Step number badge */}
                <div className="absolute -top-5 left-7 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ background: step.color }}>
                  {step.num}
                </div>
                <div className="mt-4 mb-4 w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: i === 1 ? 'rgba(6,146,215,0.12)' : 'rgba(52,177,196,0.12)' }}>
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: i === 1 ? VA_BLUE : VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}>{step.subtitle}</div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>{step.title}</h3>
                <p className="text-sm leading-relaxed flex-1 mb-6" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>{step.desc}</p>
                <Link href={step.href} className="inline-flex items-center gap-2 text-sm font-bold transition-colors duration-200 hover:opacity-80" style={{ color: step.color }}>
                  {step.cta} <ArrowRight className="w-4 h-4" />
                </Link>
                {i === 1 && (
                  <div className="absolute -top-3 right-5 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                    ✨ This is where the magic starts!
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Connector arrows on desktop */}
          <div className="hidden md:flex justify-center items-center gap-0 mt-8">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: VA_BODY, fontFamily: "'Open Sans', sans-serif" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: VA_TEAL }} />
              <span>Free to use — no account required to get started</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Step 1: Education ── */}
      <section className="py-12 md:py-16" style={{ background: VA_GREY_BG }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={eduLeftRef} className="relative hidden lg:block reveal reveal-left">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/education-section-hero-Yk9ZFnvFnvFnvFnvFnvF.webp"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/intake-form-section-mZs4Ekm9teKNjUckYUJK2U.webp'; }}
                alt="Senior reading about long-term care insurance with a cup of coffee"
                className="w-full h-auto rounded shadow-xl hover:shadow-2xl transition-shadow duration-500 hover:scale-[1.01]"
              />
            </div>
            <div ref={eduRightRef} className="reveal reveal-right">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4" style={{ background: 'rgba(52,177,196,0.12)' }}>
                <BookOpen className="w-4 h-4" style={{ color: VA_TEAL }} />
                <span className="text-sm font-semibold" style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}>Step 1 of 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Start with <span style={{ color: VA_TEAL }}>Education</span>
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Most families feel overwhelmed because they don't know what their policy actually covers. Our free Education section explains everything in plain language — no insurance jargon, no confusing terms. Just clear answers to the questions every family asks.
              </p>
              <div className="space-y-4 mb-8">
                <VaCheckItem title="Understand Your Policy" desc="Learn what ADLs are, what your elimination period means, and exactly what benefits you're entitled to" />
                <VaCheckItem title="Know What to Expect" desc="Understand the claims process from start to finish before you make a single phone call" />
                <VaCheckItem title="Free & No Account Required" desc="Access all educational resources instantly — no sign-up, no cost, no obligation" />
              </div>
              <Link href="/education" className="va-btn text-base px-8 py-4 shadow-lg">
                Start Learning <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policy Intake Form ── */}
      <section className="py-12 md:py-16" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={intakeLeftRef} className="reveal reveal-left">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4" style={{ background: 'rgba(6,146,215,0.12)' }}>
                <ClipboardList className="w-4 h-4" style={{ color: VA_BLUE }} />
                <span className="text-sm font-semibold" style={{ color: VA_BLUE, fontFamily: "'Open Sans', sans-serif" }}>Step 2 of 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Tell Us About <span style={{ color: VA_BLUE }}>Your Policy</span>
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Answer a few simple questions about your policy and care needs. It only takes a few minutes, and every answer helps us build a strategy that's tailored specifically to your situation.
              </p>
              <div className="space-y-4 mb-8">
                <VaCheckItem title="Complete Policy Details" desc="Capture your policy number, carrier, coverage dates, and benefit amounts" />
                <VaCheckItem title="Organized Documentation" desc="Store medical records, care assessments, and supporting documents in one secure location" />
                <VaCheckItem title="Ready for Your Call" desc="When you contact your insurance company, you'll have all the information they need" />
              </div>
              <Link href="/policy-form" className="va-btn text-base px-8 py-4 shadow-lg" style={{ background: VA_BLUE }}>
                Share My Policy Details <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
            </div>
            <div ref={intakeRightRef} className="relative hidden lg:block reveal reveal-right">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/intake-form-section-mZs4Ekm9teKNjUckYUJK2U.webp"
                alt="Care coordinator helping elderly couple complete their LTC insurance intake form at home"
                className="w-full h-auto rounded shadow-xl hover:shadow-2xl transition-shadow duration-500 hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Customized Strategy ── */}
      <section className="py-12 md:py-16" style={{ background: VA_GREY_BG }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={stratLeftRef} className="relative hidden lg:block order-2 lg:order-1 reveal reveal-left">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/strategy-section-YfSApseWQYDU5UU6xzzqF3.webp"
                alt="Care coordinator presenting a personalized LTC strategy plan to a family on a tablet"
                className="w-full h-auto rounded shadow-xl hover:shadow-2xl transition-shadow duration-500 hover:scale-[1.01]"
              />
            </div>
            <div ref={stratRightRef} className="order-1 lg:order-2 reveal reveal-right">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4" style={{ background: 'rgba(52,177,196,0.12)' }}>
                <Target className="w-4 h-4" style={{ color: VA_TEAL }} />
                <span className="text-sm font-semibold" style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}>Step 3 of 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Your <span style={{ color: VA_TEAL }}>Customized Strategy</span>
              </h2>
              <p className="text-lg leading-relaxed mb-4" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Based on your specific policy details and care situation, we create a personalized, step-by-step strategy designed just for you. This roadmap guides you through every phase of the claims process with clarity and confidence.
              </p>
              <div className="space-y-4 mb-6">
                <VaCheckItem title="Step-by-Step Roadmap" desc="Know exactly what to do and when to do it, with clear milestones and timelines" />
                <VaCheckItem title="Task Checklists" desc="Track your progress with organized checklists for each phase of your claim" />
                <VaCheckItem title="Policy-Specific Guidance" desc="Recommendations tailored to your unique coverage and care needs" />
              </div>
              <Link href="/strategy" className="va-btn text-base px-8 py-4 shadow-lg">
                View My Strategy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="parallax-section relative py-10 text-white" style={{ backgroundImage: "url('/manus-storage/strategy-hero_bcf2cf67.jpg')" }}>
        <div className="absolute inset-0" style={{ background: 'rgba(57,63,67,0.88)' }} />
        <div ref={ctaRef} className="reveal container relative text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>Ready to Get Started?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Begin with our free Education section — it only takes a few minutes and will make sharing your policy details much easier.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/education" className="va-btn text-base px-8 py-4 shadow-lg">
              Start with Education <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Link>
            <Link href="/policy-form" className="va-btn text-base px-8 py-4" style={{ background: VA_BLUE }}>
              Skip to Policy Details <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Chat Support ── */}
      <section className="py-12 md:py-16" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={chatLeftRef} className="reveal reveal-left">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4" style={{ background: 'rgba(52,177,196,0.12)' }}>
                <MessageSquare className="w-4 h-4" style={{ color: VA_TEAL }} />
                <span className="text-sm font-semibold" style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}>Always Available</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Live <span style={{ color: VA_TEAL }}>Support Chat</span>
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Have questions? Our intelligent support chat is available 24/7 to provide instant answers about your LTC insurance policy, claims process, and more.
              </p>
              <div className="space-y-4">
                <VaCheckItem title="Instant Responses" desc="Get answers to common questions about LTC insurance and the claims process immediately" />
                <VaCheckItem title="Available 24/7" desc="Chat support is available whenever you need it, day or night, to answer your questions" />
                <VaCheckItem title="Personalized Help" desc="Get guidance specific to your situation and policy details" />
              </div>
            </div>
            <div ref={chatRightRef} className="relative hidden lg:block reveal reveal-right">
              <div className="bg-white rounded shadow-xl overflow-hidden border hover:shadow-2xl transition-shadow duration-500" style={{ borderColor: '#e0e0e0' }}>
                <div className="p-4 border-b" style={{ background: 'rgba(52,177,196,0.08)', borderColor: '#e0e0e0' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center pulse-glow" style={{ background: VA_TEAL }}>
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>Support Chat</div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                        Always here to help
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-end">
                    <div className="text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: VA_TEAL }}>What does ADL mean?</div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: '#f0f0f0', color: VA_HEADING }}>ADL stands for Activities of Daily Living. It includes bathing, dressing, eating, and more.</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: VA_TEAL }}>How does this help my claim?</div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: '#f0f0f0', color: VA_HEADING }}>Insurance companies use ADL assessments to determine eligibility. We help you document these properly.</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.1)' }} />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.08)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Scrolling Testimonials ── */}
      <section className="py-12 md:py-16 overflow-hidden" style={{ background: VA_GREY_BG }}>
        <div className="container mb-12">
          <div ref={testimonialsHeaderRef} className="reveal">
            <VaSectionHeading>What <span style={{ color: VA_TEAL }}>Families</span> Are Saying</VaSectionHeading>
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${VA_GREY_BG}, transparent)` }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(to left, ${VA_GREY_BG}, transparent)` }} />
          <div ref={scrollRef} className="flex gap-6 animate-scroll-left" style={{ width: "max-content" }}>
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div key={index} className="testimonial-card w-[380px] shrink-0 bg-white rounded border p-6 shadow-sm" style={{ borderColor: '#e0e0e0' }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>"{testimonial.text}"</p>
                <div className="border-t pt-4" style={{ borderColor: '#e0e0e0' }}>
                  <div className="font-bold" style={{ fontFamily: "'Roboto', sans-serif", color: index % 2 === 0 ? VA_TEAL : VA_BLUE }}>{testimonial.name}</div>
                  <div className="text-xs" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>{testimonial.relation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div ref={storyLeftRef} className="reveal reveal-left relative">
              <div className="rounded overflow-hidden shadow-2xl h-[400px] group">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/swQpXlcRmPQTVKfl.jpg"
                  alt="Elderly couple embracing a Visiting Angels care coordinator"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.12)' }} />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.08)' }} />
            </div>
            <div ref={storyRightRef} className="reveal reveal-right">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-6" style={{ background: 'rgba(6,146,215,0.12)' }}>
                <Heart className="w-4 h-4" style={{ color: VA_BLUE }} />
                <span className="text-sm font-semibold" style={{ color: VA_BLUE, fontFamily: "'Open Sans', sans-serif" }}>Real Families, Real Results</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Our <span style={{ color: VA_TEAL }}>Story</span>
              </h2>
              <div className="relative min-h-[200px] flex items-center">
                <Quote className="absolute top-0 left-0 w-10 h-10 opacity-20" style={{ color: VA_TEAL }} />
                {storyQuotes.map((quote, index) => (
                  <p
                    key={index}
                    className="absolute inset-0 flex items-center text-lg md:text-xl italic leading-relaxed pl-6"
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      color: VA_BODY,
                      opacity: activeQuote === index ? 1 : 0,
                      transform: activeQuote === index ? "translateY(0)" : (index < activeQuote || (activeQuote === 0 && index === storyQuotes.length - 1)) ? "translateY(-15px)" : "translateY(15px)",
                      transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    "{quote}"
                  </p>
                ))}
              </div>
              <div className="flex gap-2 mt-8">
                {storyQuotes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveQuote(index)}
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: activeQuote === index ? 24 : 10,
                      background: activeQuote === index ? VA_TEAL : 'rgba(52,177,196,0.3)',
                    }}
                    aria-label={`Quote ${index + 1}`}
                  />
                ))}
              </div>
              <p className="mt-6 text-sm" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>— A Visiting Angels family</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About SC Visiting Angels ── */}
      <section className="py-14 md:py-20 text-white" style={{ background: VA_CHARCOAL }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div ref={aboutLeftRef} className="reveal reveal-left">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-6" style={{ background: 'rgba(52,177,196,0.18)' }}>
                <Heart className="w-4 h-4" style={{ color: VA_TEAL }} />
                <span className="text-sm font-semibold" style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}>About SC Visiting Angels</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>
                Compassionate Home Care<br className="hidden md:block" /> in the Upstate
              </h2>
              <p className="text-white text-base leading-relaxed mb-5" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                SC Visiting Angels is a locally owned and operated home care agency serving families across the Upstate of South Carolina. For over a decade, we have helped seniors and their families navigate the challenges of aging at home — from personal care and companionship to specialized dementia support.
              </p>
              <p className="text-white text-base leading-relaxed mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Our caregivers are carefully selected, thoroughly trained, and deeply committed to treating every client with the dignity and respect they deserve. We believe that home is where healing happens best.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { stat: "10+", label: "Years Serving Upstate SC", accent: VA_TEAL },
                  { stat: "100%", label: "Locally Owned & Operated", accent: VA_BLUE },
                  { stat: "24/7", label: "On-Call Support", accent: VA_TEAL },
                  { stat: "Free", label: "In-Home Consultations", accent: VA_BLUE },
                ].map(({ stat, label, accent }) => (
                  <div key={label} className="stat-card rounded p-4 border hover:bg-white/15 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ fontFamily: "'Roboto', sans-serif", color: accent }}>{stat}</div>
                    <div className="text-xs text-white/90 leading-snug" style={{ fontFamily: "'Open Sans', sans-serif" }}>{label}</div>
                  </div>
                ))}
              </div>
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="va-btn inline-flex items-center gap-2"
              >
                Learn More About Our Services
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div ref={aboutRightRef} className="relative reveal reveal-right">
              <div className="rounded overflow-hidden shadow-2xl aspect-[4/3] group">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/about-va-caregiver-Ba8Vnk5qXtNdwjG55rSFSE.webp"
                  alt="SC Visiting Angels caregiver reviewing insurance paperwork with elderly client at home"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.2)' }} />
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full -z-10" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="absolute bottom-6 right-6 bg-white rounded shadow-xl px-4 py-3 flex items-center gap-3 hover:shadow-2xl transition-shadow duration-300">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png" alt="SC Visiting Angels" className="w-8 h-8 object-contain" />
                <div>
                  <div className="text-xs font-bold leading-tight" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>SC Visiting Angels</div>
                  <div className="text-xs" style={{ color: '#888' }}>(864) 244-6300</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutHomeCare />
      <LegalDisclaimerFooter />
    </Layout>
  );
}
