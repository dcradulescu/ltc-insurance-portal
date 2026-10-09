import { YouTubeLesson } from "./YouTubeLesson";
import { RESOURCE_GUIDES } from "@shared/resourceGuides";
'use client';

import { ChevronLeft, ChevronRight, Download, FileText, BookOpen, Play, Pause, Volume2, Settings, Maximize2, Lightbulb, CheckCircle2, Clock, Zap, Clipboard, Droplet, Badge, Star, Award, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration: string;
  instructor: string;
  keyPoints: string[];
  downloads: {
    name: string;
    url: string;
    icon: "pdf" | "doc" | "guide";
  }[];
}

// Step-based educational content organized by timeline step
const STEP_EDUCATION = [
  {
    stepNumber: 1,
    stepTitle: "Understand Basics",
    stepColor: "#4A9FB5",
    terms: [
      {
        term: "Activities of Daily Living (ADLs)",
        definition: "The six basic self-care tasks used by insurance companies to determine care need: bathing, dressing, eating, transferring (moving from bed to chair), toileting, and continence.",
        whyMatters: "Most LTC policies require inability to perform at least 2 ADLs to qualify for benefits.",
        longTermImpact: "Understanding ADLs is the foundation for knowing when your policy will pay. This concept applies throughout your entire claim journey."
      },
      {
        term: "Cognitive Impairment",
        definition: "A deterioration or loss of intellectual capacity that requires substantial supervision for safety. Alzheimer's disease, dementia, and other neurological conditions typically qualify.",
        whyMatters: "This is an alternative trigger to ADL deficits in most policies.",
        longTermImpact: "If ADL deficits are not present but cognitive impairment is, your policy may still pay benefits — check your specific trigger language."
      },
      {
        term: "Benefit Trigger",
        definition: "The specific condition(s) that must be met before your policy begins paying benefits. Most policies use ADL deficits (typically 2 of 6) and/or cognitive impairment as triggers.",
        whyMatters: "Understanding your policy's exact trigger language is the first step before initiating a claim.",
        longTermImpact: "This determines everything about your claim eligibility and timing. Review it carefully now."
      },
      {
        term: "Elimination Period",
        definition: "A waiting period — similar to a deductible — during which you pay for care out-of-pocket before insurance benefits begin. Common periods are 30, 60, 90, or 100 days. The clock starts when you begin receiving qualifying care.",
        whyMatters: "You must pay for care during this period. Plan your finances accordingly before benefits kick in.",
        longTermImpact: "This affects your immediate out-of-pocket costs and financial planning for the first months of care."
      }
    ]
  },
  {
    stepNumber: 2,
    stepTitle: "Review Your Policy",
    stepColor: "#FFD700",
    terms: [
      {
        term: "Daily Benefit Amount",
        definition: "The maximum dollar amount your policy will pay per day for qualifying care. For example, $200/day means the policy pays up to $200 for each day of care, regardless of actual cost.",
        whyMatters: "If your care costs exceed your daily benefit, you pay the difference.",
        longTermImpact: "This number directly impacts your monthly out-of-pocket costs for the entire duration of your care."
      },
      {
        term: "Benefit Pool",
        definition: "The total lifetime maximum your policy will pay, calculated as Daily Benefit × Benefit Period. A $200/day policy with a 3-year benefit period has a pool of approximately $219,000.",
        whyMatters: "Track your pool balance carefully — once exhausted, benefits end permanently.",
        longTermImpact: "You need to know this number to plan for long-term care costs beyond your policy's lifetime maximum."
      },
      {
        term: "Inflation Rider",
        definition: "An optional policy feature that automatically increases your daily benefit amount each year, typically by 3–5% simple or compound. Compound riders grow significantly faster over time.",
        whyMatters: "If your policy has this rider, your effective daily benefit today may be higher than the original amount purchased.",
        longTermImpact: "This protects you from inflation eroding your benefits over a multi-year care period."
      },
      {
        term: "Indemnity vs. Reimbursement",
        definition: "Indemnity policies pay the full daily benefit regardless of actual care costs. Reimbursement policies pay only actual documented care costs up to the daily maximum.",
        whyMatters: "Knowing your policy type determines how you document and submit care costs for reimbursement.",
        longTermImpact: "This affects how you manage invoices, receipts, and monthly reimbursement requests throughout your claim."
      },
      {
        term: "Waiver of Premium",
        definition: "A provision that suspends your premium payments once you begin receiving benefits. You continue to be covered without paying premiums during the claim period.",
        whyMatters: "Stop paying premiums once your claim is approved — contact your carrier immediately to activate this provision.",
        longTermImpact: "This can save thousands of dollars over a multi-year care period."
      }
    ]
  },
  {
    stepNumber: 3,
    stepTitle: "Prepare Documents",
    stepColor: "#FF6B9D",
    terms: [
      {
        term: "Claims Packet",
        definition: "The set of forms required to initiate a claim, typically including a Claimant Statement, Attending Physician Statement, and functional assessment form. Incomplete packets are the most common cause of claim delays.",
        whyMatters: "Gather all required documents before submitting anything. Send everything together with a cover letter listing all enclosed items.",
        longTermImpact: "A complete, organized packet speeds up approval and can mean the difference between quick payment and months of delays."
      },
      {
        term: "Third-Party Assessment",
        definition: "An in-person evaluation by an independent registered nurse hired by the insurance company to verify ADL deficits. The assessor looks for consistency between medical records and observed functional ability.",
        whyMatters: "On assessment day, the insured should present as they normally are — not at their best. Minimizing limitations can result in claim denial.",
        longTermImpact: "This assessment directly determines your approved care level and benefit amount."
      },
      {
        term: "Case Manager",
        definition: "A representative assigned by the insurance company to manage your ongoing claim, determine approved care hours, and serve as your primary contact.",
        whyMatters: "Build a professional relationship with your case manager — they have significant influence over your approved care level.",
        longTermImpact: "Your case manager is your advocate throughout the entire claims process and ongoing benefit period."
      },
      {
        term: "Assignment of Benefits (AOB)",
        definition: "An arrangement where the insurance company pays the care provider directly, eliminating the need for the family to front care costs each month.",
        whyMatters: "Ask your case manager about AOB at approval — it simplifies billing significantly for ongoing home care.",
        longTermImpact: "This eliminates cash flow problems and reduces administrative burden for families managing care."
      }
    ]
  },
  {
    stepNumber: 4,
    stepTitle: "Submit Claim",
    stepColor: "#1B3A5C",
    terms: [
      {
        term: "Care Logs",
        definition: "Daily records of every care visit, including date, caregiver name, start/end time, and services provided. Required by most carriers for monthly reimbursement.",
        whyMatters: "Missing or incomplete care logs are the most common reason for delayed or denied reimbursements after approval.",
        longTermImpact: "Accurate care logs ensure you get paid every month without delays or disputes."
      },
      {
        term: "Periodic Review",
        definition: "A reassessment conducted by the case manager every 90–180 days to confirm continued eligibility and review the care plan.",
        whyMatters: "Be prepared to demonstrate ongoing care needs at each review. Significant improvement could affect benefit continuation.",
        longTermImpact: "These reviews happen throughout your entire claim period and can affect your benefits."
      },
      {
        term: "Appeals Process",
        definition: "A formal process to challenge a claim denial or benefit reduction. Typically requires a written appeal letter, additional medical documentation, and sometimes an independent medical examination.",
        whyMatters: "Most carriers have a 60–180 day window to file an appeal. Act quickly if benefits are denied or reduced.",
        longTermImpact: "Understanding your appeal rights protects you if the insurance company denies or reduces your benefits."
      },
      {
        term: "Benefit Pool Exhaustion",
        definition: "When the total lifetime maximum has been paid out and no further benefits are available under the policy.",
        whyMatters: "Track your running balance carefully. When approaching exhaustion, begin exploring supplemental options — not at the last minute.",
        longTermImpact: "Planning ahead for what happens after benefits end ensures continuity of care for your loved one."
      }
    ]
  }
];

