/**
 * Delivery-fee rules — the shape stored in `store_configuration.delivery`, its
 * default, and the fee calculation.
 *
 * Kept in its own module with NO `"use cache"` / server directives so the
 * checkout form (a Client Component) can import `computeShipping`. The
 * authoritative figure for an order is recomputed inside `create_cod_order()`
 * (migration 0007) from this same shape — keep the two in step.
 */

/** One admin-defined per-governorate delivery price. `name` is a canonical
    governorate value from `lib/egypt-governorates.ts`. */
export interface GovernorateFee {
  name: string;
  fee:  number;
}

export interface DeliveryConfig {
  /** free = never charge · threshold = free above `free_over`, else the fee ·
      flat = always charge the fee. */
  mode:      "free" | "threshold" | "flat";
  /** Base fee (used by `flat`, and by `threshold` below the free line). */
  fee:       number;
  /** Order subtotal at/above which delivery is free (`threshold` mode only). */
  free_over: number;
  /** Per-governorate overrides of `fee`. An unlisted governorate uses `fee`. */
  governorates: GovernorateFee[];
}

export const DEFAULT_DELIVERY: DeliveryConfig = {
  mode: "free",
  fee: 0,
  free_over: 0,
  governorates: [],
};

/** Fills any missing field with its default — guards against a `delivery` row
    written before a field existed, or a null column pre-migration. */
export function normaliseDelivery(d: Partial<DeliveryConfig> | null | undefined): DeliveryConfig {
  if (!d) return DEFAULT_DELIVERY;
  return {
    mode:         d.mode ?? DEFAULT_DELIVERY.mode,
    fee:          Number.isFinite(d.fee) ? Number(d.fee) : DEFAULT_DELIVERY.fee,
    free_over:    Number.isFinite(d.free_over) ? Number(d.free_over) : DEFAULT_DELIVERY.free_over,
    governorates: Array.isArray(d.governorates) ? d.governorates : DEFAULT_DELIVERY.governorates,
  };
}

/**
 * Delivery fee for an order — the display mirror of the logic inside
 * `create_cod_order()`. `subtotal` is the sum of line prices (VAT-inclusive,
 * since VAT is baked into product prices now).
 *
 *   free               → 0
 *   threshold, over    → 0   (the free line beats any per-governorate price)
 *   otherwise          → the governorate's own fee if set, else the base fee
 */
export function computeShipping(
  subtotal: number,
  governorate: string,
  d: DeliveryConfig,
): number {
  if (d.mode === "free") return 0;
  if (d.mode === "threshold" && d.free_over > 0 && subtotal >= d.free_over) return 0;
  const override = d.governorates.find((g) => g.name === governorate);
  return Math.max(0, override ? override.fee : d.fee);
}
