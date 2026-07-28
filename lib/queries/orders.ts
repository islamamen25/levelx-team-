// NOTE: no 'use cache' anywhere in this file — every query here reads cookies()
// through the SSR client for the admin session, which is illegal inside a cache
// scope (this is the bug that broke /dashboard/catalog once; see CONTEXT.md §3).
// Orders must be read live anyway: a stale order list is worse than a slow one.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type OrderStatus   = Database["public"]["Enums"]["order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export type OrderItemRow = {
  id:           string;
  product_name: string;
  sku_code:     string | null;
  price:        number;
  qty:          number;
  product_id:   string | null;
};

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: OrderItemRow[];
};

/**
 * All orders, newest first, with their line items.
 *
 * RLS does the access control: the admin_all policies require is_admin(), so a
 * non-admin session simply gets an empty list rather than an error. The (admin)
 * layout already blocks non-admins from reaching this page at all.
 */
export async function getOrdersAdmin(): Promise<OrderRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, customer_name, email, phone, address, city, postal_code,
       notes, payment_method, status, subtotal, vat, total, created_at, updated_at,
       order_items ( id, product_name, sku_code, price, qty, product_id )`
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getOrdersAdmin: ${error.message}`);
  return (data ?? []) as OrderRow[];
}
