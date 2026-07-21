"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryProps {
  images: string[];
  productName: string;
}

export function Gallery({ images, productName }: GalleryProps) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0 && images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-[#F5F5F7]">
        {hasImages ? (
          <Image
            src={images[active]}
            alt={productName}
            fill
            className="object-contain p-4"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-wider text-slate/30">
            {productName}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`${productName} image ${i + 1}`}
              className={[
                "relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border-2 bg-[#F5F5F7] transition-all duration-150",
                i === active
                  ? "border-[var(--color-mint)] shadow-[0_0_0_1px_var(--color-mint)] ring-1 ring-[var(--color-mint)]/30"
                  : "border-[var(--color-iron)] hover:border-[var(--color-mint)]/50",
              ].join(" ")}
            >
              {url && (
                <Image
                  src={url}
                  alt={`${productName} ${i + 1}`}
                  fill
                  className="object-contain p-1"
                  sizes="72px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
