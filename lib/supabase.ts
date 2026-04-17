import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser / client-side singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types aligned with DB schema ──────────────────────────────────────────────

export type ProductCondition = "Premium" | "Excellent" | "Good" | "Fair";

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  brand: string | null;
  category_id: string | null;
  is_serialized: boolean;
  images: string[];          // ordered Supabase Storage public URLs
  specs: Record<string, string>;
  ai_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbVariant {
  id: string;
  product_id: string;
  sku_code: string;
  price: number;
  sale_price: number | null;
  discount_badge: string | null;
  stock_quantity: number;
  condition: ProductCondition;
  attributes: Record<string, string>;
  created_at: string;
  updated_at: string;
}
