import { useState } from "react";
import { LegalDisclaimerFooter } from '@/components/LegalDisclaimerFooter';
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { Layout } from "@/components/Layout";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { 
  BookOpen, CheckCircle, Info, Shield, Heart, Users, 
  ArrowRight, Sparkles, Brain, DollarSign, Clock, TrendingUp, 
  ChevronDown, Target, Award, FileText, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Education() {
  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const toggleGlossary = (index: number) => {
    setExpandedGlossary(expandedGlossary === index ? null : index);
  };

  const glossaryTerms = [
    { term: "Activities of Daily Living (ADLs)", def: "Six fundamental self-care activities: Bathing, Dressing, Toileting, Feeding, Continence, and Transferring. Most policies require 2-3 ADLs to be in deficit." },
    { term: "Elimination Period", def: "The number of service days you must pay out of pocket before your LTC policy begins to pay. This counts days of service, not calendar days since illness." },
    { term: "Daily Maximum", def: "The maximum amount the insurance company will pay per day of service. Any amount above this is the client's responsibility." },
    { term: "Monthly Maximum", def: "The maximum amount the insurance company will pay per month of service." },
    { term: "Lifetime Maximum", def: "The total amount the policy will pay over its entire lifetime. Once exhausted, no further benefits are available." },
    { term: "Claim / Pre-Claim Number", def: "When a claim is initiated, a pre-claim number is issued prior to approval. When approved, it becomes the actual claim number." },
    { term: "Case Manager", def: "Assigned by the LTC insurance company to determine approved hours of care. They monitor the case regularly and serve as your primary contact." },
    { term: "Third-Party Assessment", def: "An independent RN assessment to verify the patient's condition and ADL deficits. The assessor looks for inconsistencies between documentation and observed condition." },
    { term: "Waiver of Premium", def: "A policy feature that waives (stops) premium payments once care begins under the policy. Not all policies include this benefit." },
    { term: "Assignment of Benefits (AOB)", def: "Directs the insurance company to send payment directly to the care provider instead of the insured. This means the provider submits claims and gets paid directly." },
  ];

  const strategySteps = [
    {
      num: 1,
      title: "Complete Your Intake Form",
      desc: "Gather your policy details, coverage information, and care situation",
      icon: FileText,
      color: "text-teal"
    },
    {
      num: 2,
      title: "Our System Analyzes Your Policy",
      desc: "We review your specific policy terms, benefits, and requirements",
      icon: Brain,
      color: "text-primary"
    },
    {
      num: 3,
      title: "Generate Your Custom Strategy",
      desc: "Receive a personalized roadmap tailored to your exact situation",
      icon: Target,
      color: "text-teal"
    },
    {
      num: 4,
      title: "Execute Your Plan",
      desc: "Follow step-by-step guidance to file your claim successfully",
      icon: CheckCircle,
      color: "text-primary"
    },
  ];

  const ltcProcessSteps = [
    {
      phase: "Before Filing",
      items: [
        "Request claims packet from insurance company",
        "Gather all medical documentation",
        "Begin care services with qualified provider",
        "Document ADL deficits thoroughly"
      ],
      icon: Clock,
      color: "teal"
    },
    {
      phase: "During Filing",
      items: [
        "Complete claim packet comprehensively",
        "Submit all documents in one package",
        "Prepare for third-party assessment",
        "Maintain detailed care logs"
      ],
      icon: FileText,
      color: "primary"
    },
    {
      phase: "After Approval",
      items: [
        "Submit monthly invoices and logs",
        "Track benefit usage and maximums",
        "Maintain ongoing communication",
        "Plan for long-term care needs"
      ],
      icon: TrendingUp,
      color: "teal"
    },
  ];

  return (
    <Layout>
      {/* Hero Section - Matching Home Page Style */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/lSMqOjgOjuvfRlJs.jpg" 
            alt="" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2a3a]/85 via-[#1a2a3a]/70 to-[#1a2a3a]/50" />
        </div>
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-teal/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-teal/30">
              <BookOpen className="w-4 h-4 text-teal-light" />
              <span className="text-sm text-white/90">Education & Resources</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Master Your <span className="text-teal">LTC Insurance</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
              Learn how long-term care insurance works, understand key definitions, and discover how we create your personalized strategy.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="text-base px-8 bg-teal hover:bg-teal-dark text-white">
                <Link href="/policy-form">Start Your Strategy</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 border-white/30 text-white hover:bg-white/10 bg-transparent">
                <a href="#definitions">Learn Definitions</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: How LTC Insurance Works */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How LTC Insurance <span className="text-teal">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Understanding the three phases of your long-term care insurance journey helps you prepare effectively and avoid costly mistakes.
            </p>
          </div>

          {/* Three Phase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {ltcProcessSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="group p-6 rounded-xl border border-border bg-white hover:shadow-lg hover:border-teal/30 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                    step.color === 'teal' ? 'bg-teal/10 text-teal group-hover:bg-teal/20' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                  }`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-3 text-foreground">{step.phase}</h3>
                  <ul className="space-y-2">
                    {step.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Video Explainer */}
          <div className="mb-16 rounded-2xl overflow-hidden shadow-lg">
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <video
                className="absolute top-0 left-0 w-full h-full"
                controls
                poster="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/ltc-insurance-works_95cb03b4.mp4?t=1"
              >
                <source
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/ltc-insurance-works_95cb03b4.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="bg-white p-6">
              <h3 className="font-serif font-bold text-xl text-foreground mb-2">Watch: How LTC Insurance Works</h3>
              <p className="text-muted-foreground">A quick overview of the three phases of the LTC insurance claims process: Before Filing, During Filing, and After Approval.</p>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="bg-secondary rounded-2xl p-8 md:p-12">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              Key Concepts to Understand
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: DollarSign,
                  title: "Coverage Amounts",
                  desc: "Policies specify daily, monthly, or lifetime maximums for what they'll pay toward care costs.",
                  color: "text-teal"
                },
                {
                  icon: Clock,
                  title: "Elimination Period",
                  desc: "You pay out-of-pocket for a set number of days before insurance begins paying benefits.",
                  color: "text-primary"
                },
                {
                  icon: Heart,
                  title: "ADL Requirements",
                  desc: "Most policies require deficits in 2-3 Activities of Daily Living to trigger benefits.",
                  color: "text-teal"
                },
                {
                  icon: Shield,
                  title: "Financial Protection",
                  desc: "LTC insurance protects your assets from devastating care costs that can exceed $100K annually.",
                  color: "text-primary"
                },
              ].map((concept, i) => {
                const Icon = concept.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <Icon className={`w-6 h-6 ${concept.color} flex-shrink-0 mt-1`} />
                    <div>
                      <h4 className="font-serif font-bold text-foreground mb-2">{concept.title}</h4>
                      <p className="text-sm text-muted-foreground">{concept.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Definitions */}
      <section className="py-20 bg-white" id="definitions">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Key <span className="text-teal">Definitions</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Master the terminology you'll encounter throughout your LTC insurance journey. Click any term to expand and learn more.
            </p>
          </div>

          {/* Video Explainer - Understanding ADLs */}
          <div className="mb-16 rounded-2xl overflow-hidden shadow-lg">
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <video
                className="absolute top-0 left-0 w-full h-full"
                controls
                poster="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/understanding-adls_35b7f167.mp4?t=1"
              >
                <source
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/understanding-adls_35b7f167.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="bg-white p-6">
              <h3 className="font-serif font-bold text-xl text-foreground mb-2">Watch: Understanding Activities of Daily Living (ADLs)</h3>
              <p className="text-muted-foreground">Learn about the six ADLs that form the foundation of your LTC insurance claim: Bathing, Dressing, Toileting, Feeding, Continence, and Transferring.</p>
            </div>
          </div>

          {/* Glossary Accordion */}
          <div className="max-w-4xl mx-auto space-y-3">
            {glossaryTerms.map((item, i) => (
              <div
                key={i}
                onClick={() => toggleGlossary(i)}
                className="cursor-pointer group"
              >
                <div className={`p-4 rounded-lg border transition-all duration-300 ${
                  expandedGlossary === i 
                    ? "bg-white border-teal/50 shadow-md" 
                    : "bg-white border-border hover:border-teal/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-serif font-bold transition-colors ${
                      expandedGlossary === i ? "text-teal" : "text-foreground group-hover:text-teal"
                    }`}>
                      {item.term}
                    </h4>
                    <ChevronDown className={`w-5 h-5 text-teal transition-transform duration-300 ${
                      expandedGlossary === i ? "rotate-180" : ""
                    }`} />
                  </div>
                  {expandedGlossary === i && (
                    <div className="mt-4 pt-4 border-t border-teal/20 animate-in fade-in slide-in-from-top-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.def}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-12 p-6 bg-secondary rounded-xl border border-border">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-teal flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-foreground mb-2">Pro Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Print or bookmark this glossary. You'll want to reference these terms when reviewing your policy documents and communicating with your insurance company.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How Strategy Creation Works */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How We Create Your <span className="text-teal">Strategy</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our intelligent system analyzes your unique policy and situation to generate a personalized, step-by-step action plan.
            </p>
          </div>

          {/* Strategy Steps */}
          <div className="max-w-4xl mx-auto space-y-4 mb-12">
            {strategySteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className="cursor-pointer group"
                >
                  <div className={`p-6 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "bg-white border-teal/50 shadow-md"
                      : "bg-white border-border hover:border-teal/30"
                  }`}>
                    <div className="flex items-start gap-6">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg transition-all ${
                        isActive
                          ? "bg-teal text-white"
                          : "bg-secondary text-foreground"
                      }`}>
                        {step.num}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-serif text-xl font-bold transition-colors ${
                          isActive ? "text-teal" : "text-foreground"
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                        
                        {isActive && (
                          <div className="mt-4 pt-4 border-t border-teal/20 animate-in fade-in slide-in-from-top-2">
                            <p className="text-sm font-semibold text-foreground mb-3">What happens in this step:</p>
                            <ul className="space-y-2">
                              {step.num === 1 && (
                                <>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Enter your policy number and carrier information
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Describe your current care situation
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Share relevant medical and care details
                                  </li>
                                </>
                              )}
                              {step.num === 2 && (
                                <>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Our system reads your policy terms
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Identifies coverage limits and requirements
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Analyzes your specific situation
                                  </li>
                                </>
                              )}
                              {step.num === 3 && (
                                <>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Receive a customized action plan
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Get specific timelines and milestones
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Access policy-specific guidance
                                  </li>
                                </>
                              )}
                              {step.num === 4 && (
                                <>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Follow your personalized roadmap
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    Track your progress with checklists
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                                    File your claim with confidence
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-all ${
                        isActive ? "text-teal rotate-90" : "text-muted-foreground"
                      }`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Why This Approach Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Intelligent Analysis",
                desc: "Our system understands LTC insurance complexity and applies it to your specific situation.",
                color: "text-teal"
              },
              {
                icon: Target,
                title: "Personalized Guidance",
                desc: "No generic advice—your strategy is tailored to your policy terms and care needs.",
                color: "text-primary"
              },
              {
                icon: Award,
                title: "Proven Success",
                desc: "Families using our strategies experience faster approvals and fewer denials.",
                color: "text-teal"
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-xl border border-border bg-white hover:shadow-lg hover:border-teal/30 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors ${benefit.color === 'text-teal' ? 'bg-teal/10 text-teal group-hover:bg-teal/20' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Metrics Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our <span className="text-teal">Track Record</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Families across the country trust us to guide them through the LTC insurance claims process. Here's what we've accomplished together.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <AnimatedCounter
              end={500}
              duration={2500}
              label="Families Helped"
              suffix="+"
            />
            <AnimatedCounter
              end={95}
              duration={2500}
              label="Claims Approved"
              suffix="%"
            />
            <AnimatedCounter
              end={30}
              duration={2500}
              label="Average Days to Approval"
              suffix=" days"
            />
          </div>

          {/* Metrics Description Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Trusted by Families",
                desc: "Families nationwide rely on our platform to navigate the complex LTC insurance claims process with confidence.",
                color: "text-teal"
              },
              {
                icon: CheckCircle,
                title: "High Success Rate",
                desc: "Our personalized strategies and expert guidance result in significantly higher approval rates compared to industry averages.",
                color: "text-primary"
              },
              {
                icon: TrendingUp,
                title: "Faster Approvals",
                desc: "By organizing documentation and following our proven process, families get their claims approved faster.",
                color: "text-teal"
              },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-xl border border-border bg-white hover:shadow-lg hover:border-teal/30 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                    metric.color === 'text-teal' ? 'bg-teal/10 text-teal group-hover:bg-teal/20' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                  }`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-3 text-foreground">{metric.title}</h3>
                  <p className="text-sm text-muted-foreground">{metric.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Home Care */}
      <AboutHomeCare />

      {/* Resources Reference Section — anchors used by ChronologicalChecklist document links */}
      <section className="py-16 bg-white" id="resources">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              LTC Insurance <span className="text-teal">Resource Library</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Quick-reference guides for the most common documents and processes in your LTC insurance claim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: "plan-of-care", title: "Plan of Care", desc: "A Plan of Care is a written document prepared by a licensed healthcare professional that outlines the specific care services needed, frequency, and goals. Most LTC carriers require a current Plan of Care to initiate and maintain benefits." },
              { id: "poa", title: "Power of Attorney (POA)", desc: "A legal document granting a designated person authority to act on behalf of the insured in financial and/or healthcare matters. Many carriers require a copy on file before discussing the policy with anyone other than the insured." },
              { id: "aob", title: "Assignment of Benefits (AOB)", desc: "An AOB directs the insurance company to pay the care provider directly rather than reimbursing the insured. This simplifies billing but means the provider submits claims and receives payment on your behalf." },
              { id: "hipaa", title: "HIPAA Authorization", desc: "A HIPAA release form allows your healthcare providers to share medical information with the insurance company and its representatives. This is required for the carrier to verify your condition and approve benefits." },
              { id: "claim-form", title: "Claim Form Guide", desc: "The initial claim packet typically includes a claimant statement, attending physician statement, and functional assessment. Completing these accurately and completely is critical to avoiding delays or denials." },
              { id: "elimination-period", title: "Elimination Period", desc: "The elimination period is the number of qualifying service days you must pay out-of-pocket before insurance benefits begin. Days are counted only when qualifying care is received — not calendar days. Keep detailed records of every care day." },
              { id: "care-logs", title: "Care Logs & Log Sheets", desc: "Many carriers require ongoing documentation of care services provided, including date, time, caregiver name, and services rendered. These logs support continued benefit payments and protect against audits." },
              { id: "invoicing", title: "Invoicing & Billing", desc: "Invoices must typically show the provider name, date of service, type of service, hours, and rate. Some carriers have specific invoice formats. Delays in submitting invoices can delay reimbursement." },
              { id: "appeals", title: "Appeals Process", desc: "If a claim is denied or benefits are reduced, you have the right to appeal. The appeals process typically involves submitting additional medical documentation, a written statement, and sometimes an independent assessment. Timelines vary by carrier." },
              { id: "assessment", title: "Third-Party Assessment", desc: "An independent RN or assessor evaluates the insured's condition and ADL deficits. The assessor looks for consistency between medical records, physician statements, and observed function. Preparation and honest documentation are key." },
              { id: "waiver", title: "Waiver of Premium", desc: "When active on claim, the waiver of premium benefit suspends your premium payments. Not all policies include this feature. Contact your carrier to confirm when the waiver activates and whether it applies retroactively." },
              { id: "inflation", title: "Inflation Rider / Protection", desc: "An inflation rider increases your benefit amounts annually (typically 3–5% compound or simple interest) to help keep pace with rising care costs. Check your policy for the specific percentage and whether it is simple or compound growth." },
              { id: "glossary", title: "Full Glossary", desc: "See the Key Definitions section above for a complete glossary of LTC insurance terms including ADLs, Elimination Period, Daily Maximum, Lifetime Maximum, Claim Number, Case Manager, and more." },
            ].map((item) => (
              <div key={item.id} id={item.id} className="p-5 rounded-xl border border-border bg-white hover:shadow-md hover:border-teal/30 transition-all duration-300 scroll-mt-24">
                <h3 className="font-serif font-bold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal flex-shrink-0" />
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Matching Home Page Style */}
      <section
        className="parallax-section relative py-20 text-white"
        style={{
          backgroundImage: "url('/manus-storage/education-hero_6c3e985b.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-dark/90 via-primary/85 to-[#1a2a3a]/90" />
        <div className="container relative text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Create Your Strategy?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Now that you understand how LTC insurance works, complete your policy form to generate your personalized action plan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 bg-white text-teal-dark hover:bg-white/90">
              <Link href="/policy-form">
                Start Your Strategy <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 border-white/40 text-white hover:bg-white/10 bg-transparent">
              <Link href="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
          <LegalDisclaimerFooter />
    </Layout>
  );
}
