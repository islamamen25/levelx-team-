"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DbProduct, DbVariant } from "@/lib/supabase";
import { ProductCard } from "@/components/plp/product-card";

interface TopBrandsCarouselProps {
  products: { product: DbProduct; variants: DbVariant[] }[];
  locale: string;
}

/* شعار Apple يعتمد اعتيادياً على الحرف الخاص  في الخصائص الحصرية لأنظمة Apple
   فقط (SF Pro/Helvetica Neue) — يظهر مربّعاً فارغاً على أي نظام آخر. SVG صريح
   بديل يعمل على كل الأنظمة. */
function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-ceramic" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.673-.546 9.103 1.507 12.09 1.003 1.48 2.203 3.135 3.79 3.135 1.578-.006 2.045-1.083 3.878-1.086 1.833-.003 2.28 1.086 3.878 1.086 1.596 0 2.756-1.523 3.786-3.02.762-1.11 1.351-2.301 1.751-3.541-2.05-.83-3.328-2.716-3.34-4.94-.014-1.977 1.157-3.63 2.973-4.442-1.014-1.294-2.531-2.076-4.13-2.096-1.532-.023-2.982 1.05-3.937 1.05zM15.53.5c-.017 1.03-.415 2.03-1.087 2.79-.752.881-1.98 1.579-3.15 1.489-.03-1.083.43-2.106 1.135-2.842C13.202 1.124 14.448.494 15.53.5z" />
    </svg>
  );
}

const BRAND_CHIPS: { name: string; label: string; icon?: React.ReactNode; style: React.CSSProperties }[] = [
  { name: "Apple",     label: "",         icon: <AppleLogo />, style: {} },
  { name: "Samsung",   label: "SAMSUNG",  style: { fontFamily: "sans-serif", fontSize: "11px", letterSpacing: "0.08em", fontWeight: 900 } },
  { name: "Sony",      label: "SONY",     style: { fontFamily: "sans-serif", fontSize: "14px", letterSpacing: "0.15em", fontWeight: 900 } },
  { name: "Google",    label: "Google",   style: { fontFamily: "'Segoe UI', sans-serif", fontSize: "15px", fontWeight: 500, color: "#4285f4" } },
  { name: "Dell",      label: "DELL",     style: { fontFamily: "sans-serif", fontSize: "16px", letterSpacing: "0.05em", fontWeight: 900, color: "#007db8" } },
  { name: "Dyson",     label: "dyson",    style: { fontFamily: "sans-serif", fontSize: "14px", fontWeight: 900, letterSpacing: "0.02em" } },
  { name: "Nintendo",  label: "Nintendo", style: { fontFamily: "sans-serif", fontSize: "11px", fontWeight: 900, color: "#e60012", letterSpacing: "0.02em" } },
  { name: "Bose",      label: "BOSE",     style: { fontFamily: "sans-serif", fontSize: "14px", letterSpacing: "0.12em", fontWeight: 900 } },
];

export function TopBrandsCarousel({ products, locale }: TopBrandsCarouselProps) {
  const isAr = locale === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -260 : 260, behavior: "smooth" });
    setTimeout(updateArrows, 350);
  }

  return (
    <section className="bg-white py-14 md:py-18" aria-labelledby="brands-title">
      <div className="container-px mx-auto">
        <h2
          id="brands-title"
          className="mb-6 text-ceramic"
          style={{ fontSize: "clamp(1.4rem, 2.8vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
        >
          {isAr ? "أفضل الماركات" : "Top brands"}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Left: lifestyle image */}
          <div className="relative overflow-hidden rounded-2xl min-h-[200px] md:col-span-4 md:min-h-[460px]">
            <Image
              src="https://images.unsplash.com/photo-1776919017122-8140e279c889?w=800&q=80&fit=crop"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
            <div className="relative flex h-full flex-col justify-between p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">
                  {isAr ? "ماركات عالمية" : "global brands"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">
                  {isAr ? "ضمان سنة" : "1-year warranty"}
                </span>
              </div>
              <p className="text-sm font-medium text-white/80">
                {isAr ? "تكنولوجيا مختارة بعناية" : "Carefully curated tech"}
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 md:col-span-8">
            {/* Brand logo chips */}
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {BRAND_CHIPS.map((brand) => (
                  <Link
                    key={brand.name}
                    href={{ pathname: "/products", query: { brand: brand.name } }}
                    locale={locale as "en" | "ar"}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-[var(--color-iron)] bg-white shadow-sm transition-all duration-200 group-hover:border-ceramic group-hover:shadow-md">
                      {brand.icon ?? (
                        <span className="select-none text-center leading-none text-ceramic" style={brand.style}>
                          {brand.label}
                        </span>
                      )}
                    </div>
                    <span className="text-center text-[11px] font-medium text-slate">{brand.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Product carousel */}
            <div className="relative">
              <div
                ref={scrollRef}
                onScroll={updateArrows}
                className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-3" style={{ width: "max-content" }}>
                  {products.map(({ product, variants }) => (
                    <div key={product.id} className="w-[220px] flex-shrink-0 lg:w-[240px]">
                      <ProductCard product={product} variants={variants} locale={locale} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 hidden items-center justify-end gap-2 md:flex">
                <button
                  type="button"
                  aria-label="Scroll left"
                  onClick={() => scroll("left")}
                  disabled={!canScrollLeft}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-iron)] bg-white text-ceramic transition-colors hover:border-ceramic disabled:opacity-30"
                >
                  {/* الأسهم مرآة في RTL: flex يعكس ترتيب الأزرار تلقائياً تبعاً لـdir،
                      فالشيفرون لازم يُقلَب بصرياً ليطابق اتجاه الحركة الجديد. */}
                  <ChevronLeft className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() => scroll("right")}
                  disabled={!canScrollRight}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ceramic bg-ceramic text-white transition-colors hover:bg-ceramic/90 disabled:opacity-30"
                >
                  <ChevronRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
