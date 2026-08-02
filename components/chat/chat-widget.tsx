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
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4 z-50 flex h-[min(500px,calc(100dvh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-[0_24px_60px_-20px_oklch(0_0_0/0.15)]">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-mint)]" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    ),
  }
);

export function ChatWidget() {
  const t        = useTranslations("chat");
  const pathname = usePathname();
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isOpen,         setIsOpen]         = useState(false);

  // Defined before early return to satisfy Rules of Hooks
  const handleFabClick = useCallback(() => {
    if (!isPanelMounted) setIsPanelMounted(true);
    setIsOpen(true);
  }, [isPanelMounted]);

  // Never show on admin pages
  if (pathname.includes("/dashboard")) return null;

  return (
    <>
      {/* ── FAB — always rendered, zero heavy deps ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleFabClick}
          // Deliberately left in the bottom corner. At 390x844 the category-tile grid
          // fills the viewport (first row spans y 642-815), so a fixed FAB overlaps it
          // wherever it sits — raising it to bottom-20 was measured and made things
          // worse, moving a 35px corner overlap into a 48px overlap across the middle
          // of a tile. The corner covers the least meaningful part of the content.
          // The safe-area inset keeps it clear of the iOS home indicator.
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-mint)] text-white shadow-[0_8px_24px_-6px_oklch(0.64_0.10_184/0.4)] transition-transform hover:scale-105 active:scale-95 md:h-14 md:w-14"
          aria-label={t("title")}
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
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
