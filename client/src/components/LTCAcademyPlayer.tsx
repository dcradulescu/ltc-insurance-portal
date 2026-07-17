import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, BookOpen, Play, Pause, Volume2, Settings, Maximize2, Lightbulb, CheckCircle2, Clock, Zap, Settings as GearIcon, Star, Award } from "lucide-react";

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

const ACADEMY_VIDEOS: Video[] = [
  {
    id: "video-1",
    title: "What is Long-Term Care Insurance?",
    youtubeId: "jNQXAC9IVRw",
    description: "Discover the fundamentals of long-term care insurance and how it protects your family's financial future.",
    duration: "12:45",
    instructor: "The Professor",
    keyPoints: [
      "LTC insurance covers costs of extended care services (in-home, assisted living, nursing homes)",
      "Benefits protect your family's savings from catastrophic care expenses",
      "Coverage typically begins after an elimination period (30-90 days)",
      "Policies can be purchased at any age, but earlier is more affordable",
      "Average daily costs range from $150-$300+ depending on location and care type"
    ],
    downloads: [
      { name: "LTC Insurance Basics Guide", url: "https://example.com/ltc-basics-guide.pdf", icon: "pdf" },
      { name: "Coverage Comparison Chart", url: "https://example.com/coverage-chart.pdf", icon: "pdf" },
      { name: "Planning Worksheet", url: "https://example.com/planning-worksheet.docx", icon: "doc" },
    ],
  },
  {
    id: "video-2",
    title: "Understanding Your Policy Documents",
    youtubeId: "jNQXAC9IVRw",
    description: "Navigate your insurance policy with confidence. Learn policy language, coverage limits, and benefit amounts.",
    duration: "15:20",
    instructor: "The Professor",
    keyPoints: [
      "Schedule of Benefits page shows your daily/monthly maximum and lifetime limit",
      "Elimination period is the waiting period before benefits begin",
      "Benefit triggers define when you qualify for coverage (ADL limitations, cognitive impairment)",
      "Riders and endorsements add optional coverage (inflation protection, waiver of premium)",
      "Contact information for claims is typically on the back of your insurance card"
    ],
    downloads: [
      { name: "Policy Glossary", url: "https://example.com/policy-glossary.pdf", icon: "pdf" },
      { name: "Document Checklist", url: "https://example.com/doc-checklist.pdf", icon: "pdf" },
      { name: "Key Terms Reference", url: "https://example.com/key-terms.docx", icon: "doc" },
    ],
  },
  {
    id: "video-3",
    title: "Filing Your LTC Insurance Claim",
    youtubeId: "jNQXAC9IVRw",
    description: "Master the claim filing process step-by-step. Learn what your insurance company needs and common pitfalls.",
    duration: "18:30",
    instructor: "The Professor",
    keyPoints: [
      "Notify your insurance company within 30 days of needing care services",
      "Gather medical documentation proving you meet benefit triggers (ADL assessments)",
      "Submit claim forms with physician certification and care plan",
      "Insurance company will conduct independent assessment (usually within 30 days)",
      "Keep detailed records of all correspondence and documentation submitted"
    ],
    downloads: [
      { name: "Claim Filing Checklist", url: "https://example.com/claim-checklist.pdf", icon: "pdf" },
      { name: "Required Documentation List", url: "https://example.com/required-docs.pdf", icon: "pdf" },
      { name: "Claim Form Template", url: "https://example.com/claim-form.docx", icon: "doc" },
    ],
  },
  {
    id: "video-4",
    title: "Managing Benefits After Approval",
    youtubeId: "jNQXAC9IVRw",
    description: "Learn how to manage ongoing benefits, maintain documentation, and keep your claim in good standing.",
    duration: "14:15",
    instructor: "The Professor",
    keyPoints: [
      "Submit monthly care logs documenting services received and costs incurred",
      "Report any changes in care needs, providers, or living situation immediately",
      "Keep receipts and invoices for all care expenses to support reimbursement requests",
      "Review benefit statements monthly to ensure accuracy of payments",
      "Maintain regular communication with your insurance case manager"
    ],
    downloads: [
      { name: "Benefits Management Guide", url: "https://example.com/benefits-guide.pdf", icon: "pdf" },
      { name: "Care Log Template", url: "https://example.com/care-log.pdf", icon: "pdf" },
      { name: "Monthly Reporting Form", url: "https://example.com/monthly-report.docx", icon: "doc" },
    ],
  },
  {
    id: "video-5",
    title: "Real Stories: How LTC Insurance Helped Families",
    youtubeId: "jNQXAC9IVRw",
    description: "Hear from real families about their LTC insurance experiences and how it made a difference.",
    duration: "16:50",
    instructor: "The Professor & Guests",
    keyPoints: [
      "Rose's story: In-home care policy covered $120,000 in care costs over 3 years",
      "Michael's experience: Policy protected family savings and allowed him to stay in his home",
      "Elena's insight: Early planning and understanding policy details made claim process smooth",
      "Common theme: Families wish they had understood their policies better earlier",
      "Key takeaway: Having a plan and knowing your coverage provides peace of mind"
    ],
    downloads: [
      { name: "Family Success Stories", url: "https://example.com/success-stories.pdf", icon: "pdf" },
      { name: "Planning Timeline", url: "https://example.com/timeline.pdf", icon: "pdf" },
      { name: "Discussion Guide", url: "https://example.com/discussion-guide.docx", icon: "doc" },
    ],
  },
];

