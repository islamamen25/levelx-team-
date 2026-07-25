import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser / client-side singleton
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ── Convenience row types ─────────────────────────────────────────────────────

export type ProductCondition = Database["public"]["Enums"]["product_condition"];

export type DbProduct = Database["public"]["Tables"]["products"]["Row"];

export type DbVariant = Database["public"]["Tables"]["variants"]["Row"];

export type DbCategory = Database["public"]["Tables"]["categories"]["Row"];

export type DbTranslation = Database["public"]["Tables"]["product_translations"]["Row"];
