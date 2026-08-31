import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Tag, Laptop, Tablet, Smartphone, Gamepad2, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getProductsFiltered, orderByIds } from "@/lib/queries/products";
import { getCategoryFlat } from "@/lib/queries/categories";
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { isRenderableImage } from "@/lib/images";
import type { FeaturedChipOverride } from "@/lib/store-config";

interface FeaturedProps {
  locale: string;
  /** Left lifestyle photo — Builder-editable. Falls back below when unset or when the
      host isn't in lib/images.ts's allowlist (cowork writes straight to the DB and
      skips the Builder's own validation, so this guard is load-bearing, not decorative). */
  imageUrl?: string;
  /** Builder "Pick Products" pins — non-empty ⇒ show exactly these, in this order,
      instead of the automatic biggest-discount sort below. */
  productIds?: string[];
  /** Builder override for the filter-chip row above the carousel — photo instead of a
      Lucide icon, optional label. Empty/absent ⇒ the automatic category chips below. */
  chips?: FeaturedChipOverride[];
}

const DEFAULT_FEATURED_IMAGE = "https://images.unsplash.com/photo-1760520338238-4137dd2dc28f?w=800&q=80&fit=crop";

// Lucide icons — matches the icon system already used for category tiles
// (lib/category-presentation.ts) instead of emoji, which renders inconsistently
// across operating systems and reads as an unfinished placeholder.
/**
 * These chips were hardcoded to a taxonomy that does not exist in this store:
 * `category=laptops|tablets|mobile|gaming` and `brand=Apple|Samsung`, while the real
 * tree is `*-accessories` and the only brand on file is LevelX. Every chip returned
 * "no products match" — and the first one pointed at /deals, which 404'd.
 *
 * They are built from real categories now, so a chip can only ever link somewhere that
 * exists. The leading "all products" chip replaces the dead /deals link.
 */
const CHIP_ICONS: LucideIcon[] = [Laptop, Tablet, Smartphone, Gamepad2];

export async function Featured({ locale, imageUrl, productIds, chips: chipsOverride }: FeaturedProps) {
  const t    = await getTranslations({ locale, namespace: "featured" });
  const isAr = locale === "ar";

  const realCategories = await getCategoryFlat(locale);

  // A Builder chip list overrides the automatic category row. Each chip shows its own
  // photo when set (validated the same way as every other admin image in this app —
  // see lib/images.ts) and falls back to the generic Tag icon otherwise; the label
  // below it is optional here, unlike the automatic chips which always have one.
  const chips: { key: string; href: string; label?: string; imageUrl?: string; Icon: LucideIcon }[] =
    chipsOverride && chipsOverride.length > 0
      ? chipsOverride.map((c, i) => ({
          key:      String(i),
          href:     c.href?.startsWith("/") ? c.href : "/products",
          label:    c.label?.trim() || undefined,
          imageUrl: c.image_url,
          Icon:     Tag,
        }))
      : [
          { key: "all", href: "/products", label: isAr ? "الكل" : "All", Icon: Tag },
          ...realCategories.slice(0, 5).map((c, i) => ({
            key:   c.slug,
            href:  `/products?category=${encodeURIComponent(c.slug)}`,
            label: c.name as string | undefined,
            Icon:  CHIP_ICONS[i % CHIP_ICONS.length],
          })),
        ];

  const pinned = (productIds?.length ?? 0) > 0;

  // Pinned: the admin's exact pick, in their order — no re-sort. Automatic: top 8 by
  // whatever the store has, then sorted below by biggest discount.
  const results = pinned
    ? orderByIds(await getProductsFiltered({ ids: productIds }), productIds!)
    : await getProductsFiltered({ pageSize: 8 });

  const deals = pinned
    ? results
    : results
        .map((r) => {
          const cheapest = r.variants.reduce<typeof r.variants[0] | undefined>((best, v) => {
            const p = v.sale_price ?? v.price;
            if (!best) return v;
            return p < (best.sale_price ?? best.price) ? v : best;
          }, undefined);
          const savings = cheapest?.sale_price != null
            ? cheapest.price - cheapest.sale_price
            : 0;
          return { ...r, savings };
        })
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 6);

  const heroImage = isRenderableImage(imageUrl) ? imageUrl! : DEFAULT_FEATURED_IMAGE;

  return (
    <section className="bg-white py-14 md:py-18" aria-labelledby="featured-title">
      <div className="container-px mx-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(260px,1fr)_2fr] lg:grid-cols-[minmax(300px,1fr)_2.5fr]">

          {/* Left: lifestyle image */}
          <div className="relative hidden overflow-hidden rounded-2xl md:block" style={{ minHeight: "420px" }}>
            <Image
              src={heroImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 300px, 380px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Filter chips */}
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-2" style={{ width: "max-content" }}>
                {chips.map((chip, i) => {
                  const Icon = chip.Icon;
                  const hasPhoto = isRenderableImage(chip.imageUrl);
                  return (
                    <Link
                      key={chip.key}
                      href={chip.href as never}
                      locale={locale as "en" | "ar"}
                      className={[
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-all duration-200 hover:border-[var(--color-mint)] hover:shadow-sm",
                        i === 0
                          ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)]"
                          : "border-[var(--color-iron)] bg-white",
                      ].join(" ")}
                      style={{ minWidth: "80px" }}
                    >
                      {hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={chip.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <Icon className="h-5 w-5 text-ceramic" strokeWidth={1.75} aria-hidden />
                      )}
                      {chip.label && (
                        <span dir="auto" className="whitespace-nowrap text-[11px] font-semibold text-ceramic">
                          {chip.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <FeaturedCarousel deals={deals} locale={locale} title={t("title")} />
          </div>
        </div>
      </div>
    </section>
  );
}
