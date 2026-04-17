import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";

const RL_READ  = { limit: 30, windowMs: 60_000 } as const;
const RL_WRITE = { limit: 10, windowMs: 60_000 } as const;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ThemeSchema = z.object({
  primary:   z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  accent:    z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  surface:   z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex colour"),
  radius:    z.string().regex(/^[\d.]+rem$/, 'Must be e.g. "0.75rem"'),
});

const SectionSchema = z.object({
  id:          z.string().min(1),
  label:       z.string().min(1),
  visible:     z.boolean(),
  order:       z.number().int().nonnegative(),
  product_ids: z.array(z.string()).optional(),  // PIM → CMS bridge
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

  // Re-fetch the updated row to return it
  const { data, error: fetchError } = await supabase
    .from("store_configuration")
    .select("*")
    .eq("id", 1)
    .single();

  if (fetchError) return apiError(fetchError.message, 500);
  return NextResponse.json({ data });
}
