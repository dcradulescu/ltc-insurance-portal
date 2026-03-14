"use client";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Education & Resources",
    description:
      "Comprehensive guides to help you understand your long-term care insurance policy, benefits, and coverage options.",
    color: "bg-teal/10 text-teal group-hover:bg-teal/20",
  },
  {
    icon: ClipboardList,
    title: "Policy Intake Form",
    description:
      "Our interactive form captures your specific policy details so we can provide tailored guidance for your situation.",
    color: "bg-primary/10 text-primary group-hover:bg-primary/20",
  },
  {
    icon: Target,
    title: "Customized Strategy",
    description:
      "Receive a personalized, step-by-step strategy designed specifically for your policy and care needs.",
    color: "bg-teal/10 text-teal group-hover:bg-teal/20",
  },
  {
    icon: Phone,
    title: "Live Support Chat",
    description:
      "Get instant answers to your questions about long-term care insurance through our intelligent support chat.",
    color: "bg-primary/10 text-primary group-hover:bg-primary/20",
  },
];

const storyQuotes = [
  "Years ago, Jim told me it was smart to take out this policy. I called the insurance company, but we couldn't make heads or tails of what to do.",
  "When my father needed home care, I had no idea where to start with his LTC policy.",
  "We had been paying premiums for 15 years and were terrified of the claims process.",
];

const testimonials = [
  {
    quote:
      "When my father needed home care, I had no idea where to start with his LTC policy. Visiting Angels walked us through every step. Within weeks, we had a clear strategy and the claim was approved.",
    author: "Margaret S.",
    role: "Daughter of policyholder",
  },
  {
    quote:
      "We had been paying premiums for 15 years and were terrified of the claims process. The personalized strategy made everything so clear. We couldn't have done it without this guidance.",
    author: "Robert & Linda K.",
    role: "Policyholders",
  },
  {
    quote:
      "Mom's insurance company kept asking for more paperwork. Visiting Angels helped us understand exactly what was needed and organized everything. The claim was approved on the second submission.",
    author: "Susan T.",
    role: "Caregiver for her mother",
  },
  {
    quote:
      "The education resources alone were worth it. We finally understood what ADLs meant, what our policy actually covered, and how to document everything properly. A true lifesaver for our family.",
    author: "James & Patricia W.",
    role: "Family caregivers",
  },
  {
    quote:
      "After my husband's stroke, I was overwhelmed. The step-by-step checklist kept me on track. Every task was clear, and I always knew what to do next. I felt supported the entire time.",
    author: "Carol D.",
    role: "Wife of policyholder",
  },
  {
    quote:
      "Dad's claim was initially denied. Using the strategy from this portal, we appealed with the right documentation and it was overturned. This service literally saved us tens of thousands of dollars.",
    author: "Thomas M.",
    role: "Son of policyholder",
  },
];

// Add CSS animations
const animationStyles = `
  @keyframes typing {
    0% { width: 0; }
    100% { width: 100%; }
  }
  
  @keyframes messageAppear {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes blink {
    0%, 49%, 100% { opacity: 1; }
    50%, 99% { opacity: 0; }
  }
  
  @keyframes flowDown {
    0% { opacity: 0; transform: translateY(-10px); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: translateY(10px); }
  }
  
  @keyframes fillField {
    0% { width: 0; }
    100% { width: 100%; }
  }
  
  @keyframes checkboxCheck {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .animate-typing {
    animation: typing 4s infinite;
    overflow: hidden;
    white-space: nowrap;
    border-right: 2px solid currentColor;
  }
  
  .animate-blink {
    animation: blink 1s infinite;
  }
  
  .animate-flow {
    animation: flowDown 2s infinite;
  }
  
  .animate-fill {
    animation: fillField 3s ease-in-out infinite;
  }
  
  .animate-check {
    animation: checkboxCheck 0.6s ease-out;
  }
`;

