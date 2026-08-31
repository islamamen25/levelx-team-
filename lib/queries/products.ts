// NOTE: no file-level 'use cache' — each cached function opts in itself.
// getProductsAdmin() must stay uncached because it reads cookies() for the
// admin session, which is not allowed inside a cache scope.
import { cacheLife, cacheTag } from "next/cache";
import { createSupabasePublicClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { DbProduct, DbVariant } from "@/lib/supabase";

export type ProductWithVariants = {
  product: DbProduct;
  variants: DbVariant[];
};

export async function getProductBySlug(slug: string, locale: string): Promise<ProductWithVariants | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${slug}`);

  const supabase = createSupabasePublicClient();

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (pErr) throw new Error(`getProductBySlug: ${pErr.message}`);
  if (!product) return null;

  const [{ data: variants, error: vErr }, { data: translation }] = await Promise.all([
    supabase
      .from("variants")
      .select("*")
      .eq("product_id", product.id)
      .order("price", { ascending: true }),
    supabase
      .from("product_translations")
      .select("title, description, specs")
      .eq("product_id", product.id)
      .eq("lang", locale)
      .maybeSingle(),
  ]);

  if (vErr) throw new Error(`getVariants: ${vErr.message}`);

  // Overlay the locale-specific translation onto the base row, falling back
  // to the untranslated products.* columns whenever a language has no
  // product_translations row (or a field within it is empty).
  //
  // Every field is checked the same way — null, "" and whitespace-only all
  // count as "not translated". Rows are written straight to Supabase by the
  // external product pipeline, which does not normalise blanks to NULL the
  // way the admin form does, so a field can legitimately arrive as "".
  let localized: DbProduct = product;
  if (translation) {
    const translatedSpecs = translation.specs as Record<string, string> | null;
    localized = {
      ...product,
      name: translation.title?.trim() ? translation.title : product.name,
      description: translation.description?.trim() ? translation.description : product.description,
      specs: translatedSpecs && Object.keys(translatedSpecs).length > 0 ? translatedSpecs : product.specs,
    };
  }

  return { product: localized, variants: variants ?? [] };
}

export async function generateStaticProductParams(): Promise<{ slug: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("is_active", true)
    .not("slug", "is", null);

  if (error) throw new Error(`generateStaticProductParams: ${error.message}`);
  return (data ?? []).map((r) => ({ slug: r.slug as string }));
}

export async function getProductsByCategoryId(
  categoryId: string,
  excludeProductId: string,
  limit = 6,
): Promise<ProductWithVariants[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const supabase = createSupabasePublicClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .not("slug", "is", null)
    .neq("id", excludeProductId)
    .limit(limit);

  if (error) throw new Error(`getProductsByCategoryId: ${error.message}`);
  if (!products?.length) return [];

  const productIds = products.map((p) => p.id);
  const { data: variants } = await supabase
    .from("variants")
    .select("*")
    .in("product_id", productIds)
    .order("price", { ascending: true });

  const variantsByProduct: Record<string, DbVariant[]> = {};
  for (const v of variants ?? []) {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  }

  return products.map((p) => ({
    product: p,
    variants: variantsByProduct[p.id] ?? [],
  }));
}

export async function getProductsFiltered(params: {
  categorySlug?: string;
  /** Plural: the sidebar renders checkboxes, so several may be active at once. */
  brands?: string[];
  conditions?: string[];
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
  /** Explicit product ids — the Storefront Builder's "Pick Products" picker. When set,
      this replaces pagination entirely (a curated pin list, not a filtered page), so
      `page`/`pageSize` are ignored. Order is NOT preserved — Postgres's `IN (...)`
      returns rows in whatever order it likes; callers that care use orderByIds() below. */
  ids?: string[];
}): Promise<ProductWithVariants[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const { categorySlug, brands, conditions, priceMin, priceMax, page = 1, pageSize = 24, ids } = params;

  const supabase = createSupabasePublicClient();

  // If filtering by category slug, resolve it to an id first
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
    if (!categoryId) return [];
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .not("slug", "is", null)
    // Discovered while verifying this change: with no explicit order, .range() below had
    // no stable basis to page on, so Featured/Bestsellers/Top brands — all calling this
    // with no filter, differing only in pageSize — could each land on a different subset
    // of `is_active` rows whenever candidates outnumbered the page. Same sort
    // getProductsAdmin() already uses further down this file, now shared by both.
    .order("created_at", { ascending: false });

  // A pin list is a fixed set, not a page — applying .range() on top of .in() would
  // silently truncate a Builder pick longer than the default page size.
  if (ids?.length) {
    query = query.in("id", ids);
  } else {
    query = query.range((page - 1) * pageSize, page * pageSize - 1);
  }

  if (categoryId) query = query.eq("category_id", categoryId);
  if (brands?.length) query = query.in("brand", brands);

  const { data: products, error } = await query;
  if (error) throw new Error(`getProductsFiltered: ${error.message}`);
  if (!products?.length) return [];

  const productIds = products.map((p) => p.id);
  let variantQuery = supabase
    .from("variants")
    .select("*")
    .in("product_id", productIds)
    .order("price", { ascending: true });

  if (conditions?.length)
    variantQuery = variantQuery.in(
      "condition",
      conditions as ("Premium" | "Excellent" | "Good" | "Fair")[],
    );
  if (priceMin != null) variantQuery = variantQuery.gte("price", priceMin);
  if (priceMax != null) variantQuery = variantQuery.lte("price", priceMax);

  const { data: variants } = await variantQuery;

  const variantsByProduct: Record<string, DbVariant[]> = {};
  for (const v of variants ?? []) {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  }

  // Only return products that have at least one matching variant
  return products
    .filter((p) => (variantsByProduct[p.id]?.length ?? 0) > 0)
    .map((p) => ({ product: p, variants: variantsByProduct[p.id] }));
}

/**
 * Re-orders a product list to match an explicit id order — used after
 * `getProductsFiltered({ ids })` so a Builder-pinned section (Top deals, Bestsellers,
 * Top brands) shows products in the order the admin arranged them, not whatever order
 * Postgres's `IN (...)` happened to return. Ids that no longer resolve to a visible
 * product (deleted, deactivated, or lost its last variant) are dropped rather than
 * leaving a gap.
 */
export function orderByIds<T extends { product: { id: string } }>(items: T[], ids: string[]): T[] {
  const byId = new Map(items.map((item) => [item.product.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => item !== undefined);
}

export async function getBrandsForCategory(categorySlug?: string): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const supabase = createSupabasePublicClient();

  let query = supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (cat?.id) query = query.eq("category_id", cat.id);
  }

  const { data } = await query;
  return [...new Set((data ?? []).map((r) => r.brand as string))].sort();
}

export async function getProductsAdmin(): Promise<ProductWithVariants[]> {
  // No cache — admin always gets fresh data. Uses server client for session-aware RLS.
  const supabase = await createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getProductsAdmin: ${error.message}`);
  if (!products?.length) return [];

  const productIds = products.map((p) => p.id);
  const { data: variants } = await supabase
    .from("variants")
    .select("*")
    .in("product_id", productIds)
    .order("price", { ascending: true });

  const variantsByProduct: Record<string, DbVariant[]> = {};
  for (const v of variants ?? []) {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  }

  return products.map((p) => ({
    product: p,
    variants: variantsByProduct[p.id] ?? [],
  }));
}
