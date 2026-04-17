import { tool } from "ai";
import { z } from "zod";
import { PRODUCTS } from "@/lib/mock-products";

export const searchProductsTool = tool({
  description: "Search for refurbished electronics products by query, category, or price",
  inputSchema: z.object({
    query: z.string().describe("Search query (product name, brand, or type)"),
    category: z.string().optional().describe("Filter by category: Smartphones, Laptops, Tablets, Consoles, Smartwatches, Headphones"),
    maxPrice: z.number().optional().describe("Maximum price in GBP"),
  }),
  execute: async ({ query, category, maxPrice }) => {
    const q = query.toLowerCase();

    const results = PRODUCTS.filter((p) => {
      const text = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      if (!text.includes(q) && q !== "all") return false;
      if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
      const cheapest = Math.min(...p.variants.map((v) => v.price));
      if (maxPrice && cheapest > maxPrice) return false;
      return true;
    }).map((p) => {
      const cheapest = p.variants.reduce((a, b) => (a.price < b.price ? a : b));
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: cheapest.price,
        originalPrice: cheapest.original_price,
        rating: p.rating,
        reviewCount: p.review_count,
      };
    });

    return {
      count: results.length,
      products: results.slice(0, 5),
    };
  },
});
