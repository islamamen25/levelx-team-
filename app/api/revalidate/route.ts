// POST /api/revalidate
// Called by n8n webhooks when DB content changes → invalidates Next.js cache
// Required header: x-webhook-secret
//
// Body (JSON):
//   { type: "category", slug: "mobile" }   → invalidates category + its page
//   { type: "product",  slug: "iphone-15" } → invalidates product + its page
//   {}                                       → full global invalidation

import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const CACHE_PROFILE = "hours";   // must match the profile used in cacheLife()

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    slug?: string;
    type?: "category" | "product";
  };

  const { slug, type } = body;

  // ── Category invalidation ──────────────────────────────────────────────────
  if (type === "category" && slug) {
    revalidateTag("categories", CACHE_PROFILE);
    revalidateTag(`category:${slug}`, CACHE_PROFILE);
    revalidatePath(`/category/${slug}`);
    return NextResponse.json({ ok: true, target: `category:${slug}`, now: Date.now() });
  }

  // ── Product invalidation ───────────────────────────────────────────────────
  if (type === "product" && slug) {
    revalidateTag("products", CACHE_PROFILE);
    revalidateTag(`product:${slug}`, CACHE_PROFILE);
    revalidatePath(`/products/${slug}`);
    return NextResponse.json({ ok: true, target: `product:${slug}`, now: Date.now() });
  }

  // ── Full invalidation fallback ─────────────────────────────────────────────
  revalidateTag("categories", CACHE_PROFILE);
  revalidateTag("products", CACHE_PROFILE);
  revalidateTag("store-config", CACHE_PROFILE);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, target: "global", now: Date.now() });
}
