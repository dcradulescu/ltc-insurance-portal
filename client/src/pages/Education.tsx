import { useState } from "react";
import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, AlertTriangle, CheckCircle, Info, FileText, Heart, Shield, ClipboardList, 
  Phone, Users, Lightbulb, TrendingUp, Lock, Clock, ChevronDown, Zap, Target, Award,
  ArrowRight, Sparkles, Brain, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Education() {
  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(0);
  const [selectedADL, setSelectedADL] = useState<number | null>(null);
  const [completedTips, setCompletedTips] = useState<Set<number>>(new Set());

  const toggleGlossary = (index: number) => {
    setExpandedGlossary(expandedGlossary === index ? null : index);
  };

  const toggleTip = (index: number) => {
    const newCompleted = new Set(completedTips);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTips(newCompleted);
  };

  const adls = [
    { name: "Bathing", icon: "🚿", desc: "Washing oneself, including getting in/out of tub or shower", details: "This includes washing the entire body and managing water temperature." },
    { name: "Dressing", icon: "👔", desc: "Putting on and taking off clothing and fasteners", details: "Includes selecting appropriate clothing and managing buttons, zippers, and fasteners." },
    { name: "Eating/Feeding", icon: "🍽️", desc: "Feeding oneself from plate to mouth", details: "The ability to pick up utensils and bring food to mouth independently." },
    { name: "Toileting", icon: "🚽", desc: "Using the toilet and performing hygiene", details: "Includes getting to the toilet, using it, and performing personal hygiene." },
    { name: "Transferring", icon: "🪑", desc: "Moving in/out of bed, chair, or wheelchair", details: "The ability to move from one position to another independently." },
    { name: "Continence", icon: "💧", desc: "Controlling bowel/bladder or performing hygiene", details: "Managing urinary and bowel control, or performing necessary hygiene." },
  ];

  const glossaryTerms = [
    { term: "Claim / Pre-Claim Number", def: "When a claim is initiated, a pre-claim number is issued prior to approval. When approved, it becomes the actual claim number." },
    { term: "Elimination Period", def: "The number of service days you must pay out of pocket before your LTC policy begins to pay. This counts days of service, not calendar days since illness." },
    { term: "Daily Maximum", def: "The maximum amount the insurance company will pay per day of service. Any amount above this is the client's responsibility." },
    { term: "Monthly Maximum", def: "The maximum amount the insurance company will pay per month of service." },
    { term: "Lifetime Maximum", def: "The total amount the policy will pay over its entire lifetime. Once exhausted, no further benefits are available." },
    { term: "Activities of Daily Living (ADLs)", def: "Six fundamental self-care activities: Bathing, Dressing, Toileting, Feeding, Continence, and Transferring. Most policies require 2-3 ADLs to be in deficit." },
    { term: "Case Manager", def: "Assigned by the LTC insurance company to determine approved hours of care. They monitor the case regularly and serve as your primary contact." },
    { term: "Third-Party Assessment", def: "An independent RN assessment to verify the patient's condition and ADL deficits. The assessor looks for inconsistencies between documentation and observed condition." },
    { term: "Waiver of Premium", def: "A policy feature that waives (stops) premium payments once care begins under the policy. Not all policies include this benefit." },
    { term: "Payment Cycle", def: "The review cycle for invoices and logsheets — typically monthly or at another interval set by the LTC company." },
    { term: "CNA (Certified Nursing Assistant)", def: "Some LTC companies require a CNA to provide care, or the care may be disallowed. Check your policy requirements." },
    { term: "Assignment of Benefits (AOB)", def: "Directs the insurance company to send payment directly to the care provider instead of the insured. This means the provider submits claims and gets paid directly." },
    { term: "Plan of Care", def: "A documented plan outlining the care services needed, typically created by a healthcare provider. Required for most LTC insurance claims." },
    { term: "Power of Attorney (POA)", def: "A legal document authorizing someone to act on behalf of the insured person in legal and financial matters, including insurance claims." },
    { term: "Cognitive Impairment Trigger", def: "Some policies allow benefits to be triggered by cognitive impairment (e.g., Alzheimer's, dementia) even if physical ADLs are not in deficit." },
  ];

  const dos = [
    "Read your entire policy before starting the claims process",
    "Request the claims packet by mail — do NOT initiate the claim over the phone",
    "Gather ALL documentation before submitting anything",
    "Submit everything in ONE complete packet — never piecemeal",
    "Put the policy number on EVERY page of submitted documents",
    "Keep copies of everything you submit",
    "Notify all healthcare providers IN WRITING of your intent to file",
    "Choose a home care provider experienced with LTC insurance",
    "Document ADL deficits thoroughly and consistently",
    "Maintain detailed daily care logs and notes",
  ];

  const donts = [
    "DON'T initiate the claim before all documentation is gathered",
    "DON'T send documents in pieces — submit everything at once",
    "DON'T forget to include the policy number on every page",
    "DON'T accept a denial without understanding why",
    "DON'T assume the insurance company will guide you through the process",
    "DON'T wait too long to begin the elimination period",
    "DON'T hire care providers without verifying LTC insurance experience",
    "DON'T ignore requests for additional information from the insurance company",
    "DON'T fail to maintain detailed records and documentation",
    "DON'T assume verbal confirmations are binding — get everything in writing",
  ];

  return (
    <Layout>
      {/* Hero Section - Enhanced */}
      <section className="relative text-white py-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/PwkXeMqqVgTuSYuq.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a4a]/90 to-[#1a2a3a]/85" />
          {/* Animated background elements */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-teal/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <div className="inline-block mb-6 px-4 py-2 bg-teal/30 rounded-full border border-teal/60 backdrop-blur-sm">
              <span className="text-teal-light text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> EDUCATION & GLOSSARY
              </span>
            </div>
            <h1 className="font-serif text-6xl font-bold mb-6 leading-tight">Understanding Long-Term Care Insurance</h1>
            <p className="text-xl text-white/95 mb-8">Master the terminology, concepts, and strategies you need to successfully navigate your LTC insurance claim. Interactive learning at your pace.</p>
            <div className="flex gap-4 flex-wrap">
              <Button className="bg-teal hover:bg-teal/90 text-white gap-2">
                <BookOpen className="w-4 h-4" /> Start Learning
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                <Zap className="w-4 h-4" /> Quick Tips
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-12 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BookOpen className="w-4 h-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="glossary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4 mr-2" /> Glossary
              </TabsTrigger>
              <TabsTrigger value="tips" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Lightbulb className="w-4 h-4 mr-2" /> Tips & Pitfalls
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-16">
              {/* What is LTC Insurance - Feature Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div>
                    <div className="inline-block mb-4 px-3 py-1 bg-teal/20 rounded-full text-teal text-sm font-semibold">Foundations</div>
                    <h2 className="font-serif text-4xl font-bold text-foreground mb-4">What is Long-Term Care Insurance?</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">Long-term care insurance helps pay for the costs of extended care services when you need assistance with daily activities due to aging, illness, or injury. Unlike health insurance, LTC insurance focuses on custodial and supportive care rather than medical treatment.</p>
                  <div className="space-y-4 pt-4">
                    {[
                      { icon: Heart, title: "Covers Daily Living Assistance", desc: "Help with bathing, dressing, eating, toileting, and more", color: "text-red-500" },
                      { icon: Shield, title: "Financial Protection", desc: "Protects your assets from devastating care costs", color: "text-blue-500" },
                      { icon: Users, title: "Multiple Care Settings", desc: "Home care, assisted living, or nursing facilities", color: "text-purple-500" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <item.icon className={`w-6 h-6 ${item.color} flex-shrink-0 mt-1`} />
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal/20 to-blue/20 rounded-2xl blur-2xl" />
                  <div className="relative bg-gradient-to-br from-teal/10 to-blue/10 rounded-2xl p-10 border border-teal/30 backdrop-blur-sm">
                    <div className="space-y-6">
                      <div>
                        <div className="text-5xl font-bold text-teal mb-2">$100K+</div>
                        <p className="text-sm text-muted-foreground">Average annual cost of home care in the US</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Care cost coverage</span>
                          <span className="font-semibold text-teal">75%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal to-blue w-3/4 rounded-full" />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-teal/20">
                        <p className="text-xs text-muted-foreground">💡 Why planning ahead matters</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Stages - Timeline */}
              <div className="space-y-8">
                <div>
                  <div className="inline-block mb-4 px-3 py-1 bg-blue/20 rounded-full text-blue text-sm font-semibold">Journey</div>
                  <h2 className="font-serif text-4xl font-bold text-foreground">The Three Stages of Your LTC Journey</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { num: 1, title: "Prior to Claim", color: "teal", items: ["Request claims packet", "Gather all documents", "Begin care services"] },
                    { num: 2, title: "Filing the Claim", color: "blue", items: ["Complete claim packet", "Submit all documents", "Prepare for assessment"] },
                    { num: 3, title: "Post-Approval", color: "green", items: ["Submit invoices", "Maintain care logs", "Track benefits"] },
                  ].map((stage, i) => (
                    <div key={i} className="group relative">
                      <div className={`absolute -top-4 -left-4 w-10 h-10 bg-${stage.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform`}>{stage.num}</div>
                      <Card className={`p-6 border-l-4 border-l-${stage.color} bg-${stage.color}/5 hover:shadow-lg transition-all hover:translate-y-[-4px]`}>
                        <h3 className="font-serif text-xl font-bold text-foreground mb-4">{stage.title}</h3>
                        <ul className="space-y-3">
                          {stage.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-3">
                              <CheckCircle className={`w-5 h-5 text-${stage.color} flex-shrink-0 mt-0.5`} />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADLs - Interactive Cards */}
              <div className="space-y-8">
                <div>
                  <div className="inline-block mb-4 px-3 py-1 bg-purple/20 rounded-full text-purple text-sm font-semibold">Critical</div>
                  <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Activities of Daily Living (ADLs)</h2>
                  <p className="text-muted-foreground">Most LTC policies require deficits in 2-3 ADLs to trigger benefits. Click any ADL to learn more.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adls.map((adl, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedADL(selectedADL === i ? null : i)}
                      className="cursor-pointer group"
                    >
                      <Card className={`p-6 transition-all duration-300 hover:shadow-xl ${selectedADL === i ? "ring-2 ring-teal bg-teal/5" : "hover:shadow-lg"}`}>
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{adl.icon}</div>
                        <h4 className="font-semibold text-foreground mb-2">{adl.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{adl.desc}</p>
                        {selectedADL === i && (
                          <div className="mt-4 pt-4 border-t border-teal/20 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs text-teal font-medium">{adl.details}</p>
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-teal text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Learn more</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Concepts - Stat Blocks */}
              <div className="space-y-8">
                <div>
                  <div className="inline-block mb-4 px-3 py-1 bg-amber/20 rounded-full text-amber text-sm font-semibold">Essential</div>
                  <h2 className="font-serif text-4xl font-bold text-foreground">Key Concepts You Need to Know</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: Clock, title: "Elimination Period", desc: "The number of days you pay out-of-pocket before insurance kicks in. Think of it as a deductible measured in time.", color: "teal" },
                    { icon: TrendingUp, title: "Daily/Monthly/Lifetime Maximums", desc: "The maximum amounts your insurance will pay per day, month, or over the lifetime of the policy.", color: "blue" },
                    { icon: Lightbulb, title: "Assignment of Benefits (AOB)", desc: "Directs payment directly to your care provider instead of you. Simplifies cash flow but requires provider cooperation.", color: "amber" },
                    { icon: Lock, title: "Waiver of Premium", desc: "A valuable feature that stops premium payments once care begins. Check if your policy includes this.", color: "green" },
                  ].map((concept, i) => (
                    <div key={i} className="group">
                      <div className={`bg-gradient-to-br from-${concept.color}/10 to-transparent rounded-xl p-6 border border-${concept.color}/20 hover:border-${concept.color}/50 transition-all hover:shadow-lg`}>
                        <div className="flex items-start gap-4">
                          <concept.icon className={`w-8 h-8 text-${concept.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">{concept.title}</h4>
                            <p className="text-sm text-muted-foreground">{concept.desc}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Section */}
              <div className="space-y-6 pt-8">
                <div>
                  <div className="inline-block mb-4 px-3 py-1 bg-red/20 rounded-full text-red text-sm font-semibold">Video</div>
                  <h2 className="font-serif text-3xl font-bold text-foreground">Watch: LTC Insurance Explained</h2>
                </div>
                <VideoPlaceholder title="Understanding LTC Insurance" description="Learn the key concepts and terminology you need to know" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/video-education.mp4" />
              </div>
            </TabsContent>

            {/* Glossary Tab - Interactive Accordion */}
            <TabsContent value="glossary" className="space-y-8">
              <div>
                <div className="inline-block mb-4 px-3 py-1 bg-blue/20 rounded-full text-blue text-sm font-semibold">Reference</div>
                <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Complete LTC Insurance Glossary</h2>
                <p className="text-muted-foreground">A comprehensive guide to the terminology you'll encounter throughout your LTC insurance journey. Click any term to expand.</p>
              </div>

              <div className="space-y-3">
                {glossaryTerms.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => toggleGlossary(i)}
                    className="cursor-pointer group"
                  >
                    <div className={`p-4 rounded-lg border transition-all duration-300 ${expandedGlossary === i ? "bg-teal/5 border-teal/50 shadow-md" : "bg-muted/30 border-muted/50 hover:border-teal/30"}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground group-hover:text-teal transition-colors">{item.term}</h4>
                        <ChevronDown className={`w-5 h-5 text-teal transition-transform duration-300 ${expandedGlossary === i ? "rotate-180" : ""}`} />
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
            </TabsContent>

            {/* Tips & Pitfalls Tab */}
            <TabsContent value="tips" className="space-y-8">
              <div>
                <div className="inline-block mb-4 px-3 py-1 bg-green/20 rounded-full text-green text-sm font-semibold">Best Practices</div>
                <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Tips & Common Pitfalls</h2>
                <p className="text-muted-foreground">Learn from the experiences of others. These tips and warnings can mean the difference between a successful claim and a denial. Check off items as you complete them!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Do's */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">Do's</h3>
                  </div>
                  {dos.map((tip, i) => (
                    <div
                      key={i}
                      onClick={() => toggleTip(i)}
                      className="cursor-pointer group"
                    >
                      <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${completedTips.has(i) ? "bg-green/10 border-green/50 opacity-75" : "bg-green/5 border-green/30 hover:border-green/50 hover:shadow-md"}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${completedTips.has(i) ? "bg-green-600 border-green-600" : "border-green-400 group-hover:border-green-600"}`}>
                          {completedTips.has(i) && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`text-sm transition-all ${completedTips.has(i) ? "line-through text-muted-foreground" : "text-green-900"}`}>{tip}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Don'ts */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-red/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">Don'ts</h3>
                  </div>
                  {donts.map((tip, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-red/5 border-2 border-red/30 hover:border-red/50 hover:shadow-md transition-all">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-red-900">{tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-12 p-6 bg-gradient-to-r from-teal/10 to-blue/10 rounded-xl border border-teal/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal" /> Your Learning Progress
                  </h4>
                  <span className="text-2xl font-bold text-teal">{Math.round((completedTips.size / dos.length) * 100)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal to-blue rounded-full transition-all duration-500"
                    style={{ width: `${(completedTips.size / dos.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">Complete all Do's to master the essentials!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal/10 to-blue/10 py-16 border-t border-teal/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">Use what you've learned to complete your policy form and generate a personalized strategy.</p>
          <Button className="bg-teal hover:bg-teal/90 text-white gap-2 size-lg">
            <Target className="w-5 h-5" /> Start Your Policy Form
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
}
