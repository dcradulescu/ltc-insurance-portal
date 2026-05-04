import { useState, useEffect, useRef } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutHomeCareProps {
  showStartButton?: boolean;
  onStartClick?: () => void;
}

export function AboutHomeCare({ showStartButton = false, onStartClick }: AboutHomeCareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Handle parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background Image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%), url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 800%22><defs><linearGradient id=%22grad%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22><stop offset=%220%25%22 style=%22stop-color:rgb(20,184,166);stop-opacity:0.1%22 /><stop offset=%22100%25%22 style=%22stop-color:rgb(59,130,246);stop-opacity:0.1%22 /></linearGradient></defs><rect width=%221200%22 height=%22800%22 fill=%22url(%23grad)%22/></svg>')",
          transform: `translateY(${scrollY * 0.5}px)`,
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50/80 via-white/70 to-slate-50/80" />

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full px-4 py-20 md:py-0">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-gradient-to-br from-teal/20 to-blue/20 rounded-full">
              <Heart className="w-12 h-12 text-teal animate-pulse" />
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 leading-tight">
              Ready to Start Home Care?
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Professional, compassionate home care services to support your loved ones through their long-term care journey. Our experienced caregivers are here to help.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 py-8">
            {[
              { icon: "👥", label: "Experienced Caregivers" },
              { icon: "🏥", label: "Professional Training" },
              { icon: "❤️", label: "Compassionate Care" },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 p-4">
                <span className="text-5xl">{feature.icon}</span>
                <p className="text-base font-medium text-slate-700">{feature.label}</p>
              </div>
            ))}
          </div>

          {/* Primary CTA Button */}
          <div className="pt-8">
            <Button
              onClick={() => window.open("https://www.SCVisitingAngels.com", "_blank")}
              className="bg-gradient-to-r from-teal to-blue hover:from-teal/90 hover:to-blue/90 text-white px-10 py-7 text-lg font-semibold rounded-lg group/btn transition-all duration-300 hover:shadow-2xl hover:shadow-teal/40 transform hover:scale-105"
            >
              Start Home Care Today
              <ArrowRight className="w-6 h-6 ml-3 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Subtext */}
          <p className="text-base text-slate-500 pt-4">
            Serving South Carolina with professional home care services
          </p>
        </div>
      </div>

      {/* Animated border pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
