"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DbProduct, DbVariant } from "@/lib/supabase";
import { ProductCard } from "@/components/plp/product-card";
import { isRenderableImage } from "@/lib/images";
import type { BrandOverride } from "@/lib/store-config";

export type { BrandOverride };

interface TopBrandsCarouselProps {
  products: { product: DbProduct; variants: DbVariant[] }[];
  locale: string;
  /** Left lifestyle photo — Builder-editable. Falls back to DEFAULT_BRANDS_IMAGE when unset
      or when the host isn't in lib/images.ts's allowlist (cowork writes straight to the DB
      and skips the Builder's own validation, so this guard is load-bearing, not decorative). */
  imageUrl?: string;
  /** Builder override for the whole chip row. Empty/absent ⇒ the built-in BRAND_CHIPS below. */
  brands?: BrandOverride[];
}

const DEFAULT_BRANDS_IMAGE = "https://images.unsplash.com/photo-1776919017122-8140e279c889?w=800&q=80&fit=crop";

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

/**
 * Every non-Apple brand renders through this one component instead of a hand-tuned
 * <span style>. Sharing one viewBox/height/baseline is what actually fixes the
 * inconsistency — each brand keeps its own weight/case/colour (that's what makes it
 * recognisable), but the *rendering technique* is now identical across the row, so the
 * optical size and vertical alignment line up tile to tile. Custom brands added from the
 * Builder (no known typographic identity) fall through to this with the defaults.
 */
function Wordmark({
  text,
  weight = 800,
  size = 17,
  spacing = 0,
  color = "currentColor",
  italic = false,
  tspanColors,
}: {
  text: string;
  weight?: number;
  size?: number;
  spacing?: number;
  color?: string;
  italic?: boolean;
  /** Per-character fill override, e.g. Google's four-colour wordmark. */
  tspanColors?: string[];
}) {
  return (
    <svg viewBox="0 0 140 40" width="64" height="20" aria-hidden>
      <text
        x="70"
        y="26"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={weight}
        fontSize={size}
        letterSpacing={spacing}
        fontStyle={italic ? "italic" : "normal"}
        fill={color}
      >
        {tspanColors
          ? [...text].map((ch, i) => <tspan key={i} fill={tspanColors[i] ?? color}>{ch}</tspan>)
          : text}
      </text>
    </svg>
  );
}

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"];

const BRAND_CHIPS: { name: string; render: () => React.ReactNode }[] = [
  { name: "Apple",    render: () => <AppleLogo /> },
  { name: "Samsung",  render: () => <Wordmark text="SAMSUNG"  weight={700} size={15} spacing={1.5} /> },
  { name: "Sony",     render: () => <Wordmark text="SONY"     weight={700} size={19} spacing={3} /> },
  { name: "Google",   render: () => <Wordmark text="Google"   weight={500} size={19} tspanColors={GOOGLE_COLORS} /> },
  { name: "Dell",     render: () => <Wordmark text="DELL"     weight={800} size={19} spacing={1} color="#007DB8" /> },
  { name: "Dyson",    render: () => <Wordmark text="dyson"    weight={800} size={18} spacing={0.5} /> },
  { name: "Nintendo", render: () => <Wordmark text="Nintendo" weight={800} size={15} italic color="#E60012" /> },
  { name: "Bose",     render: () => <Wordmark text="BOSE"     weight={800} size={18} spacing={3} /> },
];

export function TopBrandsCarousel({ products, locale, imageUrl, brands }: TopBrandsCarouselProps) {
  const isAr = locale === "ar";
  const heroImage = isRenderableImage(imageUrl) ? imageUrl! : DEFAULT_BRANDS_IMAGE;
  // Non-empty Builder override wins; otherwise the built-in row from 2a. The built-ins
  // always show their name (they're the well-known defaults); a Builder-added brand's
  // caption is optional — show_label defaults to true so rows saved before this field
  // existed keep looking exactly as they do today.
  const chips: { name: string; showLabel: boolean; render: () => React.ReactNode }[] =
    brands && brands.length > 0
      ? brands.map((b) => ({
          name: b.name,
          showLabel: b.show_label !== false,
          render: () =>
            isRenderableImage(b.logo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logo_url} alt={b.name} className="h-10 w-10 object-contain" />
            ) : (
              <Wordmark text={b.name} />
            ),
        }))
      : BRAND_CHIPS.map((b) => ({ ...b, showLabel: true }));
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
              src={heroImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 md:col-span-8">
            {/* Brand logo chips */}
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {chips.map((brand) => (
                  <Link
                    key={brand.name}
                    href={{ pathname: "/products", query: { brand: brand.name } }}
                    locale={locale as "en" | "ar"}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-[var(--color-iron)] bg-white shadow-sm transition-all duration-200 group-hover:border-ceramic group-hover:shadow-md text-ceramic">
                      {brand.render()}
                    </div>
                    {brand.showLabel && (
                      <span className="text-center text-[11px] font-medium text-slate">{brand.name}</span>
                    )}
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
