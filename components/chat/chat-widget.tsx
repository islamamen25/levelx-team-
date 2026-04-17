"use client";

/**
 * ChatWidget — INP-safe architecture
 * ────────────────────────────────────────────────────────────────────────────
 * Problem: the original widget ran useChat() (full @ai-sdk/react bundle) on
 * every storefront page, even when the chat was never opened. That alone added
 * ~120 KB of parsed JS to the main-thread budget on every LCP route.
 *
 * Fix (two-layer lazy loading):
 *   Layer 1 — This file renders only a lightweight FAB button (<1 KB).
 *             No AI SDK is imported. INP cost = zero.
 *   Layer 2 — On first FAB click, next/dynamic loads <ChatPanel />, which
 *             imports useChat and the full panel. The user has already
 *             interacted, so main-thread work happens off the critical INP path.
 *
 * The dynamic import is triggered by user interaction, not page load — this
 * is the canonical pattern for INP < 200ms on interaction-gated heavy UI.
 */

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

// ── Lazy panel — only loads when the FAB is first clicked ─────────────────────
const ChatPanel = dynamic(
  () => import("@/components/chat/chat-panel").then((m) => ({ default: m.ChatPanel })),
  {
    ssr:     false,
    loading: () => (
      // Thin loading state shown during the ~100ms dynamic import
      <div className="fixed bottom-6 end-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-[0_24px_60px_-20px_oklch(0_0_0/0.15)] items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "300ms" }} />
      </div>
    ),
  }
);

export function ChatWidget() {
  const t        = useTranslations("chat");
  const pathname = usePathname();
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isOpen,         setIsOpen]         = useState(false);

  // Never show on admin pages
  if (pathname.includes("/dashboard")) return null;

  // On first click: mount the heavy panel, then open it
  // On subsequent clicks: just toggle open state (panel already in memory)
  const handleFabClick = useCallback(() => {
    if (!isPanelMounted) setIsPanelMounted(true);
    setIsOpen(true);
  }, [isPanelMounted]);

  return (
    <>
      {/* ── FAB — always rendered, zero heavy deps ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleFabClick}
          className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-mint)] text-white shadow-[0_8px_24px_-6px_oklch(0.64_0.10_184/0.4)] transition-transform hover:scale-105 active:scale-95"
          aria-label={t("title")}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        </button>
      )}

      {/* ── Chat panel — mounted lazily on first interaction ── */}
      {isPanelMounted && (
        <ChatPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
