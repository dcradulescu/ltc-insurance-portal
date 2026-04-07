import { useState, useEffect, useRef } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutHomeCareProps {
  showStartButton?: boolean;
  onStartClick?: () => void;
}

export function AboutHomeCare({ showStartButton = false, onStartClick }: AboutHomeCareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Handle parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const windowCenter = window.innerHeight / 2;
        const distance = (elementCenter - windowCenter) / window.innerHeight;
        setScrollY(distance * 30); // Parallax intensity
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mouse position for animated border effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative py-20 overflow-hidden"
      style={{
        transform: `translateY(${scrollY}px)`,
        transition: "transform 0.3s ease-out",
      }}
    >
      {/* Parallax Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />

      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container max-w-4xl px-4 mx-auto">
        {/* Animated Border Container */}
        <div
          className="relative p-8 md:p-12 rounded-2xl border-2 border-transparent bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm overflow-hidden group"
          style={{
            backgroundImage: `
              linear-gradient(white, white),
              conic-gradient(
                from ${Math.atan2(mousePosition.y - 200, mousePosition.x - 200) * (180 / Math.PI)}deg,
                #14b8a6,
                #3b82f6,
                #14b8a6
              )
            `,
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
        >
          {/* Animated glow effect */}
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-teal via-blue to-teal rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur"
            style={{
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />

          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-teal/20 to-blue/20 rounded-full">
                <Heart className="w-8 h-8 text-teal animate-pulse" />
              </div>
            </div>

            {/* Heading */}
            <div>
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-3">
                Ready to Start Home Care?
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Professional, compassionate home care services to support your loved ones through their long-term care journey. Our experienced caregivers are here to help.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 py-6">
              {[
                { icon: "👥", label: "Experienced Caregivers" },
                { icon: "🏥", label: "Professional Training" },
                { icon: "❤️", label: "Compassionate Care" },
              ].map((feature, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{feature.icon}</span>
                  <p className="text-sm text-slate-600">{feature.label}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={onStartClick || (() => window.open("https://www.scvisitingangels.com", "_blank"))}
                className="bg-gradient-to-r from-teal to-blue hover:from-teal/90 hover:to-blue/90 text-white px-8 py-6 text-lg font-semibold rounded-lg group/btn transition-all duration-300 hover:shadow-lg hover:shadow-teal/30"
              >
                Start Home Care
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="px-8 py-6 text-lg font-semibold border-2 border-teal text-teal hover:bg-teal/5 rounded-lg transition-all duration-300"
                onClick={() => window.open("https://www.scvisitingangels.com", "_blank")}
              >
                Learn More
              </Button>
            </div>

            {/* Subtext */}
            <p className="text-sm text-slate-500 pt-2">
              Serving South Carolina with professional home care services
            </p>
          </div>
        </div>
      </div>

      {/* Animated border pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        @keyframes borderFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
