/**
 * GET /api/admin/products/search
 * Lightweight product search for the Storefront Builder product selector.
 * Queries Supabase products table first; falls back to mock data when empty.
 *
 * Query params:
 *   q         — search string (name / brand)
 *   category  — filter by category name
 *   limit     — max results (default 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "@/lib/mock-products";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SearchProduct {
  id:       string;
  name:     string;
  brand:    string;
  category: string;
  price:    number;
  gradient: string;   // CSS gradient (mock) or first image URL (real)
  source:   "db" | "mock";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q        = (searchParams.get("q") ?? "").toLowerCase().trim();
  const category = searchParams.get("category") ?? "";
  const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

  // ── 1. Try Supabase ───────────────────────────────────────────────────────
  let dbQuery = supabase
    .from("products")
    .select("id, name, brand, images, specs, variants:variants(price, condition)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q)        dbQuery = dbQuery.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  if (category) dbQuery = dbQuery.eq("category_id", category);

  const { data: dbRows } = await dbQuery;

  if (dbRows && dbRows.length > 0) {
    const products: SearchProduct[] = dbRows.map((row) => {
      const variants = (row.variants as { price: number }[]) ?? [];
      const minPrice = variants.length
        ? Math.min(...variants.map((v) => v.price))
        : 0;
      const firstImage = Array.isArray(row.images) ? row.images[0] : null;

      return {
        id:       row.id,
        name:     row.name,
        brand:    row.brand ?? "",
        category: "",
        price:    minPrice,
        gradient: typeof firstImage === "string"
          ? firstImage
          : "linear-gradient(135deg, #e8e8ed 0%, #d1d1d6 100%)",
        source: "db",
      };
    });
    return NextResponse.json({ products, source: "db" });
  }

  // ── 2. Fall back to mock products ─────────────────────────────────────────
  let mock = PRODUCTS;

  if (q) {
    mock = mock.filter((p) =>
      `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)
    );
  }
  if (category) {
    mock = mock.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  const products: SearchProduct[] = mock.slice(0, limit).map((p) => ({
    id:       p.id,
    name:     p.name,
    brand:    p.brand,
    category: p.category,
    price:    Math.min(...p.variants.map((v) => v.price)),
    gradient: p.images[0]?.gradient ?? "linear-gradient(135deg, #e8e8ed 0%, #d1d1d6 100%)",
    source:   "mock",
  }));

  return NextResponse.json({ products, source: "mock" });
}
