"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MockProduct } from "@/lib/mock-products";
import { ProductCard } from "@/components/plp/product-card";

interface FeaturedCarouselProps {
  deals: MockProduct[];
  locale: string;
  title: string;
}

export function FeaturedCarousel({ deals, locale, title }: FeaturedCarouselProps) {
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
    <div className="relative">
      {/* Header: title left + nav arrows right */}
      <div className="mb-6 flex items-center justify-between">
        <h2
          id="featured-title"
          className="text-ceramic"
          style={{ fontSize: "clamp(1.4rem, 2.8vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
        >
          {title}
        </h2>

        {/* Nav arrows — hidden on mobile */}
        <div className="hidden items-center gap-2 md:flex">
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

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {deals.map((product) => (
            <div key={product.id} className="w-[220px] flex-shrink-0 lg:w-[240px]">
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
