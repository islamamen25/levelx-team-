import React from "react";
import { getTranslations } from "next-intl/server";
import { HeroSlider }     from "@/components/home/hero-slider";
import { CategoryTiles }  from "@/components/home/category-tiles";
import { Featured }       from "@/components/home/featured";
import { Bestsellers }    from "@/components/home/bestsellers";
import { TopBrands }      from "@/components/home/top-brands";
import { Newsletter }     from "@/components/home/newsletter";
import { TrustBanner }    from "@/components/home/trust-banner";
import { getStoreConfig, type PageSection } from "@/lib/store-config";

type Props = {
  params: Promise<{ locale: string }>;
};

const SECTION_REGISTRY: Record<
  string,
  ({ locale, section }: { locale: string; section: PageSection }) => React.ReactElement
> = {
  hero:        ({ locale }) => <HeroSlider locale={locale} />,
  categories:  ({ locale, section }) => (
    <CategoryTiles
      locale={locale}
      tileShape={section.tile_shape}
      tiles={section.tiles}
      tileAccentColor={section.tile_accent_color}
      tileTextColor={section.tile_text_color}
      tileTextSize={section.tile_text_size}
    />
  ),
  featured:    ({ locale, section }) => (
    <Featured
      locale={locale}
      imageUrl={section.image_url}
      productIds={section.product_ids}
      chips={section.chips}
    />
  ),
  bestsellers: ({ locale, section }) => (
    <Bestsellers locale={locale} productIds={section.product_ids} />
  ),
  brands:      ({ locale, section }) => (
    <TopBrands
      locale={locale}
      imageUrl={section.image_url}
      brands={section.brands}
      productIds={section.product_ids}
    />
  ),
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
    .map((s) => ({ id: s.id, section: s, Component: SECTION_REGISTRY[s.id] }))
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
      {sections.map(({ id, section, Component }) => (
        <Component key={id} locale={locale} section={section} />
      ))}
    </>
  );
}
