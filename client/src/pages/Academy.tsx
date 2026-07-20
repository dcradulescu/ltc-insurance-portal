import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { LTCAcademyPlayer } from "@/components/LTCAcademyPlayer";
import { Link } from "wouter";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { useEffect } from "react";

const VA_TEAL = "#34B1C4";
const TOTAL_VIDEOS = 4;

export default function Academy() {
  useEffect(() => {
    const updateProgressBar = () => {
      const stored = localStorage.getItem('ltc-academy-completed');
      let completed = 0;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          completed = parsed.length;
        } catch (e) {
          console.error('Failed to parse completion data:', e);
        }
      }
      const percentage = Math.round((completed / TOTAL_VIDEOS) * 100);
      const progressBar = document.getElementById('academy-progress-bar');
      const progressText = document.getElementById('academy-progress-text');
      if (progressBar) {
        progressBar.style.width = percentage + '%';
      }
      if (progressText) {
        progressText.textContent = percentage + '%';
      }
    };

    updateProgressBar();
    window.addEventListener('storage', updateProgressBar);
    const interval = setInterval(updateProgressBar, 500);

    return () => {
      window.removeEventListener('storage', updateProgressBar);
      clearInterval(interval);
    };
  }, []);

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

      {/* Hero Banner - Same format as Homepage */}
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
                Learn from expert instructors who guide you through every step of the long-term care insurance journey. Our comprehensive video series breaks down complex topics into easy-to-understand lessons covering policy basics, the claims process, and strategies to maximize your benefits.
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

      {/* Thin Progress Timeline */}
      <section className="bg-white py-4 border-b border-gray-200">
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Progress bar background */}
            <div className="flex-1 h-1 bg-gray-200 rounded-full relative">
              {/* Progress fill - updated by useEffect */}
              <div 
                className="h-full bg-gradient-to-r rounded-full transition-all duration-300"
                style={{ 
                  width: '0%',
                  background: 'linear-gradient(to right, ' + VA_TEAL + ', #34B1C4)'
                }}
                id="academy-progress-bar"
              />
            </div>
            {/* Progress percentage text */}
            <span 
              className="ml-4 text-sm font-semibold whitespace-nowrap"
              style={{ color: VA_TEAL, fontFamily: "Aptos, sans-serif" }}
              id="academy-progress-text"
            >
              0%
            </span>
          </div>
        </div>
      </section>

      <div id="academy-content">
        <LTCAcademyPlayer />
      </div>
    </Layout>
  );
}
