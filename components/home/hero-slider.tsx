"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isRenderableImage } from "@/lib/images";
import type { HeroSlideOverride } from "@/lib/store-config";

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE DATA
   Images only. This used to also carry a badge/headline/subline/two CTA buttons/
   trust-badge row per slide, sourced from next-intl namespace "hero" — removed along
   with the whole namespace (messages/en.json's git history has the copy if it's ever
   needed again). A Builder `slides` override (Storefront Builder → Hero → Edit
   content) replaces these entirely; empty ⇒ these 3 stay as the default.
───────────────────────────────────────────────────────────────────────────── */

interface HeroSlide {
  image:     string;
  imageAlt?: string;
  href?:     string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image:    "https://images.unsplash.com/photo-1571380401583-72ca84994796?w=1920&q=80&fit=crop",
    imageAlt: "Black smartphone",
    href:     "/products",
  },
  {
    image:    "https://images.unsplash.com/photo-1512296014055-b49bbcd707d2?w=1920&q=80&fit=crop",
    imageAlt: "Silver MacBook",
    href:     "/products?brand=Apple&category=Laptops",
  },
  {
    image:    "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=1920&q=80&fit=crop",
    imageAlt: "White PlayStation 5 console and controller",
    href:     "/products?category=Consoles",
  },
];

const AUTO_MS = 5000;

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface HeroSliderProps {
  locale: string;
  /** Builder override (Storefront Builder → Hero → Edit content). Empty/absent ⇒
      DEFAULT_SLIDES above. Filtered by isRenderableImage() — unlike every other
      override in this app, a hero slide has no icon/label fallback to fall back on,
      so a bad URL here would render nothing rather than something merely degraded. */
  slides?: HeroSlideOverride[];
}

export function HeroSlider({ locale, slides: slidesOverride }: HeroSliderProps) {
  const isAr = locale === "ar";

  const overrideSlides: HeroSlide[] = (slidesOverride ?? [])
    .filter((s) => isRenderableImage(s.image_url))
    .map((s) => ({ image: s.image_url, href: s.href }));
  const slides = overrideSlides.length > 0 ? overrideSlides : DEFAULT_SLIDES;

  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived, not stored: if the slide count shrinks between renders (an admin removes
  // slides in the Builder while this page happens to be open) `current` can point past
  // the end. Rather than an effect that calls setState to "fix" it after the fact —
  // exactly the kind of extra render-and-a-half React's own docs say an effect is the
  // wrong tool for — the in-range index is just computed fresh every render. The old
  // fixed 3-slide array never needed this; SLIDES.length was a true module constant then.
  const safeCurrent = slides.length > 0 ? ((current % slides.length) + slides.length) % slides.length : 0;

  const go = useCallback((idx: number) => {
    if (slides.length === 0) return;
    setCurrent((idx + slides.length) % slides.length);
  }, [slides.length]);

  /* Auto-advance — suppressed entirely at 0-1 slides, nothing to advance to. */
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setTimeout(() => go(safeCurrent + 1), AUTO_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [safeCurrent, paused, go, slides.length]);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero slideshow"
    >
      <div className="relative h-[470px] md:h-[500px] lg:h-[560px]">
        {slides.map((s, i) => {
          const img = (
            <Image
              src={s.image}
              alt={s.imageAlt ?? ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          );
          return (
            <div
              key={i}
              aria-hidden={i !== safeCurrent}
              className={cn(
                "absolute inset-0 bg-[var(--color-obsidian)] transition-opacity duration-700 ease-in-out",
                i === safeCurrent ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
              )}
            >
              {s.href ? (
                <Link
                  href={s.href as never}
                  locale={locale as "en" | "ar"}
                  // A linked slide needs an accessible name. Built-in slides carry a real
                  // imageAlt already; an admin-added override slide has none — this is
                  // images-only by design, HeroSlideOverride has no label field — so
                  // without this fallback that Link would have no name at all.
                  aria-label={!s.imageAlt ? (isAr ? `الشريحة ${i + 1}` : `Slide ${i + 1}`) : undefined}
                  className="absolute inset-0 block"
                >
                  {img}
                </Link>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dot indicators — centred, always visible ── */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
          role="tablist"
          aria-label="Slides"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeCurrent}
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === safeCurrent
                  ? "h-2 w-6 bg-[var(--color-mint)]"
                  : "h-2 w-2 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar — thin accent line at bottom ── */}
      {slides.length > 1 && !paused && (
        <div
          key={`${safeCurrent}-progress`}
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
