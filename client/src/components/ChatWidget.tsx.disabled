import { useState, useCallback, useMemo } from "react";
import { MessageCircle, X } from "lucide-react";
import { AIChatBox, Message } from "./AIChatBox";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(() => nanoid());

  const chatMutation = trpc.chat.send.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    },
  });

  const handleSend = useCallback(
    (content: string) => {
      const newMessages: Message[] = [
        ...messages,
        { role: "user", content },
      ];
      setMessages(newMessages);
      chatMutation.mutate({
        messages: newMessages,
        sessionId,
      });
    },
    [messages, chatMutation, sessionId]
  );

  const suggestedPrompts = useMemo(
    () => [
      "What is long-term care insurance?",
      "How do I file a claim?",
      "What are ADLs?",
      "Help me understand my policy",
    ],
    []
  );

  return (
    <>
      {/* Chat bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-xl overflow-hidden border border-border">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-serif font-bold text-sm">LTC Support Chat</h3>
                <p className="text-xs opacity-80">Ask us anything about LTC insurance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat body */}
          <AIChatBox
            messages={messages}
            onSendMessage={handleSend}
            isLoading={chatMutation.isPending}
            placeholder="Ask about LTC insurance..."
            height="400px"
            emptyStateMessage="How can we help you with long-term care insurance?"
            suggestedPrompts={suggestedPrompts}
            className="rounded-none border-0 shadow-none"
          />
        </div>
      )}
    </>
  );
}
