import React from "react";
import { HeroSlider }     from "@/components/home/hero-slider";
import { CategoryTiles }  from "@/components/home/category-tiles";
import { Featured }       from "@/components/home/featured";
import { Bestsellers }    from "@/components/home/bestsellers";
import { TopBrands }      from "@/components/home/top-brands";
import { Newsletter }     from "@/components/home/newsletter";
import { TrustBanner }    from "@/components/home/trust-banner";
import { getStoreConfig } from "@/lib/store-config";

type Props = {
  params: Promise<{ locale: string }>;
};

const SECTION_REGISTRY: Record<
  string,
  ({ locale }: { locale: string }) => React.ReactElement
> = {
  hero:        ({ locale }) => <HeroSlider locale={locale} />,
  categories:  ({ locale }) => <CategoryTiles locale={locale} />,
  featured:    ({ locale }) => <Featured locale={locale} />,
  bestsellers: ({ locale }) => <Bestsellers locale={locale} />,
  brands:      ({ locale }) => <TopBrands locale={locale} />,
  newsletter:  ({ locale }) => <Newsletter locale={locale} />,
  trust:       ({ locale }) => <TrustBanner locale={locale} />,
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const { layout } = await getStoreConfig();

  const sections = [...layout]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible)
    .map((s) => ({ id: s.id, Component: SECTION_REGISTRY[s.id] }))
    .filter((s) => s.Component !== undefined);

  return (
    <>
      {sections.map(({ id, Component }) => (
        <Component key={id} locale={locale} />
      ))}
    </>
  );
}
