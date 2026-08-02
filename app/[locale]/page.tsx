import React from "react";
import { getTranslations } from "next-intl/server";
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
  const tc = await getTranslations({ locale, namespace: "common" });

  const sections = [...layout]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible)
    .map((s) => ({ id: s.id, Component: SECTION_REGISTRY[s.id] }))
    .filter((s) => s.Component !== undefined);

  return (
    <>
      {/* The page had no <h1> at all — headings started at <h2>, which breaks
          screen-reader document outline and weakens the most important page for SEO.
          It is visually hidden rather than rendered because the hero is a slider: each
          slide owns an <h2>, and promoting one of three rotating headlines to <h1>
          would be arbitrary and would change on reorder. */}
      <h1 className="sr-only">
        {tc("brand")} — {tc("tagline")}
      </h1>
      {sections.map(({ id, Component }) => (
        <Component key={id} locale={locale} />
      ))}
    </>
  );
}
