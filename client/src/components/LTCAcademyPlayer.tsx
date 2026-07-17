import { useState } from "react";
import { ChevronRight, Download, FileText, BookOpen, Play, Pause, Volume2, Settings, MoreVertical } from "lucide-react";

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration: string;
  instructor: string;
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
    description: "Discover the fundamentals of long-term care insurance and how it protects your family's financial future. Learn what LTC insurance covers, who needs it, and how it differs from other insurance types. The Professor walks you through real-world scenarios showing how LTC insurance helps families manage care costs.",
    duration: "12:45",
    instructor: "The Professor",
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
    description: "Navigate your insurance policy with confidence. This comprehensive walkthrough explains policy language, coverage limits, elimination periods, and benefit amounts. The Professor breaks down confusing terms and shows you exactly where to find important information on your policy documents.",
    duration: "15:20",
    instructor: "The Professor",
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
    description: "Master the claim filing process step-by-step. From initial notification to documentation requirements, learn exactly what your insurance company needs. The Professor shares insider tips on avoiding common mistakes and ensuring your claim processes smoothly and quickly.",
    duration: "18:30",
    instructor: "The Professor",
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
    description: "Your claim is approved—now what? Learn how to manage ongoing benefits, maintain documentation, report changes, and maximize your coverage. The Professor explains benefit payments, care coordination, and how to keep your claim in good standing.",
    duration: "14:15",
    instructor: "The Professor",
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
    description: "Hear from real families about their LTC insurance experiences. Rose shares how her policy covered in-home care costs, Michael explains how it protected his family's savings, and Elena reveals how early planning made all the difference. These inspiring stories show the real-world impact of LTC insurance.",
    duration: "16:50",
    instructor: "The Professor & Guests",
    downloads: [
      { name: "Family Success Stories", url: "https://example.com/success-stories.pdf", icon: "pdf" },
      { name: "Planning Timeline", url: "https://example.com/timeline.pdf", icon: "pdf" },
      { name: "Discussion Guide", url: "https://example.com/discussion-guide.docx", icon: "doc" },
    ],
  },
];

