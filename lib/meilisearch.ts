/**
 * lib/meilisearch.ts — Semantic Vector Search utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Meilisearch holds the product index and the OpenAI text-embedding-3-small
 * vectors. We query with both the user's raw text AND a freshly-embedded vector
 * (hybrid search) so semantic intent — "cheap laptop for college" — surfaces
 * laptops, not whatever happens to share keywords.
 *
 * Designed so that a missing host / API key / index does NOT crash the chat
 * route — it returns an empty result set so the AI can gracefully tell the
 * user nothing was found.
 */

import { MeiliSearch } from "meilisearch";
import { embedQuery } from "./embeddings";

export interface SemanticProductHit {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  conditions: string[];
}

export interface SemanticSearchResult {
  count: number;
  products: SemanticProductHit[];
}

export interface SemanticSearchOptions {
  limit?: number;
  maxPrice?: number;
  category?: string;
}

const DEFAULT_LIMIT = 5;
const DEFAULT_INDEX = "products";
const EMBEDDER_NAME = "default";
const SEMANTIC_RATIO = 0.85;

let _client: MeiliSearch | null = null;
function getClient(): MeiliSearch | null {
  if (_client) return _client;
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_API_KEY;
  if (!host) return null;
  _client = new MeiliSearch({ host, apiKey });
  return _client;
}

export function getMeilisearchIndexName(): string {
  return process.env.MEILISEARCH_INDEX_NAME ?? DEFAULT_INDEX;
}

export function getMeilisearchClient(): MeiliSearch | null {
  return getClient();
}

interface RawHit {
  id?: string;
  slug?: string;
  name?: string;
  brand?: string;
  categoryId?: string;
  price?: number;
  conditions?: string[];
}

function normalizeHit(hit: RawHit): SemanticProductHit | null {
  if (!hit.id || !hit.slug || !hit.name) return null;
  return {
    id:         String(hit.id),
    slug:       String(hit.slug),
    name:       String(hit.name),
    brand:      String(hit.brand ?? ""),
    categoryId: String(hit.categoryId ?? ""),
    price:      Number(hit.price ?? 0),
    conditions: hit.conditions ?? [],
  };
}

function buildFilter(opts: SemanticSearchOptions): string | undefined {
  const parts: string[] = [];
  if (opts.category) {
    // category is stored as a UUID categoryId in the index
    parts.push(`categoryId = "${opts.category.replace(/"/g, '\\"')}"`);
  }
  if (typeof opts.maxPrice === "number" && Number.isFinite(opts.maxPrice)) {
    parts.push(`price <= ${opts.maxPrice}`);
  }
  return parts.length ? parts.join(" AND ") : undefined;
}

export async function vectorSearchProducts(
  intent: string,
  opts: SemanticSearchOptions = {}
): Promise<SemanticSearchResult> {
  const client = getClient();
  if (!client) {
    console.warn("[meilisearch] MEILISEARCH_HOST not set — returning empty result");
    return { count: 0, products: [] };
  }

  let vector: number[] | undefined;
  try {
    vector = await embedQuery(intent);
  } catch (err) {
    console.warn("[meilisearch] embedQuery failed, falling back to keyword search", err);
  }

  try {
    const index = client.index(getMeilisearchIndexName());
    const filter = buildFilter(opts);
    const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_LIMIT, 20));

    const searchParams: Record<string, unknown> = {
      limit,
      ...(filter ? { filter } : {}),
    };
    if (vector) {
      searchParams.vector = vector;
      searchParams.hybrid = { embedder: EMBEDDER_NAME, semanticRatio: SEMANTIC_RATIO };
    }

    const response = await index.search<RawHit>(intent, searchParams);
    const products = (response.hits ?? [])
      .map(normalizeHit)
      .filter((p): p is SemanticProductHit => p !== null);

    return { count: products.length, products };
  } catch (err) {
    console.error("[meilisearch] search failed", err);
    return { count: 0, products: [] };
  }
}
