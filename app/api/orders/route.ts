// POST /api/orders — place a Cash-on-Delivery order (guest checkout, no auth)
//
// The browser sends contact details plus variant_id + qty only. It never sends
// prices: create_cod_order() looks those up from the DB and computes VAT and
// total itself, so a tampered payload cannot buy a 1300 EGP cable for 1 EGP.
// See supabase/migrations/0003_orders_cod.sql §5.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";

const UuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID");

const OrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  phone:         z.string().trim().min(6).max(30),
  address:       z.string().trim().min(5).max(400),
  city:          z.string().trim().min(2).max(80),
  email:         z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  postal_code:   z.string().trim().max(20).optional(),
  notes:         z.string().trim().max(1000).optional(),
  items: z
    .array(z.object({ variant_id: UuidLike, qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
});

export async function POST(req: NextRequest) {
  // Unauthenticated endpoint that writes to the DB — throttle per IP.
  const limit = rateLimit(`orders:${getClientId(req)}`, { limit: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const o = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_cod_order", {
    p_customer_name: o.customer_name,
    p_phone:         o.phone,
    p_address:       o.address,
    p_city:          o.city,
    // Omitted rather than null — the RPC's own defaults handle absence.
    p_email:         o.email || undefined,
    p_postal_code:   o.postal_code || undefined,
    p_notes:         o.notes || undefined,
    p_items:         o.items,
  });

  if (error) {
    // The RPC raises for an unavailable/inactive variant — that is the customer's
    // problem to fix (stale cart), not a server fault, so surface it as a 409.
    const unavailable = error.message.includes("unavailable");
    console.error("[orders] create_cod_order failed:", error.message);
    return NextResponse.json(
      { error: unavailable ? "ITEM_UNAVAILABLE" : "ORDER_FAILED" },
      { status: unavailable ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true, order_number: data }, { status: 201 });
}
