/**
 * lib/tools/search-products.ts — AI SDK v6 tool: semantic product search
 * ─────────────────────────────────────────────────────────────────────────────
 * The chat agent calls this tool to satisfy a user's shopping intent. It hands
 * the natural-language intent to Meilisearch + text-embedding-3-small (see
 * lib/meilisearch.ts) so "cheap laptop for college" returns laptops by meaning,
 * not keyword overlap.
 */

import { tool } from "ai";
import { z } from "zod";
import { vectorSearchProducts } from "@/lib/meilisearch";

export const searchProductsTool = tool({
  description:
    "Search the LevelX catalogue for electronics and accessories using semantic intent. " +
    "Pass the user's natural-language need (e.g. 'gaming phone under 1000', " +
    "'lightweight laptop for design students'); the engine does the matching.",
  inputSchema: z.object({
    intent: z
      .string()
      .min(2)
      .max(500)
      .describe('Semantic intent of the shopper, e.g. "gaming phone under EGP 20000"'),
    maxPrice: z
      .number()
      .positive()
      .optional()
      .describe("Optional EGP price ceiling extracted from the user's message"),
    category: z
      .string()
      .optional()
      .describe(
        "Optional category UUID or slug filter (e.g. mobile, gaming, computing, smart-devices, car-accessories)"
      ),
  }),
  execute: async ({ intent, maxPrice, category }) => {
    return vectorSearchProducts(intent, { maxPrice, category, limit: 5 });
  },
});
