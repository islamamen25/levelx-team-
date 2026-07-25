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
import { routing } from "@/i18n/routing";

// `{ expire: 0 }` — deliberately NOT a named profile like "hours"/"max".
// A named profile only marks the tag stale, so the next visitor is still
// served the OLD page while fresh data loads behind it. Next 16 documents
// `{ expire: 0 }` as the way an external caller (this endpoint is invoked by
// the product pipeline after it writes to Supabase) forces immediate expiry.
const IMMEDIATE = { expire: 0 } as const;

// localePrefix is "always" (i18n/routing.ts), so every public URL is
// /en/... or /ar/... — a bare "/products/x" matches no route file and
// silently revalidates nothing.
const localePaths = (suffix: string) =>
  routing.locales.map((locale) => `/${locale}${suffix}`);

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
    revalidateTag("categories", IMMEDIATE);
    revalidateTag(`category:${slug}`, IMMEDIATE);
    for (const path of localePaths(`/category/${slug}`)) revalidatePath(path);
    return NextResponse.json({ ok: true, target: `category:${slug}`, now: Date.now() });
  }

  // ── Product invalidation ───────────────────────────────────────────────────
  if (type === "product" && slug) {
    revalidateTag("products", IMMEDIATE);
    revalidateTag(`product:${slug}`, IMMEDIATE);
    for (const path of localePaths(`/products/${slug}`)) revalidatePath(path);
    return NextResponse.json({ ok: true, target: `product:${slug}`, now: Date.now() });
  }

  // ── Full invalidation fallback ─────────────────────────────────────────────
  revalidateTag("categories", IMMEDIATE);
  revalidateTag("products", IMMEDIATE);
  revalidateTag("store-config", IMMEDIATE);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, target: "global", now: Date.now() });
}
