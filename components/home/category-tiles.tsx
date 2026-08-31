import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCarouselCategories } from "@/lib/queries/categories";
import { resolveIcon, resolveColorKey } from "@/lib/category-presentation";
import { isRenderableImage } from "@/lib/images";
import type { CategoryTileOverride, TileShape } from "@/lib/store-config";

interface CategoryTilesProps {
  locale: string;
  /** Only read when `tiles` below is non-empty — the automatic strip never changes shape. */
  tileShape?: TileShape;
  /** Builder override: photo + shape + optional "Below EGP 399"-style sub-label per tile.
      Empty/absent ⇒ today's automatic icon strip, driven entirely by the categories the
      admin flagged `in_carousel` at /dashboard/categories — unchanged below. */
  tiles?: CategoryTileOverride[];
  /** One colour for every tile's icon badge, in *both* branches below — the automatic
      strip included. Unset ⇒ each category's own DB colour (today's rainbow look). */
  tileAccentColor?: string;
  /** Colour and size of the sub-label text drawn over a tile (only exists in the override
      branch below — the automatic strip has no sub-labels). Unset ⇒ white / "md". */
  tileTextColor?: string;
  tileTextSize?:  "sm" | "md" | "lg";
}

const SHAPE_CLASS: Record<TileShape, string> = {
  square:  "rounded-none",
  rounded: "rounded-2xl",
  circle:  "rounded-full",
};

const TEXT_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

export async function CategoryTiles({
  locale,
  tileShape = "rounded",
  tiles,
  tileAccentColor,
  tileTextColor,
  tileTextSize = "md",
}: CategoryTilesProps) {
  // Which categories appear here, their order, icon and colour are all set
  // per category in the dashboard — nothing about this strip is hardcoded.
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getCarouselCategories(locale),
  ]);

  // A Builder tile list overrides the automatic strip. A tile whose category_slug no
  // longer resolves — hidden or renamed after the tile was configured — is dropped
  // silently rather than rendered as a dead link.
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const overrideTiles = (tiles ?? [])
    .map((tile) => ({ tile, category: bySlug.get(tile.category_slug) }))
    .filter((x): x is { tile: CategoryTileOverride; category: NonNullable<typeof x.category> } => !!x.category);

  if (overrideTiles.length > 0) {
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

          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-6">
            {overrideTiles.map(({ tile, category }, i) => {
              const hasPhoto = isRenderableImage(tile.image_url);
              const label    = tile.label?.trim() || category.name;
              const sublabel = tile.sublabel?.trim();
              // Same icon-badge-on-soft-colour treatment the automatic tiles below use,
              // inlined here (not a helper component) rather than filling the photo-less
              // fallback — resolveIcon() returns a component reference, and a helper
              // component that renders it immediately reads to static analysis as
              // "a component defining a component", which is the one thing to avoid.
              const Icon    = resolveIcon(category.icon);
              const colorKey = resolveColorKey(category.color_key, i);
              // A per-tile accent, set freely in the Builder, wins over the section-wide
              // colour, which itself wins over the category's own DB colour — the whole
              // point is that this strip's palette isn't tied to /dashboard/categories.
              // Neither set ⇒ today's per-category rainbow behaviour.
              const accent = tile.accent_color ?? tileAccentColor;
              const soft   = accent ? `${accent}1a` : `var(--color-cat-${colorKey}-soft)`;

              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}` as never}
                  locale={locale as "en" | "ar"}
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  {/* backgroundColor sits behind BOTH branches, not just the icon one — a
                      logo/sticker PNG with a transparent (or checkered-preview) background
                      used to show that raw checker pattern edge-to-edge here, because nothing
                      was ever behind it. Now any non-opaque pixel shows this tile's own colour
                      instead, so an uploaded logo reads the same as a Lucide icon: a mark on a
                      solid, on-brand circle — not a random image floating on a transparency
                      grid. object-contain + padding (not object-cover) for the photo case, for
                      the same reason: logos/wordmarks aren't square, and cropping one to fill
                      the tile is worse than a little breathing room. */}
                  <div
                    className={[
                      "relative aspect-square w-full overflow-hidden shadow-sm transition-all duration-200",
                      "group-hover:scale-[1.03] group-hover:shadow-lg",
                      SHAPE_CLASS[tileShape],
                    ].join(" ")}
                    style={{ backgroundColor: soft }}
                  >
                    {hasPhoto ? (
                      <Image
                        src={tile.image_url!}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, 16vw"
                        className="object-contain p-4"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: accent ?? `var(--color-cat-${colorKey})`, color: "white" }}
                        >
                          <Icon className="h-7 w-7" strokeWidth={1.5} />
                        </span>
                      </div>
                    )}
                    {sublabel && (
                      // No pill/banner behind the text — a solid bar read as "a dark
                      // background" no matter what colour it was. Text sits straight on the
                      // tile instead; a drop-shadow (not a background box) is what keeps white
                      // text legible over a bright photo or the icon fallback's pale tint.
                      <div
                        dir="auto"
                        className={`absolute inset-x-0 bottom-2 truncate px-3 text-center font-extrabold ${TEXT_SIZE_CLASS[tileTextSize]}`}
                        style={{
                          color: tileTextColor ?? "#ffffff",
                          textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 1px 10px rgba(0,0,0,0.6)",
                        }}
                      >
                        {sublabel}
                      </div>
                    )}
                  </div>
                  <span dir="auto" className="text-sm font-bold tracking-tight text-ceramic">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── No Builder override: today's automatic icon strip, unchanged. ──
  if (categories.length === 0) return null;

  const defaultTiles = categories.slice(0, 6);

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
          {defaultTiles.map((cat, i) => {
            const Icon     = resolveIcon(cat.icon);
            const colorKey = resolveColorKey(cat.color_key, i);
            // Same precedence as the override branch above, minus the per-tile step —
            // there's no per-tile row here, just the section-wide colour or the DB rainbow.
            const soft  = tileAccentColor ? `${tileAccentColor}1a` : `var(--color-cat-${colorKey}-soft)`;
            const solid = tileAccentColor ?? `var(--color-cat-${colorKey})`;

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}` as never}
                locale={locale as "en" | "ar"}
                className="group flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl p-5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                style={{ backgroundColor: soft }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: solid, color: "white" }}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: solid }}
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
