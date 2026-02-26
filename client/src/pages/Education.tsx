import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertTriangle, CheckCircle, Info, FileText, Heart, Shield, ClipboardList, Phone, Users, Lightbulb, TrendingUp, Lock, Clock } from "lucide-react";

export default function Education() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative text-white py-12">
        <div className="absolute inset-0">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/PwkXeMqqVgTuSYuq.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a3a4a]/85 to-[#1a2a3a]/80" />
        </div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-2xl">
            <div className="inline-block mb-4 px-4 py-2 bg-teal/20 rounded-full border border-teal/40">
              <span className="text-teal-light text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" /> EDUCATION & GLOSSARY</span>
            </div>
            <h1 className="font-serif text-5xl font-bold mb-4">Understanding Long-Term Care Insurance</h1>
            <p className="text-lg text-white/90">Master the terminology, concepts, and strategies you need to successfully navigate your LTC insurance claim.</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
              <TabsTrigger value="tips">Tips & Pitfalls</TabsTrigger>
            </TabsList>

            {/* Overview Tab - Creative Layout */}
            <TabsContent value="overview" className="space-y-12">
              {/* What is LTC Insurance - Feature Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="font-serif text-3xl font-bold text-foreground">What is Long-Term Care Insurance?</h2>
                  <p className="text-lg text-muted-foreground">Long-term care insurance helps pay for the costs of extended care services when you need assistance with daily activities due to aging, illness, or injury. Unlike health insurance, LTC insurance focuses on custodial and supportive care rather than medical treatment.</p>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-teal flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Covers Daily Living Assistance</h4>
                        <p className="text-sm text-muted-foreground">Help with bathing, dressing, eating, toileting, and more</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-teal flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Financial Protection</h4>
                        <p className="text-sm text-muted-foreground">Protects your assets from devastating care costs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-teal flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground">Multiple Care Settings</h4>
                        <p className="text-sm text-muted-foreground">Home care, assisted living, or nursing facilities</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal/10 to-blue/10 rounded-xl p-8 border border-teal/20">
                  <div className="space-y-4">
                    <div className="text-5xl font-bold text-teal">$100K+</div>
                    <p className="text-sm text-muted-foreground">Average annual cost of home care in the US</p>
                    <div className="h-2 bg-teal/20 rounded-full overflow-hidden mt-4">
                      <div className="h-full bg-gradient-to-r from-teal to-blue w-3/4" />
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">Why planning ahead matters</p>
                  </div>
                </div>
              </div>

              {/* Three Stages - Timeline */}
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">The Three Stages of Your LTC Journey</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stage 1 */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-8 h-8 bg-teal rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <Card className="p-6 border-l-4 border-l-teal bg-teal/5">
                      <h3 className="font-serif text-xl font-bold text-foreground mb-3">Prior to Claim</h3>
                      <p className="text-sm text-muted-foreground mb-4">Gather documentation, contact your carrier, and prepare everything before filing.</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                          <span>Request claims packet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                          <span>Gather all documents</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                          <span>Begin care services</span>
                        </li>
                      </ul>
                    </Card>
                  </div>

                  {/* Stage 2 */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-8 h-8 bg-blue rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <Card className="p-6 border-l-4 border-l-blue bg-blue/5">
                      <h3 className="font-serif text-xl font-bold text-foreground mb-3">Filing the Claim</h3>
                      <p className="text-sm text-muted-foreground mb-4">Submit complete documentation and prepare for the insurance company's evaluation.</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue flex-shrink-0 mt-0.5" />
                          <span>Complete claim packet</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue flex-shrink-0 mt-0.5" />
                          <span>Submit all documents</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue flex-shrink-0 mt-0.5" />
                          <span>Prepare for assessment</span>
                        </li>
                      </ul>
                    </Card>
                  </div>

                  {/* Stage 3 */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <Card className="p-6 border-l-4 border-l-green-600 bg-green-50">
                      <h3 className="font-serif text-xl font-bold text-foreground mb-3">Post-Approval</h3>
                      <p className="text-sm text-muted-foreground mb-4">Manage ongoing benefits and maintain compliance with policy requirements.</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Submit invoices</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Maintain care logs</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Track benefits</span>
                        </li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>

              {/* ADLs - Interactive Cards */}
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">Activities of Daily Living (ADLs)</h2>
                <p className="text-muted-foreground">Most LTC policies require deficits in 2-3 ADLs to trigger benefits. Understanding these is critical to your claim.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Bathing", icon: "🚿", desc: "Washing oneself, including getting in/out of tub or shower" },
                    { name: "Dressing", icon: "👔", desc: "Putting on and taking off clothing and fasteners" },
                    { name: "Eating/Feeding", icon: "🍽️", desc: "Feeding oneself from plate to mouth" },
                    { name: "Toileting", icon: "🚽", desc: "Using the toilet and performing hygiene" },
                    { name: "Transferring", icon: "🪑", desc: "Moving in/out of bed, chair, or wheelchair" },
                    { name: "Continence", icon: "💧", desc: "Controlling bowel/bladder or performing hygiene" },
                  ].map((adl, i) => (
                    <Card key={i} className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-teal/20 hover:border-teal/50">
                      <div className="text-3xl mb-2">{adl.icon}</div>
                      <h4 className="font-semibold text-foreground mb-1">{adl.name}</h4>
                      <p className="text-sm text-muted-foreground">{adl.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Key Concepts - Stat Blocks */}
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">Key Concepts You Need to Know</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-teal/10 to-transparent rounded-xl p-6 border border-teal/20">
                    <div className="flex items-start gap-4">
                      <Clock className="w-8 h-8 text-teal flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Elimination Period</h4>
                        <p className="text-sm text-muted-foreground">The number of days you pay out-of-pocket before insurance kicks in. Think of it as a deductible measured in time.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue/10 to-transparent rounded-xl p-6 border border-blue/20">
                    <div className="flex items-start gap-4">
                      <TrendingUp className="w-8 h-8 text-blue flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Daily/Monthly/Lifetime Maximums</h4>
                        <p className="text-sm text-muted-foreground">The maximum amounts your insurance will pay per day, month, or over the lifetime of the policy.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-100/30 to-transparent rounded-xl p-6 border border-amber-200">
                    <div className="flex items-start gap-4">
                      <Lightbulb className="w-8 h-8 text-amber-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Assignment of Benefits (AOB)</h4>
                        <p className="text-sm text-muted-foreground">Directs payment directly to your care provider instead of you. Simplifies cash flow but requires provider cooperation.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-100/30 to-transparent rounded-xl p-6 border border-green-200">
                    <div className="flex items-start gap-4">
                      <Lock className="w-8 h-8 text-green-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Waiver of Premium</h4>
                        <p className="text-sm text-muted-foreground">A valuable feature that stops premium payments once care begins. Check if your policy includes this.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Section */}
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-foreground">Watch: LTC Insurance Explained</h2>
                <VideoPlaceholder title="Understanding LTC Insurance" description="Learn the key concepts and terminology you need to know" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/video-education.mp4" />
              </div>
            </TabsContent>

            {/* Glossary Tab - Comprehensive Terms */}
            <TabsContent value="glossary" className="space-y-6">
              <div className="prose max-w-none mb-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">Complete LTC Insurance Glossary</h2>
                <p className="text-muted-foreground">A comprehensive guide to the terminology you'll encounter throughout your LTC insurance journey.</p>
              </div>

              <div className="space-y-4">
                {[
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
                ].map((item, i) => (
                  <Card key={i} className="p-4 border-l-4 border-l-teal">
                    <h4 className="font-semibold text-foreground mb-1">{item.term}</h4>
                    <p className="text-sm text-muted-foreground">{item.def}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tips & Pitfalls Tab */}
            <TabsContent value="tips" className="space-y-8">
              <div className="prose max-w-none mb-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">Tips & Common Pitfalls</h2>
                <p className="text-muted-foreground">Learn from the experiences of others. These tips and warnings can mean the difference between a successful claim and a denial.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-500" /> Do's</h3>
                  {[
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
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{tip}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500" /> Don'ts</h3>
                  {[
                    "DON'T initiate the claim before all documentation is gathered",
                    "DON'T send documents in pieces — submit everything at once",
                    "DON'T forget to include the policy number on every page",
                    "DON'T accept a denial without understanding why",
                    "DON'T assume the insurance company will guide you through the process",
                    "DON'T wait too long to begin the elimination period",
                    "DON'T use a care provider unfamiliar with LTC insurance requirements",
                    "DON'T be inconsistent between documentation and third-party evaluation",
                    "DON'T underestimate the importance of the third-party nurse assessment",
                    "DON'T rely on verbal communication — get everything in writing",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