export function LTCAcademyPlayer() {
  const [selectedVideo, setSelectedVideo] = useState<Video>(ACADEMY_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

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

  return (
    <div className="w-full" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header - Character Guide Style */}
      <div className="relative overflow-hidden border-b-4" style={{ borderColor: "#4A9FB5", backgroundColor: "#1B3A5C" }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ backgroundColor: "#4A9FB5" }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4A9FB5" }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "Aptos, sans-serif" }}>
              LTC Academy
            </h1>
          </div>
          <p className="text-lg" style={{ color: "#B0D4E3", fontFamily: "Aptos, sans-serif" }}>
            Master long-term care insurance with our comprehensive video series
          </p>
        </div>
      </div>

      {/* Main Player Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6" style={{ height: "700px" }}>
          {/* Left Sidebar - Video Menu (20%) */}
          <div className="w-1/5 flex flex-col gap-3 overflow-y-auto pr-3 pb-4">
            <div className="mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                📚 Video Series
              </h3>
            </div>
            {ACADEMY_VIDEOS.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="transition-all duration-300 group text-left"
                style={{
                  padding: "14px 12px",
                  borderRadius: "8px",
                  border: selectedVideo.id === video.id ? "2px solid #4A9FB5" : "2px solid #E8E8E8",
                  backgroundColor: selectedVideo.id === video.id ? "#E8F4F8" : "#FFFFFF",
                  boxShadow: selectedVideo.id === video.id ? "0 4px 12px rgba(74, 159, 181, 0.15)" : "0 2px 6px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide mb-1 transition-colors" style={{
                      color: selectedVideo.id === video.id ? "#4A9FB5" : "#999999",
                      fontFamily: "Aptos, sans-serif"
                    }}>
                      {video.duration}
                    </p>
                    <h4 className="text-sm font-bold leading-tight transition-colors" style={{
                      color: selectedVideo.id === video.id ? "#1B3A5C" : "#333333",
                      fontFamily: "Aptos, sans-serif"
                    }}>
                      {video.title}
                    </h4>
                    <p className="text-xs mt-1" style={{
                      color: selectedVideo.id === video.id ? "#4A9FB5" : "#999999",
                      fontFamily: "Aptos, sans-serif"
                    }}>
                      {video.instructor}
                    </p>
                  </div>
                  {selectedVideo.id === video.id && (
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#4A9FB5" }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Center - Video Player (60%) */}
          <div className="w-3/5 flex flex-col gap-4">
            {/* Video Player Container - Character Guide Style */}
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden" style={{
              border: "3px solid #4A9FB5",
              backgroundColor: "#000000",
              boxShadow: "0 8px 24px rgba(74, 159, 181, 0.2)"
            }}>
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{
                  backgroundColor: "rgba(74, 159, 181, 0.9)",
                  backdropFilter: "blur(4px)"
                }}>
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-white ml-1" />
                  ) : (
                    <Play className="w-10 h-10 text-white ml-1" />
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

              {/* Custom Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg hover:bg-white/20 transition-colors" style={{ color: "#4A9FB5" }}>
                    <Play className="w-5 h-5" />
                  </button>
                  <div className="w-48 h-1 rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
                    <div className="h-full w-1/3 rounded-full" style={{ backgroundColor: "#4A9FB5" }}></div>
                  </div>
                  <span className="text-white text-xs font-bold">{selectedVideo.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/20 transition-colors" style={{ color: "#4A9FB5" }}>
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/20 transition-colors" style={{ color: "#4A9FB5" }}>
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Info - Character Guide Style */}
            <div className="rounded-2xl p-6 border-2" style={{
              backgroundColor: "#E8F4F8",
              borderColor: "#4A9FB5",
              boxShadow: "0 4px 12px rgba(74, 159, 181, 0.1)"
            }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                    {selectedVideo.title}
                  </h2>
                  <p className="text-sm font-semibold" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                    Presented by {selectedVideo.instructor}
                  </p>
                </div>
                <button className="p-2 rounded-lg hover:bg-white transition-colors" style={{ color: "#4A9FB5" }}>
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#333333", fontFamily: "Aptos, sans-serif" }}>
                {selectedVideo.description}
              </p>
            </div>
          </div>

          {/* Right Sidebar - Downloads (20%) */}
          <div className="w-1/5 flex flex-col gap-4 overflow-y-auto pl-3 pb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                📥 Resources
              </h3>
            </div>

            {/* Downloads Section */}
            <div className="space-y-3">
              {selectedVideo.downloads.map((download, idx) => (
                <a
                  key={idx}
                  href={download.url}
                  download
                  className="flex flex-col gap-2 p-4 rounded-xl transition-all duration-300 group cursor-pointer hover:scale-105"
                  style={{
                    border: "2px solid #E8E8E8",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#4A9FB5";
                    e.currentTarget.style.backgroundColor = "#E8F4F8";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 159, 181, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E8E8E8";
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.05)";
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 p-2 rounded-lg transition-colors" style={{ backgroundColor: "#E8F4F8", color: "#4A9FB5" }}>
                      {getDownloadIcon(download.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#999999", fontFamily: "Aptos, sans-serif" }}>
                        Download
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                        {download.name}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Info Box - Character Guide Style */}
            <div className="mt-auto p-4 rounded-xl border-2" style={{
              backgroundColor: "#FFF9E6",
              borderColor: "#FFD700",
              boxShadow: "0 4px 12px rgba(255, 215, 0, 0.1)"
            }}>
              <p className="text-xs leading-relaxed font-semibold" style={{ color: "#333333", fontFamily: "Aptos, sans-serif" }}>
                💡 <strong>Pro Tip:</strong> Download resources to reference while watching or share with family.
              </p>
            </div>

            {/* Interactive Progress */}
            <div className="p-4 rounded-xl border-2" style={{
              backgroundColor: "#F0F8FA",
              borderColor: "#4A9FB5",
              boxShadow: "0 4px 12px rgba(74, 159, 181, 0.1)"
            }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                Your Progress
              </p>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
                <div className="h-full w-1/3 rounded-full transition-all duration-300" style={{ backgroundColor: "#4A9FB5" }}></div>
              </div>
              <p className="text-xs mt-2" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                1 of {ACADEMY_VIDEOS.length} videos completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Series Info Footer - Character Guide Style */}
      <div className="border-t-4 mt-8 px-6 py-8" style={{ borderColor: "#4A9FB5", backgroundColor: "#F0F8FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8E8E8" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                {ACADEMY_VIDEOS.length}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                Videos in Series
              </p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8E8E8" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
                {ACADEMY_VIDEOS.reduce((sum, v) => sum + v.downloads.length, 0)}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                Downloadable Resources
              </p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E8E8E8" }}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#4A9FB5", fontFamily: "Aptos, sans-serif" }}>
                100%
              </div>
              <p className="text-sm font-semibold" style={{ color: "#666666", fontFamily: "Aptos, sans-serif" }}>
                Free Access
              </p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "#E8F4F8", border: "2px solid #4A9FB5" }}>
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
