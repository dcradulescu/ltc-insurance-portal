import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutHomeCareProps {
  showStartButton?: boolean;
  onStartClick?: () => void;
}

export function AboutHomeCare({ showStartButton = false, onStartClick }: AboutHomeCareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setMousePosition({
            x: (e.clientX / window.innerWidth) * 100,
            y: (e.clientY / window.innerHeight) * 100,
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 overflow-hidden group"
    >
      {/* Parallax Background Images - Multiple layers */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(147, 197, 253, 0.4) 0%, rgba(165, 243, 252, 0.4) 100%),
            url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 250%22><defs><linearGradient id=%22bg1%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22><stop offset=%220%25%22 style=%22stop-color:rgb(147,197,253);stop-opacity:0.1%22 /><stop offset=%22100%25%22 style=%22stop-color:rgb(165,243,252);stop-opacity:0.1%22 /></linearGradient></defs><rect width=%221200%22 height=%22250%22 fill=%22url(%23bg1)%22/></svg>')
          `,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          transform: `translateY(${scrollY * 0.3}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(165, 243, 252, 0.3) 0%, rgba(147, 197, 253, 0.2) 50%, rgba(226, 232, 240, 0.1) 100%)`,
          transition: "background 0.3s ease-out",
        }}
      />

      {/* Soft gradient background - Pastel blue to green */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100" />

      {/* Decorative blurred circles */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl -z-10" />

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Left side - Logo and Text */}
        <div className="flex items-center gap-6 md:gap-8 flex-1">
          {/* Visiting Angels Logo */}
          <div
            className="flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110"
            style={{
              transform: `translateX(${(mousePosition.x - 50) * 0.05}px)`,
            }}
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663383586656/7PNQfuuwdux64rdnaX8mmg/Dove-Trans_350b603e.gif"
              alt="Visiting Angels"
              className="h-20 md:h-24 w-auto drop-shadow-lg"
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">
              Ready to Start Home Care?
            </h3>
            <p className="text-sm md:text-base text-slate-700 max-w-md">
              Professional, compassionate care services tailored to your needs
            </p>
          </div>
        </div>

        {/* Right side - CTA Button */}
        <div className="flex-shrink-0 ml-4 md:ml-8">
          <Button
            onClick={() => window.open("https://www.SCVisitingAngels.com", "_blank")}
            className="bg-gradient-to-r from-blue-400 to-teal-400 hover:from-blue-500 hover:to-teal-500 text-white px-6 md:px-8 py-3 md:py-4 font-semibold rounded-full group/btn transition-all duration-300 hover:shadow-lg hover:shadow-blue-300/50 transform hover:scale-105 whitespace-nowrap text-sm md:text-base"
          >
            Start Care
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Animated accent line */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 via-teal-400 to-transparent"
        style={{
          width: "100%",
          opacity: 0.6,
          transform: `scaleX(${0.5 + (mousePosition.x / 200)})`,
          transformOrigin: "left",
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* Parallax text accent - moves faster */}
      <div
        className="absolute top-1/2 right-0 text-6xl md:text-8xl font-serif font-bold text-white/10 pointer-events-none"
        style={{
          transform: `translateY(${scrollY * 0.5}px) translateX(${(mousePosition.x - 50) * 0.1}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        Care
      </div>
    </div>
  );
}
