"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Check, ShieldCheck, RotateCcw, Truck, Minus, Plus, ShoppingBag, CheckCircle2 } from "lucide-react";
import type { DbProduct, DbVariant, ProductCondition } from "@/lib/supabase";
import { useCartStore } from "@/lib/cart-store";

interface ProductPanelProps {
  product: DbProduct;
  variants: DbVariant[];
  locale: string;
}

const CONDITION_ORDER: ProductCondition[] = ["Premium", "Excellent", "Good", "Fair"];

function formatEGP(n: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProductPanel({ product, variants, locale }: ProductPanelProps) {
  const t  = useTranslations("product");
  const tc = useTranslations("common");
  const tCond = useTranslations("condition");

  // Derive available selectors from variants
  const conditions = CONDITION_ORDER.filter((c) =>
    variants.some((v) => v.condition === c),
  );

  const storageOptions = [...new Set(
    variants
      .map((v) => (v.attributes as Record<string, string>)?.storage)
      .filter(Boolean),
  )];

  const [activeCondition, setActiveCondition] = useState<ProductCondition>(conditions[0] ?? "Excellent");
  const [activeStorage, setActiveStorage] = useState<string>(storageOptions[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // Pick best-matching variant for current selectors
  const activeVariant: DbVariant | undefined =
    variants.find(
      (v) =>
        v.condition === activeCondition &&
        (activeStorage === "" || (v.attributes as Record<string, string>)?.storage === activeStorage),
    ) ?? variants.find((v) => v.condition === activeCondition) ?? variants[0];

  if (!activeVariant) return null;

  const price     = activeVariant.sale_price ?? activeVariant.price;
  const original  = activeVariant.price;
  const hasSale   = activeVariant.sale_price != null && activeVariant.sale_price < activeVariant.price;
  const savings   = hasSale ? original - price : 0;
  const discountPct = hasSale ? Math.round((savings / original) * 100) : 0;

  // Price for each condition (cheapest variant of that condition)
  function conditionPrice(cond: ProductCondition): number {
    const v = variants
      .filter((v) => v.condition === cond)
      .sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))[0];
    return v ? (v.sale_price ?? v.price) : 0;
  }

  const cartKey = `${activeVariant.id}`;

  function buildCartItem() {
    return {
      key: cartKey,
      productId: product.id,
      productName: product.name,
      brand: product.brand ?? "",
      slug: product.slug ?? "",
      variantId: activeVariant!.id,
      specs: activeStorage || activeVariant!.condition,
      colour: (activeVariant!.attributes as Record<string, string>)?.colour ?? "",
      condition: activeVariant!.condition,
      price,
      gradient: "linear-gradient(135deg,#e8e8ed,#d1d1d6)",
      qty,
    };
  }

  function handleAddToCart() {
    addItem(buildCartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem(buildCartItem());
    router.push({ pathname: "/checkout" }, { locale: locale as "en" | "ar" });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
        <Link href="/" locale={locale as "en" | "ar"} className="hover:text-[var(--color-mint)]">Home</Link>
        <span>/</span>
        <Link href="/products" locale={locale as "en" | "ar"} className="hover:text-[var(--color-mint)]">
          Products
        </Link>
        <span>/</span>
        <span className="text-ceramic line-clamp-1">{product.name}</span>
      </nav>

      {/* Brand + Title */}
      <div>
        {product.brand && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate">
            {product.brand}
          </p>
        )}
        <h1
          className="text-ceramic"
          style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {product.name}
        </h1>
      </div>

      {/* Condition Selector */}
      <div>
        <p className="mb-2.5 text-sm font-bold text-ceramic">{t("condition")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {conditions.map((cond) => {
            const isActive = cond === activeCondition;
            const cp = conditionPrice(cond);
            return (
              <button
                key={cond}
                onClick={() => setActiveCondition(cond)}
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
                  {tCond(cond.toLowerCase() as "fair" | "good" | "excellent" | "premium")}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-slate">
                  {formatEGP(cp)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate">{t("conditionHelp")}</p>
      </div>

      {/* Storage selector */}
      {storageOptions.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-bold text-ceramic">{t("specs")}</p>
          <div className="flex flex-wrap gap-2">
            {storageOptions.map((opt) => {
              const isActive = activeStorage === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setActiveStorage(opt)}
                  className={[
                    "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-ceramic"
                      : "border-[var(--color-iron)] text-ceramic hover:border-ceramic/40",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-extrabold text-ceramic">{formatEGP(price)}</span>
        {hasSale && (
          <>
            <span className="text-base text-slate line-through">{formatEGP(original)}</span>
            <span className="rounded-full bg-[var(--color-mint-soft)] px-2.5 py-0.5 text-sm font-bold text-[var(--color-mint)]">
              -{discountPct}%
            </span>
          </>
        )}
      </div>
      {hasSale && (
        <p className="text-sm font-semibold text-[var(--color-mint)]">
          {t("savings")} {formatEGP(savings)}
        </p>
      )}

      {/* Discount badge from variant */}
      {activeVariant.discount_badge && (
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
          {activeVariant.discount_badge}
        </span>
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
            onClick={() => setQty((q) => Math.max(1, Math.min(q + 1, activeVariant!.stock_quantity)))}
            disabled={qty >= activeVariant.stock_quantity}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-iron)] text-ceramic transition hover:border-ceramic disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
        {activeVariant.stock_quantity <= 5 && activeVariant.stock_quantity > 0 && (
          <p className="mt-1.5 text-xs font-semibold text-amber-600">
            Only {activeVariant.stock_quantity} left in stock
          </p>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={activeVariant.stock_quantity === 0}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50",
            added
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-[var(--color-mint)] hover:bg-[var(--color-mint-hover)]",
          ].join(" ")}
        >
          {added ? (
            <>
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              Added!
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" strokeWidth={2} />
              {tc("addToCart")}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={activeVariant.stock_quantity === 0}
          className="w-full rounded-full border-2 border-ceramic py-3.5 text-sm font-bold text-ceramic transition-colors hover:bg-[var(--color-graphite)] disabled:opacity-50"
        >
          {tc("buyNow")}
        </button>
      </div>

      {/* Trust strip */}
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
        {t("sku")}: {activeVariant.sku_code.toUpperCase()}
      </p>
    </div>
  );
}
