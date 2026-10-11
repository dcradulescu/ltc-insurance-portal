import { ArrowRight } from "lucide-react";

interface AboutHomeCareProps {
  showStartButton?: boolean;
  onStartClick?: () => void;
}

export function AboutHomeCare({ showStartButton = false, onStartClick }: AboutHomeCareProps) {
  return (
    <div className="w-full py-8 sm:py-10" style={{ background: "#34B1C4" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo + Text */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <img
              src="/media/core/Dove-Trans_4328daa6.gif"
              alt="Visiting Angels"
              className="h-14 sm:h-20 w-auto drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="flex-1 space-y-1">
            <h3
              className="text-xl md:text-2xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Ready to Start Home Care?
            </h3>
            <p
              className="text-sm md:text-base text-white/85"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Professional, compassionate care services tailored to your needs
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => window.open("https://www.SCVisitingAngels.com", "_blank")}
            className="va-btn va-btn-white inline-flex items-center gap-2 whitespace-nowrap text-sm md:text-base px-7 py-3"
          >
            Start Care
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