export function LTCAcademyPlayer() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const selectedVideo = ACADEMY_VIDEOS[selectedVideoIndex];

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
    }
  };

  const goToPrevious = () => {
    if (selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header with Branding */}
      <div className="relative overflow-hidden border-b-4" style={{ borderColor: "#4A9FB5", backgroundColor: "#1B3A5C" }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ backgroundColor: "#4A9FB5" }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A9FB5" }}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Aptos, sans-serif" }}>
                  LTC Academy
                </h1>
                <p className="text-sm" style={{ color: "#B0D4E3", fontFamily: "Aptos, sans-serif" }}>
                  Master long-term care insurance with our comprehensive video series
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white" style={{ fontFamily: "Aptos, sans-serif" }}>
                Video {selectedVideoIndex + 1} of {ACADEMY_VIDEOS.length}
              </p>
              <p className="text-xs" style={{ color: "#B0D4E3", fontFamily: "Aptos, sans-serif" }}>
                {Math.round(((selectedVideoIndex + 1) / ACADEMY_VIDEOS.length) * 100)}% Complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200" style={{ backgroundColor: "#E8E8E8" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            backgroundColor: "#4A9FB5",
            width: `${((selectedVideoIndex + 1) / ACADEMY_VIDEOS.length) * 100}%`,
          }}
        ></div>
        {/* Animated progress indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg transform transition-all duration-500"
          style={{
            left: `${((selectedVideoIndex + 1) / ACADEMY_VIDEOS.length) * 100}%`,
            marginLeft: "-12px",
            backgroundColor: "#4A9FB5",
            boxShadow: "0 0 0 4px rgba(74, 159, 181, 0.2)",
          }}
        ></div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Video Player Section */}
        <div className="mb-8">
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

          {/* Main Video Player - Full Width */}
          <div
            className="relative w-full rounded-3xl overflow-hidden mb-6"
            style={{
              backgroundColor: "#000000",
              border: "4px solid #4A9FB5",
              boxShadow: "0 12px 40px rgba(74, 159, 181, 0.25)",
              aspectRatio: "16 / 9",
            }}
          >
            {/* Play Button Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10 group cursor-pointer"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-2xl"
                style={{
                  backgroundColor: "rgba(74, 159, 181, 0.95)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white ml-1" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-1" />
                )}
              </div>
            </div>

            {/* YouTube Embed */}
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0`}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />

            {/* Custom Controls Bar with Character Colors */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  style={{ color: "#4A9FB5" }}
                >
                  <Play className="w-5 h-5" />
                </button>
                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
                  <div className="h-full w-1/3 rounded-full" style={{ backgroundColor: "#4A9FB5" }}></div>
                </div>
                <span className="text-white text-xs font-bold whitespace-nowrap">{selectedVideo.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors" style={{ color: "#4A9FB5" }}>
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors" style={{ color: "#4A9FB5" }}>
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors" style={{ color: "#4A9FB5" }}>
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Description */}
          <p className="text-base leading-relaxed mb-6" style={{ color: "#333333", fontFamily: "Aptos, sans-serif" }}>
            {selectedVideo.description}
          </p>
        </div>

        {/* Key Points Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {/* Decorative Icon Circle with Gear Elements */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A9FB5", boxShadow: "0 4px 12px rgba(74, 159, 181, 0.3)" }}>
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              {/* Decorative gear elements around the circle */}
              <Settings className="w-5 h-5 absolute -top-1 -right-1" style={{ color: "#4A9FB5", opacity: 0.6 }} />
              <Settings className="w-4 h-4 absolute -bottom-1 -left-2" style={{ color: "#4A9FB5", opacity: 0.5 }} />
              <Star className="w-3 h-3 absolute top-0 -left-3" style={{ color: "#FFD700", opacity: 0.7 }} />
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                Key Points
              </h3>
              <p className="text-xs" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                Essential takeaways from this lesson
              </p>
            </div>
            {/* Decorative accent line */}
            <div className="flex-1 h-0.5 ml-4" style={{ background: "linear-gradient(to right, #4A9FB5, transparent)", opacity: 0.5 }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedVideo.keyPoints.map((point, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{
                  backgroundColor: "#E8F4F8",
                  borderColor: "#4A9FB5",
                  boxShadow: "0 4px 12px rgba(74, 159, 181, 0.1)",
                }}
              >
                <div className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "#4A9FB5" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "#333333", fontFamily: "Aptos, sans-serif" }}>
                    {point}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Downloads Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {/* Decorative Icon Circle with Badge */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A9FB5", boxShadow: "0 4px 12px rgba(74, 159, 181, 0.3)" }}>
                <Download className="w-7 h-7 text-white" />
              </div>
              {/* Decorative badge element */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFD700", boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)" }}>
                <Award className="w-3 h-3" style={{ color: "#1B3A5C" }} />
              </div>
              {/* Decorative accent dots */}
              <div className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: "#4A9FB5", opacity: 0.4, bottom: "-8px", right: "0px" }}></div>
              <div className="absolute w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#4A9FB5", opacity: 0.3, bottom: "-6px", left: "-8px" }}></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                Resources for This Video
              </h3>
              <p className="text-xs" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                Download guides, templates, and reference materials
              </p>
            </div>
            {/* Decorative accent line */}
            <div className="flex-1 h-0.5 ml-4" style={{ background: "linear-gradient(to right, #4A9FB5, transparent)", opacity: 0.5 }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedVideo.downloads.map((download, idx) => (
              <a
                key={idx}
                href={download.url}
                download
                className="p-6 rounded-2xl border-2 transition-all duration-300 group cursor-pointer hover:scale-105"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E8E8E8",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4A9FB5";
                  e.currentTarget.style.backgroundColor = "#E8F4F8";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(74, 159, 181, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E8E8E8";
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
                }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#E8F4F8", color: "#4A9FB5" }}>
                    {getDownloadIcon(download.icon)}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#999999", fontFamily: "Aptos, sans-serif" }}>
                      Download
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                      {download.name}
                    </p>
                  </div>
                  <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: "#4A9FB5" }}>
                    <Download className="w-4 h-4 text-white" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center justify-between py-8 border-t-2" style={{ borderColor: "#E8E8E8" }}>
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
            <div className="flex gap-2 mt-2">
              {ACADEMY_VIDEOS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVideoIndex(idx)}
                  className="w-3 h-3 rounded-full transition-all duration-300 hover:scale-125"
                  style={{
                    backgroundColor: idx === selectedVideoIndex ? "#4A9FB5" : "#E8E8E8",
                  }}
                />
              ))}
            </div>
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

        {/* Completion Message */}
        {selectedVideoIndex === ACADEMY_VIDEOS.length - 1 && (
          <div
            className="mt-8 p-6 rounded-2xl border-2 text-center"
            style={{
              backgroundColor: "#FFF9E6",
              borderColor: "#FFD700",
              boxShadow: "0 8px 20px rgba(255, 215, 0, 0.15)",
            }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
              🎉 Congratulations!
            </p>
            <p style={{ color: "#333333", fontFamily: "Aptos, sans-serif" }}>
              You've completed the LTC Academy series. You now have the knowledge to confidently navigate your long-term care insurance journey.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-4 mt-12 px-6 py-8" style={{ borderColor: "#4A9FB5", backgroundColor: "#F0F8FA" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8E8E8" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                {ACADEMY_VIDEOS.length}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                Videos in Series
              </p>
            </div>
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8E8E8" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                {ACADEMY_VIDEOS.reduce((sum, v) => sum + v.downloads.length, 0)}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                Downloadable Resources
              </p>
            </div>
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8E8E8" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                100%
              </div>
              <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                Free Access
              </p>
            </div>
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "#E8F4F8", border: "2px solid #4A9FB5" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                👨‍🎓
              </div>
              <p className="text-sm font-semibold" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                Expert Instruction
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
