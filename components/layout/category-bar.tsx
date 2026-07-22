"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { CategoryNode } from "@/lib/queries/categories";

// The DB has no per-category artwork, so cards cycle through this palette
// to keep the mega-menu visually close to the original hardcoded design.
const SWATCHES = [
  "linear-gradient(135deg,#c8f8f0 0%,#80e8d8 100%)",
  "linear-gradient(135deg,#ffdde8 0%,#ffb3cc 100%)",
  "linear-gradient(135deg,#e8d5ff 0%,#c4a0ff 100%)",
  "linear-gradient(135deg,#fff0c0 0%,#ffd870 100%)",
  "linear-gradient(135deg,#d5e8ff 0%,#a0c4ff 100%)",
  "linear-gradient(135deg,#c8f7e8 0%,#78d4b0 100%)",
  "linear-gradient(135deg,#ffe0e0 0%,#ffb0b0 100%)",
  "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)",
];

const ACCENTS = [
  "var(--color-cat-smartphones)",
  "var(--color-cat-laptops)",
  "var(--color-cat-consoles)",
  "var(--color-cat-tablets)",
  "var(--color-cat-watches)",
  "var(--color-cat-audio)",
  "var(--color-cat-home)",
];

interface CategoryBarProps {
  locale: string;
  categories: CategoryNode[];
}

export function CategoryBar({ locale, categories }: CategoryBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isAr = locale === "ar";

  if (categories.length === 0) return null;

  const active = categories.find((c) => c.id === activeId) ?? null;
  const activeIndex = active ? categories.findIndex((c) => c.id === active.id) : 0;
  const activeAccent = ACCENTS[activeIndex % ACCENTS.length];

  return (
    <div
      className="relative border-b border-[var(--color-iron)] bg-white"
      onMouseLeave={() => setActiveId(null)}
    >
      {/* Tab bar — root categories straight from the DB */}
      <div className="container-px mx-auto">
        <ul
          className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {categories.map((cat, i) => {
            const isActive = activeId === cat.id;
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}` as never}
                  locale={locale as "en" | "ar"}
                  className="relative flex h-11 items-center gap-1.5 whitespace-nowrap px-4 text-sm font-medium text-ceramic transition-colors hover:text-ceramic focus:outline-none"
                  style={isActive ? { color: accent } : undefined}
                  onMouseEnter={() => setActiveId(cat.id)}
                  onFocus={() => setActiveId(cat.id)}
                  onClick={() => setActiveId(null)}
                >
                  {cat.name}
                  {isActive && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mega dropdown — only when the hovered category actually has children */}
      {active && active.children.length > 0 && (
        <div
          className="absolute inset-x-0 top-full z-50 border-b border-[var(--color-iron)] bg-white shadow-xl"
          onMouseEnter={() => setActiveId(active.id)}
        >
          <div className="container-px mx-auto py-6">
            <div className="grid grid-cols-[200px_1fr] gap-8">
              {/* Left: static promo */}
              <div className="rounded-2xl border border-[var(--color-iron)] bg-[var(--color-obsidian)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate">
                  {isAr ? "ما يجب معرفته" : "Good to know"}
                </p>
                <div className="mt-3 flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--color-iron)] bg-white text-xl"
                    aria-hidden
                  >
                    🔄
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ceramic">
                      {isAr ? "استبدال الجهاز" : "Trade-in"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate">
                      {isAr
                        ? "احصل على قيمة مقابل جهازك القديم"
                        : "Get value back for your old device"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/trade-in"
                  locale={locale as "en" | "ar"}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: activeAccent }}
                  onClick={() => setActiveId(null)}
                >
                  {isAr ? "ابدأ الاستبدال" : "Start trade-in"}
                  <ArrowRight
                    className={isAr ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"}
                    strokeWidth={2}
                  />
                </Link>
              </div>

              {/* Right: subcategories from the DB */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate">
                    {isAr ? "الفئات" : "Categories"}
                  </p>
                  <Link
                    href={`/category/${active.slug}` as never}
                    locale={locale as "en" | "ar"}
                    className="text-sm font-semibold text-ceramic underline-offset-2 hover:underline"
                    onClick={() => setActiveId(null)}
                  >
                    {isAr ? "عرض الكل" : "See all"}
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {active.children.map((sub, i) => (
                    <Link
                      key={sub.id}
                      href={`/category/${sub.slug}` as never}
                      locale={locale as "en" | "ar"}
                      onClick={() => setActiveId(null)}
                      className="group flex flex-col gap-2"
                    >
                      <div
                        className="aspect-[4/3] overflow-hidden rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]"
                        style={{ background: SWATCHES[i % SWATCHES.length] }}
                      >
                        <span
                          className="select-none font-black text-white/70"
                          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: 1 }}
                          aria-hidden
                        >
                          {sub.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-ceramic transition-colors group-hover:text-[var(--color-mint)]">
                        {sub.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
