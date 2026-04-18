"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Lock, ShieldCheck, CreditCard, CheckCircle2, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

interface CheckoutFormProps {
  locale: string;
}

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

const inputClass =
  "w-full rounded-xl border border-[var(--color-iron)] bg-white px-4 py-3 text-sm text-ceramic placeholder:text-slate focus:border-[var(--color-mint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]/15 transition-colors";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5";

export function CheckoutForm({ locale }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const [cardFocused, setCardFocused] = useState(false);
  const [placed, setPlaced] = useState(false);
  const router = useRouter();

  const items      = useCartStore((s) => s.items);
  const updateQty  = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart  = useCartStore((s) => s.clearCart);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const vat      = Math.round(subtotal * 0.2);
  const total    = subtotal + vat;

  // ── Empty cart screen ──────────────────────────────
  if (items.length === 0 && !placed) {
    return (
      <div className="container-px mx-auto flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-[var(--color-iron)]" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-extrabold text-ceramic">{t("emptyCart")}</h1>
        <p className="mt-2 text-sm text-slate">Add items from the store to continue</p>
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
  if (placed) {
    return (
      <div className="container-px mx-auto flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-extrabold text-ceramic">Order placed!</h1>
        <p className="mt-2 text-sm text-slate">We&#39;ll send you a confirmation email shortly.</p>
        <Link
          href="/"
          locale={locale as "en" | "ar"}
          className="mt-6 rounded-full bg-[var(--color-mint)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-mint-hover)]"
        >
          Back to store
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
                      <button
                        type="button"
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-iron)] text-ceramic transition hover:border-ceramic"
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
                  <span className="text-sm font-bold text-ceramic">{formatGBP(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="space-y-2.5 border-t border-[var(--color-iron)] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate">{t("subtotal")}</span>
                <span className="font-semibold text-ceramic">{formatGBP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">{t("shippingFee")}</span>
                <span className="font-semibold text-[var(--color-mint)]">{t("shippingFree")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">{t("tax")}</span>
                <span className="font-semibold text-ceramic">{formatGBP(vat)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--color-iron)] pt-3 text-base font-extrabold text-ceramic">
                <span>{t("total")}</span>
                <span>{formatGBP(total)}</span>
              </div>
            </div>

            {/* Trust row */}
            <div className="mt-5 flex items-center justify-center gap-4 border-t border-[var(--color-iron)] pt-4">
              {[
                { Icon: ShieldCheck, label: "SSL secure"       },
                { Icon: Lock,        label: "Encrypted"        },
                { Icon: CheckCircle2,label: "Buyer protection" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1 text-[10px] text-slate">
                  <Icon className="h-3.5 w-3.5 text-[var(--color-mint)]" strokeWidth={2} />
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              clearCart();
              setPlaced(true);
            }}
            className="space-y-8"
          >
            {/* Contact */}
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ceramic">
                {t("contact")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("firstName")}</label>
                  <input required type="text" autoComplete="given-name" placeholder="Jane" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("lastName")}</label>
                  <input required type="text" autoComplete="family-name" placeholder="Smith" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("email")}</label>
                  <input required type="email" autoComplete="email" placeholder="jane@example.com" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("phone")}</label>
                  <input required type="tel" autoComplete="tel" placeholder="+44 7700 900000" className={inputClass} />
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
                  <label className={labelClass}>{t("address")}</label>
                  <input required type="text" autoComplete="street-address" placeholder="123 High Street" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("city")}</label>
                  <input required type="text" autoComplete="address-level2" placeholder="London" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("zip")}</label>
                  <input required type="text" autoComplete="postal-code" placeholder="SW1A 1AA" className={inputClass} />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ceramic">
                {t("payment")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t("cardNumber")}</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      onFocus={() => setCardFocused(true)}
                      onBlur={() => setCardFocused(false)}
                      className={[inputClass, "pe-12", cardFocused ? "border-[var(--color-mint)] ring-2 ring-[var(--color-mint)]/15" : ""].join(" ")}
                    />
                    <CreditCard
                      className="absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t("expiry")}</label>
                    <input required type="text" autoComplete="cc-exp" placeholder="MM / YY" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("cvc")}</label>
                    <input required type="text" autoComplete="cc-csc" placeholder="CVC" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("nameOnCard")}</label>
                  <input required type="text" autoComplete="cc-name" placeholder="Jane Smith" className={inputClass} />
                </div>
              </div>
            </section>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-mint)] py-4 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)] active:scale-[0.99]"
              >
                <Lock className="h-4 w-4" strokeWidth={2.5} />
                {t("placeOrder")} · {formatGBP(total)}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate">{t("secure")}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
