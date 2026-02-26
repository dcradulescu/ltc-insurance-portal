import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertTriangle, CheckCircle, Info, FileText, Heart } from "lucide-react";

const adlList = [
  { name: "Bathing", description: "The ability to wash oneself, including getting in and out of the tub or shower." },
  { name: "Dressing", description: "The ability to put on and take off clothing, including fasteners and braces." },
  { name: "Eating", description: "The ability to feed oneself, not including meal preparation." },
  { name: "Toileting", description: "The ability to use the toilet, including getting on and off." },
  { name: "Transferring", description: "The ability to move in and out of a bed, chair, or wheelchair." },
  { name: "Continence", description: "The ability to maintain control of bowel and bladder function." },
];

const commonMistakes = [
  "Not reading the full policy before filing a claim",
  "Missing the elimination period requirements",
  "Failing to get proper medical documentation",
  "Not understanding the benefit triggers in your policy",
  "Waiting too long to file after care begins",
  "Not keeping detailed records of care received",
  "Accepting a denial without appealing",
  "Not understanding the difference between home care and facility care benefits",
];

const glossaryTerms = [
  { term: "Benefit Trigger", definition: "The conditions that must be met before your policy begins paying benefits. Most policies require inability to perform 2 of 6 ADLs or cognitive impairment." },
  { term: "Elimination Period", definition: "The waiting period (similar to a deductible) between when you become eligible for benefits and when the insurance company starts paying. Common periods are 30, 60, or 90 days." },
  { term: "Daily Benefit Amount", definition: "The maximum amount your policy will pay per day for covered care services." },
  { term: "Benefit Period", definition: "The maximum length of time your policy will pay benefits. Can range from 2 years to lifetime." },
  { term: "Inflation Protection", definition: "A rider that increases your daily benefit amount over time to keep pace with rising care costs. Can be simple or compound." },
  { term: "Home Care Coverage", definition: "Benefits that cover care received in your home, including skilled nursing, physical therapy, and personal care assistance." },
  { term: "Facility Care", definition: "Benefits that cover care in nursing homes, assisted living facilities, or adult day care centers." },
  { term: "Care Coordinator", definition: "A professional (often a nurse or social worker) assigned by the insurance company to assess care needs and develop a plan of care." },
  { term: "Plan of Care", definition: "A written document outlining the specific care services needed, typically required by the insurance company before benefits begin." },
  { term: "Waiver of Premium", definition: "A policy feature that waives premium payments while you are receiving benefits." },
];

