"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isRenderableImage } from "@/lib/images";
import type { HeroSlideOverride, HeroDesktopAspectRatio, HeroMobileAspectRatio } from "@/lib/store-config";

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE DATA
   Images only. This used to also carry a badge/headline/subline/two CTA buttons/
   trust-badge row per slide, sourced from next-intl namespace "hero" — removed along
   with the whole namespace (messages/en.json's git history has the copy if it's ever
   needed again). A Builder `slides` override (Storefront Builder → Hero → Edit
   content) replaces these entirely; empty ⇒ these 3 stay as the default.

   Desktop and mobile are real art direction — a <picture>/<source> pair per slide
   serving a genuinely different image per breakpoint, not next/image's single-file
   responsive srcset (which resizes one image, it can't swap to a different crop). That
   is also why this file uses a plain <img>, not next/image: next/image has no supported
   way to express "a different source file above vs below this breakpoint."
───────────────────────────────────────────────────────────────────────────── */

interface HeroSlide {
  desktopImage: string;
  mobileImage:  string;   // always resolved — falls back to desktopImage when a slide has no mobile-specific crop
  desktopRatio: HeroDesktopAspectRatio;
  mobileRatio:  HeroMobileAspectRatio;
  imageAlt?:    string;
  href?:        string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    desktopImage: "https://images.unsplash.com/photo-1571380401583-72ca84994796?w=1920&q=80&fit=crop",
    mobileImage:  "https://images.unsplash.com/photo-1571380401583-72ca84994796?w=1920&q=80&fit=crop",
    desktopRatio: "wide-banner",
    mobileRatio:  "square",
    imageAlt:     "Black smartphone",
    href:         "/products",
  },
  {
    desktopImage: "https://images.unsplash.com/photo-1512296014055-b49bbcd707d2?w=1920&q=80&fit=crop",
    mobileImage:  "https://images.unsplash.com/photo-1512296014055-b49bbcd707d2?w=1920&q=80&fit=crop",
    desktopRatio: "wide-banner",
    mobileRatio:  "square",
    imageAlt:     "Silver MacBook",
    href:         "/products?brand=Apple&category=Laptops",
  },
  {
    desktopImage: "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=1920&q=80&fit=crop",
    mobileImage:  "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=1920&q=80&fit=crop",
    desktopRatio: "wide-banner",
    mobileRatio:  "square",
    imageAlt:     "White PlayStation 5 console and controller",
    href:         "/products?category=Consoles",
  },
];

const AUTO_MS = 5000;

/* Named presets → real CSS aspect-ratio values. Kept as a lookup rather than storing the
   raw ratio in HeroSlideOverride so the Builder can offer a fixed set of buttons instead
   of a free-text CSS value an admin could get wrong. */
function desktopRatioCSS(ratio: HeroDesktopAspectRatio): string {
  switch (ratio) {
    case "standard-cinema": return "16 / 9";
    case "compact-strip":   return "3 / 1";
    case "wide-banner":     return "21 / 9";
    default:                return "21 / 9";
  }
}
function mobileRatioCSS(ratio: HeroMobileAspectRatio): string {
  switch (ratio) {
    case "portrait": return "4 / 5";
    case "compact":  return "3 / 2";
    case "square":   return "1 / 1";
    default:         return "1 / 1";
  }
}

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

  // Memoized, not recomputed-and-discarded every render: `go` below depends on
  // `slides.length`, and the React Compiler needs a stable reference to trust that
  // dependency won't silently drift — a fresh array literal every render (even one
  // with the same eventual length) doesn't give it that guarantee.
  const slides = useMemo<HeroSlide[]>(() => {
    const overrideSlides = (slidesOverride ?? [])
      .filter((s) => isRenderableImage(s.desktop_image_url))
      .map((s) => ({
        desktopImage: s.desktop_image_url,
        mobileImage:  isRenderableImage(s.mobile_image_url) ? s.mobile_image_url! : s.desktop_image_url,
        desktopRatio: s.desktop_aspect_ratio ?? "wide-banner",
        mobileRatio:  s.mobile_aspect_ratio ?? "square",
        href:         s.href,
      }));
    return overrideSlides.length > 0 ? overrideSlides : DEFAULT_SLIDES;
  }, [slidesOverride]);

  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived, not stored: if the slide count shrinks between renders (an admin removes
  // slides in the Builder while this page happens to be open) `current` can point past
  // the end. Rather than an effect that calls setState to "fix" it after the fact —
  // exactly the kind of extra render-and-a-half React's own docs say an effect is the
  // wrong tool for — the in-range index is just computed fresh every render.
  const safeCurrent = slides.length > 0 ? ((current % slides.length) + slides.length) % slides.length : 0;
  const activeSlide  = slides[safeCurrent];

  const go = useCallback((idx: number) => {
    if (slides.length === 0) return;
    setCurrent((idx + slides.length) % slides.length);
  }, [slides.length]);

  // Clamp `current` back in range if the slide count shrinks between renders — an admin
  // can remove slides in the Builder while this page happens to be open.
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
      {/* hero-slide-frame (globals.css) sets aspect-ratio from these two custom
          properties — mobile below 768px or in a portrait/narrow-landscape shape,
          desktop only once the viewport is both wide AND landscape-ish. Driven by the
          ACTIVE slide specifically: every slide is absolutely stacked into one shared
          frame for the crossfade, so only one slide's ratio can be "the" container size
          at a time — it animates (transition-[aspect-ratio]) when that changes between
          slides instead of jumping. */}
      <div
        className="hero-slide-frame relative transition-[aspect-ratio] duration-300"
        style={{
          ["--hero-aspect-mobile" as string]:  mobileRatioCSS(activeSlide.mobileRatio),
          ["--hero-aspect-desktop" as string]: desktopRatioCSS(activeSlide.desktopRatio),
        }}
      >
        {slides.map((s, i) => {
          const picture = (
            <picture className="block h-full w-full">
              {/* Phones, folded/unfolded foldables in a narrow shape, and iPad-style
                  tablets in portrait — anything narrow or tall gets the mobile crop. */}
              <source media="(max-aspect-ratio: 13/10), (orientation: portrait)" srcSet={s.mobileImage} />
              {/* True landscape desktop/laptop/tablet gets the wide crop. */}
              <source media="(min-aspect-ratio: 13/10) and (min-width: 768px)" srcSet={s.desktopImage} />
              {/* Plain <img>, not next/image — this is inside a <picture>, and the
                  no-img-element rule already recognizes that pattern (confirmed: no
                  warning fires here), so no eslint-disable needed either. */}
              <img
                src={s.desktopImage}
                alt={s.imageAlt ?? ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full select-none object-cover"
              />
            </picture>
          );
          return (
            <div
              key={i}
              aria-hidden={i !== safeCurrent}
              className={cn(
                "absolute inset-0 overflow-hidden bg-[var(--color-obsidian)] transition-opacity duration-700 ease-in-out",
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
                  className="block h-full w-full"
                >
                  {picture}
                </Link>
              ) : (
                picture
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
