import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/supabase/require-admin";

// Rate limits: read ops are generous (browsing), writes are strict
const RL_READ  = { limit: 60, windowMs: 60_000 } as const;   // 60 GET/min
const RL_WRITE = { limit: 20, windowMs: 60_000 } as const;   // 20 POST|PATCH|DELETE/min

// `{ expire: 0 }` — not a named profile like "hours"/"max". A named profile
// only marks the tag stale, so the next visit is served the STALE page while
// fresh data loads behind it; an admin who just saved would still see the old
// content. Next 16 documents `{ expire: 0 }` as the way a Route Handler forces
// immediate expiry (`updateTag` would be the alternative, but it is Server
// Action-only and this is a fetch() to an API route).
const IMMEDIATE = { expire: 0 } as const;

/**
 * Purge the storefront cache after an admin write.
 *
 * Without this, lib/queries/products.ts serves every read from `"use cache"` +
 * cacheLife("hours"), so an edit made here would not reach
 * /[locale]/products/[slug] or the category/listing pages for up to an hour.
 * The "products" tag covers the listing + category queries; the per-slug tag
 * covers the PDP. Pass every slug the product has been known by, so renaming a
 * slug also invalidates the old URL.
 */
function revalidateProducts(...slugs: (string | null | undefined)[]) {
  revalidateTag("products", IMMEDIATE);
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidateTag(`product:${slug}`, IMMEDIATE);
  }
}

// ── Zod Schemas (AI-agent ready — strict, fully typed) ────────────────────────

const ConditionSchema = z.enum(["Premium", "Excellent", "Good", "Fair"]);

// Messages are written to read after a field label, because describeSaveError in
// components/admin/product-form.tsx renders them as "<Field> <message>". Setting
// them explicitly also stops the UI text from depending on Zod's default wording.
const VariantSchema = z.object({
  sku_code: z.string().min(1, "is required").max(100, "is longer than 100 characters"),
  // `.positive()`, not `.nonnegative()`. A blank price box used to arrive here as
  // 0 (`parseFloat("") || 0`), pass validation, and put the product on sale for
  // 0 EGP with no error shown anywhere — the only silent way to lose money on
  // this form. The form now sends null for a blank or unparseable box, and 0 is
  // rejected outright. Checked against live data first: the lowest existing
  // price is 1300, so no current product becomes uneditable.
  price: z.number({ error: "is required" }).positive("must be greater than zero"),
  sale_price: z.number().nonnegative().nullable().optional(),
  discount_badge: z.string().max(50).nullable().optional(),
  stock_quantity: z.number().int().nonnegative().default(0),
  condition: ConditionSchema.default("Good"),
  attributes: z.record(z.string(), z.string()).default({}),
});

// Mirrors the DB CHECK constraint product_translations_lang_check.
// PATCH relies on this being the complete set of languages a product can have.
const LANGS = ["en", "ar"] as const;

// zod's z.string().uuid() enforces strict RFC4122 (requires the variant
// nibble to be 8/9/a/b). This project's categories table was seeded with
// memorable-but-non-compliant ids like b4444444-4444-4444-4444-444444444444
// ("Power bank") — valid as far as Postgres's native uuid type is concerned,
// but every one of them fails z.string().uuid(). That silently 422'd EVERY
// product save that included a category (i.e. virtually all of them), with
// the admin form only ever surfacing a generic "Validation failed" message.
// Match the DB's actual leniency instead of RFC4122.
const UuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID");

const TranslationSchema = z.object({
  lang: z.enum(LANGS),
  title: z.string().max(255).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  specs: z.record(z.string(), z.string()).default({}),
});

const CreateProductSchema = z.object({
  name: z.string().min(1, "is required").max(255, "is longer than 255 characters"),
  description: z.string().max(5000).nullable().optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug must be lowercase, numbers, hyphens only").optional(),
  brand: z.string().max(100).nullable().optional(),
  category_id: UuidLike.nullable().optional(),
  is_active: z.boolean().default(true),
  is_serialized: z.boolean().default(false),
  images: z.array(z.string().url()).default([]),
  specs: z.record(z.string(), z.string()).default({}),
  ai_metadata: z.record(z.string(), z.unknown()).default({}),
  variants: z.array(VariantSchema).min(1, "At least one variant is required"),
  // Per-language title/description/specs shown on the storefront. Optional —
  // languages with no meaningful content are omitted by the admin form.
  translations: z.array(TranslationSchema).default([]),
});

