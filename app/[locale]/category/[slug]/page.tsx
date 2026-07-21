import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryBySlug, getCategoryFlat, getCategoryTree } from "@/lib/queries/categories";
import type { CategoryFlat, CategoryNode } from "@/lib/queries/categories";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { cacheLife, cacheTag } from "next/cache";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ─── generateStaticParams: يُولَّد وقت البناء لكل الأقسام ────────────────────
export async function generateStaticParams() {
  const categories = await getCategoryFlat();
  return categories.map((c) => ({ slug: c.slug }));
}

// ─── SEO Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const [category, t] = await Promise.all([
    getCategoryBySlug(slug),
    getTranslations({ locale, namespace: "plp" }),
  ]);
  if (!category) return { title: "Not Found" };
  return {
    title: `${category.name} — LevelX`,
    description: `Browse our full collection of ${category.name} products.`,
  };
}

// ─── منتجات القسم ─────────────────────────────────────────────────────────────
type ProductRow = {
  id:          string;
  name:        string;
  description: string | null;
  slug:        string | null;
  brand:       string | null;
  images:      unknown;
  is_active:   boolean;
};

async function getProductsByCategory(categoryId: string): Promise<ProductRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, description, slug, brand, images, is_active")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .not("slug", "is", null)
    .order("name");
  return (data ?? []) as ProductRow[];
}

// ─── Breadcrumb Helper ────────────────────────────────────────────────────────
function buildCrumbs(current: CategoryFlat, all: CategoryFlat[]): CategoryFlat[] {
  const map = Object.fromEntries(all.map((c) => [c.id, c]));
  const chain: CategoryFlat[] = [];
  let node: CategoryFlat | undefined = current;
  while (node) {
    chain.unshift(node);
    node = node.parent_id ? map[node.parent_id] : undefined;
  }
  return chain;
}

// ─── الصفحة ───────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;

  const [category, allCategories, tree] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryFlat(),
    getCategoryTree(),
  ]);

  if (!category) notFound();

  const products = await getProductsByCategory(category.id);
  const crumbs   = buildCrumbs(category, allCategories);
  const children = (tree.find((n) => n.slug === slug) ??
    tree.flatMap((n) => n.children).find((n) => n.slug === slug))?.children ?? [];

  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-10 space-y-6">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--color-slate)]">
            <li>
              <Link href="/" locale={locale as "en" | "ar"} className="hover:text-[var(--color-ceramic)]">
                Home
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={crumb.id} className="flex items-center gap-1">
                <span className="text-[var(--color-iron)]">/</span>
                {i === crumbs.length - 1 ? (
                  <span className="text-[var(--color-ceramic)] font-semibold">{crumb.name}</span>
                ) : (
                  <Link
                    href={`/category/${crumb.slug}` as any}
                    locale={locale as "en" | "ar"}
                    className="hover:text-[var(--color-ceramic)]"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-baseline justify-between">
          <h1
            className="text-[var(--color-ceramic)]"
            style={{ fontSize: "clamp(1.6rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
          >
            {category.name}
          </h1>
          <span className="text-sm text-[var(--color-slate)]">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
        </div>

        {/* أقسام فرعية — إن وجدت */}
        {children.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {children.map((child: CategoryNode) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}` as any}
                locale={locale as "en" | "ar"}
                className="rounded-full border border-[var(--color-iron)] px-4 py-1.5
                           text-sm font-medium text-[var(--color-ceramic)]
                           hover:border-[var(--color-ceramic)] transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {/* Grid المنتجات */}
        {products.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const cover = Array.isArray(p.images) ? p.images[0] : null;
              return (
                <li key={p.id}>
                  <Link
                    href={p.slug ? (`/products/${p.slug}` as any) : ("/products" as any)}
                    locale={locale as "en" | "ar"}
                    className="group block bg-white border border-[var(--color-iron)]
                               rounded-2xl overflow-hidden hover:shadow-lg
                               hover:border-[var(--color-slate)] transition-all"
                  >
                    {/* صورة */}
                    <div className="aspect-square bg-[var(--color-surface)] overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[var(--color-iron)]">
                          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                                 a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6
                                 a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* بيانات */}
                    <div className="p-3 space-y-0.5">
                      {p.brand && (
                        <p className="text-xs text-[var(--color-slate)] font-medium">{p.brand}</p>
                      )}
                      <p className="text-sm font-bold text-[var(--color-ceramic)] line-clamp-2 leading-snug">
                        {p.name}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-2">
            <p className="text-[var(--color-slate)] font-medium">No products in {category.name} yet.</p>
            <p className="text-sm text-[var(--color-iron)]">Check back soon — we're adding new items regularly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
