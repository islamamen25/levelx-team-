import { getProductsFiltered } from "@/lib/queries/products";
import { TopBrandsCarousel } from "@/components/home/top-brands-carousel";

interface TopBrandsProps {
  locale: string;
}

export async function TopBrands({ locale }: TopBrandsProps) {
  const results = await getProductsFiltered({ pageSize: 8 });
  return <TopBrandsCarousel products={results} locale={locale} />;
}
