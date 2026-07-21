/**
 * scripts/seed-meilisearch.ts — Index products from Supabase into Meilisearch
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with:
 *   npx tsx scripts/seed-meilisearch.ts
 *
 * Required env: MEILISEARCH_HOST, MEILISEARCH_API_KEY, OPENAI_API_KEY,
 *               NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * What it does:
 *   1. Fetches all active products + their variants from Supabase.
 *   2. Configures the index's filterable / sortable / searchable attrs.
 *   3. Configures the OpenAI embedder (text-embedding-3-small, dim 1536).
 *   4. Embeds each document body and pushes as a single batch.
 *
 * Idempotent — re-running upserts by `id`.
 */

import * as dotenv from "dotenv";
// Load .env.local for local runs
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { MeiliSearch } from "meilisearch";
import { embedBatch, EMBEDDING_DIMENSIONS } from "../lib/embeddings";

const HOST      = process.env.MEILISEARCH_HOST;
const API_KEY   = process.env.MEILISEARCH_API_KEY;
const INDEX_NAME    = process.env.MEILISEARCH_INDEX_NAME ?? "products";
const EMBEDDER_NAME = "default";

if (!HOST)                            throw new Error("MEILISEARCH_HOST is not set");
if (!process.env.OPENAI_API_KEY)      throw new Error("OPENAI_API_KEY is not set");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProductDoc {
  id:             string;
  slug:           string;
  name:           string;
  brand:          string;
  categoryId:     string;
  price:          number;
  conditions:     string[];
  searchableBody: string;
  _vectors?:      { [embedder: string]: number[] };
}

function buildSearchableBody(p: {
  name: string;
  brand: string | null;
  description: string | null;
  specs: Record<string, string> | null;
}): string {
  const specsLine = p.specs
    ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(", ")
    : "";
  return [
    p.name,
    p.brand,
    p.description,
    `Refurbished electronics`,
    specsLine,
  ].filter(Boolean).join(". ");
}

async function main() {
  // ── 1. Fetch products + variants from Supabase ──────────────────────────────
  console.log("[seed] fetching products from Supabase…");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, brand, description, category_id, specs, variants(price, sale_price, condition)")
    .eq("is_active", true)
    .not("slug", "is", null);

  if (error) throw new Error(`Supabase error: ${error.message}`);
  if (!products?.length) {
    console.log("[seed] no active products found — nothing to index.");
    return;
  }

  console.log(`[seed] found ${products.length} products.`);

  // ── 2. Connect to Meilisearch ───────────────────────────────────────────────
  const client = new MeiliSearch({ host: HOST!, apiKey: API_KEY });
  const index  = client.index(INDEX_NAME);

  console.log(`[seed] configuring index "${INDEX_NAME}"…`);

  await index.updateSettings({
    searchableAttributes: ["name", "brand", "searchableBody"],
    filterableAttributes: ["categoryId", "brand", "price", "conditions"],
    sortableAttributes:   ["price"],
  });

  await index.updateEmbedders({
    [EMBEDDER_NAME]: {
      source:     "userProvided",
      dimensions: EMBEDDING_DIMENSIONS,
    },
  });

  // ── 3. Build docs ───────────────────────────────────────────────────────────
  const docs: ProductDoc[] = products.map((p) => {
    const variants = (p.variants as { price: number; sale_price: number | null; condition: string }[]) ?? [];
    const minPrice = variants.length
      ? Math.min(...variants.map((v) => v.sale_price ?? v.price))
      : 0;
    const conditions = [...new Set(variants.map((v) => v.condition))];

    return {
      id:             p.id,
      slug:           p.slug as string,
      name:           p.name,
      brand:          p.brand ?? "",
      categoryId:     p.category_id ?? "",
      price:          minPrice,
      conditions,
      searchableBody: buildSearchableBody({
        name:        p.name,
        brand:       p.brand,
        description: p.description,
        specs:       p.specs as Record<string, string> | null,
      }),
    };
  });

  // ── 4. Embed + upload ───────────────────────────────────────────────────────
  console.log(`[seed] embedding ${docs.length} products with text-embedding-3-small…`);
  const vectors = await embedBatch(docs.map((d) => d.searchableBody));

  for (let i = 0; i < docs.length; i++) {
    docs[i]._vectors = { [EMBEDDER_NAME]: vectors[i] };
  }

  console.log(`[seed] uploading ${docs.length} documents to Meilisearch…`);
  const task = await index.addDocuments(docs, { primaryKey: "id" });
  console.log(`[seed] enqueued task #${task.taskUid}; waiting for completion…`);
  await client.tasks.waitForTask(task.taskUid);

  console.log("[seed] done ✓");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
