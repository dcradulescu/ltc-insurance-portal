import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { LegalDisclaimerFooter } from '@/components/LegalDisclaimerFooter';
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Heart,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Target,
  Phone,
  Quote,
  Star,
  CheckCircle,
  MessageSquare,
  Zap,
  Share2,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Education & Resources",
    description: "Comprehensive guides to help you understand your long-term care insurance policy, benefits, and coverage options.",
    color: "bg-teal/10 text-teal group-hover:bg-teal/20",
  },
  {
    icon: ClipboardList,
    title: "Policy Intake Form",
    description: "Our interactive form captures your specific policy details so we can provide tailored guidance for your situation.",
    color: "bg-primary/10 text-primary group-hover:bg-primary/20",
  },
  {
    icon: Target,
    title: "Customized Strategy",
    description: "Receive a personalized, step-by-step strategy designed specifically for your policy and care needs.",
    color: "bg-teal/10 text-teal group-hover:bg-teal/20",
  },
  {
    icon: Phone,
    title: "Live Support Chat",
    description: "Get instant answers to your questions about long-term care insurance through our intelligent support chat.",
    color: "bg-primary/10 text-primary group-hover:bg-primary/20",
  },
];

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

export default function Home() {
  const [activeQuote, setActiveQuote] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const featuresHeaderRef = useReveal();
  const statsRef = useReveal();
  const storyLeftRef = useReveal();
  const storyRightRef = useReveal();
  const aboutLeftRef = useReveal();
  const aboutRightRef = useReveal();
  const testimonialsHeaderRef = useReveal();
  const stepsHeaderRef = useReveal();
  const ctaRef = useReveal();
  const aloneRef = useReveal();
  const intakeLeftRef = useReveal();
  const intakeRightRef = useReveal();
  const stratLeftRef = useReveal();
  const stratRightRef = useReveal();
  const chatLeftRef = useReveal();
  const chatRightRef = useReveal();

  const stat1 = useCountUp(500);
  const stat2 = useCountUp(98);
  const stat3 = useCountUp(15);

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
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2a3a]/90 via-[#1a2a3a]/75 to-[#1a2a3a]/50" />
        </div>
        <div className="container relative py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-3 mb-6 animate-float-up">
                <div className="inline-flex items-center gap-2 bg-teal/20 backdrop-blur-sm rounded-full px-4 py-2 border border-teal/30 hover:bg-teal/30 transition-colors duration-300">
                  <Heart className="w-4 h-4 text-teal-light" />
                  <span className="text-sm text-white/90">Supportive Guidance for Families</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-yellow-400/90 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-300 hover:bg-yellow-400 transition-colors duration-300">
                  <Zap className="w-4 h-4 text-yellow-900" />
                  <span className="text-sm font-bold text-yellow-900">100% Free — No Cost to You</span>
                </div>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-float-up animate-delay-100">
                Navigating Long Term Care insurance{" "}
                <span className="text-teal">with Confidence!</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed mb-4 max-w-lg animate-float-up animate-delay-200">
                Filing a long-term care insurance claim can be overwhelming. We provide the education, tools, and personalized strategies your family needs to successfully navigate the process.
              </p>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 mb-8 max-w-lg animate-float-up animate-delay-300 hover:bg-white/15 transition-colors duration-300">
                <p className="text-white font-semibold text-base mb-1">This is a completely free resource.</p>
                <p className="text-white/80 text-sm leading-relaxed">There is no charge, no subscription, and no hidden fees — ever. SC Visiting Angels provides this portal as a gift to families navigating long-term care insurance, because no family should face this process alone.</p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-float-up animate-delay-400">
                <Button asChild size="lg" className="text-base px-8 bg-teal hover:bg-teal-dark text-white w-full sm:w-auto shadow-lg hover:shadow-teal/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  <Link href="/education">Start Here — Learn First</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8 border-white/30 text-white hover:bg-white/15 bg-transparent w-full sm:w-auto transition-all duration-300 hover:-translate-y-0.5">
                  <Link href="/policy-form">Already Educated? Go to Form</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-6 border-white/30 text-white hover:bg-white/15 bg-transparent flex items-center justify-center gap-2 w-full sm:w-auto transition-all duration-300 hover:-translate-y-0.5"
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
                </Button>
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
      <section className="lg:hidden py-5 bg-secondary">
        <div className="container">
          <VideoPlaceholder
            title="Welcome to LTC Navigator"
            description="Watch our brief introduction to learn how we can help your family"
            thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg"
            videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/MjPhBEQZfvIrfZms.mp4"
          />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container">
          <div ref={featuresHeaderRef} className="reveal text-center mb-8 md:mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How We <span className="text-teal">Help</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our portal provides everything you need to understand, prepare, and successfully file your long-term care insurance claim.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group feature-card p-6 rounded-xl border border-border bg-white"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${feature.color}`}>
                  <feature.icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                </div>
                <h3 className="font-serif font-bold text-lg mb-3 text-foreground group-hover:text-teal transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center gap-1 text-teal text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── You Don't Have to Navigate This Alone ── */}
      <section className="parallax-section relative py-12 md:py-16 text-white" style={{ backgroundImage: "url('/manus-storage/strategy-hero_bcf2cf67.jpg')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-dark/90 via-primary/85 to-[#1a2a3a]/90" />
        <div ref={aloneRef} className="reveal container relative text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            You Don't Have to Navigate This Alone
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Thousands of families have trusted us to guide them through the long-term care insurance claims process. Let us create a personalized strategy for your family too.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 bg-white text-teal-dark hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/education">Step 1: Learn About LTC <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 border-white/40 text-white hover:bg-white/15 bg-transparent transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/policy-form">Step 2: Complete the Form</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-10 md:py-14 bg-gradient-to-r from-teal-dark to-primary text-white">
        <div ref={statsRef} className="reveal container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {[
              { ref: stat1.ref, count: stat1.count, suffix: "+", label: "Families Helped" },
              { ref: stat2.ref, count: stat2.count, suffix: "%", label: "Claim Success Rate" },
              { ref: stat3.ref, count: stat3.count, suffix: "+", label: "Years of Experience" },
              { ref: null, count: null, suffix: "", label: "100% Free Service", special: true },
            ].map((stat, i) => (
              <div key={i} className="stat-card p-4 md:p-5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all duration-300">
                {stat.special ? (
                  <div className="text-3xl md:text-4xl font-serif font-bold text-yellow-300 mb-1">Free</div>
                ) : (
                  <div className="text-3xl md:text-4xl font-serif font-bold text-yellow-300 mb-1">
                    <span ref={stat.ref!}>{stat.count}</span>{stat.suffix}
                  </div>
                )}
                <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Policy Intake Form ── */}
      <section className="py-12 md:py-16 bg-secondary">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={intakeLeftRef} className="reveal reveal-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Personalized Intake</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Your <span className="text-primary">Policy Intake Form</span>
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                Our comprehensive intake form captures all the details we need to build your personalized strategy. Complete it once, and we'll create a roadmap tailored specifically to your policy and care situation.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { title: "Complete Policy Details", desc: "Capture your policy number, carrier, coverage dates, and benefit amounts" },
                  { title: "Organized Documentation", desc: "Store medical records, care assessments, and supporting documents in one secure location" },
                  { title: "Ready for Your Call", desc: "When you contact your insurance company, you'll have all the information they need" },
                ].map(({ title, desc }, i) => (
                  <div key={i} className="flex gap-4 group">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1 transition-transform duration-300 group-hover:scale-110" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">{title}</h3>
                      <p className="text-sm text-foreground/70">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="text-base px-8 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <Link href="/policy-form">Complete Your Intake Form</Link>
              </Button>
            </div>
            <div ref={intakeRightRef} className="relative hidden lg:block reveal reveal-right">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/intake-form-section-mZs4Ekm9teKNjUckYUJK2U.webp"
                alt="Care coordinator helping elderly couple complete their LTC insurance intake form at home"
                className="w-full h-auto rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-500 hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Customized Strategy ── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={stratLeftRef} className="relative hidden lg:block order-2 lg:order-1 reveal reveal-left">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/strategy-section-YfSApseWQYDU5UU6xzzqF3.webp"
                alt="Care coordinator presenting a personalized LTC strategy plan to a family on a tablet"
                className="w-full h-auto rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-500 hover:scale-[1.01]"
              />
            </div>
            <div ref={stratRightRef} className="order-1 lg:order-2 reveal reveal-right">
              <div className="inline-flex items-center gap-2 bg-teal/10 rounded-full px-4 py-2 mb-4">
                <Target className="w-4 h-4 text-teal" />
                <span className="text-sm font-medium text-teal-dark">Personalized Guidance</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Your <span className="text-teal">Customized Strategy</span>
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-4">
                Based on your specific policy details and care situation, we create a personalized, step-by-step strategy designed just for you. This roadmap guides you through every phase of the claims process with clarity and confidence.
              </p>
              <div className="space-y-4 mb-6">
                {[
                  { title: "Step-by-Step Roadmap", desc: "Know exactly what to do and when to do it, with clear milestones and timelines" },
                  { title: "Task Checklists", desc: "Track your progress with organized checklists for each phase of your claim" },
                  { title: "Policy-Specific Guidance", desc: "Recommendations tailored to your unique coverage and care needs" },
                ].map(({ title, desc }, i) => (
                  <div key={i} className="flex gap-4 group">
                    <Zap className="w-6 h-6 text-teal flex-shrink-0 mt-1 transition-transform duration-300 group-hover:scale-110" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-1 group-hover:text-teal transition-colors duration-300">{title}</h3>
                      <p className="text-sm text-foreground/70">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="text-base px-8 bg-teal hover:bg-teal-dark text-white shadow-lg hover:shadow-teal/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <Link href="/strategy">View My Strategy</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chat Support ── */}
      <section className="py-12 md:py-16 bg-secondary">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div ref={chatLeftRef} className="reveal reveal-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Always Available</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Live <span className="text-primary">Support Chat</span>
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                Have questions? Our intelligent support chat is available 24/7 to provide instant answers about your LTC insurance policy, claims process, and more.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Instant Responses", desc: "Get answers to common questions about LTC insurance and the claims process immediately" },
                  { title: "Available 24/7", desc: "Chat support is available whenever you need it, day or night, to answer your questions" },
                  { title: "Personalized Help", desc: "Get guidance specific to your situation and policy details" },
                ].map(({ title, desc }, i) => (
                  <div key={i} className="flex gap-4 group">
                    <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1 transition-transform duration-300 group-hover:scale-110" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">{title}</h3>
                      <p className="text-sm text-foreground/70">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div ref={chatRightRef} className="relative hidden lg:block reveal reveal-right">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-border hover:shadow-2xl transition-shadow duration-500">
                <div className="bg-primary/10 p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center pulse-glow">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">Support Chat</div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                        Always here to help
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs shadow-sm">What does ADL mean?</div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs shadow-sm">ADL stands for Activities of Daily Living. It includes bathing, dressing, eating, and more.</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs shadow-sm">How does this help my claim?</div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-xs shadow-sm">Insurance companies use ADL assessments to determine eligibility. We help you document these properly.</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-teal/10 rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div ref={storyLeftRef} className="reveal reveal-left relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl h-[400px] group">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/swQpXlcRmPQTVKfl.jpg"
                  alt="Elderly couple embracing a Visiting Angels care coordinator"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal/10 rounded-full -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-full -z-10" />
            </div>
            <div ref={storyRightRef} className="reveal reveal-right">
              <div className="inline-flex items-center gap-2 bg-teal/10 rounded-full px-4 py-2 mb-6">
                <Heart className="w-4 h-4 text-teal" />
                <span className="text-sm font-medium text-teal-dark">Real Families, Real Results</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                Our <span className="text-teal">Story</span>
              </h2>
              <div className="relative min-h-[200px] flex items-center">
                <Quote className="absolute top-0 left-0 w-10 h-10 text-teal/20" />
                {storyQuotes.map((quote, index) => (
                  <p
                    key={index}
                    className="absolute inset-0 flex items-center text-lg md:text-xl text-foreground/80 italic leading-relaxed pl-6"
                    style={{
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
                    className={`h-2.5 rounded-full transition-all duration-300 ${activeQuote === index ? "bg-teal w-6" : "bg-teal/30 hover:bg-teal/60 w-2.5"}`}
                    aria-label={`Quote ${index + 1}`}
                  />
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">— A Visiting Angels family</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About SC Visiting Angels ── */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-[#1a3a4a] to-[#2c5060] text-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div ref={aboutLeftRef} className="reveal reveal-left">
              <div className="inline-flex items-center gap-2 bg-teal/20 rounded-full px-4 py-2 mb-6">
                <Heart className="w-4 h-4 text-teal" />
                <span className="text-sm font-medium text-teal">About SC Visiting Angels</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-5 leading-tight">
                Compassionate Home Care<br className="hidden md:block" /> in the Upstate
              </h2>
              <p className="text-white/80 text-base leading-relaxed mb-5">
                SC Visiting Angels is a locally owned and operated home care agency serving families across the Upstate of South Carolina. For over a decade, we have helped seniors and their families navigate the challenges of aging at home — from personal care and companionship to specialized dementia support.
              </p>
              <p className="text-white/80 text-base leading-relaxed mb-8">
                Our caregivers are carefully selected, thoroughly trained, and deeply committed to treating every client with the dignity and respect they deserve. We believe that home is where healing happens best.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { stat: "10+", label: "Years Serving Upstate SC" },
                  { stat: "100%", label: "Locally Owned & Operated" },
                  { stat: "24/7", label: "On-Call Support" },
                  { stat: "Free", label: "In-Home Consultations" },
                ].map(({ stat, label }) => (
                  <div key={label} className="stat-card bg-white/10 rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-all duration-300">
                    <div className="text-2xl font-serif font-bold text-teal mb-1">{stat}</div>
                    <div className="text-xs text-white/70 leading-snug">{label}</div>
                  </div>
                ))}
              </div>
              <a
                href="https://www.scvisitingangels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal/30"
              >
                Learn More About Our Services
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div ref={aboutRightRef} className="relative reveal reveal-right">
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] group">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/swQpXlcRmPQTVKfl.jpg"
                  alt="SC Visiting Angels caregiver with client"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-teal/20 rounded-full -z-10" />
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full -z-10" />
              <div className="absolute bottom-6 right-6 bg-white text-slate-900 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 hover:shadow-2xl transition-shadow duration-300">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png" alt="SC Visiting Angels" className="w-8 h-8 object-contain" />
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">SC Visiting Angels</div>
                  <div className="text-xs text-slate-500">(864) 244-6300</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Scrolling Testimonials ── */}
      <section className="py-12 md:py-16 bg-secondary overflow-hidden">
        <div className="container mb-12">
          <div ref={testimonialsHeaderRef} className="reveal text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              What <span className="text-teal">Families</span> Are Saying
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from families who have successfully navigated the LTC insurance claims process with our help.
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none" />
          <div ref={scrollRef} className="flex gap-6 animate-scroll-left" style={{ width: "max-content" }}>
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div key={index} className="testimonial-card w-[380px] shrink-0 bg-white rounded-xl border border-border p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-4 italic">"{testimonial.text}"</p>
                <div className="border-t border-border pt-4">
                  <div className="font-serif font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.relation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four Steps ── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container">
          <div ref={stepsHeaderRef} className="reveal text-center mb-8 md:mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Four Simple <span className="text-primary">Steps</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From sign-up to claim approval — here's how we guide you through the process.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { num: "01", title: "Learn First", desc: "Start in the Education section to understand your policy, benefits, ADLs, and what to expect from the claims process.", color: "text-teal", bg: "hover:bg-teal/5", border: "border-transparent hover:border-teal/30" },
              { num: "02", title: "Complete the Form", desc: "Once you understand your policy, fill out our intake form with your specific insurance details and care needs.", color: "text-primary", bg: "hover:bg-primary/5", border: "border-transparent hover:border-primary/30" },
              { num: "03", title: "Get Your Strategy", desc: "Receive a customized, step-by-step claim filing strategy tailored to your specific policy and situation.", color: "text-teal", bg: "hover:bg-teal/5", border: "border-transparent hover:border-teal/30" },
              { num: "04", title: "File With Confidence", desc: "Follow your personalized guide to successfully submit your LTC insurance claim with everything in order.", color: "text-primary", bg: "hover:bg-primary/5", border: "border-transparent hover:border-primary/30" },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${i + 1} relative p-6 rounded-xl border ${step.bg} ${step.border} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg`}
              >
                <div className={`text-6xl font-serif font-bold ${step.color} opacity-20 mb-2`}>{step.num}</div>
                <h3 className="font-serif font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="parallax-section relative py-10 text-white" style={{ backgroundImage: "url('/manus-storage/strategy-hero_bcf2cf67.jpg')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2a3a]/90 to-teal-dark/85" />
        <div ref={ctaRef} className="reveal container relative text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Begin with our free Education section — it only takes a few minutes and will make completing the form much easier.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 bg-teal hover:bg-teal-dark text-white shadow-lg hover:shadow-teal/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/education">Start with Education <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 border-white/40 text-white hover:bg-white/15 bg-transparent transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/policy-form">Skip to Policy Form</Link>
            </Button>
          </div>
        </div>
      </section>

      <AboutHomeCare />
      <LegalDisclaimerFooter />
    </Layout>
  );
}
