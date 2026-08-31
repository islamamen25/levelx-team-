import Image from "next/image";
import { isRenderableImage } from "@/lib/images";

interface ProductImageryProps {
  images: string[];
  productName: string;
  /** Localised section heading, passed in from the page. */
  label: string;
}

/**
 * A full-bleed stacked view of the product photos below the PDP details — the same
 * images the gallery shows up top, here running edge to edge for scroll-to-inspect
 * rather than click-through.
 *
 * `next/image` + `isRenderableImage` for the same reason as gallery.tsx: a host
 * missing from `remotePatterns` makes `next/image` throw, and there is no error
 * boundary around this section.
 *
 * The bands break out of the page container to the full viewport width — the
 * `<body>` carries `overflow-x-hidden`, so the `100vw` breakout can't add a
 * horizontal scrollbar. Catalog photos are 1000×1000 on white; `object-cover` in a
 * 4:3 band fills the width with the product, trimming ~1/8 off the top and bottom
 * (whitespace on these centred shots, not the product). Hidden when there is
 * nothing beyond the single image the gallery already shows.
 */
export function ProductImagery({ images, productName, label }: ProductImageryProps) {
  const renderable = images.filter(isRenderableImage);
  if (renderable.length < 2) return null;

  return (
    <section
      className="mt-12 border-t border-[var(--color-iron)] pt-10"
      aria-label={label}
    >
      <h2
        className="mb-6 text-ceramic"
        style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
      >
        {label}
      </h2>

      {/* Break out of `container-px` to the full viewport width. */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        {renderable.map((url, i) => (
          <div
            key={url}
            className="relative aspect-[4/3] w-full border-b border-[var(--color-iron)] bg-white last:border-b-0"
          >
            <Image
              src={url}
              alt={`${productName} — ${i + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
