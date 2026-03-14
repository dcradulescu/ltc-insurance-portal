import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, AlertTriangle, CheckCircle, Info, Shield, Heart, Users, 
  ArrowRight, Sparkles, Brain, DollarSign, Clock, TrendingUp, Lightbulb, 
  Lock, ChevronDown, Zap, Target, Award, FileText, Layers, Workflow
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
      color: "from-orange-400 to-red-500"
    },
    {
      num: 2,
      title: "Our System Analyzes Your Policy",
      desc: "We review your specific policy terms, benefits, and requirements",
      icon: Brain,
      color: "from-blue-400 to-cyan-500"
    },
    {
      num: 3,
      title: "Generate Your Custom Strategy",
      desc: "Receive a personalized roadmap tailored to your exact situation",
      icon: Target,
      color: "from-green-400 to-emerald-500"
    },
    {
      num: 4,
      title: "Execute Your Plan",
      desc: "Follow step-by-step guidance to file your claim successfully",
      icon: CheckCircle,
      color: "from-purple-400 to-pink-500"
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
      color: "from-teal-400 to-cyan-500",
      bgColor: "from-teal-50 to-cyan-50"
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
      color: "from-blue-400 to-indigo-500",
      bgColor: "from-blue-50 to-indigo-50"
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
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50"
    },
  ];

  return (
    <Layout>
      {/* Hero Section - Enhanced with Vibrant Gradient */}
      <section className="relative text-white py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/PwkXeMqqVgTuSYuq.jpg" 
            alt="" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/95" />
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 via-blue-600/10 to-purple-600/20" />
        </div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-teal-400/40 to-cyan-400/40 rounded-full border border-teal-300/60 backdrop-blur-sm">
              <span className="text-teal-100 text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> EDUCATION CENTER
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              Master LTC Insurance
            </h1>
            <p className="text-xl text-white/85 mb-8 leading-relaxed">
              Learn how long-term care insurance works, understand key definitions, and discover how we create your personalized strategy.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: How LTC Insurance Works */}
      <section className="py-24 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="mb-20">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full text-teal-700 text-sm font-bold">
              SECTION 1
            </div>
            <h2 className="font-serif text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              How LTC Insurance Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Understanding the three phases of your long-term care insurance journey helps you prepare effectively and avoid costly mistakes.
            </p>
          </div>

          {/* Visual Process Flow with Gradient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {ltcProcessSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative group">
                  {/* Connector Line */}
                  {idx < ltcProcessSteps.length - 1 && (
                    <div className="hidden md:block absolute top-24 -right-4 w-8 h-1 bg-gradient-to-r from-teal-400 to-transparent" />
                  )}
                  
                  <div className="relative">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${step.color} rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300`} />
                    <div className={`relative bg-gradient-to-br ${step.bgColor} rounded-2xl p-8 border border-white/50 backdrop-blur-sm`}>
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-slate-900 mb-4">
                        {step.phase}
                      </h3>
                      <ul className="space-y-3">
                        {step.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Concepts Grid with Vibrant Colors */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-12 border border-slate-700/50 shadow-2xl">
            <h3 className="font-serif text-3xl font-bold text-white mb-12">
              Key Concepts to Understand
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: DollarSign,
                  title: "Coverage Amounts",
                  desc: "Policies specify daily, monthly, or lifetime maximums for what they'll pay toward care costs.",
                  color: "from-orange-400 to-red-500"
                },
                {
                  icon: Clock,
                  title: "Elimination Period",
                  desc: "You pay out-of-pocket for a set number of days before insurance begins paying benefits.",
                  color: "from-yellow-400 to-orange-500"
                },
                {
                  icon: Heart,
                  title: "ADL Requirements",
                  desc: "Most policies require deficits in 2-3 Activities of Daily Living to trigger benefits.",
                  color: "from-pink-400 to-rose-500"
                },
                {
                  icon: Shield,
                  title: "Financial Protection",
                  desc: "LTC insurance protects your assets from devastating care costs that can exceed $100K annually.",
                  color: "from-blue-400 to-cyan-500"
                },
              ].map((concept, i) => {
                const Icon = concept.icon;
                return (
                  <div key={i} className="group relative">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${concept.color} rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300`} />
                    <div className="relative bg-slate-800 rounded-xl p-6 flex gap-4 border border-slate-700/50">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${concept.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">{concept.title}</h4>
                        <p className="text-sm text-slate-300">{concept.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Definitions */}
      <section className="py-24 bg-gradient-to-b from-white via-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="mb-20">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-blue-700 text-sm font-bold">
              SECTION 2
            </div>
            <h2 className="font-serif text-5xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Key Definitions
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Master the terminology you'll encounter throughout your LTC insurance journey. Click any term to expand and learn more.
            </p>
          </div>

          {/* Interactive Glossary with Gradient Accents */}
          <div className="space-y-3 max-w-4xl">
            {glossaryTerms.map((item, i) => (
              <div
                key={i}
                onClick={() => toggleGlossary(i)}
                className="cursor-pointer group"
              >
                <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  expandedGlossary === i 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-lg" 
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${
                        expandedGlossary === i 
                          ? "from-blue-500 to-indigo-500" 
                          : "from-slate-300 to-slate-200"
                      } transition-all`} />
                      <h4 className={`font-semibold text-lg transition-colors ${
                        expandedGlossary === i ? "text-blue-700" : "text-slate-900 group-hover:text-blue-600"
                      }`}>
                        {item.term}
                      </h4>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform duration-300 ${
                      expandedGlossary === i ? "rotate-180" : ""
                    }`} />
                  </div>
                  {expandedGlossary === i && (
                    <div className="mt-4 pt-4 border-t border-blue-200 animate-in fade-in slide-in-from-top-2">
                      <p className="text-slate-700 leading-relaxed">{item.def}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip Box with Gradient */}
          <div className="mt-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 border border-blue-400/50 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Pro Tip</h4>
                <p className="text-blue-50">
                  Print or bookmark this glossary. You'll want to reference these terms when reviewing your policy documents and communicating with your insurance company.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How Strategy Creation Works */}
      <section className="py-24 bg-gradient-to-b from-white via-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="mb-20">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full text-green-700 text-sm font-bold">
              SECTION 3
            </div>
            <h2 className="font-serif text-5xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent mb-4">
              How We Create Your Strategy
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl">
              Our intelligent system analyzes your unique policy and situation to generate a personalized, step-by-step action plan.
            </p>
          </div>

          {/* Interactive Strategy Steps with Vibrant Gradients */}
          <div className="space-y-6 mb-20">
            {strategySteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className="cursor-pointer group"
                >
                  <div className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${step.color} shadow-2xl border-opacity-0`
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg"
                  }`}>
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all font-bold text-lg ${
                        isActive
                          ? "bg-white/30 text-white shadow-lg"
                          : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700"
                      }`}>
                        {step.num}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-serif text-2xl font-bold ${isActive ? "text-white" : "text-slate-900"}`}>
                            {step.title}
                          </h3>
                        </div>
                        <p className={`${isActive ? "text-white/90" : "text-slate-600"}`}>{step.desc}</p>
                        
                        {isActive && (
                          <div className="mt-6 pt-6 border-t border-white/20 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                              <p className="text-sm text-white font-medium mb-3">What happens in this step:</p>
                              <ul className="space-y-2">
                                {step.num === 1 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Enter your policy number and carrier information
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Describe your current care situation
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Share relevant medical and care details
                                    </li>
                                  </>
                                )}
                                {step.num === 2 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Our system reads your policy terms
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Identifies coverage limits and requirements
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Analyzes your specific situation
                                    </li>
                                  </>
                                )}
                                {step.num === 3 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Receive a customized action plan
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Get specific timelines and milestones
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Access policy-specific guidance
                                    </li>
                                  </>
                                )}
                                {step.num === 4 && (
                                  <>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Follow your personalized roadmap
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                                      Track your progress with checklists
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-white/90">
                                      <CheckCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
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
                        isActive ? "text-white rotate-90" : "text-slate-400"
                      }`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Why This Approach Works - Colorful Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "Intelligent Analysis",
                desc: "Our system understands LTC insurance complexity and applies it to your specific situation.",
                color: "from-purple-400 to-pink-500"
              },
              {
                icon: Target,
                title: "Personalized Guidance",
                desc: "No generic advice—your strategy is tailored to your policy terms and care needs.",
                color: "from-green-400 to-emerald-500"
              },
              {
                icon: Award,
                title: "Proven Success",
                desc: "Families using our strategies experience faster approvals and fewer denials.",
                color: "from-yellow-400 to-orange-500"
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="group relative">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${benefit.color} rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300`} />
                  <Card className="relative p-8 text-center bg-white hover:shadow-xl transition-all border-0">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${benefit.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">{benefit.title}</h4>
                    <p className="text-sm text-slate-600">{benefit.desc}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Vibrant Gradient */}
      <section className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 py-20 shadow-2xl">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            Ready to Create Your Strategy?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
            Now that you understand how LTC insurance works, complete your policy form to generate your personalized action plan.
          </p>
          <Button className="bg-white text-teal-600 hover:bg-slate-100 text-white gap-2 size-lg font-semibold shadow-lg hover:shadow-xl transition-all">
            <Target className="w-5 h-5" /> Start Your Policy Form
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
}
