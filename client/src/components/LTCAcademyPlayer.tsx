import { useState } from "react";
import { ChevronRight, Download, FileText, BookOpen } from "lucide-react";

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration: string;
  downloads: {
    name: string;
    url: string;
    icon: "pdf" | "doc" | "guide";
  }[];
}

const ACADEMY_VIDEOS: Video[] = [
  {
    id: "video-1",
    title: "Understanding LTC Insurance Basics",
    youtubeId: "dQw4w9WgXcQ",
    description: "Learn the fundamentals of long-term care insurance and how it protects your family.",
    duration: "12:45",
    downloads: [
      { name: "LTC Basics Guide", url: "#", icon: "pdf" },
      { name: "Policy Checklist", url: "#", icon: "doc" },
    ],
  },
  {
    id: "video-2",
    title: "Decoding Your Policy Documents",
    youtubeId: "dQw4w9WgXcQ",
    description: "A step-by-step walkthrough of your insurance policy to understand coverage details.",
    duration: "15:20",
    downloads: [
      { name: "Document Guide", url: "#", icon: "pdf" },
      { name: "Terms Glossary", url: "#", icon: "doc" },
    ],
  },
  {
    id: "video-3",
    title: "Filing Your LTC Claim",
    youtubeId: "dQw4w9WgXcQ",
    description: "Everything you need to know about submitting your claim and what to expect.",
    duration: "18:30",
    downloads: [
      { name: "Claim Checklist", url: "#", icon: "pdf" },
      { name: "Required Forms", url: "#", icon: "doc" },
    ],
  },
  {
    id: "video-4",
    title: "After Approval: Managing Your Benefits",
    youtubeId: "dQw4w9WgXcQ",
    description: "Learn how to manage your benefits and maintain your claim after approval.",
    duration: "14:15",
    downloads: [
      { name: "Benefits Guide", url: "#", icon: "pdf" },
      { name: "Care Log Template", url: "#", icon: "doc" },
    ],
  },
];

export function LTCAcademyPlayer() {
  const [selectedVideo, setSelectedVideo] = useState<Video>(ACADEMY_VIDEOS[0]);

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
    <div className="w-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Roboto', sans-serif" }}>
            LTC Academy
          </h1>
          <p className="text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Master long-term care insurance with our comprehensive video series
          </p>
        </div>
      </div>

      {/* Main Player Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6 h-[600px]">
          {/* Left Sidebar - Video Menu (20%) */}
          <div className="w-1/5 flex flex-col gap-3 overflow-y-auto pr-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2" style={{ fontFamily: "'Roboto', sans-serif", color: "#34B1C4" }}>
              Video Series
            </h3>
            {ACADEMY_VIDEOS.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`p-4 rounded-lg text-left transition-all duration-300 border-2 group hover:shadow-md ${
                  selectedVideo.id === video.id
                    ? "bg-gradient-to-r from-teal-50 to-blue-50 border-teal-400 shadow-md"
                    : "bg-white border-gray-200 hover:border-teal-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wide mb-1 transition-colors ${
                      selectedVideo.id === video.id ? "text-teal-600" : "text-gray-500 group-hover:text-teal-600"
                    }`} style={{ fontFamily: "'Roboto', sans-serif" }}>
                      {video.duration}
                    </p>
                    <h4 className={`text-sm font-bold leading-tight transition-colors ${
                      selectedVideo.id === video.id ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                    }`} style={{ fontFamily: "'Roboto', sans-serif" }}>
                      {video.title}
                    </h4>
                  </div>
                  {selectedVideo.id === video.id && (
                    <ChevronRight className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Center - Video Player (60%) */}
          <div className="w-3/5 flex flex-col gap-4">
            {/* YouTube Embed */}
            <div className="relative w-full flex-1 rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
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
            </div>

            {/* Video Info */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Roboto', sans-serif" }}>
                {selectedVideo.title}
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {selectedVideo.description}
              </p>
            </div>
          </div>

          {/* Right Sidebar - Downloads (20%) */}
          <div className="w-1/5 flex flex-col gap-4 overflow-y-auto pl-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700" style={{ fontFamily: "'Roboto', sans-serif", color: "#34B1C4" }}>
              Resources
            </h3>

            {/* Downloads Section */}
            <div className="space-y-3">
              {selectedVideo.downloads.map((download, idx) => (
                <a
                  key={idx}
                  href={download.url}
                  download
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-teal-100 to-blue-100 group-hover:from-teal-200 group-hover:to-blue-200 transition-colors" style={{ color: "#34B1C4" }}>
                    {getDownloadIcon(download.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 group-hover:text-teal-600 transition-colors" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Download
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      {download.name}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-auto p-4 rounded-lg bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200">
              <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                <strong>Tip:</strong> Download the resources to reference while watching or share with family members.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Series Info Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2" style={{ fontFamily: "'Roboto', sans-serif" }}>
                {ACADEMY_VIDEOS.length}
              </div>
              <p className="text-sm text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Videos in Series
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2" style={{ fontFamily: "'Roboto', sans-serif" }}>
                {ACADEMY_VIDEOS.reduce((sum, v) => sum + v.downloads.length, 0)}
              </div>
              <p className="text-sm text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Downloadable Resources
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2" style={{ fontFamily: "'Roboto', sans-serif" }}>
                Free
              </div>
              <p className="text-sm text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Complete Access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