const ACADEMY_VIDEOS: Video[] = [
  {
    id: "video-1",
    title: "What is Long-Term Care Insurance?",
    youtubeId: "ytsdfesv_uk",
    description: "Discover the fundamentals of long-term care insurance and how it protects your family's financial future.",
    duration: "External sample lesson",
    instructor: "External educational publisher",
    keyPoints: [
      "LTC insurance covers costs of extended care services (in-home, assisted living, nursing homes)",
      "Benefits protect your family's savings from catastrophic care expenses",
      "Coverage typically begins after an elimination period (30-90 days)",
      "Policies can be purchased at any age, but earlier is more affordable",
      "Average daily costs range from $150-$300+ depending on location and care type",
    ],
    downloads: [
      { name: "LTC Insurance Basics Guide", url: "#", icon: "pdf" },
      { name: "Coverage Comparison Chart", url: "#", icon: "pdf" },
      { name: "Planning Worksheet", url: "#", icon: "doc" },
    ],
  },
  {
    id: "video-2",
    title: "Understanding Your Policy Documents",
    youtubeId: "0LGv1Z9CLbc",
    description: "Navigate your insurance policy with confidence. Learn policy language, coverage limits, and benefit amounts.",
    duration: "External sample lesson",
    instructor: "External educational publisher",
    keyPoints: [
      "Schedule of Benefits page shows your daily/monthly maximum and lifetime limit",
      "Elimination period is the waiting period before benefits begin",
      "Benefit triggers define when you qualify for coverage (ADL limitations, cognitive impairment)",
      "Riders and endorsements add optional coverage (inflation protection, waiver of premium)",
      "Contact information for claims is typically on the back of your insurance card",
    ],
    downloads: [
      { name: "Policy Glossary", url: "#", icon: "pdf" },
      { name: "Document Checklist", url: "#", icon: "pdf" },
      { name: "Key Terms Reference", url: "#", icon: "doc" },
    ],
  },
  {
    id: "video-3",
    title: "Filing Your LTC Insurance Claim",
    youtubeId: "dSqQ8Ahb1VY",
    description: "Master the claim filing process step-by-step. Learn what your insurance company needs and common pitfalls.",
    duration: "External sample lesson",
    instructor: "External educational publisher",
    keyPoints: [
      "Notify your insurance company within 30 days of needing care services",
      "Gather medical documentation proving you meet benefit triggers (ADL assessments)",
      "Submit claim forms with physician certification and care plan",
      "Insurance company will conduct independent assessment (usually within 30 days)",
      "Keep detailed records of all correspondence and documentation submitted",
    ],
    downloads: [
      { name: "Claim Filing Checklist", url: "#", icon: "pdf" },
      { name: "Required Documentation List", url: "#", icon: "pdf" },
      { name: "Claim Form Template", url: "#", icon: "doc" },
    ],
  },
  {
    id: "video-4",
    title: "Managing Benefits After Approval",
    youtubeId: "4c5rqyrLVJ8",
    description: "Learn how to manage ongoing benefits, maintain documentation, and keep your claim in good standing.",
    duration: "External sample lesson",
    instructor: "External educational publisher",
    keyPoints: [
      "Submit monthly care logs documenting services received and costs incurred",
      "Report any changes in care needs, providers, or living situation immediately",
      "Keep receipts and invoices for all care expenses to support reimbursement requests",
      "Review benefit statements monthly to ensure accuracy of payments",
      "Maintain regular communication with your insurance case manager",
    ],
    downloads: [
      { name: "Benefits Management Guide", url: "#", icon: "pdf" },
      { name: "Care Log Template", url: "#", icon: "pdf" },
      { name: "Monthly Reporting Form", url: "#", icon: "doc" },
    ],
  },
];

