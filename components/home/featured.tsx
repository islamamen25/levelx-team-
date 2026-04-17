import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCTS } from "@/lib/mock-products";
import { FeaturedCarousel } from "@/components/home/featured-carousel";

interface FeaturedProps {
  locale: string;
}

/** Category filter chips — mirrors Back Market's "Price drop | MacBook | iPad | ..." tabs */
const FILTER_CHIPS: { label: string; arLabel: string; emoji: string; query: string }[] = [
  { label: "Price drop",  arLabel: "تخفيضات",     emoji: "🏷️",  query: "" },
  { label: "MacBook",     arLabel: "ماك بوك",     emoji: "💻",  query: "brand=Apple&category=Laptops" },
  { label: "iPad",        arLabel: "آيباد",        emoji: "⬛",  query: "brand=Apple&category=Tablets" },
  { label: "Android",     arLabel: "أندرويد",      emoji: "📱",  query: "brand=Samsung" },
  { label: "iPhone",      arLabel: "آيفون",        emoji: "📱",  query: "brand=Apple&category=Smartphones" },
  { label: "AirPods",     arLabel: "إيربودز",      emoji: "🎧",  query: "category=Headphones" },
  { label: "Gaming",      arLabel: "ألعاب",        emoji: "🎮",  query: "category=Consoles" },
];

export async function Featured({ locale }: FeaturedProps) {
  const t  = await getTranslations({ locale, namespace: "featured" });
  const isAr = locale === "ar";

  // Sort by savings (biggest discount first), take top 6
  const deals = [...PRODUCTS]
    .map((p) => {
      const v = p.variants.reduce((a, b) => (a.price < b.price ? a : b));
      return { product: p, savings: v.original_price - v.price };
    })
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 6)
    .map((d) => d.product);

  return (
    <section className="bg-white py-14 md:py-18" aria-labelledby="featured-title">
      <div className="container-px mx-auto">
        {/* ── Main layout: lifestyle image left + filter tabs & cards right ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(260px,1fr)_2fr] lg:grid-cols-[minmax(300px,1fr)_2.5fr]">

          {/* Left: Lifestyle image — NOT a product, just aesthetic ambiance */}
          <div
            className="hidden overflow-hidden rounded-2xl md:block"
            style={{
              background: "linear-gradient(160deg, #6db5a0 0%, #3d8b72 40%, #2a6b55 100%)",
              minHeight: "420px",
            }}
          >
            {/* Styled lifestyle scene placeholder */}
            <div className="flex h-full flex-col items-center justify-end p-6">
              <div className="mb-4 flex items-end gap-3">
                <span style={{ fontSize: "3rem", lineHeight: 1 }} aria-hidden>🎧</span>
                <span style={{ fontSize: "2rem", lineHeight: 1, opacity: 0.7 }} aria-hidden>📱</span>
                <span style={{ fontSize: "2.5rem", lineHeight: 1, opacity: 0.8 }} aria-hidden>⌚</span>
              </div>
              <p className="text-center text-xs font-medium text-white/60">
                {isAr ? "تكنولوجيا مجددة بعناية" : "Carefully refurbished tech"}
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Filter chips — horizontal scroll like Back Market */}
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-2" style={{ width: "max-content" }}>
                {FILTER_CHIPS.map((chip, i) => (
                  <Link
                    key={chip.label}
                    href={chip.query ? `/products?${chip.query}` : "/deals"}
                    locale={locale as "en" | "ar"}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-all duration-200 hover:border-[var(--color-mint)] hover:shadow-sm",
                      i === 0
                        ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)]"
                        : "border-[var(--color-iron)] bg-white",
                    ].join(" ")}
                    style={{ minWidth: "80px" }}
                  >
                    <span className="text-xl" aria-hidden>{chip.emoji}</span>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-ceramic">
                      {isAr ? chip.arLabel : chip.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Product cards — carousel with title + arrows in header */}
            <FeaturedCarousel deals={deals} locale={locale} title={t("title")} />
          </div>
        </div>
      </div>
    </section>
  );
}
