import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, AlertTriangle, CheckCircle, Info, Shield, Heart, Users, 
  ArrowRight, Sparkles, Brain, DollarSign, Clock, TrendingUp, Lightbulb, 
  Lock, ChevronDown, Zap, Target, Award, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      color: "teal"
    },
    {
      num: 2,
      title: "Our System Analyzes Your Policy",
      desc: "We review your specific policy terms, benefits, and requirements",
      icon: Brain,
      color: "blue"
    },
    {
      num: 3,
      title: "Generate Your Custom Strategy",
      desc: "Receive a personalized roadmap tailored to your exact situation",
      icon: Target,
      color: "green"
    },
    {
      num: 4,
      title: "Execute Your Plan",
      desc: "Follow step-by-step guidance to file your claim successfully",
      icon: CheckCircle,
      color: "purple"
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
      color: "blue"
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
      color: "green"
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative text-white py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/PwkXeMqqVgTuSYuq.jpg" 
            alt="" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a4a]/95 to-[#1a2a3a]/90" />
        </div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <div className="inline-block mb-6 px-4 py-2 bg-teal/30 rounded-full border border-teal/60 backdrop-blur-sm">
              <span className="text-teal-light text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> EDUCATION CENTER
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Master LTC Insurance
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Learn how long-term care insurance works, understand key definitions, and discover how we create your personalized strategy.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: How LTC Insurance Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <div className="inline-block mb-4 px-3 py-1 bg-teal/20 rounded-full text-teal text-sm font-semibold">
              SECTION 1
            </div>
            <h2 className="font-serif text-5xl font-bold text-foreground mb-4">
              How LTC Insurance Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Understanding the three phases of your long-term care insurance journey helps you prepare effectively and avoid costly mistakes.
            </p>
          </div>

          {/* Visual Process Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {ltcProcessSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  {/* Connector Line */}
                  {idx < ltcProcessSteps.length - 1 && (
                    <div className="hidden md:block absolute top-24 -right-4 w-8 h-1 bg-gradient-to-r from-teal to-transparent" />
                  )}
                  
                  <div className="group">
                    <div className={`absolute -top-6 -left-6 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-${step.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <Card className={`p-8 border-t-4 border-t-${step.color} bg-gradient-to-br from-${step.color}/5 to-transparent hover:shadow-xl transition-all`}>
                      <h3 className="font-serif text-2xl font-bold text-foreground mb-6 mt-4">
                        {step.phase}
                      </h3>
                      <ul className="space-y-4">
                        {step.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className={`w-5 h-5 text-${step.color} flex-shrink-0 mt-0.5`} />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Concepts Grid */}
          <div className="bg-gradient-to-br from-teal/5 to-blue/5 rounded-2xl p-12 border border-teal/20">
            <h3 className="font-serif text-3xl font-bold text-foreground mb-12">
              Key Concepts to Understand
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: DollarSign,
                  title: "Coverage Amounts",
                  desc: "Policies specify daily, monthly, or lifetime maximums for what they'll pay toward care costs."
                },
                {
                  icon: Clock,
                  title: "Elimination Period",
                  desc: "You pay out-of-pocket for a set number of days before insurance begins paying benefits."
                },
                {
                  icon: Heart,
                  title: "ADL Requirements",
                  desc: "Most policies require deficits in 2-3 Activities of Daily Living to trigger benefits."
                },
                {
                  icon: Shield,
                  title: "Financial Protection",
                  desc: "LTC insurance protects your assets from devastating care costs that can exceed $100K annually."
                },
              ].map((concept, i) => {
                const Icon = concept.icon;
                return (
                  <div key={i} className="flex gap-4 p-6 bg-white rounded-xl hover:shadow-lg transition-all">
                    <Icon className="w-8 h-8 text-teal flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">{concept.title}</h4>
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
      <section className="py-20 bg-gradient-to-b from-muted/30 to-white">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <div className="inline-block mb-4 px-3 py-1 bg-blue/20 rounded-full text-blue text-sm font-semibold">
              SECTION 2
            </div>
            <h2 className="font-serif text-5xl font-bold text-foreground mb-4">
              Key Definitions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Master the terminology you'll encounter throughout your LTC insurance journey. Click any term to expand and learn more.
            </p>
          </div>

          {/* Interactive Glossary */}
          <div className="space-y-3 max-w-4xl">
            {glossaryTerms.map((item, i) => (
              <div
                key={i}
                onClick={() => toggleGlossary(i)}
                className="cursor-pointer group"
              >
                <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  expandedGlossary === i 
                    ? "bg-blue/10 border-blue/50 shadow-lg" 
                    : "bg-white border-muted/30 hover:border-blue/30 hover:shadow-md"
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold text-lg transition-colors ${
                      expandedGlossary === i ? "text-blue" : "text-foreground group-hover:text-blue"
                    }`}>
                      {item.term}
                    </h4>
                    <ChevronDown className={`w-5 h-5 text-blue transition-transform duration-300 ${
                      expandedGlossary === i ? "rotate-180" : ""
                    }`} />
                  </div>
                  {expandedGlossary === i && (
                    <div className="mt-4 pt-4 border-t border-blue/20 animate-in fade-in slide-in-from-top-2">
                      <p className="text-muted-foreground leading-relaxed">{item.def}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reference Box */}
          <div className="mt-16 bg-gradient-to-r from-blue/10 to-teal/10 rounded-2xl p-8 border border-blue/20">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-blue flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">Pro Tip</h4>
                <p className="text-muted-foreground">
                  Print or bookmark this glossary. You'll want to reference these terms when reviewing your policy documents and communicating with your insurance company.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How Strategy Creation Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <div className="inline-block mb-4 px-3 py-1 bg-green/20 rounded-full text-green text-sm font-semibold">
              SECTION 3
            </div>
            <h2 className="font-serif text-5xl font-bold text-foreground mb-4">
              How We Create Your Strategy
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Our intelligent system analyzes your unique policy and situation to generate a personalized, step-by-step action plan.
            </p>
          </div>

          {/* Interactive Strategy Steps */}
          <div className="space-y-6 mb-16">
            {strategySteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className="cursor-pointer group"
                >
                  <div className={`p-8 rounded-xl border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-green/10 to-teal/10 border-green/50 shadow-lg"
                      : "bg-white border-muted/30 hover:border-green/30 hover:shadow-md"
                  }`}>
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive
                          ? "bg-green text-white scale-110"
                          : "bg-muted text-muted-foreground group-hover:bg-green/20"
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-sm font-bold ${isActive ? "text-green" : "text-muted-foreground"}`}>
                            STEP {step.num}
                          </span>
                          <h3 className={`font-serif text-2xl font-bold ${isActive ? "text-green" : "text-foreground"}`}>
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground">{step.desc}</p>
                        
                        {isActive && (
                          <div className="mt-6 pt-6 border-t border-green/20 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-green/5 rounded-lg p-4 border border-green/20">
                              <p className="text-sm text-foreground font-medium mb-3">What happens in this step:</p>
                              <ul className="space-y-2">
                                {step.num === 1 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Enter your policy number and carrier information
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Describe your current care situation
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Share relevant medical and care details
                                    </li>
                                  </>
                                )}
                                {step.num === 2 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Our system reads your policy terms
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Identifies coverage limits and requirements
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Analyzes your specific situation
                                    </li>
                                  </>
                                )}
                                {step.num === 3 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Receive a customized action plan
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Get specific timelines and milestones
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Access policy-specific guidance
                                    </li>
                                  </>
                                )}
                                {step.num === 4 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Follow your personalized roadmap
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      Track your progress with checklists
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                                      File your claim with confidence
                                    </li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                      <ArrowRight className={`w-6 h-6 transition-all ${
                        isActive ? "text-green rotate-90" : "text-muted-foreground"
                      }`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Why This Approach Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "Intelligent Analysis",
                desc: "Our system understands LTC insurance complexity and applies it to your specific situation."
              },
              {
                icon: Target,
                title: "Personalized Guidance",
                desc: "No generic advice—your strategy is tailored to your policy terms and care needs."
              },
              {
                icon: Award,
                title: "Proven Success",
                desc: "Families using our strategies experience faster approvals and fewer denials."
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <Card key={i} className="p-6 text-center hover:shadow-lg transition-all">
                  <Icon className="w-10 h-10 text-green mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal/10 to-green/10 py-16 border-t border-teal/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-foreground mb-4">
            Ready to Create Your Strategy?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Now that you understand how LTC insurance works, complete your policy form to generate your personalized action plan.
          </p>
          <Button className="bg-teal hover:bg-teal/90 text-white gap-2 size-lg">
            <Target className="w-5 h-5" /> Start Your Policy Form
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
}
