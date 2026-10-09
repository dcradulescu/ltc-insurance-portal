import { nanoid } from "nanoid";
import { usePolicyContext } from "@/contexts/PolicyContext";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Play,
  Download,
  MessageCircle,
  X,
  ChevronUp,
  FileText,
  Send,
  Loader2,
  Video,
  HelpCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const VA_TEAL = "#34B1C4";
const VA_HEADING = "#454545";
const VA_BODY = "#555555";

// Page-specific content
const pageContent: Record<string, { videoTitle: string; videoUrl: string; downloads: { label: string; url: string }[] }> = {
  "/": {
    videoTitle: "Welcome to LTC Navigator",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/MjPhBEQZfvIrfZms.mp4",
    downloads: [
      { label: "LTC Insurance Overview", url: "/resources/insurance-basics" },
      { label: "Getting Started Guide", url: "/resources/planning-worksheet" },
    ],
  },
  "/academy": {
    videoTitle: "Academy Introduction",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NiJblCFJqXDChprB.mp4",
    downloads: [
      { label: "LTC Glossary PDF", url: "/resources/policy-glossary" },
      { label: "Understanding ADLs", url: "/education#adl" },
      { label: "Policy Basics Guide", url: "/resources/insurance-basics" },
    ],
  },
  "/education": {
    videoTitle: "What is LTC Insurance?",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/QlCyvRbUBXkLwOND.mp4",
    downloads: [
      { label: "LTC Education Guide", url: "/resources/insurance-basics" },
      { label: "Definitions Cheat Sheet", url: "/resources/policy-glossary" },
    ],
  },
  "/policy-form": {
    videoTitle: "Filling Out Your Policy Form",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/UZLuXdBXwBOgyGSg.mp4",
    downloads: [
      { label: "Policy Worksheet", url: "/resources/key-terms-reference" },
      { label: "What to Have Ready", url: "/resources/document-checklist" },
      { label: "Sample Completed Form", url: "/resources/sample-completed-form" },
    ],
  },
  "/strategy": {
    videoTitle: "Understanding Your Strategy",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/MjPhBEQZfvIrfZms.mp4",
    downloads: [
      { label: "Strategy Checklist", url: "/resources/claim-filing-checklist" },
      { label: "Claim Timeline Template", url: "/resources/claim-timeline-template" },
    ],
  },
  "/contact": {
    videoTitle: "How We Can Help",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NiJblCFJqXDChprB.mp4",
    downloads: [
      { label: "Contact Information", url: "/contact" },
    ],
  },
  "/profile": {
    videoTitle: "Managing Your Profile",
    videoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/QlCyvRbUBXkLwOND.mp4",
    downloads: [],
  },
};

// FAQ answers for common questions
const faqAnswers: Record<string, string> = {
  "what is ltc": "Long-Term Care (LTC) insurance helps cover the cost of care services when you can no longer perform daily activities independently. It typically covers home care, assisted living, and nursing home care.",
  "elimination period": "The elimination period is like a deductible measured in days. It's the number of days you must pay for care out-of-pocket before your policy starts paying. Common periods are 30, 60, or 90 days.",
  "adl": "ADLs (Activities of Daily Living) are basic self-care tasks: bathing, dressing, eating, toileting, transferring (moving), and continence. Most policies require you to need help with 2+ ADLs to qualify for benefits.",
  "how to file": "To file a claim: 1) Call your insurance carrier's claims department, 2) Request a claim form, 3) Have your doctor complete a Plan of Care, 4) Submit all documentation, 5) Complete the elimination period.",
  "daily benefit": "Your daily benefit is the maximum amount your policy will pay per day for care services. For example, if your daily benefit is $250, the policy will reimburse up to $250 per day of qualifying care.",
  "how long": "The claims process typically takes 30-90 days from initial filing to first payment. The elimination period must be satisfied first, then benefits begin.",
};

