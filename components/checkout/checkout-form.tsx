"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Banknote, ShieldCheck, PackageCheck, CheckCircle2, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatEGP } from "@/lib/format";

interface CheckoutFormProps {
  locale: string;
}

/**
 * Egypt standard VAT. This is the *display* rate — the authoritative figure is
 * recomputed server-side in create_cod_order() (migration 0003), so the two must
 * be kept in step. Was hardcoded 0.2 (a UK-template leftover, alongside the £
 * symbols removed earlier).
 */
const VAT_RATE = 0.14;

/** Mirrors the per-line ceiling enforced inside create_cod_order() (migration 0005). */
const MAX_QTY = 99;


const inputClass =
  "w-full rounded-xl border border-[var(--color-iron)] bg-white px-4 py-3 text-sm text-ceramic placeholder:text-slate focus:border-[var(--color-mint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]/15 transition-colors";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5";

export function CheckoutForm({ locale }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const [placedNumber, setPlacedNumber] = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const items      = useCartStore((s) => s.items);
  const updateQty  = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart  = useCartStore((s) => s.clearCart);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const vat      = Math.round(subtotal * VAT_RATE);
  const total    = subtotal + vat;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      customer_name: `${fd.get("firstName") ?? ""} ${fd.get("lastName") ?? ""}`.trim(),
      phone:         String(fd.get("phone") ?? "").trim(),
      address:       String(fd.get("address") ?? "").trim(),
      city:          String(fd.get("city") ?? "").trim(),
      email:         String(fd.get("email") ?? "").trim(),
      postal_code:   String(fd.get("zip") ?? "").trim(),
      notes:         String(fd.get("notes") ?? "").trim(),
      // Prices deliberately omitted — the server recomputes them from the DB.
      items: items.map((i) => ({ variant_id: i.variantId, qty: i.qty })),
    };

    try {
      const res  = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Every non-OK response used to collapse into errorGeneric. A rate-limited
        // customer was told "something went wrong" and retried, extending their own
        // lockout; a validation failure never said which field was wrong.
        // 429 = rate limit, 422 = Zod rejection, 409 = stale cart (see api/orders).
        if (res.status === 429)      setError(t("errorRateLimited"));
        else if (res.status === 422) setError(t("errorValidation"));
        else if (data?.error === "ITEM_UNAVAILABLE") setError(t("errorUnavailable"));
        else setError(t("errorGeneric"));
        return;
      }

      // Only clear the cart once the order is safely persisted.
      setPlacedNumber(data.order_number);
      clearCart();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Empty cart screen ──────────────────────────────
  if (items.length === 0 && !placedNumber) {
    return (
      <div className="container-px mx-auto flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-[var(--color-iron)]" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-extrabold text-ceramic">{t("emptyCart")}</h1>
        <p className="mt-2 text-sm text-slate">{t("emptyCartSub")}</p>
        <Link
          href="/products"
          locale={locale as "en" | "ar"}
          className="mt-6 rounded-full bg-[var(--color-mint)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-mint-hover)]"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  // ── Order placed screen ────────────────────────────
  if (placedNumber) {
    return (
      <div className="container-px mx-auto flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-extrabold text-ceramic">{t("orderPlaced")}</h1>

        {/* The order number is the customer's only handle on this order — they
            read it back to us on the phone, so make it prominent and copyable. */}
        <div className="mt-5 rounded-2xl border border-[var(--color-iron)] bg-white px-6 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate">
            {t("orderNumberLabel")}
          </p>
          <p dir="ltr" className="mt-1 select-all font-mono text-lg font-extrabold text-ceramic">
            {placedNumber}
          </p>
        </div>

        <p className="mt-4 max-w-sm text-sm text-slate">{t("orderConfirmCall")}</p>
        <Link
          href="/"
          locale={locale as "en" | "ar"}
          className="mt-6 rounded-full bg-[var(--color-mint)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-mint-hover)]"
        >
          {t("backToStore")}
        </Link>
      </div>
    );
  }

  // ── Main checkout ──────────────────────────────────
  return (
    <div className="container-px mx-auto py-8 md:py-12">
      <h1
        className="mb-8 text-ceramic"
        style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
      >
        {t("title")}
      </h1>

      {/* Grid: summary LEFT, form RIGHT */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">

        {/* ── Order Summary ── */}
        <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-6">
            <h2 className="mb-5 text-sm font-bold text-ceramic">{t("orderSummary")}</h2>

            {/* Item list */}
            <ul className="mb-5 space-y-4">
              {items.map((item) => (
                <li key={item.key} className="flex items-start gap-3">
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-xl border border-[var(--color-iron)]"
                    style={{ background: item.gradient }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate">{item.brand}</p>
                    <p className="text-sm font-semibold text-ceramic leading-snug">{item.productName}</p>
                    <p className="mt-0.5 text-[11px] text-slate">
                      {item.condition} · {item.specs} · {item.colour}
                    </p>
                    {/* Qty stepper */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-iron)] text-ceramic transition hover:border-ceramic disabled:opacity-40"
                        disabled={item.qty <= 1}
                      >
                        <Minus className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold text-ceramic">{item.qty}</span>
                      {/* create_cod_order() REJECTS qty > 99 (migration 0005) rather
                          than clamping, so letting the stepper run past it just buys a
                          generic failure after the whole form is filled in. */}
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, Math.min(MAX_QTY, item.qty + 1))}
                        disabled={item.qty >= MAX_QTY}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-iron)] text-ceramic transition hover:border-ceramic disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="ms-auto flex h-6 w-6 items-center justify-center rounded-full text-slate transition hover:text-red-500"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-ceramic">{formatEGP(item.price * item.qty, locale)}</span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="space-y-2.5 border-t border-[var(--color-iron)] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate">{t("subtotal")}</span>
                <span className="font-semibold text-ceramic">{formatEGP(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">{t("shippingFee")}</span>
                <span className="font-semibold text-[var(--color-mint)]">{t("shippingFree")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">{t("tax")}</span>
                <span className="font-semibold text-ceramic">{formatEGP(vat, locale)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--color-iron)] pt-3 text-base font-extrabold text-ceramic">
                <span>{t("total")}</span>
                <span>{formatEGP(total, locale)}</span>
              </div>
            </div>

            {/* Trust row — COD signals; the previous SSL/Encrypted/Buyer-protection
                trio described card payment, which no longer happens here. */}
            <div className="mt-5 flex items-center justify-center gap-4 border-t border-[var(--color-iron)] pt-4">
              {[
                { Icon: Banknote,     label: t("trustNoPrepay") },
                { Icon: PackageCheck, label: t("trustInspect")  },
                { Icon: ShieldCheck,  label: t("trustReturns")  },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1 text-[10px] text-slate">
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-mint)]" strokeWidth={2} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Checkout Form ── */}
        <div className="order-1 lg:order-2">
          {/* Guest header card */}
          <div className="mb-6 rounded-2xl border border-[var(--color-iron)] bg-white p-5">
            <p className="text-base font-bold text-ceramic">{t("guestHeading")}</p>
            <p className="mt-1 text-sm text-slate">{t("guestSub")}</p>
            <p className="mt-2 text-xs text-slate">
              {t("haveAccount")}{" "}
              <Link
                href="/login"
                locale={locale as "en" | "ar"}
                className="font-semibold text-[var(--color-mint)] hover:underline"
              >
                {t("signIn")}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact */}
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ceramic">
                {t("contact")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={labelClass}>{t("firstName")}</label>
                  <input id="firstName" name="firstName" required type="text" autoComplete="given-name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelClass}>{t("lastName")}</label>
                  <input id="lastName" name="lastName" required type="text" autoComplete="family-name" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  {/* Not required: for COD the phone is the contact that matters,
                      and many Egyptian customers order without an email address. */}
                  <label htmlFor="email" className={labelClass}>{t("email")}</label>
                  <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className={labelClass}>{t("phone")}</label>
                  <input id="phone" name="phone" required type="tel" dir="ltr" autoComplete="tel" placeholder="01X XXXX XXXX" className={inputClass} />
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ceramic">
                {t("shipping")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>{t("address")}</label>
                  <input id="address" name="address" required type="text" autoComplete="street-address" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>{t("city")}</label>
                  <input id="city" name="city" required type="text" autoComplete="address-level2" className={inputClass} />
                </div>
                <div>
                  {/* Postcodes are rarely used in Egyptian addressing — optional. */}
                  <label htmlFor="zip" className={labelClass}>{t("zip")}</label>
                  <input id="zip" name="zip" type="text" autoComplete="postal-code" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className={labelClass}>{t("notes")}</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    maxLength={1000}
                    placeholder={t("notesPlaceholder")}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Payment — Cash on Delivery only.
                This section previously collected card number, expiry and CVC in
                plain inputs while the form submitted nothing anywhere. Card
                collection is removed rather than wired up: taking card details
                belongs behind Paymob, which is not integrated yet. */}
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ceramic">
                {t("payment")}
              </h2>
              <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-mint)] bg-[var(--color-mint-soft)] p-4">
                <Banknote className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-mint)]" strokeWidth={2} aria-hidden />
                <div>
                  <p className="text-sm font-bold text-ceramic">{t("codTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate">{t("codNotice")}</p>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div>
              {error && (
                <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-mint)] py-4 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Banknote className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                {submitting ? t("placing") : `${t("placeOrder")} · ${formatEGP(total, locale)}`}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate">{t("secure")}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
