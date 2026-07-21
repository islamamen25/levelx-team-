/**
 * lib/embeddings.ts — OpenAI text-embedding-3-small wrapper
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for query / document embeddings used by Meilisearch
 * vector search. Hard-caps input length so a malicious or runaway prompt cannot
 * blow up our token bill.
 */

import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small" as const;
export const EMBEDDING_DIMENSIONS = 1536 as const;

const MAX_INPUT_CHARS = 2000;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

export async function embedQuery(text: string): Promise<number[]> {
  const trimmed = text.trim().slice(0, MAX_INPUT_CHARS);
  if (!trimmed) {
    throw new Error("embedQuery: empty input");
  }
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const inputs = texts.map((t) => t.trim().slice(0, MAX_INPUT_CHARS)).filter(Boolean);
  if (inputs.length === 0) return [];
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
  });
  return res.data.map((d) => d.embedding);
}
