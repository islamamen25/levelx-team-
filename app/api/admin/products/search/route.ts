/**
 * GET /api/admin/products/search
 * Lightweight product search for the Storefront Builder product selector.
 * Queries the Supabase products + variants tables.
 *
 * Query params:
 *   q         — search string (name / brand)
 *   category  — filter by category_id (UUID)
 *   limit     — max results (default 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export interface SearchProduct {
  id:       string;
  name:     string;
  brand:    string;
  category: string;   // category_id or ""
  price:    number;
  image:    string;   // first image URL or ""
  source:   "db";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { searchParams } = new URL(req.url);
  const q        = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category") ?? "";
  const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

  let query = supabase
    .from("products")
    .select("id, name, brand, category_id, images, variants(price, sale_price)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q)        query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  if (category) query = query.eq("category_id", category);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products: SearchProduct[] = (data ?? []).map((row) => {
    const variants = (row.variants as { price: number; sale_price: number | null }[]) ?? [];
    const minPrice = variants.length
      ? Math.min(...variants.map((v) => v.sale_price ?? v.price))
      : 0;
    const images = row.images as string[];
    return {
      id:       row.id,
      name:     row.name,
      brand:    row.brand ?? "",
      category: row.category_id ?? "",
      price:    minPrice,
      image:    images?.[0] ?? "",
      source:   "db",
    };
  });

  return NextResponse.json({ products, source: "db" });
}
