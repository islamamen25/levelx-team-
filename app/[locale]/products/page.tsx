import { getTranslations } from "next-intl/server";
import { PRODUCTS, getAllBrands, getAllCategories } from "@/lib/mock-products";
import { ProductCard } from "@/components/plp/product-card";
import { FilterSidebar } from "@/components/plp/filter-sidebar";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plp" });
  return { title: `${t("title")} — LevelX`, description: t("subtitle") };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t  = await getTranslations({ locale, namespace: "plp" });

  const conditions = str(sp.condition)?.split(",").filter(Boolean) ?? [];
  const brands     = str(sp.brand)?.split(",").filter(Boolean) ?? [];
  const category   = str(sp.category);
  const priceMin   = parseFloat(str(sp.priceMin) ?? "0")  || 0;
  const priceMax   = parseFloat(str(sp.priceMax) ?? "0")  || Infinity;

  const filtered = PRODUCTS.filter((p) => {
    if (category && p.category !== category) return false;
    if (brands.length && !brands.includes(p.brand)) return false;
    const cheapest = p.variants.reduce((a, b) => (a.price < b.price ? a : b));
    if (cheapest.price < priceMin) return false;
    if (cheapest.price > priceMax) return false;
    if (conditions.length) {
      const has = p.condition_options.some(
        (co) => conditions.includes(co.tier) && co.stock > 0,
      );
      if (!has) return false;
    }
    return true;
  });

  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="mb-1 text-ceramic"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            {t("title")}
          </h1>
          <p className="text-sm text-slate">
            {t("resultsCount", { count: filtered.length })}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <FilterSidebar brands={getAllBrands()} categories={getAllCategories()} locale={locale} />
          </div>

          {/* Grid */}
          <div>
            {filtered.length === 0 ? (
              <p className="py-20 text-center text-slate">{t("noResults")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} locale={locale} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
