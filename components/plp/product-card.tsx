import { Link } from "@/i18n/navigation";
import { Plus, Star, Zap } from "lucide-react";
import type { MockProduct } from "@/lib/mock-products";

interface ProductCardProps {
  product: MockProduct;
  locale: string;
}

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const cheapest  = product.variants.reduce((a, b) => (a.price < b.price ? a : b));
  const price     = cheapest.price;
  const original  = cheapest.original_price;
  const discount  = original > price ? Math.round(((original - price) / original) * 100) : 0;
  const image     = product.images[0];
  const isFlash   = discount >= 25;
  const saving    = original > price ? original - price : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      locale={locale as "en" | "ar"}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-sm transition-all duration-200 hover:border-[var(--color-iron)]/60 hover:shadow-md"
    >
      {/* Image area */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: image.gradient }}
      >
        {isFlash && (
          <span className="absolute start-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#16a34a] px-2.5 py-1 text-[11px] font-black text-white shadow">
            <Zap className="h-3 w-3 fill-white" strokeWidth={0} aria-hidden />
            Flash deal
          </span>
        )}
        {!isFlash && discount > 0 && (
          <span className="absolute start-3 top-3 z-10 rounded-full bg-[var(--color-mint)] px-2.5 py-1 text-[11px] font-black text-white">
            -{discount}%
          </span>
        )}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-slate/40"
        >
          {product.brand}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" strokeWidth={0} aria-hidden />
          <span className="text-xs font-semibold text-ceramic">{product.rating}/5</span>
          <span className="text-[11px] text-slate">({product.review_count.toLocaleString()})</span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ceramic">
          {product.name}
        </h3>

        <p className="text-[11px] text-slate line-clamp-1">
          {cheapest.colour} · {cheapest.specs}
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-ceramic">{formatGBP(price)}</span>
          {original > price && (
            <span className="text-xs text-slate line-through">{formatGBP(original)} new</span>
          )}
        </div>

        {isFlash && saving > 0 && (
          <p className="text-xs font-semibold text-[#16a34a]">
            After {formatGBP(saving)} off at checkout
          </p>
        )}

        <div className="mt-auto pt-2">
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-iron)] py-2 text-xs font-semibold text-ceramic transition-colors hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Add to cart
          </div>
        </div>
      </div>
    </Link>
  );
}
