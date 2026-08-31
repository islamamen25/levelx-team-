import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProductBySlug, generateStaticProductParams } from "@/lib/queries/products";
import { Gallery } from "@/components/pdp/gallery";
import { ProductPanel } from "@/components/pdp/product-panel";
import { Overview } from "@/components/pdp/overview";
import { ProductImagery } from "@/components/pdp/product-imagery";
import { SpecsAccordion } from "@/components/pdp/specs-accordion";
import { SmartAddons } from "@/components/pdp/smart-addons";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await generateStaticProductParams();
  // cacheComponents: true requires at least one static param
  const effective = slugs.length > 0 ? slugs : [{ slug: "_" }];
  return routing.locales.flatMap((locale) =>
    effective.map((s) => ({ locale, slug: s.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const data = await getProductBySlug(slug, locale);
  if (!data) return {};
  const { product } = data;
  return {
    title: `${product.name} — LevelX`,
    description: product.description
      ? product.description.slice(0, 155)
      : `Buy ${product.name} at LevelX. 1-year warranty, 30-day returns, fast delivery.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const data = await getProductBySlug(slug, locale);
  if (!data) notFound();

  const t = await getTranslations({ locale, namespace: "product" });
  const { product, variants } = data;
  const images = (product.images as string[]) ?? [];
  const specs  = (product.specs as Record<string, string>) ?? {};
  const description = product.description?.trim() ?? "";

  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_460px] lg:gap-12">
          {/* Gallery */}
          <div>
            <Gallery images={images} productName={product.name} />
          </div>

          {/* Buy box */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductPanel product={product} variants={variants} locale={locale} />
          </div>
        </div>

        {/* Overview — the full product description from the catalog */}
        {description.length > 0 && (
          <Overview description={description} label={t("overview")} />
        )}

        {/* Specs accordion */}
        {Object.keys(specs).length > 0 && (
          <div className="mt-12 max-w-2xl">
            <SpecsAccordion specs={specs} label={t("specifications")} />
          </div>
        )}

        {/* Product photos — the gallery images again, large, for scroll-to-inspect */}
        <ProductImagery images={images} productName={product.name} label={t("photos")} />

        {/* Smart Add-ons */}
        <Suspense fallback={null}>
          <SmartAddons
            productId={product.id}
            categoryId={product.category_id}
            locale={locale}
          />
        </Suspense>
      </div>
    </div>
  );
}
