// PATCH /api/admin/orders?id=<uuid> — change an order's status (admin only)
//
// Status is the only mutable field. Customer details and money are deliberately
// immutable: an order is a historical record, and letting the dashboard rewrite
// totals would defeat the server-side pricing in create_cod_order().

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/require-admin";

const StatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data, error } = await auth.supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // No revalidateTag: the orders page is uncached (reads cookies), so it always
  // reflects the DB on next load.
  return NextResponse.json(data);
}
