import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertTriangle, CheckCircle, Info, FileText, Heart, Shield, ClipboardList, Phone, Users } from "lucide-react";

const glossary = [
  { term: "Claim / Pre-Claim Number", definition: "When a claim is initiated, a pre-claim number is issued prior to approval. When approved, it becomes the actual claim number." },
  { term: "Elimination Period", definition: "The number of service days you must pay out of pocket before your LTC policy begins to pay. This counts days of service, not calendar days since illness. Think of it like a deductible measured in time." },
  { term: "Daily Maximum", definition: "The maximum amount the insurance company will pay per day of service. Any amount above this is the client's responsibility." },
  { term: "Monthly Maximum", definition: "The maximum amount the insurance company will pay per month of service." },
  { term: "Lifetime Maximum", definition: "The total amount the policy will pay over its entire lifetime. Once exhausted, no further benefits are available." },
  { term: "Activities of Daily Living (ADLs)", definition: "Six fundamental self-care activities: Bathing, Dressing, Toileting, Feeding, Continence, and Transferring. Most policies require 2-3 ADLs to be in deficit to qualify for benefits." },
  { term: "Case Manager", definition: "Assigned by the LTC insurance company to determine approved hours of care. They monitor the case regularly and serve as your primary contact at the insurance company." },
  { term: "Third-Party Assessment", definition: "An independent RN assessment to verify the patient's condition and ADL deficits. The assessor looks for inconsistencies between documentation and observed condition." },
  { term: "Waiver of Premium", definition: "A policy feature that waives (stops) premium payments once care begins under the policy. Not all policies include this benefit." },
  { term: "Payment Cycle", definition: "The review cycle for invoices and logsheets — typically monthly or at another interval set by the LTC company." },
  { term: "CNA (Certified Nursing Assistant)", definition: "Some LTC companies require a CNA to provide care, or the care may be disallowed. Check your policy requirements." },
  { term: "Assignment of Benefits (AOB)", definition: "Directs the insurance company to send payment directly to the care provider instead of the insured. This means the provider submits claims and gets paid directly." },
  { term: "Plan of Care", definition: "A documented plan outlining the care services needed, typically created by a healthcare provider. Required for most LTC insurance claims." },
  { term: "Power of Attorney (POA)", definition: "A legal document authorizing someone to act on behalf of the insured person in legal and financial matters, including insurance claims." },
  { term: "Cognitive Impairment Trigger", definition: "Some policies allow benefits to be triggered by cognitive impairment (e.g., Alzheimer's, dementia) even if physical ADLs are not in deficit." },
  { term: "Benefit Trigger", definition: "The conditions that must be met for the policy to begin paying benefits. Typically requires a certain number of ADL deficits or cognitive impairment." },
];

const adlList = [
  { name: "Bathing", description: "The ability to wash oneself, including getting in and out of the tub or shower. Deficit means the person needs hands-on assistance to bathe safely.", icon: "🚿" },
  { name: "Dressing", description: "The ability to put on and take off clothing, including fasteners, braces, and prosthetic devices.", icon: "👔" },
  { name: "Eating / Feeding", description: "The ability to feed oneself, not including meal preparation. The person cannot get food from plate to mouth without assistance.", icon: "🍽️" },
  { name: "Toileting", description: "The ability to use the toilet, including getting on and off, and performing associated personal hygiene.", icon: "🚽" },
  { name: "Transferring", description: "The ability to move in and out of a bed, chair, or wheelchair without assistance.", icon: "🪑" },
  { name: "Continence", description: "The ability to maintain control of bowel and bladder function, or the ability to perform associated personal hygiene.", icon: "💧" },
];

