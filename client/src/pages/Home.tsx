import { shareResource } from "@/lib/shareResource";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
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
  PhoneCall,
  ExternalLink,
  Users,
  Award,
  ThumbsUp,
  MapPin,
  Gift,
  Shield,
  Clock,
  Phone,
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

// Character-Inspired Color Palettes from Official Guides
const CHARACTER_COLORS = {
  maya: { primary: "#34B1C4", secondary: "#0E5A6F", accent: "#E8F4F8", light: "#B8E6ED" },
  professor: { primary: "#8B4513", secondary: "#5C2E0F", accent: "#F5EBE0", light: "#D4A574" },
  david: { primary: "#6B8FBF", secondary: "#3D5A8C", accent: "#E8EEF7", light: "#B8D4E8" },
  elena: { primary: "#E89BB5", secondary: "#D4758A", accent: "#FDF0F5", light: "#F0D4E0" },
  rose: { primary: "#B896D4", secondary: "#8B5FA3", accent: "#F3E8FB", light: "#D9C5E8" },
  sarah: { primary: "#4FA3A3", secondary: "#2D7A7A", accent: "#E0F5F5", light: "#A8D9D9" },
  michael: { primary: "#1B3A5C", secondary: "#0F2438", accent: "#E6EEF7", light: "#99B8D9" },
  buddy: { primary: "#8B6F47", secondary: "#5C4A2F", accent: "#F5F0E8", light: "#C9B8A0" },
};



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
  const [alertVisible, setAlertVisible] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-close alert after 3 seconds with slide-up animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAlertVisible(false);
      setTimeout(() => setAlertDismissed(true), 400); // remove from DOM after animation
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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

  const stat1 = useCountUp(1000);
  const stat2 = useCountUp(22);
  const stat3 = useCountUp(97);
  const stat4 = useCountUp(95);

  // Our Story: fly-in on mount, pause 3s on first quote, then rotate every 3s
  const storyStarted = useRef(false);
  useEffect(() => {
    if (storyStarted.current) return;
    storyStarted.current = true;
    const firstDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setActiveQuote((prev) => (prev + 1) % storyQuotes.length);
      }, 3000);
      return () => clearInterval(interval);
    }, 3000);
    return () => clearTimeout(firstDelay);
  }, []);

  // Chat animation state
  const [chatStep, setChatStep] = useState(0);
  useEffect(() => {
    // Steps: 0=show Q1, 1=typing, 2=show A1, 3=pause, 4=show Q2, 5=typing, 6=show A2, 7=pause, then loop
    const delays = [1200, 900, 1000, 1800, 1200, 900, 1000, 2200];
    const timer = setTimeout(() => {
      setChatStep((prev) => (prev + 1) % delays.length);
    }, delays[chatStep]);
    return () => clearTimeout(timer);
  }, [chatStep]);

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

      {/* ── Free Resource Alert Banner ── */}
      {!alertDismissed && (
        <div
          className="relative z-50 text-sm py-2 px-4 overflow-hidden"
          style={{
            background: '#fffde7',
            border: '2px dashed #c0392b',
            transition: 'max-height 0.4s ease, opacity 0.4s ease, padding 0.4s ease',
            maxHeight: alertVisible ? '60px' : '0px',
            opacity: alertVisible ? 1 : 0,
            paddingTop: alertVisible ? '0.5rem' : '0',
            paddingBottom: alertVisible ? '0.5rem' : '0',
          }}
        >
          <div className="container flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Heart className="w-4 h-4 flex-shrink-0" style={{ color: '#c0392b' }} />
              <span className="truncate" style={{ fontFamily: "'Open Sans', sans-serif", color: '#7b2d00' }}>
                <strong>100% Free Resource</strong> — No charge, no subscription, no hidden fees. Ever.
              </span>
            </div>
            <button
              onClick={() => { setAlertVisible(false); setTimeout(() => setAlertDismissed(true), 400); }}
              className="flex-shrink-0 font-bold ml-2 transition-colors duration-200"
              style={{ color: '#c0392b', fontSize: '1.1rem', lineHeight: 1 }}
              aria-label="Dismiss"
            >✕</button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="/manus-storage/home-hero_8fb65dbf.jpg" alt="Caregiver helping senior at home" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(57,63,67,0.82)' }} />
        </div>
        <div className="container relative py-section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            {/* Left: Heading + Description + Buttons */}
            <div className="animate-float-up flex flex-col">
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>
                Navigating Long Term Care Insurance{" "}
                <span style={{ color: VA_TEAL }}>with Confidence!</span>
              </h1>
              <p className="text-lg text-white/85 leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Filing a long-term care insurance claim can be overwhelming. We provide the education, tools, and personalized strategies your family needs to successfully navigate the process.
              </p>
              <div className="animate-float-up animate-delay-300 flex flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/academy" className="va-btn text-base px-8 py-4 text-center shadow-lg">
                Start Here
              </Link>
              <button
                className="va-btn va-btn-outline text-base px-6 py-4 flex items-center justify-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}
                onClick={async () => {
                  const shareData = { title: "LTC Insurance Navigator — Free Resource", text: "SC Visiting Angels offers a completely free tool to help families navigate long-term care insurance claims.", url: window.location.origin };
                  await shareResource(shareData, "Link copied to clipboard!");
                }}
              >
                <Share2 className="w-4 h-4" />
                Share This Free Resource
              </button>
              </div>
            </div>
            {/* Right: Video */}
            <div className="animate-fade-in-scale animate-delay-200">
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



      {/* ── Stats ── */}
      <section className="relative py-section text-white overflow-hidden" style={{ background: "#0692D7" }}>
        {/* floating semi-transparent balls — top + bottom spread */}
        {[
          { w: 110, h: 110, top: '-25px',  left: '5%',  op: 0.09 },
          { w: 70,  h: 70,  top: '8px',    left: '18%', op: 0.07 },
          { w: 150, h: 150, top: '-35px',  left: '38%', op: 0.06 },
          { w: 55,  h: 55,  top: '15px',   left: '55%', op: 0.09 },
          { w: 95,  h: 95,  top: '-12px',  left: '70%', op: 0.08 },
          { w: 130, h: 130, top: '-28px',  left: '85%', op: 0.07 },
          { w: 45,  h: 45,  top: '20px',   left: '92%', op: 0.10 },
          { w: 85,  h: 85,  top: '-8px',   left: '48%', op: 0.05 },
          /* bottom row */
          { w: 90,  h: 90,  top: 'auto', bottom: '-20px', left: '10%', op: 0.08 },
          { w: 60,  h: 60,  top: 'auto', bottom: '5px',   left: '25%', op: 0.07 },
          { w: 120, h: 120, top: 'auto', bottom: '-30px', left: '50%', op: 0.06 },
          { w: 50,  h: 50,  top: 'auto', bottom: '8px',   left: '65%', op: 0.09 },
          { w: 100, h: 100, top: 'auto', bottom: '-15px', left: '78%', op: 0.07 },
          { w: 70,  h: 70,  top: 'auto', bottom: '10px',  left: '90%', op: 0.08 },
        ].map((b, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{ width: b.w, height: b.h, top: (b as any).bottom ? 'auto' : b.top, bottom: (b as any).bottom ?? undefined, left: b.left, background: `rgba(255,255,255,${b.op})` }} />
        ))}
        <div ref={statsRef} className="container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {[
              { ref: stat1.ref, count: stat1.count, suffix: "+", label: "Families Helped",         icon: Users,    accent: '#ffffff' },
              { ref: stat2.ref, count: stat2.count, suffix: "+", label: "Years of Experience",     icon: Award,    accent: '#ffffff' },
              { ref: stat3.ref, count: stat3.count, suffix: "%", label: "Overall Satisfaction",    icon: ThumbsUp, accent: '#ffffff' },
              { ref: stat4.ref, count: stat4.count, suffix: "%+", label: "Claim Approvals", icon: CheckCircle2, accent: '#ffffff' },
            ].map((stat, i) => (
              <div key={i} className="stat-card p-5 md:p-6 rounded-xl border hover:bg-white/10 transition-all duration-300 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {/* Number */}
                <div className="text-3xl md:text-4xl font-bold mb-1" style={{ fontFamily: "'Roboto', sans-serif", color: stat.accent }}>
                  <span ref={stat.ref!}>{stat.count}</span>{stat.suffix}
                </div>
                {/* Label */}
                <div className="text-xs md:text-sm text-white/90 leading-snug" style={{ fontFamily: "'Open Sans', sans-serif" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── Step 1: Education ── */}
      <section className="py-section" style={{ background: VA_GREY_BG }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
            <div ref={eduLeftRef} className="relative flex lg:flex reveal reveal-left w-full">
              <div className="relative w-full rounded overflow-hidden shadow-xl" style={{ height: eduRightRef?.current?.offsetHeight ? `${eduRightRef.current.offsetHeight}px` : 'auto' }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/step1-education-600x450-26Zj4spKh33ZER3qyicxip.webp"
                  alt="Adult woman calmly reading LTC insurance documents at home"
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded px-3 py-1.5 shadow-md" style={{ background: CHARACTER_COLORS.maya.primary }}>
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white" style={{ fontFamily: "'Open Sans', sans-serif" }}>Step 1 of 3</span>
                </div>
              </div>
            </div>
            <div ref={eduRightRef} className="reveal reveal-right flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4 lg:hidden" style={{ background: CHARACTER_COLORS.maya.accent }}>
                <BookOpen className="w-4 h-4" style={{ color: CHARACTER_COLORS.maya.primary }} />
                <span className="text-sm font-semibold" style={{ color: CHARACTER_COLORS.maya.primary, fontFamily: "'Open Sans', sans-serif" }}>Step 1 of 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Start with <span style={{ color: CHARACTER_COLORS.maya.primary }}>Education</span>
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Most families feel overwhelmed because they don't know what their policy actually covers. Our free Education section explains everything in plain language — no insurance jargon, no confusing terms. Just clear answers to the questions every family asks.
              </p>
              <div className="space-y-4 mb-8">
                <VaCheckItem title="Understand Your Policy" desc="Learn what ADLs are, what your elimination period means, and exactly what benefits you're entitled to" />
                <VaCheckItem title="Know What to Expect" desc="Understand the claims process from start to finish before you make a single phone call" />
                <VaCheckItem title="Free & No Account Required" desc="Access all educational resources instantly — no sign-up, no cost, no obligation" />
              </div>
              <div className="flex justify-center">
                <Link href="/education" className="va-btn text-base px-8 py-4 shadow-lg">
                  Start Learning <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policy Intake Form ── */}
      <section className="py-section" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
            <div ref={intakeLeftRef} className="reveal reveal-left flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4 lg:hidden" style={{ background: CHARACTER_COLORS.david.accent }}>
                <ClipboardList className="w-4 h-4" style={{ color: CHARACTER_COLORS.david.primary }} />
                <span className="text-sm font-semibold" style={{ color: CHARACTER_COLORS.david.primary, fontFamily: "'Open Sans', sans-serif" }}>Step 2 of 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Tell Us About <span style={{ color: CHARACTER_COLORS.david.primary }}>Your Policy</span>
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Answer a few simple questions about your policy and care needs. It only takes a few minutes, and every answer helps us build a strategy that's tailored specifically to your situation.
              </p>
              <div className="space-y-4 mb-8">
                <VaCheckItem title="Complete Policy Details" desc="Capture your policy number, carrier, coverage dates, and benefit amounts" />
                <VaCheckItem title="Organized Documentation" desc="Store medical records, care assessments, and supporting documents in one secure location" />
                <VaCheckItem title="Ready for Your Call" desc="When you contact your insurance company, you'll have all the information they need" />
              </div>
              <div className="flex justify-center">
                <Link href="/policy-form" className="va-btn text-base px-8 py-4 shadow-lg" style={{ background: CHARACTER_COLORS.david.primary }}>
                  Share My Policy Details <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Link>
              </div>
            </div>
            <div ref={intakeRightRef} className="relative flex lg:flex reveal reveal-right w-full">
              <div className="relative w-full rounded overflow-hidden shadow-xl" style={{ height: intakeLeftRef?.current?.offsetHeight ? `${intakeLeftRef.current.offsetHeight}px` : 'auto' }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/step2-policy-600x450-nicJag3knmKGCq79iEqaXB.webp"
                  alt="Care coordinator helping elderly couple with LTC insurance details"
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded px-3 py-1.5 shadow-md" style={{ background: CHARACTER_COLORS.david.primary }}>
                  <ClipboardList className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white" style={{ fontFamily: "'Open Sans', sans-serif" }}>Step 2 of 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customized Strategy ── */}
      <section className="py-section" style={{ background: VA_GREY_BG }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
            <div ref={stratLeftRef} className="relative flex lg:flex order-2 lg:order-1 reveal reveal-left w-full">
              <div className="relative w-full rounded overflow-hidden shadow-xl" style={{ height: stratRightRef?.current?.offsetHeight ? `${stratRightRef.current.offsetHeight}px` : 'auto' }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/step3-strategy-600x450-UExwXyk7heWTvVJSZ4gdVY.webp"
                  alt="Care coordinator presenting a personalized LTC strategy plan to a family"
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded px-3 py-1.5 shadow-md" style={{ background: CHARACTER_COLORS.rose.primary }}>
                  <Target className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white" style={{ fontFamily: "'Open Sans', sans-serif" }}>Step 3 of 3</span>
                </div>
              </div>
            </div>
            <div ref={stratRightRef} className="order-1 lg:order-2 reveal reveal-right flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded px-4 py-2 mb-4 lg:hidden" style={{ background: CHARACTER_COLORS.rose.accent }}>
                <Target className="w-4 h-4" style={{ color: CHARACTER_COLORS.rose.primary }} />
                <span className="text-sm font-semibold" style={{ color: CHARACTER_COLORS.rose.primary, fontFamily: "'Open Sans', sans-serif" }}>Step 3 of 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                Your <span style={{ color: CHARACTER_COLORS.rose.primary }}>Customized Strategy</span>
              </h2>
              <p className="text-lg leading-relaxed mb-4" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Based on your specific policy details and care situation, we create a personalized, step-by-step strategy designed just for you. This roadmap guides you through every phase of the claims process with clarity and confidence.
              </p>
              <div className="space-y-4 mb-6">
                <VaCheckItem title="Step-by-Step Roadmap" desc="Know exactly what to do and when to do it, with clear milestones and timelines" />
                <VaCheckItem title="Task Checklists" desc="Track your progress with organized checklists for each phase of your claim" />
                <VaCheckItem title="Policy-Specific Guidance" desc="Recommendations tailored to your unique coverage and care needs" />
              </div>
              <div className="flex justify-center">
                <Link href="/strategy" className="va-btn text-base px-8 py-4 shadow-lg" style={{ background: CHARACTER_COLORS.rose.primary }}>
                  View My Strategy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="parallax-section relative py-section text-white" style={{ backgroundImage: "url('/manus-storage/strategy-hero_bcf2cf67.jpg')" }}>
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
      <section className="py-section" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={chatLeftRef} className="reveal reveal-left">
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
              <div className="bg-white rounded shadow-xl overflow-hidden border" style={{ borderColor: '#e0e0e0' }}>
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
                <div className="p-4 space-y-3 overflow-hidden" style={{ height: 280 }}>
                  {/* Q1 */}
                  {chatStep >= 0 && (
                    <div className="flex justify-end" style={{ opacity: chatStep >= 0 ? 1 : 0, transition: 'opacity 0.4s' }}>
                      <div className="text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: VA_TEAL }}>What does ADL mean?</div>
                    </div>
                  )}
                  {/* Typing A1 */}
                  {chatStep === 1 && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1" style={{ background: '#f0f0f0' }}>
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#aaa', animation: 'bounce 1s infinite 0ms' }} />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#aaa', animation: 'bounce 1s infinite 150ms' }} />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#aaa', animation: 'bounce 1s infinite 300ms' }} />
                      </div>
                    </div>
                  )}
                  {/* A1 */}
                  {chatStep >= 2 && (
                    <div className="flex justify-start" style={{ opacity: chatStep >= 2 ? 1 : 0, transition: 'opacity 0.4s' }}>
                      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: '#f0f0f0', color: VA_HEADING }}>ADL stands for Activities of Daily Living — bathing, dressing, eating, and more.</div>
                    </div>
                  )}
                  {/* Q2 */}
                  {chatStep >= 4 && (
                    <div className="flex justify-end" style={{ opacity: chatStep >= 4 ? 1 : 0, transition: 'opacity 0.4s' }}>
                      <div className="text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: VA_TEAL }}>How does this help my claim?</div>
                    </div>
                  )}
                  {/* Typing A2 */}
                  {chatStep === 5 && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1" style={{ background: '#f0f0f0' }}>
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#aaa', animation: 'bounce 1s infinite 0ms' }} />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#aaa', animation: 'bounce 1s infinite 150ms' }} />
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#aaa', animation: 'bounce 1s infinite 300ms' }} />
                      </div>
                    </div>
                  )}
                  {/* A2 */}
                  {chatStep >= 6 && (
                    <div className="flex justify-start" style={{ opacity: chatStep >= 6 ? 1 : 0, transition: 'opacity 0.4s' }}>
                      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs shadow-sm" style={{ background: '#f0f0f0', color: VA_HEADING }}>Insurance companies use ADL assessments to determine eligibility. We help you document these properly.</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.1)' }} />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full -z-10" style={{ background: 'rgba(52,177,196,0.08)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Scrolling Testimonials ── */}
      <section className="py-section overflow-hidden" style={{ background: VA_GREY_BG }}>
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
              <div key={index} className="testimonial-card w-[380px] shrink-0 bg-white rounded border p-6 shadow-sm flex flex-col" style={{ borderColor: '#e0e0e0', minHeight: 220 }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed italic flex-1" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>"{ testimonial.text}"</p>
                <div className="pt-4 mt-auto border-t" style={{ borderColor: '#f0f0f0' }}>
                  <div className="font-bold" style={{ fontFamily: "'Roboto', sans-serif", color: index % 2 === 0 ? VA_TEAL : VA_BLUE }}>{testimonial.name}</div>
                  <div className="text-xs" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>{testimonial.relation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-section" style={{ background: '#ffffff' }}>
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

    </Layout>
  );
}
