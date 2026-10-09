import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What is an elimination period?",
  "How do I file an LTC claim?",
  "What ADLs qualify for benefits?",
  "What documents do I need?",
  "What is Assignment of Benefits?",
  "How long does approval take?",
];

function MarkdownText({ text }: { text: string }) {
  // Simple markdown renderer for bold, bullets, and line breaks
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-teal-600 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-slate-100 px-1 rounded text-xs'>$1</code>");
}

export function ChatWidget({ policyId }: { policyId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.chat.send.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment, or call us at **(864) 244-6300**.",
        },
      ]);
    },
  });

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    chatMutation.mutate({ message: text, sessionId, policyId });
  }, [input, messages, chatMutation, sessionId, policyId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
          style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #3BBFBF 100%)" }}
          aria-label="Open LTC support chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-teal-400" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
          style={{ height: "520px", maxHeight: "calc(100vh - 5rem)" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2a6db5 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white leading-tight">LTC Support Assistant</h3>
                <p className="text-xs text-blue-200">SC Visiting Angels · Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {/* Welcome message */}
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: "linear-gradient(135deg, #1B4F8A, #3BBFBF)" }}>
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-slate-100 max-w-[85%]">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Hello! I'm your LTC insurance guide. I can help you understand your policy, navigate the claims process, and answer any questions about long-term care. How can I help you today?
                </p>
              </div>
            </div>

            {/* Suggested prompts when empty */}
            {isEmpty && (
              <div className="space-y-1.5 pl-9">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      setTimeout(() => handleSend(), 50);
                    }}
                    className="block w-full text-left text-xs px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === "user" ? "bg-slate-300" : ""
                  }`}
                  style={msg.role === "assistant" ? { background: "linear-gradient(135deg, #1B4F8A, #3BBFBF)" } : {}}
                >
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-slate-600" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 shadow-sm max-w-[85%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm bg-white border border-slate-100 text-slate-700"
                  }`}
                  style={msg.role === "user" ? { background: "linear-gradient(135deg, #1B4F8A, #2a6db5)" } : {}}
                >
                  {msg.role === "assistant"
                    ? <MarkdownText text={msg.content} />
                    : msg.content
                  }
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {chatMutation.isPending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1B4F8A, #3BBFBF)" }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-slate-100">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about LTC insurance..."
                className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm border-slate-200 focus:border-teal-400 rounded-xl"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                size="sm"
                className="h-10 w-10 p-0 rounded-xl shrink-0"
                style={{ background: "linear-gradient(135deg, #1B4F8A, #3BBFBF)" }}
              >
                {chatMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
