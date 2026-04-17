"use client";

import { useRef, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight, Smartphone, Laptop, Tablet, Gamepad2, Watch, Headphones, Camera, Home, Package, Plane, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY DATA  (10 items — overflows carousel naturally)
───────────────────────────────────────────────────────────────────────────── */

interface CategoryItem {
  key:      string;
  label:    string;
  arLabel:  string;
  slug:     string;
  Icon:     LucideIcon;
  /** CSS custom property name for the accent colour */
  colorKey: string;
}

const CATEGORIES: CategoryItem[] = [
  { key: "smartphones",  label: "Smartphones",  arLabel: "الهواتف",       slug: "Smartphones",  Icon: Smartphone, colorKey: "smartphones" },
  { key: "laptops",      label: "MacBooks",      arLabel: "اللاب توب",     slug: "Laptops",      Icon: Laptop,     colorKey: "laptops"     },
  { key: "tablets",      label: "iPads",         arLabel: "الأجهزة اللوحية", slug: "Tablets",    Icon: Tablet,     colorKey: "tablets"     },
  { key: "consoles",     label: "Consoles",      arLabel: "أجهزة الألعاب",slug: "Consoles",     Icon: Gamepad2,   colorKey: "consoles"    },
  { key: "smartwatches", label: "Smartwatches",  arLabel: "الساعات الذكية", slug: "Smartwatches", Icon: Watch,     colorKey: "watches"     },
  { key: "audio",        label: "Audio",         arLabel: "الصوتيات",      slug: "Headphones",   Icon: Headphones, colorKey: "audio"       },
  { key: "cameras",      label: "Cameras",       arLabel: "الكاميرات",     slug: "Cameras",      Icon: Camera,     colorKey: "home"        },
  { key: "home",         label: "Smart Home",    arLabel: "المنزل الذكي",  slug: "SmartHome",    Icon: Home,       colorKey: "home"        },
  { key: "accessories",  label: "Accessories",   arLabel: "الملحقات",      slug: "Accessories",  Icon: Package,    colorKey: "deals"       },
  { key: "drones",       label: "Drones",        arLabel: "الطائرات",      slug: "Drones",       Icon: Plane,      colorKey: "smartphones" },
];

const SCROLL_STEP = 320; // px per arrow click

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface CategoryCarouselProps {
  locale: string;
}

export function CategoryCarousel({ locale }: CategoryCarouselProps) {
  const trackRef        = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);
  const isAr = locale === "ar";

  const syncArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -SCROLL_STEP : SCROLL_STEP, behavior: "smooth" });
    setTimeout(syncArrows, 350);
  }, [syncArrows]);

  return (
    <section className="bg-white py-12 md:py-16" aria-label="Shop by category">
      <div className="container-px mx-auto">

        {/* ── Header row ── */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2
            className="text-ceramic"
            style={{ fontSize: "clamp(1.35rem, 2.5vw, 1.875rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            {isAr ? "تسوق حسب الفئة" : "Shop by category"}
          </h2>

          {/* Desktop-only arrows */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label={isAr ? "التالي" : "Scroll left"}
              onClick={() => scroll("left")}
              disabled={!canLeft}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                canLeft
                  ? "border-[var(--color-iron)] bg-white text-ceramic hover:border-ceramic hover:shadow-sm"
                  : "border-[var(--color-iron)] bg-white text-[var(--color-iron)] cursor-not-allowed opacity-40"
              )}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label={isAr ? "السابق" : "Scroll right"}
              onClick={() => scroll("right")}
              disabled={!canRight}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                canRight
                  ? "border-ceramic bg-ceramic text-white hover:bg-ceramic/90"
                  : "border-[var(--color-iron)] bg-white text-[var(--color-iron)] cursor-not-allowed opacity-40"
              )}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Scrollable track ── */}
        <div
          ref={trackRef}
          onScroll={syncArrows}
          className={cn(
            "flex gap-3 overflow-x-auto scroll-smooth",
            /* snap */
            "snap-x snap-mandatory",
            /* hide scrollbar — all browsers */
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {CATEGORIES.map(({ key, label, arLabel, slug, Icon, colorKey }) => (
            <Link
              key={key}
              href={{ pathname: "/products", query: { category: slug } }}
              locale={locale as "en" | "ar"}
              /* snap alignment */
              className="group snap-start flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* ── Squarish box ── */}
              <div
                className="flex h-[108px] w-[108px] flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--color-iron)] bg-white transition-all duration-200 group-hover:border-transparent group-hover:shadow-lg"
                style={{
                  // Lift background colour on hover via the soft variant
                  // (can't use dynamic class names in Tailwind so we use inline hover trick)
                }}
              >
                {/* Icon pill */}
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{
                    backgroundColor: `var(--color-cat-${colorKey}-soft)`,
                    color:           `var(--color-cat-${colorKey})`,
                  }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
              </div>

              {/* Label below the box */}
              <p
                className="mt-2 w-[108px] text-center text-[12px] font-semibold text-ceramic"
              >
                {isAr ? arLabel : label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
