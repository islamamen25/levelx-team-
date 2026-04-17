"use client";

/**
 * chat-panel.tsx
 * Heavy chat UI — dynamically imported by chat-widget.tsx on first FAB click.
 * Intentionally isolated so next/dynamic code-splits the AI SDK bundle.
 *
 * AI SDK v4 API notes:
 *   - useChat() returns { messages, sendMessage, status } — no input/handleSubmit
 *   - Input state is managed locally with useState
 *   - sendMessage({ text }) submits the user message
 */

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { X, Send, MessageCircle } from "lucide-react";
import { ChatMessage } from "./chat-message";

interface ChatPanelProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const t         = useTranslations("chat");
  const pathname  = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const locale    = pathname.startsWith("/ar") ? "ar" : "en";

  // AI SDK v4: manage input locally, call sendMessage on submit
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSend = () => {
    const text = input.trim();
    if (!text || status === "streaming") return;
    sendMessage({ text });
    setInput("");
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-[0_24px_60px_-20px_oklch(0_0_0/0.15)]">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-iron)] bg-[var(--color-mint)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-bold text-white">{t("title")}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-[var(--color-obsidian)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ceramic)]">
                {t("welcome")}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} locale={locale} />
          ))}
          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-[var(--color-obsidian)] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-iron)] bg-white p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 rounded-xl border border-[var(--color-iron)] bg-[var(--color-obsidian)] px-4 py-2.5 text-sm text-[var(--color-ceramic)] outline-none transition-colors placeholder:text-[var(--color-slate)] focus:border-[var(--color-mint)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || status === "streaming"}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-mint)] text-white transition-colors hover:bg-[var(--color-mint-hover)] disabled:opacity-40"
            aria-label={t("send")}
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </form>
      </div>

    </div>
  );
}