function findFaqAnswer(question: string): string | null {
  const q = question.toLowerCase();
  for (const [key, answer] of Object.entries(faqAnswers)) {
    if (q.includes(key)) return answer;
  }
  return null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function RightHelperPanel() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "downloads" | "chat">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm here to help you navigate your LTC insurance. Ask me anything about policies, claims, or how to use this portal." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const desktopMessagesRef = useRef<HTMLDivElement>(null);
  const mobileMessagesRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(false);
  const faqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionId] = useState(() => nanoid());
  const { activePolicyId } = usePolicyContext();
  useEffect(() => () => { if (faqTimerRef.current) clearTimeout(faqTimerRef.current); }, []);

  const content = pageContent[location] || pageContent["/"];

  useEffect(() => {
    for (const ref of [desktopMessagesRef, mobileMessagesRef]) { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }
  }, [messages]);

  const chatMutation = trpc.chat.send.useMutation({
    onSettled: () => { pendingRef.current = false; },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I couldn't process that. Please try again or call us at (864) 244-6300." }]);
      setIsTyping(false);
    },
  });

  const handleSend = () => {
    if (!input.trim() || isTyping || pendingRef.current) return;
    pendingRef.current = true;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Check FAQ first
    const faqAnswer = findFaqAnswer(userMsg);
    if (faqAnswer) {
      faqTimerRef.current = setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: faqAnswer }]);
        setIsTyping(false);
        pendingRef.current = false;
      }, 500);
    } else {
      // Use LLM for complex questions
      chatMutation.mutate({ message: userMsg, sessionId, policyId: activePolicyId });
    }
  };

  // Desktop panel (hidden on mobile)
  const renderDesktopPanel = () => (
    <aside aria-label="Page helper"
      className="hidden lg:flex flex-col fixed right-0 top-[110px] bottom-0 w-[280px] border-l z-40"
      style={{ background: "#FAFCFD", borderColor: "#e8edf1" }}
    >
      {/* Video Section - Top 33% */}
      <div className="flex-1 border-b p-3 flex flex-col" style={{ borderColor: "#e8edf1" }}>
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4" style={{ color: VA_TEAL }} />
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>
            Helper Video
          </h4>
        </div>
        <div className="flex-1 rounded overflow-hidden bg-black/5 relative group cursor-pointer">
          <video
            src={content.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            onMouseEnter={(e) => { void (e.target as HTMLVideoElement).play().catch(() => undefined); }}
            onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
            <Play className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </div>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: VA_BODY }}>{content.videoTitle}</p>
      </div>

      {/* Downloads Section - Middle 33% */}
      <div className="flex-1 border-b p-3 flex flex-col" style={{ borderColor: "#e8edf1" }}>
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4" style={{ color: VA_TEAL }} />
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>
            Downloads
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {content.downloads.length > 0 ? content.downloads.map((dl, i) => (
            <a
              key={i}
              href={dl.url}
              className="flex items-center gap-2 p-2 rounded text-xs transition-all duration-200 no-underline hover:shadow-sm"
              style={{ background: "#ffffff", border: "1px solid #e8edf1", color: VA_BODY, fontFamily: "'Open Sans', sans-serif" }}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: VA_TEAL }} />
              <span className="truncate">{dl.label}</span>
            </a>
          )) : (
            <p className="text-xs text-center py-4" style={{ color: "#999" }}>No downloads for this page</p>
          )}
        </div>
      </div>

      {/* Chat Section - Bottom 33% */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-4 h-4" style={{ color: VA_TEAL }} />
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>
            Ask a Question
          </h4>
        </div>
        <div ref={desktopMessagesRef} aria-live="polite" className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-[11px] leading-relaxed p-2 rounded ${msg.role === "user" ? "ml-4" : "mr-4"}`}
              style={{
                background: msg.role === "user" ? "rgba(52,177,196,0.12)" : "#ffffff",
                border: msg.role === "user" ? "none" : "1px solid #e8edf1",
                color: VA_BODY,
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="text-[11px] p-2 rounded mr-4" style={{ background: "#ffffff", border: "1px solid #e8edf1", color: "#999" }}>
              Typing...
            </div>
          )}

        </div>
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            aria-label="Helper question" maxLength={2000}
            placeholder="Type a question..."
            className="flex-1 text-xs px-2.5 py-2 rounded border outline-none transition-all focus:border-[#34B1C4]"
            style={{ borderColor: "#e0e0e0", fontFamily: "'Open Sans', sans-serif" }}
          />
          <button
            aria-label="Send helper question" onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded transition-all duration-200 disabled:opacity-40"
            style={{ background: VA_TEAL, color: "#fff" }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  // Mobile bottom drawer
  const renderMobileDrawer = () => (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-20 left-4 z-50 flex items-center gap-2 px-3 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        style={{ background: VA_TEAL, color: "#fff", display: isOpen ? "none" : "flex" }}
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-xs font-bold">Help</span>
      </button>

      {/* Drawer overlay */}
      {isOpen && (
        <div role="dialog" aria-label="Page help" onKeyDown={event => { if (event.key === "Escape") setIsOpen(false); }} className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
          <div
            className="relative bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up"
            style={{ borderTop: `3px solid ${VA_TEAL}` }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "#e8edf1" }}>
              <div className="flex gap-1">
                {(["video", "downloads", "chat"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: activeTab === tab ? VA_TEAL : "transparent",
                      color: activeTab === tab ? "#fff" : VA_BODY,
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    {tab === "video" ? "Video" : tab === "downloads" ? "Files" : "Chat"}
                  </button>
                ))}
              </div>
              <button aria-label="Close help" onClick={() => setIsOpen(false)} className="p-1.5 rounded hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: VA_BODY }} />
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "video" && (
                <div>
                  <video src={content.videoUrl} controls className="w-full rounded" playsInline />
                  <p className="text-sm mt-2 text-center" style={{ color: VA_BODY }}>{content.videoTitle}</p>
                </div>
              )}
              {activeTab === "downloads" && (
                <div className="space-y-2">
                  {content.downloads.length > 0 ? content.downloads.map((dl, i) => (
                    <a
                      key={i}
                      href={dl.url}
                      className="flex items-center gap-3 p-3 rounded border no-underline transition-all hover:shadow-sm"
                      style={{ background: "#fff", borderColor: "#e8edf1", color: VA_BODY }}
                    >
                      <FileText className="w-5 h-5" style={{ color: VA_TEAL }} />
                      <span className="text-sm font-medium">{dl.label}</span>
                      <Download className="w-4 h-4 ml-auto" style={{ color: "#999" }} />
                    </a>
                  )) : (
                    <p className="text-sm text-center py-8" style={{ color: "#999" }}>No downloads available for this page.</p>
                  )}
                </div>
              )}
              {activeTab === "chat" && (
                <div className="flex flex-col h-[50vh]">
                  <div ref={mobileMessagesRef} aria-live="polite" className="flex-1 overflow-y-auto space-y-2 mb-3">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-sm leading-relaxed p-3 rounded ${msg.role === "user" ? "ml-8" : "mr-8"}`}
                        style={{
                          background: msg.role === "user" ? "rgba(52,177,196,0.12)" : "#f8f9fa",
                          color: VA_BODY,
                        }}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="text-sm p-3 rounded mr-8 flex items-center gap-2" style={{ background: "#f8f9fa", color: "#999" }}>
                        <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                      </div>
                    )}

                  </div>
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      aria-label="Helper question" maxLength={2000}
                      placeholder="Ask about LTC insurance..."
                      className="flex-1 text-sm px-3 py-2.5 rounded border outline-none focus:border-[#34B1C4]"
                      style={{ borderColor: "#e0e0e0" }}
                    />
                    <button
                      aria-label="Send helper question" onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="px-4 py-2.5 rounded font-bold text-sm transition-all disabled:opacity-40"
                      style={{ background: VA_TEAL, color: "#fff" }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {renderDesktopPanel()}
      {renderMobileDrawer()}
    </>
  );
}
