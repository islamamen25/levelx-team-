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

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
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

  const { data: variants, error: vErr } = await supabase
    .from("variants")
    .select("*")
    .eq("product_id", product.id)
    .order("price", { ascending: true });

  if (vErr) throw new Error(`getVariants: ${vErr.message}`);

  return { product, variants: variants ?? [] };
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
  brand?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
}): Promise<ProductWithVariants[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const { categorySlug, brand, condition, priceMin, priceMax, page = 1, pageSize = 24 } = params;

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
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (brand) query = query.eq("brand", brand);

  const { data: products, error } = await query;
  if (error) throw new Error(`getProductsFiltered: ${error.message}`);
  if (!products?.length) return [];

  const productIds = products.map((p) => p.id);
  let variantQuery = supabase
    .from("variants")
    .select("*")
    .in("product_id", productIds)
    .order("price", { ascending: true });

  if (condition) variantQuery = variantQuery.eq("condition", condition as "Premium" | "Excellent" | "Good" | "Fair");
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