const threeStages = [
  {
    stage: 1,
    title: "Prior to Claim — Preparation",
    color: "bg-blue-50 border-blue-200",
    icon: <ClipboardList className="w-6 h-6 text-blue-600" />,
    items: [
      "Contact the insurance company and request a claims packet by mail",
      "DO NOT initiate the claim yet — only request information",
      "Request an Assignment of Benefits (AOB) form",
      "Evaluate the long-term care need and identify physical/cognitive decline",
      "Identify all healthcare providers and notify them IN WRITING",
      "Request documented decline records from all providers",
      "Secure a home care provider experienced with LTC insurance",
      "Collect all required documents: provider license, Plan of Care, W-9",
      "Begin services to trigger the elimination period",
      "Gather personal identifiers: SSN, Medicare/Medicaid numbers",
      "Obtain Power of Attorney documentation if applicable",
    ],
    critical: "NEVER initiate the claim until ALL preparation is complete. The insurance company will start the clock once a claim is filed.",
  },
  {
    stage: 2,
    title: "Filing the Claim — Submission",
    color: "bg-amber-50 border-amber-200",
    icon: <FileText className="w-6 h-6 text-amber-600" />,
    items: [
      "Complete the claim packet thoroughly — leave nothing blank",
      "Create a document index listing all attachments",
      "Attach all supporting documents in ONE complete submission",
      "Ensure the policy number appears on EVERY page",
      "Prepare for third-party nurse evaluation (if required)",
      "Understand: inconsistencies between documentation and evaluation may lead to denial",
      "Expect a 30-day review period after submission",
    ],
    critical: "Submit ALL documents in ONE packet. Never send documents piecemeal. Appeals after denial have very low success rates — get it right the first time.",
  },
  {
    stage: 3,
    title: "Post-Approval — Ongoing Management",
    color: "bg-green-50 border-green-200",
    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    items: [
      "Continue paying for services during the elimination period",
      "Organize and retain all paid invoices",
      "Ensure care notes document minimum ADL assistance",
      "Submit invoices and care logs per the payment cycle",
      "Ensure the policy number appears on every submitted page",
      "Maintain ongoing communication with your case manager",
      "Keep all records organized for potential audits",
    ],
    critical: "If you have Assignment of Benefits, the provider submits claims directly. If not, you pay the provider and submit for reimbursement.",
  },
];

