/**
 * lib/payment-methods.ts — what this store actually accepts, in one place.
 *
 * The footer used to advertise Visa, Mastercard, PayPal, Klarna and Apple Pay while
 * checkout accepted none of them: the only method is Cash on Delivery. Card logos on a
 * COD-only store mislead the customer at the exact moment they decide whether to trust
 * it. The list lived as a hardcoded array in the footer, with nothing tying it to what
 * checkout does — so it drifted, and nothing would have caught it.
 *
 * Anything that displays accepted payment methods reads ENABLED_PAYMENT_METHODS.
 *
 * `id` mirrors the `payment_method` enum in supabase/migrations/0003_orders_cod.sql,
 * which already reserves 'paymob' — adding it needs no enum migration.
 *
 * TO ENABLE A METHOD: flipping `enabled` to true is the LAST step, not the first. For
 * paymob that means the checkout flow, the webhook route
 * (app/api/webhooks/paymob/route.ts) and HMAC signature verification all exist first —
 * see CLAUDE.md §8. Turning it on here only changes what customers are promised.
 */

export type PaymentMethodId = "cod" | "paymob";

export interface PaymentMethod {
  id: PaymentMethodId;
  /** Key inside the `footer` next-intl namespace. */
  labelKey: string;
  enabled: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "cod", labelKey: "paymentCod", enabled: true },
  // Planned. Zero implementation exists today — do not enable on the strength of a
  // signed contract alone; enable when the verified webhook is live.
  { id: "paymob", labelKey: "paymentCard", enabled: false },
];

export const ENABLED_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m.enabled);
