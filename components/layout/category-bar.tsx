"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

type SubCategory = {
  name: string;
  arName: string;
  bgCss: string;   // inline CSS gradient for card background
  emoji: string;   // product visual
  href: string;
};

type NavItem = {
  key: string;
  label: string;
  arLabel: string;
  color: string;
  href: string;
  icon?: typeof Sparkles;
  subcategories: SubCategory[];
  promo: { title: string; arTitle: string; sub: string; arSub: string; cta: string; arCta: string; href: string };
};

const MEGA_NAV: NavItem[] = [
  {
    key: "deals",
    label: "Good deals",
    arLabel: "أفضل العروض",
    color: "var(--color-cat-deals)",
    href: "/deals",
    icon: Sparkles,
    subcategories: [
      { name: "Flash deals",  arName: "عروض فورية",  bgCss: "linear-gradient(135deg,#c8f8f0 0%,#80e8d8 100%)", emoji: "⚡",  href: "/deals?type=flash" },
      { name: "Under £100",   arName: "أقل من £100", bgCss: "linear-gradient(135deg,#fff0c0 0%,#ffd870 100%)", emoji: "🏷️", href: "/deals?max=100" },
      { name: "Bundle deals", arName: "عروض الحزم",  bgCss: "linear-gradient(135deg,#e8d8ff 0%,#c8a8ff 100%)", emoji: "📦", href: "/deals?type=bundle" },
      { name: "Clearance",    arName: "تصفية",        bgCss: "linear-gradient(135deg,#ffe0e0 0%,#ffb0b0 100%)", emoji: "🔖", href: "/deals?type=clearance" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
  {
    key: "smartphones",
    label: "Smartphones",
    arLabel: "الهواتف الذكية",
    color: "var(--color-cat-smartphones)",
    href: "/products?category=Smartphones",
    subcategories: [
      { name: "iPhone",          arName: "آيفون",       bgCss: "linear-gradient(135deg,#ffdde8 0%,#ffb3cc 100%)", emoji: "📱", href: "/products?brand=Apple&category=Smartphones" },
      { name: "Samsung Galaxy",  arName: "سامسونج",     bgCss: "linear-gradient(135deg,#e8d5ff 0%,#c4a0ff 100%)", emoji: "📱", href: "/products?brand=Samsung" },
      { name: "Google Pixel",    arName: "جوجل بيكسل", bgCss: "linear-gradient(135deg,#c8f7e8 0%,#78d4b0 100%)", emoji: "📱", href: "/products?brand=Google" },
      { name: "All smartphones", arName: "كل الهواتف", bgCss: "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)", emoji: "📱", href: "/products?category=Smartphones" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
  {
    key: "laptops",
    label: "Laptops",
    arLabel: "اللاب توب",
    color: "var(--color-cat-laptops)",
    href: "/products?category=Laptops",
    subcategories: [
      { name: "MacBook",     arName: "ماك بوك",        bgCss: "linear-gradient(135deg,#e8e8ed 0%,#c8c8d0 100%)", emoji: "💻", href: "/products?brand=Apple&category=Laptops" },
      { name: "Dell XPS",    arName: "ديل XPS",         bgCss: "linear-gradient(135deg,#2d2d3d 0%,#4a4a5a 100%)", emoji: "💻", href: "/products?brand=Dell" },
      { name: "All laptops", arName: "كل اللاب توب",   bgCss: "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)", emoji: "💻", href: "/products?category=Laptops" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
  {
    key: "tablets",
    label: "Tablets",
    arLabel: "الأجهزة اللوحية",
    color: "var(--color-cat-tablets)",
    href: "/products?category=Tablets",
    subcategories: [
      { name: "iPad",        arName: "آيباد",               bgCss: "linear-gradient(135deg,#c8e8ff 0%,#90c8ff 100%)", emoji: "⬛", href: "/products?brand=Apple&category=Tablets" },
      { name: "All tablets", arName: "كل الأجهزة اللوحية", bgCss: "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)", emoji: "⬛", href: "/products?category=Tablets" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
  {
    key: "consoles",
    label: "Game consoles",
    arLabel: "أجهزة الألعاب",
    color: "var(--color-cat-consoles)",
    href: "/products?category=Consoles",
    subcategories: [
      { name: "PlayStation", arName: "بلاي ستيشن",   bgCss: "linear-gradient(135deg,#c0d8ff 0%,#80b0ff 100%)", emoji: "🎮", href: "/products?brand=Sony&category=Consoles" },
      { name: "Xbox",        arName: "إكس بوكس",      bgCss: "linear-gradient(135deg,#c8f0d0 0%,#80d898 100%)", emoji: "🎮", href: "/products?brand=Microsoft&category=Consoles" },
      { name: "Nintendo",    arName: "نينتندو",        bgCss: "linear-gradient(135deg,#ffc8d0 0%,#ff8090 100%)", emoji: "🎮", href: "/products?brand=Nintendo&category=Consoles" },
      { name: "Video games", arName: "ألعاب فيديو",   bgCss: "linear-gradient(135deg,#e8e0ff 0%,#c8b8ff 100%)", emoji: "🕹️", href: "/products?type=games" },
      { name: "Accessories", arName: "ملحقات الألعاب",bgCss: "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)", emoji: "🎯", href: "/products?type=console-acc" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
  {
    key: "watches",
    label: "Smartwatches",
    arLabel: "الساعات الذكية",
    color: "var(--color-cat-watches)",
    href: "/products?category=Smartwatches",
    subcategories: [
      { name: "Apple Watch",      arName: "ساعة آبل",    bgCss: "linear-gradient(135deg,#ffe8f0 0%,#ffc0d8 100%)", emoji: "⌚", href: "/products?brand=Apple&category=Smartwatches" },
      { name: "All smartwatches", arName: "كل الساعات", bgCss: "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)", emoji: "⌚", href: "/products?category=Smartwatches" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
  {
    key: "audio",
    label: "Audio",
    arLabel: "الصوتيات",
    color: "var(--color-cat-audio)",
    href: "/products?category=Headphones",
    subcategories: [
      { name: "Headphones",    arName: "سماعات الرأس", bgCss: "linear-gradient(135deg,#fff0c0 0%,#ffd870 100%)", emoji: "🎧", href: "/products?category=Headphones" },
      { name: "Sony WH series",arName: "سوني WH",      bgCss: "linear-gradient(135deg,#ffe8c8 0%,#ffcc88 100%)", emoji: "🎧", href: "/products?brand=Sony&category=Headphones" },
      { name: "All audio",     arName: "كل الصوتيات", bgCss: "linear-gradient(135deg,#e8e8f0 0%,#d0d0e0 100%)", emoji: "🎵", href: "/products?category=Headphones" },
    ],
    promo: { title: "Trade-in", arTitle: "استبدال الجهاز", sub: "Get up to £700 for your old device", arSub: "احصل على حتى £700 مقابل جهازك القديم", cta: "Start trade-in", arCta: "ابدأ الاستبدال", href: "/trade-in" },
  },
];

interface CategoryBarProps {
  locale: string;
}

export function CategoryBar({ locale }: CategoryBarProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const isAr = locale === "ar";

  return (
    <div
      className="relative border-b border-[var(--color-iron)] bg-white"
      onMouseLeave={() => setActiveKey(null)}
    >
      {/* Tab bar */}
      <div className="container-px mx-auto">
        <ul
          className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {MEGA_NAV.map((item) => {
            const isActive = activeKey === item.key;
            const label = isAr ? item.arLabel : item.label;
            const IconComp = item.icon;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className="relative flex h-11 items-center gap-1.5 whitespace-nowrap px-4 text-sm font-medium text-ceramic transition-colors hover:text-ceramic focus:outline-none"
                  style={isActive ? { color: item.color } : undefined}
                  onMouseEnter={() => setActiveKey(item.key)}
                  onFocus={() => setActiveKey(item.key)}
                >
                  {IconComp && (
                    <IconComp
                      className="h-3.5 w-3.5"
                      strokeWidth={1.5}
                      style={isActive ? { color: item.color } : undefined}
                    />
                  )}
                  {label}
                  {/* Active underline */}
                  {isActive && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mega dropdown panel */}
      {activeKey && (() => {
        const item = MEGA_NAV.find((n) => n.key === activeKey);
        if (!item) return null;
        return (
          <div
            className="absolute inset-x-0 top-full z-50 border-b border-[var(--color-iron)] bg-white shadow-xl"
            onMouseEnter={() => setActiveKey(activeKey)}
          >
            <div className="container-px mx-auto py-6">
              <div className="grid grid-cols-[200px_1fr] gap-8">
                {/* Left: promo / "Good to know" block */}
                <div className="rounded-2xl border border-[var(--color-iron)] bg-[var(--color-obsidian)] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate">
                    {isAr ? "ما يجب معرفته" : "Good to know"}
                  </p>
                  {/* Icon + text row — mirrors Back Market's trade-in card */}
                  <div className="mt-3 flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--color-iron)] bg-white text-xl"
                      aria-hidden
                    >
                      🔄
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ceramic">
                        {isAr ? item.promo.arTitle : item.promo.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate">
                        {isAr ? item.promo.arSub : item.promo.sub}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={item.promo.href}
                    locale={locale as "en" | "ar"}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                    style={{ color: item.color }}
                  >
                    {isAr ? item.promo.arCta : item.promo.cta}
                    <ArrowRight
                      className={isAr ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"}
                      strokeWidth={2}
                    />
                  </Link>
                </div>

                {/* Right: subcategory grid */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate">
                      {isAr ? "الفئات" : "Categories"}
                    </p>
                    <Link
                      href={item.href}
                      locale={locale as "en" | "ar"}
                      className="text-sm font-semibold text-ceramic underline-offset-2 hover:underline"
                      style={{ color: "inherit" }}
                      onClick={() => setActiveKey(null)}
                    >
                      {isAr ? "عرض الكل" : "See all"}
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {item.subcategories.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        locale={locale as "en" | "ar"}
                        onClick={() => setActiveKey(null)}
                        className="group flex flex-col gap-2"
                      >
                        <div
                          className="aspect-[4/3] overflow-hidden rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]"
                          style={{ background: sub.bgCss }}
                        >
                          <span
                            className="select-none"
                            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1 }}
                            aria-hidden
                          >
                            {sub.emoji}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-ceramic transition-colors group-hover:text-[var(--color-mint)]">
                          {isAr ? sub.arName : sub.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
