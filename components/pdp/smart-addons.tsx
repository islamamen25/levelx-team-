import { getTranslations } from "next-intl/server";
import { getProductsByCategoryId } from "@/lib/queries/products";
import { Link } from "@/i18n/navigation";
import { formatEGP } from "@/lib/format";
import type { DbProduct, DbVariant } from "@/lib/supabase";

interface SmartAddonsProps {
  productId: string;
  categoryId: string | null;
  locale: string;
}


function AddonCard({
  product,
  variants,
  locale,
}: {
  product: DbProduct;
  variants: DbVariant[];
  locale: string;
}) {
  const cheapest = variants.reduce<DbVariant | undefined>((best, v) => {
    const p = v.sale_price ?? v.price;
    if (!best) return v;
    return p < (best.sale_price ?? best.price) ? v : best;
  }, undefined);

  const price    = cheapest ? (cheapest.sale_price ?? cheapest.price) : 0;
  const original = cheapest?.price ?? 0;
  const discount = cheapest?.sale_price && cheapest.sale_price < original
    ? Math.round(((original - cheapest.sale_price) / original) * 100)
    : 0;
  const image = (product.images as string[])?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      locale={locale as "en" | "ar"}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-iron)] bg-white shadow-sm transition-all duration-200 hover:border-[var(--color-iron)]/60 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F7]">
        {discount > 0 && (
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
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-slate/40">
            {product.brand}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ceramic">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-[11px] text-slate">{product.brand}</p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-extrabold text-ceramic">{formatEGP(price, locale)}</span>
          {discount > 0 && (
            <span className="text-xs text-slate line-through">{formatEGP(original, locale)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export async function SmartAddons({ productId, categoryId, locale }: SmartAddonsProps) {
  if (!categoryId) return null;

  const t = await getTranslations({ locale, namespace: "product" });
  const addons = await getProductsByCategoryId(categoryId, productId, 6);

  if (addons.length === 0) return null;

  return (
    <section className="mt-12" aria-label={t("smartAddons")}>
      <div className="mb-5">
        <h2
          className="text-[var(--color-ceramic)]"
          style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {t("smartAddons")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-slate)]">{t("smartAddonsSub")}</p>
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {addons.map(({ product, variants }) => (
            <div key={product.id} className="w-[220px] flex-shrink-0">
              <AddonCard product={product} variants={variants} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
