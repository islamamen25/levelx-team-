"use client";

import { useState } from "react";
import Image from "next/image";
import { isRenderableImage } from "@/lib/images";

interface GalleryProps {
  images: string[];
  productName: string;
}

export function Gallery({ images, productName }: GalleryProps) {
  const [active, setActive] = useState(0);

  // `next/image` THROWS on a host missing from remotePatterns rather than degrading,
  // which previously took the whole product page down with it. Drop the URLs it would
  // reject and fall through to the placeholder instead — a product page with no photo
  // still sells; a page that will not render does not.
  //
  // Filtering (not just try/catch) also keeps `active` pointing at a usable image, and
  // hides the thumbnail strip when only one image survives.
  const renderable = images.filter(isRenderableImage);
  const hasImages = renderable.length > 0;
  const activeIndex = Math.min(active, renderable.length - 1);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-[#F5F5F7]">
        {hasImages ? (
          <Image
            src={renderable[activeIndex]}
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
      {renderable.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {renderable.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              // Preview on hover (desktop) and on keyboard focus; touch still
              // works because a tap fires onClick. Same handler either way.
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              aria-label={`${productName} image ${i + 1}`}
              className={[
                "relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border-2 bg-[#F5F5F7] transition-all duration-150",
                i === activeIndex
                  ? "border-[var(--color-mint)] shadow-[0_0_0_1px_var(--color-mint)] ring-1 ring-[var(--color-mint)]/30"
                  : "border-[var(--color-iron)] hover:border-[var(--color-mint)]/50",
              ].join(" ")}
            >
              <Image
                src={url}
                alt={`${productName} ${i + 1}`}
                fill
                className="object-contain p-1"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
