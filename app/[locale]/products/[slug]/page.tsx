import { notFound } from "next/navigation";
import { getProductBySlug, PRODUCTS } from "@/lib/mock-products";
import { Gallery } from "@/components/pdp/gallery";
import { ProductPanel } from "@/components/pdp/product-panel";
import { SpecsAccordion } from "@/components/pdp/specs-accordion";
import { SmartAddons } from "@/components/pdp/smart-addons";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PRODUCTS.map((p) => ({ locale, slug: p.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — LevelX`,
    description: `Buy refurbished ${product.name}. 1-year warranty, 30-day returns, free UK delivery.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_460px] lg:gap-12">
          {/* Gallery */}
          <div>
            <Gallery images={product.images} productName={product.name} />
          </div>

          {/* Buy box */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductPanel product={product} locale={locale} />
          </div>
        </div>

        {/* Smart Add-ons */}
        <SmartAddons product={product} locale={locale} />

        {/* Specs accordion */}
        {Object.keys(product.specs).length > 0 && (
          <div className="mt-12 max-w-2xl">
            <SpecsAccordion specs={product.specs} locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}
