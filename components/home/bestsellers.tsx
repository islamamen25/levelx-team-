"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCTS } from "@/lib/mock-products";
import { ProductCard } from "@/components/plp/product-card";

interface BestsellersProps {
  locale: string;
}

export function Bestsellers({ locale }: BestsellersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isAr = locale === "ar";

  // Sort by review count (most popular = bestsellers)
  const bestsellers = [...PRODUCTS]
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 8);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 260;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(updateArrows, 350);
  }

  return (
    <section className="bg-[#F5F5F7] py-14 md:py-18" aria-labelledby="bestsellers-title">
      <div className="container-px mx-auto">
        {/* Header with nav arrows */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="bestsellers-title"
            className="text-ceramic"
            style={{ fontSize: "clamp(1.4rem, 2.8vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            {isAr ? "الأكثر مبيعاً" : "Shop bestsellers"}
          </h2>

          {/* Navigation arrows — like Back Market */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-iron)] bg-white text-ceramic transition-colors hover:border-ceramic disabled:opacity-30 disabled:hover:border-[var(--color-iron)]"
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

        {/* Horizontal product carousel */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex gap-4" style={{ width: "max-content" }}>
            {bestsellers.map((product) => (
              <div key={product.id} className="w-[240px] flex-shrink-0 lg:w-[260px]">
                <ProductCard product={product} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
