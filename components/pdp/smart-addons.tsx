import { getTranslations } from "next-intl/server";
import { PRODUCTS, type MockProduct } from "@/lib/mock-products";
import { ProductCard } from "@/components/plp/product-card";

const CROSS_SELL: Record<string, string[]> = {
  Smartphones:  ["Headphones", "Smartwatches", "Tablets"],
  Laptops:      ["Headphones", "Tablets", "Smartphones"],
  Tablets:      ["Headphones", "Smartwatches", "Laptops"],
  Consoles:     ["Headphones", "Tablets", "Smartphones"],
  Smartwatches: ["Smartphones", "Headphones"],
  Headphones:   ["Smartphones", "Smartwatches", "Tablets"],
};

interface SmartAddonsProps {
  product: MockProduct;
  locale: string;
}

export async function SmartAddons({ product, locale }: SmartAddonsProps) {
  const t = await getTranslations({ locale, namespace: "product" });
  const categories = CROSS_SELL[product.category] ?? [];

  const addons = PRODUCTS
    .filter((p) => p.id !== product.id && categories.includes(p.category))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

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
          {addons.map((addon) => (
            <div key={addon.id} className="w-[220px] flex-shrink-0">
              <ProductCard product={addon} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
