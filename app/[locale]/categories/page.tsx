import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/lib/queries/categories";
import { resolveIcon, resolveColorKey } from "@/lib/category-presentation";

/**
 * /[locale]/categories — the full category index.
 *
 * `/categories` was linked from the footer and from the mobile menu but no route file
 * existed, so both 404'd. It matters most on small screens: CategoryBar is
 * `hidden md:block` and the mobile sheet does not render it, so without this page a
 * phone user has no way to browse categories except the six tiles on the home page.
 *
 * Unlike the home tiles (which show only `in_carousel` categories, capped at six) this
 * lists the whole tree, parents with their children.
 */

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tc = await getTranslations({ locale, namespace: "common" });
  return { title: `${t("categories")} — ${tc("brand")}` };
}

export default async function CategoriesPage({ params }: Props) {
  const { locale } = await params;
  const [t, tn, tree] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "nav" }),
    getCategoryTree(locale),
  ]);

  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">
        <div className="mb-10 max-w-xl">
          <h1
            className="mb-2 text-ceramic"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            {tn("categories")}
          </h1>
          <p className="text-sm text-slate md:text-base">{t("categoriesSub")}</p>
        </div>

        {tree.length === 0 ? (
          <p className="py-20 text-center text-slate">{t("categoriesSub")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tree.map((parent, i) => {
              const Icon = resolveIcon(null);
              const colorKey = resolveColorKey(null, i);

              return (
                <section
                  key={parent.id}
                  className="rounded-2xl border border-[var(--color-iron)] bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/category/${parent.slug}` as never}
                    locale={locale as "en" | "ar"}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: `var(--color-cat-${colorKey})` }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h2 dir="auto" className="text-base font-bold text-ceramic">
                      {parent.name}
                    </h2>
                  </Link>

                  {parent.children.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-[var(--color-iron)] pt-3">
                      {parent.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/category/${child.slug}` as never}
                            locale={locale as "en" | "ar"}
                            dir="auto"
                            className="block rounded-lg px-2 py-2 text-sm text-slate transition-colors hover:bg-[#F5F5F7] hover:text-[var(--color-mint)]"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
