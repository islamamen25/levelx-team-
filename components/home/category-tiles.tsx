import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCarouselCategories } from "@/lib/queries/categories";
import { resolveIcon, resolveColorKey } from "@/lib/category-presentation";

interface CategoryTilesProps {
  locale: string;
}

export async function CategoryTiles({ locale }: CategoryTilesProps) {
  // Which categories appear here, their order, icon and colour are all set
  // per category in the dashboard — nothing about this strip is hardcoded.
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getCarouselCategories(),
  ]);

  if (categories.length === 0) return null;

  const tiles = categories.slice(0, 6);

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
          {tiles.map((cat, i) => {
            const Icon     = resolveIcon(cat.icon);
            const colorKey = resolveColorKey(cat.color_key, i);

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}` as never}
                locale={locale as "en" | "ar"}
                className="group flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl p-5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                style={{ backgroundColor: `var(--color-cat-${colorKey}-soft)` }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `var(--color-cat-${colorKey})`, color: "white" }}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: `var(--color-cat-${colorKey})` }}
                >
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
