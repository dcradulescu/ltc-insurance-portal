import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { journey } from "./JourneyNavigation";

const VA_TEAL = "#34B1C4";

// Ordered page flow for Next/Previous navigation
const pageFlow = journey;

interface PageNavigationProps {
  showDownload?: boolean;
  showEmail?: boolean;
  onDownload?: () => void;
  onEmail?: () => void;
}

export function PageNavigation({ showDownload = true, showEmail = true, onDownload, onEmail }: PageNavigationProps) {
  const [location, navigate] = useLocation();

  const currentIndex = pageFlow.findIndex((p) => p.href === location);
  const prevPage = currentIndex > 0 ? pageFlow[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < pageFlow.length - 1 ? pageFlow[currentIndex + 1] : null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default: print the page
      window.print();
      toast.info("Print or save as PDF", { description: "Use your browser's print dialog to save as PDF." });
    }
  };

  const handleEmail = () => {
    if (onEmail) {
      onEmail();
    } else {
      const subject = encodeURIComponent(document.title);
      const body = encodeURIComponent(`Here is the LTC resource: ${window.location.origin}${location}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const goTo = (href: string) => {
    navigate(href);
  };

  return (
    <div
      className="flex flex-wrap gap-4 items-center justify-between py-4 px-4 mt-6 rounded border"
      style={{ background: "#F8FBFC", borderColor: "#e8edf1" }}
    >
      {/* Previous */}
      <div className="flex-1">
        {prevPage && (
          <button
            onClick={() => goTo(prevPage.href)}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:gap-2.5 no-underline"
            style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{prevPage.label}</span>
          </button>
        )}
      </div>

      {/* Center: Download & Email buttons */}
      <div className="flex items-center gap-2">
        {showDownload && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-all duration-200 hover:shadow-sm"
            style={{
              color: VA_TEAL,
              borderColor: VA_TEAL,
              background: "transparent",
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        )}
        {showEmail && (
          <button
            onClick={handleEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-all duration-200 hover:shadow-sm"
            style={{
              color: "#0692D7",
              borderColor: "#0692D7",
              background: "transparent",
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </button>
        )}
      </div>

      {/* Next */}
      <div className="flex-1 text-right">
        {nextPage && (
          <button
            onClick={() => goTo(nextPage.href)}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:gap-2.5 no-underline"
            style={{ color: VA_TEAL, fontFamily: "'Open Sans', sans-serif" }}
          >
            <span>{nextPage.label}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
