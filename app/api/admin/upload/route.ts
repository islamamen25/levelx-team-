import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/supabase/require-admin";

/**
 * Image upload for the admin product form.
 *
 * This exists as a server route rather than a direct browser upload for one
 * concrete reason: **the browser Supabase singleton has no session.** Login is a
 * Server Action (`app/[locale]/login/actions.ts`) using the `@supabase/ssr`
 * cookie client, so the access token lives in httpOnly cookies. `lib/supabase.ts`
 * is a plain `createClient()` reading localStorage, which is empty — every
 * request it makes is anonymous. The old form called
 * `supabase.storage.upload()` from the browser directly, so even with correct
 * storage policies in place it would still be denied as `anon`.
 *
 * Going through `requireAdmin()` picks up the cookie session, so the upload
 * reaches Supabase Storage as an authenticated admin and satisfies the
 * `product_images_admin_insert` policy. It also matches how every other admin
 * write in this app works (CLAUDE.md §4b).
 *
 * The cowork script path (`levelx-images.py`) is untouched — it authenticates
 * with the service_role key, which bypasses RLS entirely.
 */

const RL_UPLOAD = { limit: 30, windowMs: 60_000 } as const; // 30 files/min

const BUCKET = "product-images";
const MAX_FILES = 10;

// The form downscales to WebP before sending, so anything arriving here should
// be well under this. It is a backstop against a broken/bypassed client, not
// the primary size control.
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};

/** Storage object keys are path segments — keep them boring and collision-free. */
function safeSlug(input: string): string {
  const s = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s.slice(0, 60) || "product";
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`upload:${getClientId(req)}`, RL_UPLOAD);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files received" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `At most ${MAX_FILES} images per upload` }, { status: 400 });
  }

  // Group uploads under the product slug when the form knows it, so the bucket
  // stays browsable and matches what levelx-images.py writes (products/<slug>/…).
  const slug = safeSlug(String(form.get("slug") ?? ""));

  const urls: string[] = [];
  const failed: string[] = [];

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      failed.push(`${file.name}: unsupported type (${file.type || "unknown"})`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      failed.push(`${file.name}: ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the 5 MB limit`);
      continue;
    }

    const path = `products/${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[file.type]}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });

    if (error) {
      failed.push(`${file.name}: ${error.message}`);
      continue;
    }

    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  // 207: some succeeded, some did not. The form shows both halves rather than
  // discarding good uploads because one file was bad.
  const status = failed.length === 0 ? 200 : urls.length > 0 ? 207 : 400;
  return NextResponse.json({ urls, failed }, { status, headers: rateLimitHeaders(rl) });
}
