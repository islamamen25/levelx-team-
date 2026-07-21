import { getTranslations } from "next-intl/server";
import { getCategoryFlat } from "@/lib/queries/categories";
import { getProductsFiltered, getBrandsForCategory } from "@/lib/queries/products";
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

  const categorySlug = str(sp.category);
  const brand        = str(sp.brand)?.split(",").filter(Boolean)[0];
  const condition    = str(sp.condition)?.split(",").filter(Boolean)[0];
  const priceMin     = parseFloat(str(sp.priceMin) ?? "") || undefined;
  const priceMax     = parseFloat(str(sp.priceMax) ?? "") || undefined;

  const [results, allCategories, brands] = await Promise.all([
    getProductsFiltered({ categorySlug, brand, condition, priceMin, priceMax }),
    getCategoryFlat(),
    getBrandsForCategory(categorySlug),
  ]);

  const categories = allCategories.map((c) => ({ name: c.name, slug: c.slug }));

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
            {t("resultsCount", { count: results.length })}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <FilterSidebar brands={brands} categories={categories} locale={locale} />
          </div>

          {/* Grid */}
          <div>
            {results.length === 0 ? (
              <p className="py-20 text-center text-slate">{t("noResults")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {results.map(({ product, variants }) => (
                  <ProductCard key={product.id} product={product} variants={variants} locale={locale} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
