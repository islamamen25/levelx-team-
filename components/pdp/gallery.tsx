"use client";

import { useState } from "react";
import type { MockImage } from "@/lib/mock-products";

interface GalleryProps {
  images: MockImage[];
  productName: string;
}

export function Gallery({ images, productName }: GalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image — full width on left column */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white"
        style={{ background: images[active]?.gradient ?? "#F5F5F7" }}
        aria-label={images[active]?.alt ?? productName}
      >
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-wider text-slate/30"
        >
          {productName}
        </div>
      </div>

      {/* Thumbnails — horizontal slide bar directly underneath */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={img.alt}
              className={[
                "h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150",
                i === active
                  ? "border-[var(--color-mint)] shadow-[0_0_0_1px_var(--color-mint)] ring-1 ring-[var(--color-mint)]/30"
                  : "border-[var(--color-iron)] hover:border-[var(--color-mint)]/50",
              ].join(" ")}
              style={{ background: img.gradient }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
