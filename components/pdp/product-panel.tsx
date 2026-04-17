"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, ShieldCheck, RotateCcw, Truck, Star, Minus, Plus } from "lucide-react";
import type { MockProduct, ConditionTier } from "@/lib/mock-products";

interface ProductPanelProps {
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

export function ProductPanel({ product, locale }: ProductPanelProps) {
  const t  = useTranslations("product");
  const tc = useTranslations("common");
  const tCond = useTranslations("condition");

  const [activeVariantId, setActiveVariantId] = useState(product.variants[0].id);
  const [activeCondition, setActiveCondition] = useState<ConditionTier>("Excellent");
  const [qty, setQty] = useState(1);

  const activeVariant = product.variants.find((v) => v.id === activeVariantId) ?? product.variants[0];
  const conditionOption = product.condition_options.find((c) => c.tier === activeCondition);
  const currentPrice = activeVariant.price + (conditionOption?.price_delta ?? 0);
  const originalPrice = activeVariant.original_price;
  const savings = originalPrice - currentPrice;
  const discountPct = Math.round((savings / originalPrice) * 100);

  // Group variants by specs for storage selector
  const specGroups = [...new Set(product.variants.map((v) => v.specs))];
  const colourGroups = [...new Set(
    product.variants
      .filter((v) => v.specs === activeVariant.specs)
      .map((v) => v.colour),
  )];

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
        <Link href="/" locale={locale as "en" | "ar"} className="hover:text-[var(--color-mint)]">Home</Link>
        <span>/</span>
        <Link
          href={{ pathname: "/products", query: { category: product.category } }}
          locale={locale as "en" | "ar"}
          className="hover:text-[var(--color-mint)]"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-ceramic line-clamp-1">{product.name}</span>
      </nav>

      {/* Brand + Title */}
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate">
          {product.brand}
        </p>
        <h1
          className="text-ceramic"
          style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {product.name}
        </h1>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-[var(--color-iron)]"}`}
              strokeWidth={0}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-ceramic">{product.rating}</span>
        <span className="text-sm text-slate">({product.review_count} {t("reviews")})</span>
      </div>

      {/* ── Condition Selector ── (most prominent control) */}
      <div>
        <p className="mb-2.5 text-sm font-bold text-ceramic">{t("condition")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {product.condition_options.map((co) => {
            const isActive = co.tier === activeCondition;
            const delta    = co.price_delta;
            return (
              <button
                key={co.tier}
                onClick={() => setActiveCondition(co.tier)}
                className={[
                  "relative flex flex-col items-center rounded-xl border-2 px-3 py-3 text-center transition-all duration-150",
                  isActive
                    ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)]"
                    : "border-[var(--color-iron)] bg-white hover:border-[var(--color-mint)]/50",
                ].join(" ")}
              >
                {isActive && (
                  <Check
                    className="absolute end-2 top-2 h-3.5 w-3.5 text-[var(--color-mint)]"
                    strokeWidth={2.5}
                  />
                )}
                <span className="text-xs font-bold text-ceramic">
                  {tCond(co.tier.toLowerCase() as "fair" | "good" | "excellent" | "premium")}
                </span>
                <span className={`mt-0.5 text-[10px] font-semibold ${delta < 0 ? "text-[var(--color-mint)]" : delta > 0 ? "text-slate" : "text-ceramic"}`}>
                  {delta === 0 ? "" : delta > 0 ? `+${formatGBP(delta)}` : formatGBP(delta)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate">{t("conditionHelp")}</p>
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-extrabold text-ceramic">{formatGBP(currentPrice)}</span>
        {savings > 0 && (
          <>
            <span className="text-base text-slate line-through">{formatGBP(originalPrice)}</span>
            <span className="rounded-full bg-[var(--color-mint-soft)] px-2.5 py-0.5 text-sm font-bold text-[var(--color-mint)]">
              -{discountPct}%
            </span>
          </>
        )}
      </div>
      {savings > 0 && (
        <p className="text-sm font-semibold text-[var(--color-mint)]">
          {t("savings")} {formatGBP(savings)}
        </p>
      )}

      {/* Storage / Specs */}
      {specGroups.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-bold text-ceramic">{t("specs")}</p>
          <div className="flex flex-wrap gap-2">
            {specGroups.map((spec) => {
              const isActive = activeVariant.specs === spec;
              return (
                <button
                  key={spec}
                  onClick={() => {
                    const v = product.variants.find(
                      (v) => v.specs === spec && v.colour === activeVariant.colour,
                    ) ?? product.variants.find((v) => v.specs === spec);
                    if (v) setActiveVariantId(v.id);
                  }}
                  className={[
                    "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-ceramic"
                      : "border-[var(--color-iron)] text-ceramic hover:border-ceramic/40",
                  ].join(" ")}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colour */}
      {colourGroups.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-bold text-ceramic">{t("color")}</p>
          <div className="flex flex-wrap gap-2">
            {colourGroups.map((colour) => {
              const v = product.variants.find(
                (v) => v.specs === activeVariant.specs && v.colour === colour,
              );
              const isActive = activeVariant.colour === colour;
              return (
                <button
                  key={colour}
                  onClick={() => { if (v) setActiveVariantId(v.id); }}
                  className={[
                    "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-ceramic"
                      : "border-[var(--color-iron)] text-ceramic hover:border-ceramic/40",
                  ].join(" ")}
                >
                  {colour}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="mb-2 text-sm font-bold text-ceramic">{t("quantity")}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-iron)] text-ceramic transition hover:border-ceramic disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-ceramic">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-iron)] text-ceramic transition hover:border-ceramic"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          className="w-full rounded-full bg-[var(--color-mint)] py-4 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)] active:scale-[0.98]"
        >
          {tc("addToCart")}
        </button>
        <button
          type="button"
          className="w-full rounded-full border-2 border-ceramic py-3.5 text-sm font-bold text-ceramic transition-colors hover:bg-[var(--color-graphite)]"
        >
          {tc("buyNow")}
        </button>
      </div>

      {/* ── Trust strip ── */}
      <div className="rounded-2xl border border-[var(--color-iron)] bg-white">
        {[
          { Icon: ShieldCheck, key: "warranty"  },
          { Icon: RotateCcw,   key: "returns"   },
          { Icon: Truck,       key: "delivery"  },
        ].map(({ Icon, key }, i, arr) => (
          <div
            key={key}
            className={[
              "flex items-center gap-3 px-4 py-3.5",
              i < arr.length - 1 ? "border-b border-[var(--color-iron)]" : "",
            ].join(" ")}
          >
            <Icon className="h-5 w-5 flex-shrink-0 text-[var(--color-mint)]" strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-ceramic">
                {t(`trust.${key}` as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-slate">
                {t(`trust.${key}Sub` as Parameters<typeof t>[0])}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* SKU */}
      <p className="text-[11px] text-slate">
        {t("sku")}: {activeVariant.id.toUpperCase()}
      </p>
    </div>
  );
}
