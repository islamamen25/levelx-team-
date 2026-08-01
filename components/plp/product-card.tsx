"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus, Zap } from "lucide-react";
import { formatEGP } from "@/lib/format";
import type { DbProduct, DbVariant } from "@/lib/supabase";

interface ProductCardProps {
  product: DbProduct;
  variants: DbVariant[];
  locale: string;
}

export function ProductCard({ product, variants, locale }: ProductCardProps) {
  const t = useTranslations("plp");
  const tCommon = useTranslations("common");
  const cheapest = variants.reduce<DbVariant | undefined>((best, v) => {
    const p = v.sale_price ?? v.price;
    if (!best) return v;
    return p < (best.sale_price ?? best.price) ? v : best;
  }, undefined);

  const price    = cheapest ? (cheapest.sale_price ?? cheapest.price) : 0;
  const original = cheapest?.price ?? 0;
  const hasSale  = cheapest?.sale_price != null && cheapest.sale_price < original;
  const discount = hasSale ? Math.round(((original - price) / original) * 100) : 0;
  const isFlash  = discount >= 25;
  const saving   = hasSale ? original - price : 0;
  const image    = (product.images as string[])?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      locale={locale as "en" | "ar"}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-sm transition-all duration-200 hover:border-[var(--color-iron)]/60 hover:shadow-md"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F7]">
        {isFlash && (
          <span className="absolute start-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#16a34a] px-2.5 py-1 text-[11px] font-black text-white shadow">
            <Zap className="h-3 w-3 fill-white" strokeWidth={0} aria-hidden />
            {t("flashDeal")}
          </span>
        )}
        {!isFlash && discount > 0 && (
          <span className="absolute start-3 top-3 z-10 rounded-full bg-[var(--color-mint)] px-2.5 py-1 text-[11px] font-black text-white">
            -{discount}%
          </span>
        )}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain p-3"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-slate/40"
          >
            {product.brand}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {/* dir="auto" إلزامي: اسم المنتج يأتي من الـ DB وقد يكون لاتينياً
            داخل صفحة RTL، فتنتقل الأرقام لآخر السلسلة —
            "3-in-1 Multi USB Charging Cable" ← "in-1 Multi USB Charging Cable-3". */}
        <h3 dir="auto" className="line-clamp-2 text-sm font-semibold leading-snug text-ceramic">
          {product.name}
        </h3>

        {product.brand && (
          <p dir="auto" className="text-[11px] text-slate">{product.brand}</p>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-ceramic">{formatEGP(price, locale)}</span>
          {hasSale && (
            <span className="text-xs text-slate line-through">{formatEGP(original, locale)}</span>
          )}
        </div>

        {isFlash && saving > 0 && (
          <p dir="auto" className="text-xs font-semibold text-[#16a34a]">
            {t("save", { amount: formatEGP(saving, locale) })}
          </p>
        )}

        <div className="mt-auto pt-2">
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-iron)] py-2 text-xs font-semibold text-ceramic transition-colors hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {tCommon("addToCart")}
          </div>
        </div>
      </div>
    </Link>
  );
}
