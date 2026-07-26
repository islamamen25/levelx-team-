"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPE SYSTEM
   النصوص تأتي من next-intl (namespace "hero", مفاتيح slides.s1/s2/s3) —
   هنا فقط هيكل الشريحة والروابط والتدرّج، لا نصوص إنجليزية مباشرة.
───────────────────────────────────────────────────────────────────────────── */

interface HeroSlide {
  id: string;
  layout: "split";
  badgeVariant?: "flash" | "new" | "sale" | "plain";
  ctaPrimaryHref?: string;
  ctaSecondaryHref?: string;
  hasCtaSecondary?: boolean;
  /** CSS gradient used as the right-panel background (visible while the image loads) */
  gradient: string;
  /** صورة منتج حقيقية — Unsplash مُعتمَد في next.config.ts لهذا الغرض بالضبط */
  image: string;
  imageAlt: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE DATA
───────────────────────────────────────────────────────────────────────────── */

const SLIDES: HeroSlide[] = [
  {
    id: "s1",
    layout: "split",
    badgeVariant: "flash",
    ctaPrimaryHref: "/deals",
    ctaSecondaryHref: "/how-it-works",
    hasCtaSecondary: true,
    gradient: "linear-gradient(145deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
    image: "https://images.unsplash.com/photo-1571380401583-72ca84994796?w=900&q=80&fit=crop",
    imageAlt: "Black smartphone",
  },
  {
    id: "s2",
    layout: "split",
    badgeVariant: "new",
    ctaPrimaryHref: "/products?brand=Apple&category=Laptops",
    ctaSecondaryHref: "/products?category=Laptops",
    hasCtaSecondary: true,
    gradient: "linear-gradient(145deg,#e8e8ed 0%,#c8c8ce 55%,#aeaeb2 100%)",
    image: "https://images.unsplash.com/photo-1512296014055-b49bbcd707d2?w=900&q=80&fit=crop",
    imageAlt: "Silver MacBook",
  },
  {
    id: "s3",
    layout: "split",
    badgeVariant: "sale",
    ctaPrimaryHref: "/products?category=Consoles",
    hasCtaSecondary: false,
    gradient: "linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    image: "https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=900&q=80&fit=crop",
    imageAlt: "White PlayStation 5 console and controller",
  },
];

const AUTO_MS = 5000;

/* ─────────────────────────────────────────────────────────────────────────────
   BADGE HELPER
───────────────────────────────────────────────────────────────────────────── */

function Badge({ slide, label }: { slide: HeroSlide; label: string }) {
  const base = "mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider";
  const variants: Record<string, string> = {
    flash: "bg-[#16a34a] text-white",
    new:   "bg-[var(--color-cat-laptops-soft)] text-[var(--color-cat-laptops)]",
    sale:  "bg-[var(--color-cat-deals-soft)] text-[var(--color-cat-deals)]",
    plain: "border border-[var(--color-iron)] bg-white text-ceramic",
  };
  return (
    <span dir="auto" className={cn(base, variants[slide.badgeVariant ?? "plain"])}>
      {slide.badgeVariant === "flash" && (
        <Zap className="h-3 w-3 fill-white" strokeWidth={0} aria-hidden />
      )}
      {label}
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
  const t = useTranslations("hero");
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

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero slideshow"
    >
      {/* ── Slides ──
          h-[380px] كانت أقصر من محتوى النص المُترجَم (badge+headline+subline+CTAs+trust ≈ 406px)،
          فمركز flex items-center كان يدفع الشارة فوق y=0 وتختفي خلف الهيدر الثابت (56px).
          470px + pt-14 (سطر تحت) يضمنان مساحة كافية بلا تراكب. */}
      <div className="relative h-[470px] md:h-[500px] lg:h-[560px]">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== current}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === current ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
            )}
          >
            {/* ── Full-bleed gradient background — visible while the image loads/fades in ── */}
            <div className="absolute inset-0" style={{ background: s.gradient }}>
              <div className="flex h-full items-center justify-center md:justify-end md:pe-[8%]">
                {/* width/height صريحة تمنع CLS — priority على أول شريحة فقط (LCP) */}
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  width={720}
                  height={720}
                  priority={i === 0}
                  className="h-[70%] w-auto max-w-[85%] rounded-2xl object-cover shadow-2xl md:h-[80%]"
                />
              </div>
            </div>

            {/* ── Text overlay ── */}
            {/* Gradient scrim for text legibility.
                اتجاه منطقي عبر --scrim-dir (globals.css) — يتبع اتجاه الصفحة.
                كان bg-gradient-to-r فيزيائياً، فوقع الحاجب في الجهة المقابلة
                للنص في RTL وسقط تباين العنوان إلى 1.67:1.
                أدنى طرف 0.15 بدل transparent يضمن أرضية حتى فوق أفتح تدرّج. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to var(--scrim-dir, right), " +
                  "oklch(0 0 0 / 0.72) 0%, oklch(0 0 0 / 0.45) 45%, oklch(0 0 0 / 0.15) 100%)",
              }}
            />

            {/* Text content — pt-14 على الموبايل يفسح المساحة اللي الهيدر الثابت
                يحتلها (56px) بدل ما يعتمد على items-center يوزّع الفائض؛ items-center
                يرجع في md لأن الهيرو أطول من المحتوى هناك فمركز طبيعي وآمن. */}
            <div className="absolute inset-0 flex items-start pt-14 md:items-center md:pt-0">
              <div className="w-full max-w-lg px-8 lg:px-14">
                <Badge slide={s} label={t(`slides.${s.id}.badge`)} />

                {/* dir="auto" — بدونها يرث النص اتجاه RTL من الصفحة،
                    فتنتقل النقطة/الأرقام لبداية السطر:
                    "MacBook. …" ← ".MacBook" و "1-year" ← "year-1". */}
                <h2
                  dir="auto"
                  className="font-black text-white"
                  style={{
                    fontSize:      "clamp(2rem, 3.2vw, 3rem)",
                    lineHeight:    1.08,
                    letterSpacing: "-0.03em",
                    whiteSpace:    "pre-line",
                  }}
                >
                  {t(`slides.${s.id}.headline`)}
                </h2>

                <p dir="auto" className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">
                  {t(`slides.${s.id}.subline`)}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {s.ctaPrimaryHref && (
                    <Link
                      href={s.ctaPrimaryHref}
                      locale={locale as "en" | "ar"}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-mint)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)]"
                    >
                      {t(`slides.${s.id}.ctaPrimary`)}
                      <ArrowRight
                        className={cn("h-4 w-4", isAr && "rotate-180")}
                        strokeWidth={2}
                      />
                    </Link>
                  )}
                  {s.hasCtaSecondary && s.ctaSecondaryHref && (
                    <Link
                      href={s.ctaSecondaryHref}
                      locale={locale as "en" | "ar"}
                      className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      {t(`slides.${s.id}.ctaSecondary`)}
                    </Link>
                  )}
                </div>

                {/* Trust micro-badges — dir="auto" وإلا صارت
                    "1-year warranty" ← "year warranty-1". */}
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/70">
                  <span dir="auto">✓ {t("trust.warranty")}</span>
                  <span dir="auto">✓ {t("trust.returns")}</span>
                  <span dir="auto">✓ {t("trust.delivery")}</span>
                </div>
              </div>
            </div>
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
