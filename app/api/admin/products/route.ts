import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";

// Rate limits: read ops are generous (browsing), writes are strict
const RL_READ  = { limit: 60, windowMs: 60_000 } as const;   // 60 GET/min
const RL_WRITE = { limit: 20, windowMs: 60_000 } as const;   // 20 POST|PATCH|DELETE/min

// ── Supabase service client (server-side only) ────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Zod Schemas (AI-agent ready — strict, fully typed) ────────────────────────

const ConditionSchema = z.enum(["Premium", "Excellent", "Good", "Fair"]);

const VariantSchema = z.object({
  sku_code: z.string().min(1).max(100),
  price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().nullable().optional(),
  discount_badge: z.string().max(50).nullable().optional(),
  stock_quantity: z.number().int().nonnegative().default(0),
  condition: ConditionSchema.default("Good"),
  attributes: z.record(z.string(), z.string()).default({}),
});

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug must be lowercase, numbers, hyphens only").optional(),
  brand: z.string().max(100).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_serialized: z.boolean().default(false),
  images: z.array(z.string().url()).default([]),
  specs: z.record(z.string(), z.string()).default({}),
  ai_metadata: z.record(z.string(), z.unknown()).default({}),
  variants: z.array(VariantSchema).min(1, "At least one variant is required"),
});

const UpdateProductSchema = CreateProductSchema.partial().extend({
  variants: z.array(VariantSchema).optional(),
});

// ── Helper: uniform error response ───────────────────────────────────────────
function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

// ── GET /api/admin/products ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = rateLimit(`products:read:${getClientId(req)}`, RL_READ);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select(`
      *,
      variants (*)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq("category_id", category);
  }

  const { data, error, count } = await query;

  if (error) return apiError(error.message, 500);

  // Filter by condition on variant level if requested
  const filtered = condition
    ? data?.map((p) => ({
        ...p,
        variants: p.variants?.filter(
          (v: { condition: string }) => v.condition === condition
        ),
      })).filter((p) => p.variants?.length > 0)
    : data;

  return NextResponse.json({
    data: filtered,
    meta: { total: count ?? 0, page, limit },
  });
}

// ── POST /api/admin/products ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rl = rateLimit(`products:write:${getClientId(req)}`, RL_WRITE);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, parsed.error.flatten());
  }

  const { variants, ...productData } = parsed.data;

  // Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (productError) return apiError(productError.message, 500);

  // Insert variants
  const variantsPayload = variants.map((v) => ({
    ...v,
    product_id: product.id,
  }));

  const { data: createdVariants, error: variantsError } = await supabase
    .from("variants")
    .insert(variantsPayload)
    .select();

  if (variantsError) {
    // Rollback product on variant failure
    await supabase.from("products").delete().eq("id", product.id);
    return apiError(variantsError.message, 500);
  }

  return NextResponse.json(
    { data: { ...product, variants: createdVariants } },
    { status: 201 }
  );
}

// ── PATCH /api/admin/products?id=<uuid> ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const rl = rateLimit(`products:write:${getClientId(req)}`, RL_WRITE);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("Missing product id");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, parsed.error.flatten());
  }

  const { variants, ...productData } = parsed.data;

  // Update product fields
  if (Object.keys(productData).length > 0) {
    const { error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id);
    if (error) return apiError(error.message, 500);
  }

  // Replace all variants if provided
  if (variants && variants.length > 0) {
    await supabase.from("variants").delete().eq("product_id", id);
    const { error } = await supabase.from("variants").insert(
      variants.map((v) => ({ ...v, product_id: id }))
    );
    if (error) return apiError(error.message, 500);
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, variants(*)")
    .eq("id", id)
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ data });
}

// ── DELETE /api/admin/products?id=<uuid> ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const rl = rateLimit(`products:write:${getClientId(req)}`, RL_WRITE);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("Missing product id");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return apiError(error.message, 500);

  return NextResponse.json({ success: true });
}