export default function Education() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Education Center</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">Understanding Long-Term Care Insurance</h1>
          <p className="text-white/80 max-w-2xl">Everything you need to know about LTC insurance, the claims process, and how to protect your family's interests. Knowledge is your most powerful tool.</p>
        </div>
      </section>

      {/* Video */}
      <section className="py-8 bg-secondary">
        <div className="container max-w-4xl">
          <VideoPlaceholder title="LTC Insurance Education Overview" description="A comprehensive introduction to long-term care insurance and the claims process" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/lWGNhdOVPEktQuAP.jpg" />
        </div>
      </section>

      {/* Tabbed Content */}
      <section className="py-12 bg-white">
        <div className="container max-w-5xl">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="stages" className="text-xs md:text-sm">3 Stages</TabsTrigger>
              <TabsTrigger value="adls" className="text-xs md:text-sm">ADLs</TabsTrigger>
              <TabsTrigger value="glossary" className="text-xs md:text-sm">Glossary</TabsTrigger>
              <TabsTrigger value="tips" className="text-xs md:text-sm">Tips & Pitfalls</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="prose prose-lg max-w-none">
                <h2 className="font-serif text-2xl font-bold text-foreground">What is Long-Term Care Insurance?</h2>
                <p className="text-muted-foreground leading-relaxed">Long-term care insurance is a type of insurance specifically designed to cover the costs of long-term care services that are not typically covered by regular health insurance, Medicare, or Medicaid. These services include assistance with Activities of Daily Living (ADLs), skilled nursing care, and support for cognitive impairments such as Alzheimer's disease or dementia.</p>

                <h3 className="font-serif text-xl font-bold text-foreground">Why Does This Matter?</h3>
                <p className="text-muted-foreground leading-relaxed">The average cost of long-term care can be staggering — a private room in a nursing home can exceed $100,000 per year, and home health aide services average $50,000+ annually. Without proper insurance coverage, these costs can quickly deplete a family's savings. If you or a loved one has an LTC policy, understanding how to properly file a claim is critical to accessing the benefits you've been paying for.</p>

                <h3 className="font-serif text-xl font-bold text-foreground">The Challenge</h3>
                <p className="text-muted-foreground leading-relaxed">Filing an LTC insurance claim is notoriously complex. Insurance companies have specific requirements, documentation standards, and evaluation processes that can be overwhelming for families already dealing with the stress of a loved one's declining health. <strong>Studies show that a significant percentage of LTC claims are initially denied</strong> — often due to incomplete documentation, procedural errors, or misunderstanding of policy requirements.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <Shield className="w-8 h-8 text-blue-600" />, title: "Know Your Policy", desc: "Understanding your specific policy terms, benefit triggers, and coverage limits is the foundation of a successful claim." },
                  { icon: <ClipboardList className="w-8 h-8 text-amber-600" />, title: "Document Everything", desc: "Thorough documentation of care needs, ADL deficits, and medical conditions is essential for claim approval." },
                  { icon: <Users className="w-8 h-8 text-green-600" />, title: "Build Your Team", desc: "Work with experienced care providers, physicians, and advocates who understand LTC insurance requirements." },
                ].map((card, i) => (
                  <div key={i} className="p-6 bg-secondary rounded-lg border border-border">
                    <div className="mb-3">{card.icon}</div>
                    <h3 className="font-serif font-bold text-foreground mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 3 Stages Tab */}
            <TabsContent value="stages" className="space-y-8">
              <div className="prose max-w-none mb-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">The 3-Stage Claims Process</h2>
                <p className="text-muted-foreground">Successfully filing an LTC insurance claim follows a structured 3-stage process. Each stage must be completed thoroughly before moving to the next. <strong>Rushing through stages or skipping steps is the primary cause of claim denials.</strong></p>
              </div>

              {threeStages.map(stage => (
                <div key={stage.stage} className={`p-6 rounded-lg border ${stage.color}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">{stage.icon}</div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-foreground">Stage {stage.stage}: {stage.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {stage.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-3 bg-white/60 rounded-lg border border-amber-300">
                    <p className="text-sm font-semibold text-amber-800"><AlertTriangle className="w-4 h-4 inline mr-1" /> {stage.critical}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ADLs Tab */}
            <TabsContent value="adls" className="space-y-6">
              <div className="prose max-w-none mb-4">
                <h2 className="font-serif text-2xl font-bold text-foreground">Activities of Daily Living (ADLs)</h2>
                <p className="text-muted-foreground">ADLs are the fundamental self-care activities that determine eligibility for LTC insurance benefits. Most policies require that <strong>2 to 3 ADLs be in deficit</strong> (meaning the person needs hands-on assistance) to qualify for benefits.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adlList.map(adl => (
                  <div key={adl.name} className="p-5 bg-secondary rounded-lg border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{adl.icon}</span>
                      <h3 className="font-serif font-bold text-foreground">{adl.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{adl.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2"><Info className="w-4 h-4 inline mr-1" /> Important Note About ADL Assessment</h4>
                <p className="text-sm text-blue-700">During a third-party assessment, an independent nurse will evaluate each ADL. They observe the insured performing tasks and look for <strong>consistency</strong> between what is documented and what they observe. Any inconsistencies can lead to claim denial. Be honest and thorough in documenting limitations.</p>
              </div>
            </TabsContent>

            {/* Glossary Tab */}
            <TabsContent value="glossary" className="space-y-4">
              <div className="prose max-w-none mb-4">
                <h2 className="font-serif text-2xl font-bold text-foreground">LTC Insurance Glossary</h2>
                <p className="text-muted-foreground">Understanding the terminology used in LTC insurance is essential for navigating the claims process. Here are the key terms you need to know.</p>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {glossary.map((item, i) => (
                  <AccordionItem key={i} value={`glossary-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">{item.term}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">{item.definition}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            {/* Tips & Pitfalls Tab */}
            <TabsContent value="tips" className="space-y-8">
              <div className="prose max-w-none mb-4">
                <h2 className="font-serif text-2xl font-bold text-foreground">Tips & Common Pitfalls</h2>
                <p className="text-muted-foreground">Learn from the experiences of others. These tips and warnings can mean the difference between a successful claim and a denial.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Do's</h3>
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
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{tip}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Don'ts</h3>
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
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-800">{tip}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
