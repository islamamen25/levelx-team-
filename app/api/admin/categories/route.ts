// GET /api/admin/categories — قائمة كل الأقسام (admin)
// POST   — إنشاء قسم جديد
// PATCH  — تعديل قسم (name, slug, parent_id, is_visible)
// DELETE — حذف قسم (CASCADE في الـ DB)

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// z.string().uuid() enforces strict RFC4122 (variant nibble must be 8/9/a/b).
// This project's categories were seeded with memorable-but-non-compliant ids
// like b4444444-4444-4444-4444-444444444444 ("Power bank") — valid to
// Postgres's native uuid type, but rejected by z.string().uuid(). Match the
// DB's actual leniency instead (see app/api/admin/products/route.ts for the
// same issue on category_id there).
const UuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID");

const CategorySchema = z.object({
  name:         z.string().min(1),
  slug:         z.string().min(1).regex(/^[a-z0-9-]+$/),
  parent_id:    UuidLike.nullable().optional(),
  is_visible:   z.boolean().optional(),
  // Home page presentation, all admin-controlled
  in_carousel:  z.boolean().optional(),
  sort_order:   z.number().int().optional(),
  icon:         z.string().max(40).nullable().optional(),
  color_key:    z.string().max(40).nullable().optional(),
  display_name: z.string().max(60).nullable().optional(),
});

// في Next.js 16.2 يتطلب revalidateTag الـ profile كـ argument ثانٍ
const CACHE_PROFILE = "hours";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, is_visible")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("categories", CACHE_PROFILE);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = CategorySchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("categories", CACHE_PROFILE);
  if (data.slug) revalidateTag(`category:${data.slug}`, CACHE_PROFILE);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("categories", CACHE_PROFILE);
  return NextResponse.json({ ok: true });
}