export function LTCAcademyPlayer({ onLessonChange, onProgress }: { onLessonChange?: (index: number) => void; onProgress?: (ids: Set<string>) => void }) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(() => {
    try { const parsed = JSON.parse(localStorage.getItem('ltc-academy-completed') || '[]'); return new Set(Array.isArray(parsed) ? parsed.filter((id: unknown) => ACADEMY_VIDEOS.some(v => v.id === id)) : []); } catch { return new Set(); }
  });
  const selectedVideo = ACADEMY_VIDEOS[selectedVideoIndex];
  useEffect(() => { onLessonChange?.(selectedVideoIndex); setExpandedStep(selectedVideoIndex + 1); }, [selectedVideoIndex, onLessonChange]);
  useEffect(() => {
    try { localStorage.setItem('ltc-academy-completed', JSON.stringify(Array.from(completedVideos))); } catch { /* Storage can be unavailable in private browsing. */ }
    onProgress?.(completedVideos);
  }, [completedVideos, onProgress]);
  const markVideoCompleted = (videoId: string) => setCompletedVideos(previous => {
    const next = new Set(previous); next.has(videoId) ? next.delete(videoId) : next.add(videoId); return next;
  });
  const getDownloadIcon = (type: "pdf" | "doc" | "guide") => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "doc":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const goToNext = () => {
    if (selectedVideoIndex < ACADEMY_VIDEOS.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
      document.getElementById('academy-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToPrevious = () => {
    if (selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
      document.getElementById('academy-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const progressPercentage = Math.round(((completedVideos.size) / ACADEMY_VIDEOS.length) * 100);

  return (
    <div className="w-full academy-flow-background" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Video Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Video Title and Info */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
            {selectedVideo.title}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
              Presented by {selectedVideo.instructor}
            </span>
            <span className="flex items-center gap-1" style={{ color: "#999999", fontFamily: "Aptos, sans-serif" }}>
              <Clock className="w-4 h-4" />
              {selectedVideo.duration}
            </span>
          </div>
        </div>

        <YouTubeLesson key={selectedVideo.id} videoId={selectedVideo.youtubeId} title={selectedVideo.title} />
        <div className="my-6 rounded-xl border bg-white p-4">
          <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={completedVideos.has(selectedVideo.id)} onChange={() => markVideoCompleted(selectedVideo.id)} className="h-5 w-5" />I have completed this lesson</label>
          <div role="progressbar" aria-label="Academy completion" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100} className="h-3 bg-slate-100 rounded-full mt-4 overflow-hidden"><div className="h-full bg-teal transition-all" style={{width: `${progressPercentage}%`}} /></div>
          <p className="text-sm text-slate-600 mt-2">{completedVideos.size} of 4 lessons completed ({progressPercentage}%). Navigation does not mark a lesson complete.</p>
        </div>
        {/* Video Description */}
        <p className="text-base leading-relaxed mb-8" style={{ color: "#333333", fontFamily: "Aptos, sans-serif" }}>
          {selectedVideo.description}
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-3 items-center justify-between py-6 border-t-2 border-b-2" style={{ borderColor: "#E8E8E8" }}>
          <button
            onClick={goToPrevious}
            disabled={selectedVideoIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            style={{
              backgroundColor: selectedVideoIndex === 0 ? "#E8E8E8" : "#4A9FB5",
              color: selectedVideoIndex === 0 ? "#999999" : "#FFFFFF",
              fontFamily: "Aptos, sans-serif",
            }}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Video
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
              {selectedVideoIndex + 1} of {ACADEMY_VIDEOS.length}
            </p>
          </div>

          <button
            onClick={goToNext}
            disabled={selectedVideoIndex === ACADEMY_VIDEOS.length - 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            style={{
              backgroundColor: selectedVideoIndex === ACADEMY_VIDEOS.length - 1 ? "#E8E8E8" : "#4A9FB5",
              color: selectedVideoIndex === ACADEMY_VIDEOS.length - 1 ? "#999999" : "#FFFFFF",
              fontFamily: "Aptos, sans-serif",
            }}
          >
            Next Video
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Column Layout: Education (75%) + Resources (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 my-12">
          {/* Left Column: Educational Guide (75% - 3 columns) */}
          <div className="lg:col-span-3">
            <h3 className="text-2xl font-bold mb-8" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
              Your LTC Journey: Educational Guide
            </h3>

            <div className="space-y-6">
              {STEP_EDUCATION.map((step) => (
                <div key={step.stepNumber} className="rounded-lg overflow-hidden border" style={{ borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  {/* Step Header */}
                  <button type="button" className="p-5 w-full text-left" aria-expanded={expandedStep === step.stepNumber} aria-controls={`lesson-step-${step.stepNumber}`} onClick={() => setExpandedStep(expandedStep === step.stepNumber ? null : step.stepNumber)} style={{ backgroundColor: step.stepColor }}>
                    <h4 className="text-lg font-bold text-white" style={{ fontFamily: "Aptos, sans-serif" }}>
                      Step {step.stepNumber}: {step.stepTitle}
                    </h4>
                  </button>

                  {/* Accordion Terms */}
                  <div id={`lesson-step-${step.stepNumber}`} hidden={expandedStep !== step.stepNumber} className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {step.terms.map((item, idx) => (
                        <AccordionItem key={idx} value={`step-${step.stepNumber}-term-${idx}`} className="border-b border-gray-100 last:border-b-0">
                          <AccordionTrigger className="hover:no-underline py-4 px-5 hover:bg-gray-50" style={{ fontFamily: "Aptos, sans-serif" }}>
                            <div className="flex items-start gap-3 text-left">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold"
                                style={{ backgroundColor: step.stepColor }}
                              >
                                {idx + 1}
                              </div>
                              <span className="font-semibold text-gray-800">
                                {item.term}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 bg-gray-50">
                            <div className="px-5 py-4 space-y-4">
                              {/* Definition */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: step.stepColor, fontFamily: "Aptos, sans-serif" }}>
                                  Definition
                                </p>
                                <p style={{ color: "#555", fontFamily: "Aptos, sans-serif", fontSize: "14px", lineHeight: "1.5" }}>
                                  {item.definition}
                                </p>
                              </div>

                              {/* Why It Matters */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: step.stepColor, fontFamily: "Aptos, sans-serif" }}>
                                  Why It Matters Now
                                </p>
                                <p style={{ color: "#555", fontFamily: "Aptos, sans-serif", fontSize: "14px", lineHeight: "1.5" }}>
                                  {item.whyMatters}
                                </p>
                              </div>

                              {/* Long-term Impact */}
                              <div
                                className="p-3 rounded-lg border-l-4"
                                style={{ backgroundColor: "#F5F5F5", borderColor: step.stepColor }}
                              >
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: step.stepColor, fontFamily: "Aptos, sans-serif" }}>
                                  Long-Term Impact
                                </p>
                                <p style={{ color: "#555", fontFamily: "Aptos, sans-serif", fontSize: "14px", lineHeight: "1.5" }}>
                                  {item.longTermImpact}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Resources (25% - 1 column) - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {/* Resources Header */}
                <div className="p-5" style={{ backgroundColor: "#1B3A5C" }}>
                  <h4 className="text-base font-bold text-white" style={{ fontFamily: "Aptos, sans-serif" }}>
                    Resources
                  </h4>
                  <p className="text-xs text-gray-300 mt-1" style={{ fontFamily: "Aptos, sans-serif" }}>
                    All guides, in learning order
                  </p>
                </div>

                <img src="/manus-storage/policy-form-hero_314c2717.jpg" alt="Family preparing policy paperwork" className="h-32 w-full object-cover" />
                {/* Download Buttons */}
                <div className="p-4 space-y-3">
                  {RESOURCE_GUIDES.map((guide, idx) => { const download = { name: guide.title, url: `/resources/${guide.slug}`, icon: guide.format === "docx" ? "doc" as const : "pdf" as const }; return (
                    <a
                      key={idx}
                      href={download.url}
                      onClick={(e) => {
                        if (download.url === "#") {
                          e.preventDefault();
                          toast.info("Coming Soon", { description: `${download.name} will be available soon.` });
                        }
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:border-gray-400"
                      style={{
                        borderColor: "#E0E0E0",
                        backgroundColor: "#F9F9F9",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F0F0F0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#F9F9F9";
                      }}
                    >
                      <div style={{ color: "#4A9FB5" }}>
                        {getDownloadIcon(download.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 break-words" style={{ fontFamily: "Aptos, sans-serif" }}>
                          {download.name}
                        </p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: "Aptos, sans-serif" }}>
                          Open guide and download
                        </p>
                      </div>
                      <Download className="w-4 h-4 flex-shrink-0" style={{ color: "#4A9FB5" }} />
                    </a>
                  ); })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
