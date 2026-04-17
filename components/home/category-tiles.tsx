import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Smartphone,
  Laptop,
  Tablet,
  Gamepad2,
  Watch,
  Headphones,
  type LucideIcon,
} from "lucide-react";

const TILES: { key: string; slug: string; Icon: LucideIcon; colorKey: string }[] = [
  { key: "smartphones",  slug: "Smartphones",  Icon: Smartphone, colorKey: "smartphones" },
  { key: "laptops",      slug: "Laptops",      Icon: Laptop,     colorKey: "laptops" },
  { key: "tablets",      slug: "Tablets",      Icon: Tablet,     colorKey: "tablets" },
  { key: "consoles",     slug: "Consoles",     Icon: Gamepad2,   colorKey: "consoles" },
  { key: "smartwatches", slug: "Smartwatches", Icon: Watch,      colorKey: "watches" },
  { key: "headphones",   slug: "Headphones",   Icon: Headphones, colorKey: "audio" },
];

interface CategoryTilesProps {
  locale: string;
}

export async function CategoryTiles({ locale }: CategoryTilesProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="bg-white py-16 md:py-20" aria-labelledby="categories-title">
      <div className="container-px mx-auto">
        <div className="mb-10 max-w-xl">
          <h2
            id="categories-title"
            className="mb-2 text-ceramic"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            {t("categoriesTitle")}
          </h2>
          <p className="text-sm text-slate md:text-base">{t("categoriesSub")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {TILES.map(({ key, slug, Icon, colorKey }) => (
            <Link
              key={key}
              href={{ pathname: "/products", query: { category: slug } }}
              locale={locale as "en" | "ar"}
              className="group flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl p-5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
              style={{
                backgroundColor: `var(--color-cat-${colorKey}-soft)`,
              }}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `var(--color-cat-${colorKey})`,
                  color: "white",
                }}
              >
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </span>
              <span
                className="text-sm font-bold tracking-tight"
                style={{ color: `var(--color-cat-${colorKey})` }}
              >
                {t(`categories.${key}`)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
