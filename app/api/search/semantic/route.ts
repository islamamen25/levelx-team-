/**
 * app/api/search/semantic/route.ts — Public semantic-intent search endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 * POST { query: string, maxPrice?: number, category?: string }
 *   → { count, products: [...] }
 *
 * Backed by Meilisearch hybrid (text + OpenAI embedding) search. Per-IP
 * rate-limited (60 req/min). Never throws raw — degrades to empty results.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { vectorSearchProducts } from "@/lib/meilisearch";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";

const BodySchema = z.object({
  query:    z.string().min(1).max(500).transform((s) => s.replace(/<[^>]*>/g, "").trim()),
  maxPrice: z.number().positive().max(1_000_000).optional(),
  category: z.string().min(1).max(60).optional(),
});

const RATE_LIMIT = { limit: 60, windowMs: 60_000 } as const;

export async function POST(req: NextRequest) {
  const ip = getClientId(req);

  const rl = rateLimit(`semantic:${ip}`, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { query, maxPrice, category } = parsed.data;

  const result = await vectorSearchProducts(query, { maxPrice, category });

  return NextResponse.json(result, {
    status:  200,
    headers: rateLimitHeaders(rl),
  });
}
