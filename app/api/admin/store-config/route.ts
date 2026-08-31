import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { isRenderableImage } from "@/lib/images";

const RL_READ  = { limit: 30, windowMs: 60_000 } as const;
const RL_WRITE = { limit: 10, windowMs: 60_000 } as const;

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ThemeSchema = z.object({
  primary:   z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  accent:    z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  surface:   z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  radius:    z.string().regex(/^[\d.]+rem$/, 'Must be e.g. "0.75rem"'),
});

// Every admin-supplied image URL feeds next/image sooner or later, and next/image
// throws (with no error boundary catching it — see lib/images.ts) for any host outside
// its remotePatterns allowlist. isRenderableImage() is that same allowlist — reusing it
// here means a URL that fails validation can never reach the DB in the first place, no
// matter which of the Builder's fields it came through.
const imageField = z.union([
  z.literal(""),
  z.string().refine(isRenderableImage, "Image host not allowed — use an uploaded image or an images.unsplash.com URL"),
]).optional();

// Same "" ⇒ clear-back-to-default shape as imageField, for the tile accent colour picker.
const hexColorField = z.union([
  z.literal(""),
  z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
]).optional();

const SectionSchema = z.object({
  id:          z.string().min(1),
  label:       z.string().min(1),
  visible:     z.boolean(),
  order:       z.number().int().nonnegative(),
  product_ids: z.array(z.string()).optional(),  // PIM → CMS bridge
  image_url:   imageField,                      // featured / brands: side lifestyle photo
  brands: z.array(z.object({
    name:       z.string().min(1),
    logo_url:   imageField,
    show_label: z.boolean().optional(),
  })).optional(),                                // brands: overrides the built-in logo row
  tile_shape: z.enum(["square", "rounded", "circle"]).optional(),
  // hexColorField (not a bare regex) because the Builder's "Reset" buttons send "" to
  // clear back to the built-in default — a bare regex would reject that and fail the
  // save with a 422 the moment someone clicked Reset.
  tile_accent_color: hexColorField,
  tile_text_color:   hexColorField,
  tile_text_size:    z.enum(["sm", "md", "lg"]).optional(),
  tiles: z.array(z.object({
    category_slug: z.string().min(1),
    label:         z.string().optional(),
    sublabel:      z.string().optional(),
    image_url:     imageField,
    accent_color:  hexColorField,
  })).optional(),                                // categories: overrides the built-in icon tiles
  chips: z.array(z.object({
    label:     z.string().optional(),
    image_url: imageField,
    href:      z.string().regex(/^\/(?!\/)/, "Must be an internal path starting with /").optional(),
  })).optional(),                                // featured: overrides the automatic filter chips
});

const UpdateConfigSchema = z.object({
  theme:  ThemeSchema.optional(),
  layout: z.array(SectionSchema).optional(),
});

function apiError(msg: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: msg, details }, { status });
}

// ── GET /api/admin/store-config ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rl = rateLimit(`config:read:${getClientId(req)}`, RL_READ);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("store_configuration")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ data });
}

// ── PATCH /api/admin/store-config ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const rl = rateLimit(`config:write:${getClientId(req)}`, RL_WRITE);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Invalid JSON"); }

  const parsed = UpdateConfigSchema.safeParse(body);
  if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

  // Use update without .single() to avoid "coerce to single object" error
  const { error } = await supabase
    .from("store_configuration")
    .update(parsed.data)
    .eq("id", 1);

  if (error) return apiError(error.message, 500);

  // getStoreConfig() (lib/store-config.ts) caches this row under cacheTag("store-config")
  // with cacheLife("minutes") — without this, a Builder save would take up to a few
  // minutes to reach the homepage instead of showing immediately after "Saved ✓".
  // { expire: 0 } (not the bare/deprecated single-arg form, and not profile "max" —
  // "max" only marks the tag stale-while-revalidate, so the *next* request still shows
  // the old value) is what the Next 16 docs call out for a Route Handler that needs the
  // very next request to see fresh data, which is exactly the Builder's save-then-reload flow.
  revalidateTag("store-config", { expire: 0 });

  // Re-fetch the updated row to return it
  const { data, error: fetchError } = await supabase
    .from("store_configuration")
    .select("*")
    .eq("id", 1)
    .single();

  if (fetchError) return apiError(fetchError.message, 500);
  return NextResponse.json({ data });
}
