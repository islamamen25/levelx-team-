import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Smartphone, Laptop, Gamepad2, Car, Cpu, Watch, Headphones, ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { getCategoryTree } from "@/lib/queries/categories";

// خريطة slug → icon + colorKey (يرجع إلى المتغيرات الموجودة في globals.css)
const SLUG_CONFIG: Record<string, { Icon: LucideIcon; colorKey: string }> = {
  "mobile":          { Icon: Smartphone, colorKey: "smartphones" },
  "gaming":          { Icon: Gamepad2,   colorKey: "consoles"    },
  "car-accessories": { Icon: Car,        colorKey: "tablets"     },
  "computing":       { Icon: Laptop,     colorKey: "laptops"     },
  "smart-devices":   { Icon: Cpu,        colorKey: "watches"     },
  "smartphones":     { Icon: Smartphone, colorKey: "smartphones" },
  "laptops":         { Icon: Laptop,     colorKey: "laptops"     },
  "tablets":         { Icon: Watch,      colorKey: "tablets"     },
  "consoles":        { Icon: Gamepad2,   colorKey: "consoles"    },
  "headphones":      { Icon: Headphones, colorKey: "audio"       },
  "smartwatches":    { Icon: Watch,      colorKey: "watches"     },
  "audio":           { Icon: Headphones, colorKey: "audio"       },
};

const FALLBACK_COLORS = [
  "smartphones", "consoles", "laptops", "tablets", "watches", "audio",
];

interface CategoryTilesProps {
  locale: string;
}

export async function CategoryTiles({ locale }: CategoryTilesProps) {
  const [t, tree] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getCategoryTree(),
  ]);

  // نأخذ الأقسام الجذرية فقط (max 6 للعرض)
  const rootCats = tree.slice(0, 6);

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
          {rootCats.map(({ slug, name }, i) => {
            const config    = SLUG_CONFIG[slug];
            const colorKey  = config?.colorKey ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            const Icon      = config?.Icon      ?? ShoppingBag;

            return (
              <Link
                key={slug}
                href={`/category/${slug}` as any}
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
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
