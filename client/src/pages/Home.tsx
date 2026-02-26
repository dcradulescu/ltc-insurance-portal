import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Shield,
  FileText,
  BookOpen,
  Target,
  Heart,
  Users,
  CheckCircle,
  ArrowRight,
  Phone,
  ClipboardList,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Education & Resources",
    description:
      "Comprehensive guides to help you understand your long-term care insurance policy, benefits, and coverage options.",
  },
  {
    icon: ClipboardList,
    title: "Policy Intake Form",
    description:
      "Our interactive form captures your specific policy details so we can provide tailored guidance for your situation.",
  },
  {
    icon: Target,
    title: "Customized Strategy",
    description:
      "Receive a personalized, step-by-step strategy designed specifically for your policy and care needs.",
  },
  {
    icon: Phone,
    title: "Live Support Chat",
    description:
      "Get instant answers to your questions about long-term care insurance through our intelligent support chat.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
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
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#2c3e50] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="container relative py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/10">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-sm text-white/90">Supportive Guidance for Families</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Navigate Your LTC Insurance Claim{" "}
                <span className="text-primary">With Confidence</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
                Filing a long-term care insurance claim can be overwhelming. We provide the education, tools, and personalized strategies your family needs to successfully navigate the process.
              </p>
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Button asChild size="lg" className="text-base px-8">
                    <Link href="/policy-form">Start Your Claim Journey</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="text-base px-8">
                    <a href={getLoginUrl()}>Get Started Free</a>
                  </Button>
                )}
                <Button asChild variant="outline" size="lg" className="text-base px-8 border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <Link href="/education">Learn About LTC</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <VideoPlaceholder
                title="Welcome to LTC Navigator"
                description="Watch our brief introduction to learn how we can help your family"
                thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile video */}
      <section className="lg:hidden py-8 bg-secondary">
        <div className="container">
          <VideoPlaceholder
            title="Welcome to LTC Navigator"
            description="Watch our brief introduction to learn how we can help your family"
            thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How We <span className="text-primary">Help</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our portal provides everything you need to understand, prepare, and successfully file your long-term care insurance claim.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border bg-white hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-lg mb-3 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four simple steps to get your personalized LTC insurance claim strategy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-serif font-bold text-primary/10 mb-2">{step.number}</div>
                <h3 className="font-serif font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Families <span className="text-primary">Trust Us</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                We understand how stressful it can be when a loved one needs long-term care. Our mission is to remove the confusion and frustration from the insurance claims process so you can focus on what matters most — caring for your family.
              </p>
              <ul className="space-y-4">
                {[
                  "Personalized strategies based on your specific policy",
                  "Step-by-step guidance through the entire claims process",
                  "Expert knowledge of common insurance company practices",
                  "Downloadable and shareable strategy documents",
                  "Live support chat for immediate assistance",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-secondary rounded-xl p-8 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-serif text-2xl font-bold text-foreground">Families Helped</div>
                    <div className="text-sm text-muted-foreground">And counting</div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every family deserves clear guidance when navigating long-term care insurance. We are committed to making this process as smooth as possible.
                </p>
              </div>
              <div className="bg-secondary rounded-xl p-8 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-serif text-2xl font-bold text-foreground">Secure & Private</div>
                    <div className="text-sm text-muted-foreground">Your data is protected</div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your policy information and personal details are securely stored and never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Create your free account today and take the first step toward successfully filing your long-term care insurance claim.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Button asChild size="lg" variant="outline" className="text-base px-8 border-white text-white hover:bg-white hover:text-primary bg-transparent">
                <Link href="/policy-form">
                  Complete Policy Form <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline" className="text-base px-8 border-white text-white hover:bg-white hover:text-primary bg-transparent">
                <a href={getLoginUrl()}>
                  Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
