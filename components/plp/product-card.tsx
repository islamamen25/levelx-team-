"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, Plus, Zap } from "lucide-react";
import { formatEGP } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";
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

  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  // Cheapest variant is what the card prices, so it is what the card adds. `key` is the
  // variant id — the same key the PDP uses — so adding here and there merges into one
  // cart line instead of duplicating it.
  const canAdd = !!cheapest && cheapest.stock_quantity !== 0;

  function handleAdd() {
    if (!cheapest) return;
    const attrs = (cheapest.attributes as Record<string, string>) ?? {};
    addItem({
      key:         cheapest.id,
      productId:   product.id,
      productName: product.name,
      brand:       product.brand ?? "",
      slug:        product.slug ?? "",
      variantId:   cheapest.id,
      specs:       attrs.storage ?? cheapest.condition,
      colour:      attrs.colour ?? "",
      condition:   cheapest.condition,
      price,
      gradient:    "linear-gradient(135deg,#e8e8ed,#d1d1d6)",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    // Card shell is a plain div: the add button must be a sibling of the link, not a
    // descendant. It used to be a <div> *inside* this <Link> styled to look like a
    // button — so it had no handler, could not be focused or activated by keyboard, and
    // clicking it just navigated to the product page.
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-sm transition-all duration-200 hover:border-[var(--color-iron)]/60 hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        locale={locale as "en" | "ar"}
        className="flex flex-1 flex-col"
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
      <div className="flex flex-1 flex-col gap-1 p-3 pb-0">
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

      </div>
      </Link>

      {/* Add to cart — sibling of the link so it is a real, focusable control. */}
      <div className="px-3 pb-3 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          aria-label={`${tCommon("addToCart")} — ${product.name}`}
          className={[
            "flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-50",
            added
              ? "border-emerald-500 text-emerald-600"
              : "border-[var(--color-iron)] text-ceramic hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]",
          ].join(" ")}
        >
          {added ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              {tCommon("added")}
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              {canAdd ? tCommon("addToCart") : tCommon("outOfStock")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
