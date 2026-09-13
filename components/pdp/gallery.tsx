"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";
import { isRenderableImage } from "@/lib/images";

interface GalleryProps {
  images: string[];
  productName: string;
}

export function Gallery({ images, productName }: GalleryProps) {
  const [active, setActive] = useState(0);
  // Cursor position over the main image, in %, while a pointer is hovering it —
  // drives the zoom transform-origin. null = not hovering, image sits at scale(1).
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number } | null>(null);

  const railRef = useRef<HTMLDivElement>(null);
  const [railOverflows, setRailOverflows] = useState(false);

  // `next/image` THROWS on a host missing from remotePatterns rather than degrading,
  // which previously took the whole product page down with it. Drop the URLs it would
  // reject and fall through to the placeholder instead — a product page with no photo
  // still sells; a page that will not render does not.
  const renderable = images.filter(isRenderableImage);
  const hasImages = renderable.length > 0;
  const activeIndex = Math.min(active, renderable.length - 1);
  const multi = renderable.length > 1;

  // Scroll-up/down arrows on the rail only make sense on the desktop vertical
  // layout (see the `sm:` split below) and only when the thumbnails overflow it.
  // On mobile the strip is a plain horizontal scroller with no arrows.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const check = () => setRailOverflows(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderable.length]);

  function scrollRail(direction: -1 | 1) {
    railRef.current?.scrollBy({ top: direction * 200, behavior: "smooth" });
  }

  return (
    // Mobile: stacked — full-width main image on top, thumbnails in a row below
    // it, so the image keeps its space instead of sharing width with a side rail.
    // sm+: side-by-side — vertical thumbnail rail beside the main image (the two
    // `order-*` pairs below swap which one comes first without duplicating markup).
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Main image — hover to zoom in (pointer devices; a touch tap just does nothing) */}
      <div className="order-1 min-w-0 flex-1 sm:order-2">
        <div
          className={[
            "relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-[#F5F5F7]",
            hasImages ? "cursor-zoom-in" : "",
          ].join(" ")}
          onMouseMove={
            hasImages
              ? (e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setZoomOrigin({
                    x: ((e.clientX - r.left) / r.width) * 100,
                    y: ((e.clientY - r.top) / r.height) * 100,
                  });
                }
              : undefined
          }
          onMouseLeave={() => setZoomOrigin(null)}
        >
          {hasImages ? (
            <Image
              src={renderable[activeIndex]}
              alt={productName}
              fill
              className="object-contain p-4 transition-transform duration-200 ease-out will-change-transform"
              style={
                zoomOrigin
                  ? {
                      transform: "scale(2)",
                      transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      transitionDuration: "0ms",
                    }
                  : undefined
              }
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-wider text-slate/30">
              {productName}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails — horizontal row below the image on mobile, vertical rail
          beside it from `sm` up. Each thumbnail is a fixed 64px square either
          way, so only the wrapper's flex-direction/overflow axis needs to flip. */}
      {multi && (
        <div className="order-2 flex items-center gap-2 sm:order-1 sm:w-16 sm:flex-shrink-0 sm:flex-col sm:items-stretch">
          {railOverflows && (
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              aria-label="Scroll thumbnails up"
              className="hidden h-7 w-full flex-shrink-0 items-center justify-center rounded-lg border border-[var(--color-iron)] text-slate transition hover:border-ceramic hover:text-ceramic sm:flex"
            >
              <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}

          <div
            ref={railRef}
            className="flex min-w-0 flex-1 gap-2.5 overflow-x-auto sm:min-h-0 sm:w-full sm:flex-none sm:flex-col sm:overflow-x-visible sm:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {renderable.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                // Preview on hover (desktop) and on keyboard focus; touch still
                // works because a tap fires onClick. Same handler either way.
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-label={`${productName} image ${i + 1}`}
                aria-current={i === activeIndex}
                className={[
                  "relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-[#F5F5F7] transition-all duration-150",
                  i === activeIndex
                    ? "border-[var(--color-mint)] ring-1 ring-[var(--color-mint)]/30"
                    : "border-[var(--color-iron)] hover:border-[var(--color-mint)]/50",
                ].join(" ")}
              >
                <Image
                  src={url}
                  alt={`${productName} ${i + 1}`}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                />
              </button>
            ))}
          </div>

          {railOverflows && (
            <button
              type="button"
              onClick={() => scrollRail(1)}
              aria-label="Scroll thumbnails down"
              className="hidden h-7 w-full flex-shrink-0 items-center justify-center rounded-lg border border-[var(--color-iron)] text-slate transition hover:border-ceramic hover:text-ceramic sm:flex"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
