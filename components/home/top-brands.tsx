import { getProductsFiltered, orderByIds } from "@/lib/queries/products";
import { TopBrandsCarousel, type BrandOverride } from "@/components/home/top-brands-carousel";

interface TopBrandsProps {
  locale: string;
  imageUrl?: string;
  brands?: BrandOverride[];
  /** Builder "Pick Products" pins — non-empty ⇒ show exactly these, in this order,
      instead of the automatic pageSize:8 fetch below. */
  productIds?: string[];
}

export async function TopBrands({ locale, imageUrl, brands, productIds }: TopBrandsProps) {
  const pinned  = (productIds?.length ?? 0) > 0;
  const results = pinned
    ? orderByIds(await getProductsFiltered({ ids: productIds }), productIds!)
    : await getProductsFiltered({ pageSize: 8 });

  return <TopBrandsCarousel products={results} locale={locale} imageUrl={imageUrl} brands={brands} />;
}
