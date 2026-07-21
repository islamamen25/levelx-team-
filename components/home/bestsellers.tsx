import { getProductsFiltered } from "@/lib/queries/products";
import { BestsellersCarousel } from "@/components/home/bestsellers-carousel";

interface BestsellersProps {
  locale: string;
}

export async function Bestsellers({ locale }: BestsellersProps) {
  const results = await getProductsFiltered({ pageSize: 12 });

  // Sort by lowest price (most accessible = bestsellers proxy until we have sales data)
  const sorted = [...results]
    .sort((a, b) => {
      const ap = a.variants[0]?.sale_price ?? a.variants[0]?.price ?? Infinity;
      const bp = b.variants[0]?.sale_price ?? b.variants[0]?.price ?? Infinity;
      return ap - bp;
    })
    .slice(0, 8);

  return <BestsellersCarousel products={sorted} locale={locale} />;
}