export default function Education() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-16">
        <div className="container">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Education Center</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Understanding Long-Term Care Insurance
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Knowledge is your greatest asset when navigating the LTC insurance claims process. Learn everything you need to know to protect your family.
          </p>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 bg-secondary">
        <div className="container max-w-4xl">
          <VideoPlaceholder
            title="LTC Insurance Education Overview"
            description="A comprehensive introduction to long-term care insurance and the claims process"
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-secondary p-1 rounded-lg mb-8 h-auto">
              <TabsTrigger value="basics" className="text-sm">LTC Basics</TabsTrigger>
              <TabsTrigger value="adls" className="text-sm">ADLs Explained</TabsTrigger>
              <TabsTrigger value="claims" className="text-sm">Claims Process</TabsTrigger>
              <TabsTrigger value="glossary" className="text-sm">Glossary</TabsTrigger>
              <TabsTrigger value="tips" className="text-sm">Tips & Pitfalls</TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics" className="space-y-8">
              <div className="max-w-3xl">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">What is Long-Term Care Insurance?</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Long-term care insurance (LTCI) is a type of insurance that helps cover the costs of long-term care services that are not typically covered by regular health insurance, Medicare, or Medicaid. These services include assistance with everyday activities when you can no longer perform them independently due to a chronic illness, disability, or cognitive impairment such as Alzheimer's disease.
                </p>

                <h3 className="font-serif text-xl font-bold text-foreground mb-3">Types of Care Covered</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { title: "Home Care", desc: "Skilled nursing, personal care, and therapy services provided in your home." },
                    { title: "Assisted Living", desc: "Residential facilities that provide personal care and support services." },
                    { title: "Nursing Home Care", desc: "24-hour skilled nursing care in a licensed facility." },
                    { title: "Adult Day Care", desc: "Daytime programs providing social activities, meals, and health services." },
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-lg border border-border bg-secondary/50">
                      <h4 className="font-serif font-bold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-serif text-xl font-bold text-foreground mb-3">Understanding Your Policy</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Every LTC insurance policy is different. The key components you need to understand include your daily benefit amount (how much the policy pays per day), your benefit period (how long benefits last), your elimination period (the waiting period before benefits begin), and your benefit triggers (the conditions that must be met to activate benefits).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Most policies require that you are unable to perform at least 2 out of 6 Activities of Daily Living (ADLs) without substantial assistance, or that you have a severe cognitive impairment that requires substantial supervision for your safety.
                </p>
              </div>
            </TabsContent>

            {/* ADLs Tab */}
            <TabsContent value="adls" className="space-y-8">
              <div className="max-w-3xl">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Activities of Daily Living (ADLs)</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Activities of Daily Living (ADLs) are the fundamental personal care tasks that most people perform every day without assistance. Most LTC insurance policies use ADLs as the primary measure to determine whether a policyholder qualifies for benefits. Typically, you must be unable to perform at least 2 of the 6 ADLs without substantial assistance from another person.
                </p>

                <div className="space-y-4 mb-8">
                  {adlList.map((adl) => (
                    <div key={adl.name} className="p-5 rounded-lg border border-border bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-serif font-bold text-foreground mb-1">{adl.name}</h4>
                          <p className="text-sm text-muted-foreground">{adl.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-serif font-bold text-foreground mb-2">Cognitive Impairment</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        In addition to ADL limitations, most policies also cover individuals with severe cognitive impairment (such as Alzheimer's disease or dementia) who require substantial supervision for their safety, even if they can physically perform ADLs. A cognitive assessment may be required as part of the claims process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Claims Process Tab */}
            <TabsContent value="claims" className="space-y-8">
              <div className="max-w-3xl">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">The Claims Filing Process</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Filing a long-term care insurance claim involves several steps. Understanding the process ahead of time can help you avoid delays and increase your chances of approval.
                </p>

                <div className="space-y-6">
                  {[
                    { step: "1", title: "Notify Your Insurance Company", desc: "Contact your insurance company to report a claim. They will send you the necessary forms and explain their specific process. Keep a record of all communications." },
                    { step: "2", title: "Complete the Claim Forms", desc: "Fill out all required forms accurately and completely. This typically includes a claimant statement, attending physician statement, and authorization forms." },
                    { step: "3", title: "Gather Medical Documentation", desc: "Obtain medical records, physician statements, and any cognitive assessments that support your claim. The more thorough your documentation, the better." },
                    { step: "4", title: "Assessment & Care Plan", desc: "The insurance company will typically send a care coordinator to assess the policyholder's needs and develop a plan of care. Cooperate fully with this process." },
                    { step: "5", title: "Elimination Period", desc: "Once approved, the elimination period begins. You must satisfy this waiting period (typically 30-90 days) before benefits start paying." },
                    { step: "6", title: "Benefits Begin", desc: "After the elimination period is satisfied, benefits begin according to your policy terms. Keep detailed records of all care received and expenses." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Glossary Tab */}
            <TabsContent value="glossary" className="space-y-8">
              <div className="max-w-3xl">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Insurance Glossary</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Understanding the terminology used in your LTC insurance policy is essential for navigating the claims process effectively.
                </p>

                <Accordion type="single" collapsible className="w-full">
                  {glossaryTerms.map((item, index) => (
                    <AccordionItem key={index} value={`term-${index}`}>
                      <AccordionTrigger className="font-serif font-bold text-foreground hover:text-primary">
                        {item.term}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.definition}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="space-y-8">
              <div className="max-w-3xl">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Tips & Common Pitfalls</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Avoid these common mistakes that can delay or derail your LTC insurance claim.
                </p>

                <div className="space-y-3 mb-8">
                  {commonMistakes.map((mistake, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{mistake}</span>
                    </div>
                  ))}
                </div>

                <h3 className="font-serif text-xl font-bold text-foreground mb-4">Pro Tips for Success</h3>
                <div className="space-y-3">
                  {[
                    "Keep a detailed daily log of care needs and assistance provided",
                    "Request everything in writing from your insurance company",
                    "Know your state's insurance regulations and consumer protections",
                    "Consider hiring a long-term care insurance claims advocate if your claim is complex",
                    "Document all phone calls with date, time, person spoken to, and summary",
                    "Submit all documentation via certified mail or trackable delivery",
                    "Understand your appeal rights before you need them",
                  ].map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary">
        <div className="container text-center">
          <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Ready to Take the Next Step?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Now that you understand the basics, complete our policy intake form to receive a personalized strategy for your specific situation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/policy-form" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:opacity-90 transition-opacity no-underline">
              <FileText className="w-4 h-4" />
              Start Policy Form
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
