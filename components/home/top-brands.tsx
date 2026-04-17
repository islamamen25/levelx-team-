"use client";

import React, { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCTS } from "@/lib/mock-products";
import { ProductCard } from "@/components/plp/product-card";

interface TopBrandsProps {
  locale: string;
}

/** Brand chips styled to closely resemble actual brand logos */
const BRAND_CHIPS: { name: string; label: string; style: React.CSSProperties }[] = [
  { name: "Apple",     label: "",       style: { fontFamily: "-apple-system, 'SF Pro Display', sans-serif", fontSize: "28px", fontWeight: 400 } },
  { name: "Samsung",   label: "SAMSUNG",  style: { fontFamily: "sans-serif", fontSize: "11px", letterSpacing: "0.08em", fontWeight: 900 } },
  { name: "Sony",      label: "SONY",     style: { fontFamily: "sans-serif", fontSize: "14px", letterSpacing: "0.15em", fontWeight: 900 } },
  { name: "Google",    label: "Google",   style: { fontFamily: "'Segoe UI', sans-serif", fontSize: "15px", fontWeight: 500, color: "#4285f4" } },
  { name: "Dell",      label: "DELL",     style: { fontFamily: "sans-serif", fontSize: "16px", letterSpacing: "0.05em", fontWeight: 900, color: "#007db8" } },
  { name: "Dyson",     label: "dyson",    style: { fontFamily: "sans-serif", fontSize: "14px", fontWeight: 900, letterSpacing: "0.02em" } },
  { name: "Nintendo",  label: "Nintendo", style: { fontFamily: "sans-serif", fontSize: "11px", fontWeight: 900, color: "#e60012", letterSpacing: "0.02em" } },
  { name: "Bose",      label: "BOSE",     style: { fontFamily: "sans-serif", fontSize: "14px", letterSpacing: "0.12em", fontWeight: 900 } },
];

export function TopBrands({ locale }: TopBrandsProps) {
  const isAr = locale === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // All products for carousel, sorted by brand diversity
  const brandProducts = PRODUCTS.slice(0, 8);

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
        {/* Header — simple like Back Market */}
        <h2
          id="brands-title"
          className="mb-6 text-ceramic"
          style={{ fontSize: "clamp(1.4rem, 2.8vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
        >
          {isAr ? "أفضل الماركات، مجددة" : "Top brands, refurbished"}
        </h2>

        {/* Main layout: lifestyle image left + brands & carousel right */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

          {/* Left: Lifestyle image — NOT a product, just aesthetic */}
          <div
            className="overflow-hidden rounded-2xl min-h-[200px] md:col-span-4 md:min-h-[460px]"
            style={{
              background: "linear-gradient(160deg, #3a3a4a 0%, #1a1a2e 50%, #0f0f1a 100%)",
            }}
          >
            <div className="flex h-full flex-col justify-between p-6">
              {/* Top decorative elements */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/40">refurbished</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/40">certified</span>
              </div>
              {/* Bottom scene */}
              <div>
                <div className="mb-4 flex items-end gap-4">
                  <span style={{ fontSize: "3.5rem", lineHeight: 1 }} aria-hidden>🎧</span>
                  <span style={{ fontSize: "2.5rem", lineHeight: 1, opacity: 0.7 }} aria-hidden>📱</span>
                  <span style={{ fontSize: "2rem", lineHeight: 1, opacity: 0.5 }} aria-hidden>⌚</span>
                  <span style={{ fontSize: "1.5rem", lineHeight: 1, opacity: 0.3 }} aria-hidden>💻</span>
                </div>
                <p className="text-sm font-medium text-white/40">
                  {isAr ? "تكنولوجيا مجددة بعناية" : "Tech that feels like new"}
                </p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 md:col-span-8">

            {/* Brand logo chips — large rounded squares like Back Market */}
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
                      <span
                        className="select-none text-center leading-none text-ceramic"
                        style={brand.style}
                      >
                        {brand.label}
                      </span>
                    </div>
                    <span className="text-center text-[11px] font-medium text-slate">{brand.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Product carousel with nav arrows */}
            <div className="relative">
              <div
                ref={scrollRef}
                onScroll={updateArrows}
                className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-3" style={{ width: "max-content" }}>
                  {brandProducts.map((product) => (
                    <div key={product.id} className="w-[220px] flex-shrink-0 lg:w-[240px]">
                      <ProductCard product={product} locale={locale} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Nav arrows — bottom right like Back Market */}
              <div className="mt-3 hidden items-center justify-end gap-2 md:flex">
                <button
                  type="button"
                  aria-label="Scroll left"
                  onClick={() => scroll("left")}
                  disabled={!canScrollLeft}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-iron)] bg-white text-ceramic transition-colors hover:border-ceramic disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() => scroll("right")}
                  disabled={!canScrollRight}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ceramic bg-ceramic text-white transition-colors hover:bg-ceramic/90 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
