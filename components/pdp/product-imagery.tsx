import Image from "next/image";
import { isRenderableImage } from "@/lib/images";

interface ProductImageryProps {
  images: string[];
  productName: string;
  /** Localised section heading, passed in from the page. */
  label: string;
}

/**
 * A large stacked view of the product photos below the PDP details — the same
 * images the gallery shows up top, here at full column width for scroll-to-inspect
 * rather than click-through.
 *
 * `next/image` + `isRenderableImage` for the same reason as gallery.tsx: a host
 * missing from `remotePatterns` makes `next/image` throw, and there is no error
 * boundary around this section.
 *
 * The catalog standardises photos to 1000×1000 on white, so this uses
 * `object-contain` on a light panel — an edge-to-edge `object-cover` bleed would
 * crop a centred product hard. Hidden entirely when there is nothing extra to show
 * beyond the single image the gallery already displays.
 */
export function ProductImagery({ images, productName, label }: ProductImageryProps) {
  const renderable = images.filter(isRenderableImage);
  if (renderable.length < 2) return null;

  return (
    <section
      className="mt-12 border-t border-[var(--color-iron)] pt-10"
      aria-label={label}
    >
      <div className="mx-auto max-w-4xl">
        <h2
          className="mb-6 text-ceramic"
          style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {label}
        </h2>
        <div className="space-y-4">
          {renderable.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-[#F5F5F7]"
            >
              <Image
                src={url}
                alt={`${productName} — ${i + 1}`}
                fill
                className="object-contain p-6"
                sizes="(max-width: 896px) 100vw, 896px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
