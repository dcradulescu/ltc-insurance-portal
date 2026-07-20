import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { LTCAcademyPlayer } from "@/components/LTCAcademyPlayer";
import { Link } from "wouter";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";

const VA_TEAL = "#34B1C4";

export default function Academy() {
  return (
    <Layout>
      <Helmet>
        <title>LTC Academy — Video Series on Long-Term Care Insurance | SC Visiting Angels</title>
        <meta name="description" content="Master long-term care insurance with our comprehensive video academy series. Learn about policies, claims, benefits, and more." />
        <meta property="og:title" content="LTC Academy — Comprehensive Video Education" />
        <meta property="og:description" content="Free video series teaching you everything about long-term care insurance and how to navigate the claims process." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LTC Academy — Video Series on Long-Term Care Insurance" />
        <meta name="twitter:description" content="Master long-term care insurance with our comprehensive video academy series." />
      </Helmet>

      {/* Hero Banner */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg" alt="LTC Academy" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(57,63,67,0.82)' }} />
        </div>
        <div className="container relative py-section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            {/* Left: Heading + Description + Buttons */}
            <div className="animate-float-up flex flex-col">
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: '#ffffff' }}>
                LTC Insurance{" "}
                <span style={{ color: VA_TEAL }}>Academy</span>
              </h1>
              <p className="text-lg text-white/85 leading-relaxed mb-6" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Learn from expert instructors who guide you through every step of the long-term care insurance journey. Our comprehensive video series breaks down complex topics into easy-to-understand lessons.
              </p>
              <div className="animate-float-up animate-delay-300 flex flex-row gap-3 sm:gap-4 justify-center">
              <Link href="#academy-content" className="va-btn text-base px-8 py-4 text-center shadow-lg">
                Start Learning
              </Link>
              <button
                className="va-btn va-btn-outline text-base px-6 py-4 flex items-center justify-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}
                onClick={async () => {
                  const shareData = { title: "LTC Academy — Free Video Learning", text: "Learn how to navigate long-term care insurance with our comprehensive video academy.", url: window.location.origin + '/academy' };
                  if (navigator.share && navigator.canShare?.(shareData)) {
                    try { await navigator.share(shareData); } catch {}
                  } else {
                    await navigator.clipboard.writeText(window.location.origin + '/academy');
                    toast.success("Link copied to clipboard!", { description: "Share it with family members." });
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Share Academy
              </button>
              </div>
            </div>
            {/* Right: Video */}
            <div className="animate-fade-in-scale animate-delay-200">
              <VideoPlaceholder
                title="Welcome to LTC Academy"
                description="Expert-led video lessons on navigating long-term care insurance"
                thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ZFmUJyMqNgTRQtRW.jpg"
                videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/MjPhBEQZfvIrfZms.mp4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Progress Timeline */}
      <section className="bg-white py-12 border-b-2" style={{ borderColor: "#E8E8E8" }}>
        <div className="container">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
              Your Learning Journey
            </h2>
            <p className="text-gray-600" style={{ fontFamily: "Aptos, sans-serif" }}>
              Follow these key milestones to master long-term care insurance
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r" style={{ background: "linear-gradient(to right, #4A9FB5, #FFD700, #FF6B9D)" }}></div>

            {/* Timeline points */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
              {[
                {
                  number: 1,
                  title: "Understand Basics",
                  description: "Learn LTC insurance fundamentals and policy types",
                  color: "#4A9FB5",
                  icon: "📚",
                },
                {
                  number: 2,
                  title: "Review Your Policy",
                  description: "Gather and review your specific policy details",
                  color: "#FFD700",
                  icon: "📋",
                },
                {
                  number: 3,
                  title: "Prepare Documents",
                  description: "Collect required medical and financial documents",
                  color: "#FF6B9D",
                  icon: "📄",
                },
                {
                  number: 4,
                  title: "Submit Claim",
                  description: "File your claim with confidence and follow up",
                  color: "#1B3A5C",
                  icon: "✅",
                },
              ].map((point, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  {/* Circle point */}
                  <button
                    onClick={() => {
                      document.getElementById("academy-content")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer mb-4"
                    style={{
                      backgroundColor: point.color,
                      boxShadow: `0 4px 12px ${point.color}40`,
                    }}
                    title={`Go to: ${point.title}`}
                  >
                    {point.icon}
                  </button>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="font-bold text-sm md:text-base mb-1" style={{ color: point.color, fontFamily: "Aptos, sans-serif" }}>
                      {point.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600" style={{ fontFamily: "Aptos, sans-serif" }}>
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div id="academy-content">
        <LTCAcademyPlayer />
      </div>
    </Layout>
  );
}