export default function Home() {
  const { user } = useAuth();
  const [activeQuote, setActiveQuote] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuote((prev) => (prev + 1) % storyQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1576091160550-112173f7f869?w=1200&q=80')",
              backgroundAttachment: "fixed",
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-white space-y-6">
                <div className="inline-flex items-center gap-2 bg-teal/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Heart className="w-4 h-4 text-teal" />
                  <span className="text-sm font-medium">Supportive Guidance for Families</span>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight">
                  Navigating Long Term Care insurance with <span className="text-teal">Confidence!</span>
                </h1>
                <p className="text-lg text-white/90 leading-relaxed max-w-lg">
                  Filing a long-term care insurance claim can be overwhelming. We provide the education, tools, and personalized strategies your family needs to successfully navigate the process.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="bg-teal hover:bg-teal-dark text-white">
                    <Link href="/policy-form">Start Your Claim Journey</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20">
                    <Link href="/education">Learn About LTC</Link>
                  </Button>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <VideoPlaceholder title="Welcome to Visiting Angels" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Help Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                How We <span className="text-teal">Help</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our portal provides everything you need to understand, prepare, and successfully file your long-term care insurance claim.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white rounded-lg border border-border p-6 hover:shadow-lg hover:border-teal/30 transition-all duration-300"
                  >
                    <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Intake Form Section */}
        <section className="py-20 bg-secondary">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary-dark">Smart Preparation</span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                  The <span className="text-primary">Intake Form</span>
                </h2>
                <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                  Our comprehensive policy intake form is designed to gather all the essential information about your long-term care insurance policy in one place. When you're ready to call your insurance company, you'll have everything organized and at your fingertips.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-4">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Complete Policy Details</h3>
                      <p className="text-sm text-foreground/70">Capture your policy number, carrier, coverage dates, and benefit amounts</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Organized Documentation</h3>
                      <p className="text-sm text-foreground/70">Store medical records, care assessments, and supporting documents in one secure location</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Ready for Your Call</h3>
                      <p className="text-sm text-foreground/70">When you contact your insurance company, you'll have all the information they need to process your claim efficiently</p>
                    </div>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-primary hover:bg-primary-dark text-white">
                  <Link href="/policy-form">Complete Your Intake Form</Link>
                </Button>
              </div>

              {/* Right: Interactive Form Graphic */}
              <div className="relative hidden lg:block">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
                  {/* Form Header */}
                  <div className="mb-6 pb-4 border-b-2 border-primary/20">
                    <div className="h-3 bg-primary rounded w-1/3 animate-fill" />
                  </div>
                  
                  {/* Form Fields */}
                  <div className="space-y-5">
                    {/* Field 1 */}
                    <div>
                      <div className="h-2.5 bg-primary/30 rounded w-1/4 mb-2" />
                      <div className="h-8 bg-primary/10 rounded border border-primary/20 overflow-hidden">
                        <div className="h-full bg-primary/20 animate-fill" style={{ animationDelay: "0s" }} />
                      </div>
                    </div>
                    
                    {/* Field 2 */}
                    <div>
                      <div className="h-2.5 bg-primary/30 rounded w-1/3 mb-2" />
                      <div className="h-8 bg-primary/10 rounded border border-primary/20 overflow-hidden">
                        <div className="h-full bg-primary/20 animate-fill" style={{ animationDelay: "0.5s" }} />
                      </div>
                    </div>
                    
                    {/* Field 3 */}
                    <div>
                      <div className="h-2.5 bg-primary/30 rounded w-1/4 mb-2" />
                      <div className="h-8 bg-primary/10 rounded border border-primary/20 overflow-hidden">
                        <div className="h-full bg-primary/20 animate-fill" style={{ animationDelay: "1s" }} />
                      </div>
                    </div>
                    
                    {/* Checkboxes */}
                    <div className="pt-2">
                      <div className="h-2.5 bg-primary/30 rounded w-1/3 mb-3" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-primary rounded animate-check" style={{ animationDelay: "1.5s" }} />
                          <div className="h-2 bg-primary/20 rounded w-1/2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-primary/20 rounded border border-primary/30" />
                          <div className="h-2 bg-primary/20 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-6 pt-4 border-t border-primary/20">
                    <div className="h-8 bg-primary rounded w-1/2 animate-fill" style={{ animationDelay: "2s" }} />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full -z-10" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-teal/10 rounded-full -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Customized Strategy Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Interactive Strategy Flow */}
              <div className="relative hidden lg:block order-2 lg:order-1">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                  {/* Workflow Steps - Vertical Flow */}
                  <div className="space-y-3">
                    {/* Step 1 - Learn About LTC */}
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-400 rounded-lg p-4 animate-flow" style={{ animationDelay: "0s" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-400 text-white font-bold text-sm">1</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-blue-900 text-sm">Learn About LTC</div>
                          <div className="text-xs text-blue-700 mt-0.5">Understand your policy and benefits</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connector Arrow */}
                    <div className="flex justify-center py-2">
                      <div className="text-gray-400 text-3xl animate-flow" style={{ animationDelay: "0.5s" }}>↓</div>
                    </div>
                    
                    {/* Step 2 - Discover Your Policy Benefits */}
                    <div className="bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-400 rounded-lg p-4 animate-flow" style={{ animationDelay: "1s" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-green-400 text-white font-bold text-sm">2</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-green-900 text-sm">Discover Your Policy Benefits</div>
                          <div className="text-xs text-green-700 mt-0.5">Review coverage and eligibility</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connector Arrow */}
                    <div className="flex justify-center py-2">
                      <div className="text-gray-400 text-3xl animate-flow" style={{ animationDelay: "1.5s" }}>↓</div>
                    </div>
                    
                    {/* Step 3 - Develop Custom Strategy */}
                    <div className="bg-gradient-to-r from-purple-100 to-purple-50 border-l-4 border-purple-400 rounded-lg p-4 animate-flow" style={{ animationDelay: "2s" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-purple-400 text-white font-bold text-sm">3</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-purple-900 text-sm">Develop a Custom Strategy</div>
                          <div className="text-xs text-purple-700 mt-0.5">Create your personalized action plan</div>
                          <div className="text-xs text-purple-600 mt-1.5 space-y-0.5">
                            <div>• Organize documentation</div>
                            <div>• Prepare for insurance call</div>
                            <div>• Set timeline and milestones</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connector Arrow */}
                    <div className="flex justify-center py-2">
                      <div className="text-gray-400 text-3xl animate-flow" style={{ animationDelay: "2.5s" }}>↓</div>
                    </div>
                    
                    {/* Step 4 - Initiate a Claim */}
                    <div className="bg-gradient-to-r from-pink-100 to-pink-50 border-l-4 border-pink-400 rounded-lg p-4 animate-flow" style={{ animationDelay: "3s" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-pink-400 text-white font-bold text-sm">✓</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-pink-900 text-sm">Initiate a Claim</div>
                          <div className="text-xs text-pink-700 mt-0.5">File your claim with confidence</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-100 rounded-full -z-10 opacity-50" />
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-pink-100 rounded-full -z-10 opacity-50" />
              </div>

              {/* Right: Content */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-teal/10 rounded-full px-4 py-2 mb-6">
                  <Target className="w-4 h-4 text-teal" />
                  <span className="text-sm font-medium text-teal-dark">Personalized Guidance</span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Your <span className="text-teal">Customized Strategy</span>
                </h2>
                <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                  Based on your specific policy details and care situation, we create a personalized, step-by-step strategy designed just for you. This roadmap guides you through every phase of the claims process with clarity and confidence.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-4">
                    <Zap className="w-6 h-6 text-teal flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Step-by-Step Roadmap</h3>
                      <p className="text-sm text-foreground/70">Know exactly what to do and when to do it, with clear milestones and timelines</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Zap className="w-6 h-6 text-teal flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Task Checklists</h3>
                      <p className="text-sm text-foreground/70">Track your progress with organized checklists for each phase of your claim</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Zap className="w-6 h-6 text-teal flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Policy-Specific Guidance</h3>
                      <p className="text-sm text-foreground/70">Recommendations tailored to your unique coverage and care needs</p>
                    </div>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-teal hover:bg-teal-dark text-white">
                  <Link href="/strategy">Get Your Strategy</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* You Don't Have to Navigate This Alone */}
        <section className="py-20 bg-secondary">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
                You Don't Have to Navigate This <span className="text-teal">Alone</span>
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-8">
                Thousands of families have trusted us to guide them through the long-term care insurance claims process. Let us create a personalized strategy for your family too.
              </p>
            </div>
          </div>
        </section>

        {/* Live Chat Support Section */}
        <section className="py-20 bg-secondary">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary-dark">Always Available</span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                  <span className="text-primary">Live Chat</span> Support
                </h2>
                <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                  Have a question about your policy, the claims process, or how to use the portal? Our intelligent support chat is available to help you find answers quickly. Get instant responses to your questions without waiting on hold.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-4">
                    <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Instant Responses</h3>
                      <p className="text-sm text-foreground/70">Get answers to common questions about LTC insurance and the claims process immediately</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Available 24/7</h3>
                      <p className="text-sm text-foreground/70">Chat support is available whenever you need it, day or night, to answer your questions</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground mb-2">Personalized Help</h3>
                      <p className="text-sm text-foreground/70">Get guidance specific to your situation and policy details</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Chat Graphic */}
              <div className="relative hidden lg:block">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-border">
                  <div className="bg-primary/10 p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Support Chat</div>
                        <div className="text-xs text-foreground/60">Always here to help</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 min-h-[400px] flex flex-col justify-end">
                    {/* Message 1: User Question - Appears with typing */}
                    <div className="flex justify-end" style={{
                      animation: "messageAppear 0.5s ease-out 0.5s both"
                    }}>
                      <div className="bg-primary text-white rounded-lg px-4 py-2 text-sm max-w-xs">
                        What is the first step in filing a claim?
                      </div>
                    </div>
                    
                    {/* Message 2: Support Response - Appears with typing */}
                    <div className="flex justify-start" style={{
                      animation: "messageAppear 0.5s ease-out 2s both"
                    }}>
                      <div className="bg-foreground/10 text-foreground rounded-lg px-4 py-2 text-sm max-w-xs">
                        <span style={{
                          animation: "typing 3s ease-out 2s both",
                          display: "inline-block",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          borderRight: "2px solid currentColor"
                        }}>Gather your policy documents and contact info...</span>
                      </div>
                    </div>
                    
                    {/* Message 3: User Follow-up - Appears with typing */}
                    <div className="flex justify-end" style={{
                      animation: "messageAppear 0.5s ease-out 5.5s both"
                    }}>
                      <div className="bg-primary text-white rounded-lg px-4 py-2 text-sm max-w-xs">
                        How long does approval usually take?
                      </div>
                    </div>
                    
                    {/* Message 4: Support Final Response - Appears with typing */}
                    <div className="flex justify-start" style={{
                      animation: "messageAppear 0.5s ease-out 7.5s both"
                    }}>
                      <div className="bg-foreground/10 text-foreground rounded-lg px-4 py-2 text-sm max-w-xs">
                        <span style={{
                          animation: "typing 3s ease-out 7.5s both",
                          display: "inline-block",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          borderRight: "2px solid currentColor"
                        }}>Typically 30-60 days. We help expedite the process...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl h-[400px]">
                  <img
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/swQpXlcRmPQTVKfl.jpg"
                    alt="Elderly couple embracing a Visiting Angels care coordinator"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal/10 rounded-full -z-10" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-full -z-10" />
              </div>

              {/* Right: Our Story with fading quotes */}
              <div>
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
                      className="absolute inset-0 flex items-center text-lg md:text-xl text-foreground/80 italic leading-relaxed pl-6 transition-all duration-1000"
                      style={{
                        opacity: activeQuote === index ? 1 : 0,
                        transform: activeQuote === index ? "translateY(0)" : (index < activeQuote || (activeQuote === 0 && index === storyQuotes.length - 1)) ? "translateY(-15px)" : "translateY(15px)",
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
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        activeQuote === index ? "bg-teal w-6" : "bg-teal/30 hover:bg-teal/50"
                      }`}
                      aria-label={`Quote ${index + 1}`}
                    />
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  — A Visiting Angels family
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scrolling Testimonials */}
        <section className="py-20 bg-secondary overflow-hidden">
          <div className="container mb-12">
            <div className="text-center">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                What <span className="text-teal">Families</span> Are Saying
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Hear from families who have successfully navigated the LTC insurance claims process with our help.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-secondary to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary to-transparent z-10" />
            <div className="flex gap-6 overflow-x-auto pb-4 px-4">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-96 bg-white rounded-lg shadow-md p-6 border border-border"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Four Simple Steps Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Four Simple <span className="text-teal">Steps</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From sign-up to claim approval — here's how we guide you through the process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  number: "01",
                  title: "Create Account",
                  description: "Sign up to securely save your information and access personalized features.",
                },
                {
                  number: "02",
                  title: "Enter Policy Details",
                  description: "Complete our comprehensive policy intake form with your insurance information.",
                },
                {
                  number: "03",
                  title: "Get Your Strategy",
                  description: "Receive a customized claim filing strategy tailored to your specific situation.",
                },
                {
                  number: "04",
                  title: "File With Confidence",
                  description: "Follow your personalized guide to successfully submit your LTC insurance claim.",
                },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="text-5xl font-bold text-teal/20 mb-4">{step.number}</div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to Get Started Section */}
        <section className="py-8 bg-gradient-to-r from-teal-600 to-teal-700 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23000000\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            }}
          />
          <div className="container relative z-10 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Create your free account today and take the first step toward successfully filing your long-term care insurance claim.
            </p>
            <Button asChild size="lg" className="bg-white text-teal hover:bg-white/90">
              <Link href="/policy-form">Complete Policy Form <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