// CreateProductSchema.partial() makes every field optional, but a field
// that also carries .default(...) (images, specs, ai_metadata,
// is_serialized) still gets its default substituted in whenever the key is
// merely ABSENT from the request body — Zod applies .default() to
// `undefined`, and a missing key reads as `undefined` too. On PATCH that
// silently resets the column to its default (e.g. ai_metadata, which has no
// UI field in the admin form at all, was getting wiped to {} — including the
// barcode stored in ai_metadata.ean — on every single save). Re-declare
// these as plain .optional() with no default so "absent" means "leave this
// column alone", not "reset it".
const UpdateProductSchema = CreateProductSchema.partial().extend({
  is_active: z.boolean().optional(),
  is_serialized: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
  specs: z.record(z.string(), z.string()).optional(),
  ai_metadata: z.record(z.string(), z.unknown()).optional(),
  variants: z.array(VariantSchema).optional(),
  translations: z.array(TranslationSchema).optional(),
});

// ── Helper: uniform error response ───────────────────────────────────────────
function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Field-level detail for a 422, keyed by the FULL issue path.
 *
 * `error.flatten()` groups issues by `path[0]` only, so a blank SKU inside
 * variants[0] arrives as `{ variants: ["String must contain at least 1
 * character(s)"] }` — the sub-field is gone. Combined with the form showing
 * only `err.error`, an admin who left the SKU empty saw the words "Validation
 * failed" and nothing else, on a form with roughly twenty inputs. That is the
 * single most likely thing to happen to a first-time user, because
 * defaultVariant() starts with an empty sku_code.
 *
 * Keeping the path means the message can name the actual box to go and fill.
 */
function validationDetails(error: z.ZodError) {
  return {
    fields: error.issues.map((i) => ({
      path: i.path.join(".") || "(body)",
      message: i.message,
    })),
  };
}

// ── GET /api/admin/products ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = rateLimit(`products:read:${getClientId(req)}`, RL_READ);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

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

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, validationDetails(parsed.error));
  }

  const { variants, translations, ...productData } = parsed.data;

  // Insert product (cast JSONB fields to satisfy Supabase Json type)
  const { data: product, error: productError } = await supabase
    .from("products")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(productData as any)
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

  // Insert translations (non-fatal: product + variants already committed)
  if (translations && translations.length > 0) {
    const { error: translationsError } = await supabase
      .from("product_translations")
      .insert(translations.map((t) => ({ ...t, product_id: product.id })));
    if (translationsError) return apiError(translationsError.message, 500);
  }

  revalidateProducts(product.slug);

  return NextResponse.json(
    { data: { ...product, variants: createdVariants } },
    { status: 201 }
  );
}

// ── PATCH /api/admin/products?id=<uuid> ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const rl = rateLimit(`products:write:${getClientId(req)}`, RL_WRITE);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

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
    return apiError("Validation failed", 422, validationDetails(parsed.error));
  }

  const { variants, translations, ...productData } = parsed.data;

  // Capture the slug before the update: if this request renames it, the old
  // PDP URL still holds a cached entry under the old per-slug tag.
  let previousSlug: string | null = null;
  if (productData.slug !== undefined) {
    const { data: existing } = await supabase
      .from("products")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    previousSlug = existing?.slug ?? null;
  }

  // Update product fields
  if (Object.keys(productData).length > 0) {
    const { error } = await supabase
      .from("products")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(productData as any)
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

  // When `translations` is present it is the COMPLETE desired set for this
  // product — mirroring how `variants` above is a full replacement.
  //
  // The upsert alone can only add or update, never remove. The admin form
  // drops a language from the payload once all of its fields are blank, so
  // upsert-only meant clearing a translation in the UI silently left the old
  // row in the DB and the storefront kept serving it. Deleting the languages
  // that are absent is what makes "clear the fields and save" actually work.
  //
  // Omitting the key entirely (translations === undefined) still leaves every
  // translation untouched, so a partial PATCH cannot wipe them by accident.
  if (translations) {
    if (translations.length > 0) {
      const { error } = await supabase
        .from("product_translations")
        .upsert(
          translations.map((t) => ({ ...t, product_id: id })),
          { onConflict: "product_id,lang" }
        );
      if (error) return apiError(error.message, 500);
    }

    const removed = LANGS.filter((lang) => !translations.some((t) => t.lang === lang));
    if (removed.length > 0) {
      const { error } = await supabase
        .from("product_translations")
        .delete()
        .eq("product_id", id)
        .in("lang", removed);
      if (error) return apiError(error.message, 500);
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, variants(*)")
    .eq("id", id)
    .single();

  if (error) return apiError(error.message, 500);

  revalidateProducts(previousSlug, data.slug);

  return NextResponse.json({ data });
}

// ── DELETE /api/admin/products?id=<uuid> ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const rl = rateLimit(`products:write:${getClientId(req)}`, RL_WRITE);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError("Missing product id");

  // Read the slug first — after the delete there is no row left to derive the
  // per-slug cache tag from, and the PDP would keep serving the stale page.
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return apiError(error.message, 500);

  revalidateProducts(existing?.slug);

  return NextResponse.json({ success: true });
}
