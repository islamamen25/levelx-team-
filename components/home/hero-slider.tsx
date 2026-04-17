"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPE SYSTEM
───────────────────────────────────────────────────────────────────────────── */

interface HeroSlide {
  id: string;
  /** "split"  → white text panel on desktop | right-side image.
   *  "image-only" → full-bleed image/gradient, no text on any screen. */
  layout: "split" | "image-only";
  badge?: string;
  badgeVariant?: "flash" | "new" | "sale" | "plain";
  headline?: string;
  subline?: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  /** CSS gradient used as the right-panel / full-bleed background */
  gradient: string;
  /** Large emoji rendered as the centred device placeholder inside the image panel */
  emoji?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE DATA
───────────────────────────────────────────────────────────────────────────── */

const SLIDES: HeroSlide[] = [
  {
    id: "s1",
    layout: "split",
    badge: "⚡ Flash sale — ends midnight",
    badgeVariant: "flash",
    headline: "Premium tech.\nUp to 70% less.",
    subline:
      "Expert-verified smartphones, laptops and more. Every device backed by a 1-year warranty and 30-day returns.",
    ctaPrimary: { label: "Shop flash deals", href: "/deals" },
    ctaSecondary: { label: "How it works", href: "/how-it-works" },
    gradient: "linear-gradient(145deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
    emoji: "📱",
  },
  {
    id: "s2",
    layout: "split",
    badge: "New arrivals",
    badgeVariant: "new",
    headline: "MacBook.\nRefurbished\n& ready.",
    subline:
      "Every Apple laptop fully tested and certified. Ships with a 1-year warranty — always.",
    ctaPrimary: { label: "Explore MacBooks", href: "/products?brand=Apple&category=Laptops" },
    ctaSecondary: { label: "All laptops", href: "/products?category=Laptops" },
    gradient: "linear-gradient(145deg,#e8e8ed 0%,#c8c8ce 55%,#aeaeb2 100%)",
    emoji: "💻",
  },
  {
    id: "s3",
    layout: "split",
    badge: "Best value",
    badgeVariant: "sale",
    headline: "PlayStation 5.\nRefurbished.",
    subline:
      "Sony PS5 Disc Edition fully tested. Ready to play, starting from £349 with free delivery.",
    ctaPrimary: { label: "Shop consoles", href: "/products?category=Consoles" },
    gradient: "linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    emoji: "🎮",
  },
  {
    id: "s4",
    layout: "image-only",
    gradient: "linear-gradient(145deg,#1c0030 0%,#3d0066 50%,#7b2d8b 100%)",
    emoji: "🎧",
  },
];

const AUTO_MS = 5000;

/* ─────────────────────────────────────────────────────────────────────────────
   BADGE HELPER
───────────────────────────────────────────────────────────────────────────── */

function Badge({ slide }: { slide: HeroSlide }) {
  if (!slide.badge) return null;
  const base = "mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider";
  const variants: Record<string, string> = {
    flash: "bg-[#16a34a] text-white",
    new:   "bg-[var(--color-cat-laptops-soft)] text-[var(--color-cat-laptops)]",
    sale:  "bg-[var(--color-cat-deals-soft)] text-[var(--color-cat-deals)]",
    plain: "border border-[var(--color-iron)] bg-white text-ceramic",
  };
  return (
    <span className={cn(base, variants[slide.badgeVariant ?? "plain"])}>
      {slide.badgeVariant === "flash" && (
        <Zap className="h-3 w-3 fill-white" strokeWidth={0} aria-hidden />
      )}
      {slide.badge}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface HeroSliderProps {
  locale: string;
}

export function HeroSlider({ locale }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAr = locale === "ar";

  const go = useCallback((idx: number) => {
    setCurrent((idx + SLIDES.length) % SLIDES.length);
  }, []);

  /* Auto-advance */
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => go(current + 1), AUTO_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, go]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero slideshow"
    >
      {/* ── Slides ── */}
      <div className="relative h-[380px] md:h-[500px] lg:h-[560px]">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== current}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === current ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
            )}
          >
            {/* ── Full-bleed gradient background — always covers entire slide ── */}
            <div className="absolute inset-0" style={{ background: s.gradient }}>
              {s.emoji && (
                <div className={cn(
                  "flex h-full items-center justify-center",
                  s.layout === "split" && "md:justify-end md:pe-[12%]"
                )}>
                  <span
                    className="select-none drop-shadow-2xl"
                    style={{ fontSize: "clamp(5rem, 12vw, 11rem)", lineHeight: 1 }}
                    aria-hidden
                  >
                    {s.emoji}
                  </span>
                </div>
              )}
            </div>

            {/* ── Text overlay — for split-layout slides only ── */}
            {s.layout === "split" && (s.headline || s.ctaPrimary) && (
              <>
                {/* Gradient scrim for text legibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

                {/* Text content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full max-w-lg px-8 lg:px-14">
                    <Badge slide={s} />

                    {s.headline && (
                      <h2
                        className="font-black text-white"
                        style={{
                          fontSize:      "clamp(2rem, 3.2vw, 3rem)",
                          lineHeight:    1.08,
                          letterSpacing: "-0.03em",
                          whiteSpace:    "pre-line",
                        }}
                      >
                        {s.headline}
                      </h2>
                    )}

                    {s.subline && (
                      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">
                        {s.subline}
                      </p>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      {s.ctaPrimary && (
                        <Link
                          href={s.ctaPrimary.href}
                          locale={locale as "en" | "ar"}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-mint)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)]"
                        >
                          {s.ctaPrimary.label}
                          <ArrowRight
                            className={cn("h-4 w-4", isAr && "rotate-180")}
                            strokeWidth={2}
                          />
                        </Link>
                      )}
                      {s.ctaSecondary && (
                        <Link
                          href={s.ctaSecondary.href}
                          locale={locale as "en" | "ar"}
                          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                        >
                          {s.ctaSecondary.label}
                        </Link>
                      )}
                    </div>

                    {/* Trust micro-badges */}
                    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/70">
                      <span>✓ 1-year warranty</span>
                      <span>✓ 30-day returns</span>
                      <span>✓ Expert verified</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Dot indicators — centred, always visible ── */}
      <div
        className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        role="tablist"
        aria-label="Slides"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            onClick={() => go(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current
                ? "h-2 w-6 bg-[var(--color-mint)]"
                : "h-2 w-2 bg-white/50 hover:bg-white/80"
            )}
          />
        ))}
      </div>


      {/* ── Progress bar — thin accent line at bottom ── */}
      {!paused && (
        <div
          key={`${current}-progress`}
          className="absolute bottom-0 left-0 z-20 h-[2px] bg-[var(--color-mint)]"
          style={{
            animation: `slide-progress ${AUTO_MS}ms linear forwards`,
            width: "0%",
          }}
        />
      )}
    </section>
  );
}
