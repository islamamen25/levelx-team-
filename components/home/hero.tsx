"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Smartphone, Laptop, Gamepad2, ShieldCheck, RotateCcw, BadgeCheck } from "lucide-react";

interface HeroProps {
  locale: string;
}

export function Hero({ locale }: HeroProps) {
  const t = useTranslations("hero");
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    async function animate() {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Word stagger reveal — preserved exactly
        gsap.from(wordsRef.current.filter(Boolean), {
          opacity: 0,
          y: 28,
          duration: 0.65,
          stagger: 0.06,
          ease: "power3.out",
          delay: 0.1,
        });
        // Sub + CTA + trust fade
        gsap.from([subRef.current, ctaRef.current, trustRef.current], {
          opacity: 0,
          y: 20,
          duration: 0.6,
          stagger: 0.12,
          ease: "power2.out",
          delay: 0.55,
        });
        // Visual entrance
        gsap.from(visualRef.current, {
          opacity: 0,
          scale: 0.94,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.2,
        });
        // Parallax on scroll — preserved exactly
        gsap.to(visualRef.current, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: visualRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }

    animate();
    return () => ctx?.revert();
  }, []);

  // Split headline into words for per-word animation
  const headline = t("headline");
  const words = headline.split(/(\s+|\n)/);

  return (
    <section
      className="relative overflow-hidden bg-[#F5F5F7]"
      aria-label="Hero"
    >
      <div className="container-px mx-auto relative min-h-[480px] py-16 md:min-h-[540px] md:py-20">
        {/* ── Left: copy ── */}
        <div className="relative z-10 max-w-[560px] md:max-w-[640px]">
          {/* Eyebrow pill */}
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-mint)]/30 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-mint)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]" aria-hidden />
            {t("eyebrow")}
          </span>

          {/* Animated headline */}
          <h1
            className="text-display-xl mb-6 whitespace-pre-line text-ceramic"
            style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.75rem)" }}
            aria-label={headline}
          >
            {words.map((word, i) =>
              word === "\n" ? (
                <br key={i} />
              ) : /^\s+$/.test(word) ? (
                <span key={i}> </span>
              ) : (
                <span
                  key={i}
                  className="word inline-block will-change-transform"
                  ref={(el) => {
                    if (el) wordsRef.current[i] = el;
                  }}
                >
                  {word}
                </span>
              ),
            )}
          </h1>

          <p
            ref={subRef}
            className="mb-8 max-w-[460px] text-base leading-relaxed text-slate md:text-lg"
          >
            {t("sub")}
          </p>

          <div ref={ctaRef} className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              locale={locale as "en" | "ar"}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-mint)] px-7 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[var(--color-mint-hover)]"
            >
              {t("cta")}
              <ArrowRight
                className={
                  locale === "ar"
                    ? "h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5"
                    : "h-4 w-4 transition-transform group-hover:translate-x-0.5"
                }
                strokeWidth={2}
              />
            </Link>

            <Link
              href="/about"
              locale={locale as "en" | "ar"}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-iron)] bg-white px-7 py-3.5 text-sm font-bold text-ceramic transition-colors duration-200 hover:border-ceramic"
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          {/* Micro trust badges */}
          <div
            ref={trustRef}
            className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-mint)]" strokeWidth={2} aria-hidden />
              {locale === "ar" ? "ضمان سنة كاملة" : "1-year warranty"}
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-[var(--color-mint)]" strokeWidth={2} aria-hidden />
              {locale === "ar" ? "إرجاع خلال 30 يوماً" : "30-day returns"}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-[var(--color-mint)]" strokeWidth={2} aria-hidden />
              {locale === "ar" ? "مفحوص من خبراء" : "Expert verified"}
            </span>
          </div>
        </div>

        {/* ── Right: 3-card category showcase (desktop) ── */}
        <div ref={visualRef} className="pointer-events-none absolute inset-0 hidden md:block">
          <div
            className="relative h-full"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "12px",
              position: "absolute",
              right: "0",
              top: "50%",
              transform: "translateY(-50%)",
              width: "45%",
              opacity: "0.2",
            }}
          >
            {/* Card 1 — large, spans both rows */}
            <div
              className="row-span-2 flex flex-col items-center justify-center rounded-[2rem] border border-[var(--color-iron)] bg-gradient-to-br from-blue-100 to-blue-50 p-6 shadow-sm"
              style={{ minHeight: "260px" }}
            >
              <Smartphone
                className="h-20 w-20"
                strokeWidth={0.8}
                style={{ color: "var(--color-cat-smartphones)" }}
                aria-hidden
              />
              <span className="mt-3 text-sm font-bold text-ceramic">
                {locale === "ar" ? "الهواتف الذكية" : "Smartphones"}
              </span>
              <span
                className="mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
                style={{ backgroundColor: "var(--color-cat-smartphones)" }}
              >
                {locale === "ar" ? "حتى −60%" : "Up to −60%"}
              </span>
            </div>

            {/* Card 2 — laptops */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-iron)] bg-gradient-to-br from-purple-100 to-violet-50 p-5 shadow-sm">
              <Laptop
                className="h-12 w-12"
                strokeWidth={0.8}
                style={{ color: "var(--color-cat-laptops)" }}
                aria-hidden
              />
              <span className="mt-2 text-xs font-bold text-ceramic">
                {locale === "ar" ? "اللاب توب" : "Laptops"}
              </span>
            </div>

            {/* Card 3 — consoles */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-iron)] bg-gradient-to-br from-green-100 to-emerald-50 p-5 shadow-sm">
              <Gamepad2
                className="h-12 w-12"
                strokeWidth={0.8}
                style={{ color: "var(--color-cat-consoles)" }}
                aria-hidden
              />
              <span className="mt-2 text-xs font-bold text-ceramic">
                {locale === "ar" ? "أجهزة الألعاب" : "Consoles"}
              </span>
            </div>

            {/* Floating discount badge */}
            <div
              className="absolute end-0 -top-3 rotate-6 rounded-full bg-[var(--color-mint)] px-4 py-2 text-sm font-black text-white shadow-[0_8px_24px_-6px_oklch(0.64_0.10_184/0.45)]"
              aria-hidden
            >
              {t("badge")}
            </div>
          </div>
        </div>

        {/* ── Mobile-only: single card visual ── */}
        <div className="relative flex items-center justify-center md:hidden">
          <div className="relative aspect-square w-full max-w-[280px]">
            <div
              aria-hidden
              className="absolute inset-6 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 55%, oklch(0.64 0.10 184 / 0.15) 0%, oklch(0.64 0.10 184 / 0.04) 45%, transparent 70%)",
              }}
            />
            <div className="absolute inset-10 flex items-center justify-center rounded-[2.5rem] border border-[var(--color-iron)] bg-white shadow-[0_24px_60px_-20px_oklch(0_0_0/0.12)]">
              <Smartphone className="h-20 w-20 text-slate" strokeWidth={1} aria-hidden />
            </div>
            <div className="absolute end-2 top-4 rotate-6 rounded-full bg-[var(--color-mint)] px-3 py-1.5 text-sm font-black text-white shadow-lg">
              {t("badge")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
