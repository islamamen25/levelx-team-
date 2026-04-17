"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Lock, ShieldCheck, CreditCard, CheckCircle2 } from "lucide-react";

interface CheckoutFormProps {
  locale: string;
}

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

// Static mock cart for prototype
const MOCK_ITEMS = [
  { id: "1", name: "Apple iPhone 15", brand: "Apple", condition: "Excellent", storage: "128GB", colour: "Black Titanium", qty: 1, price: 589, gradient: "linear-gradient(135deg, #e8e8ed 0%, #d1d1d6 100%)" },
];

const inputClass =
  "w-full rounded-xl border border-[var(--color-iron)] bg-white px-4 py-3 text-sm text-ceramic placeholder:text-slate focus:border-[var(--color-mint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]/15 transition-colors";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5";

export function CheckoutForm({ locale }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const [cardFocused, setCardFocused] = useState(false);

  const subtotal = MOCK_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const vat = Math.round(subtotal * 0.2);
  const total = subtotal + vat;

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
        {/* ── Order Summary (left on desktop) ── */}
        <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-6">
            <h2 className="mb-5 text-sm font-bold text-ceramic">{t("orderSummary")}</h2>

            {/* Item list */}
            <ul className="mb-5 space-y-4">
              {MOCK_ITEMS.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-xl border border-[var(--color-iron)]"
                    style={{ background: item.gradient }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate">{item.brand}</p>
                    <p className="text-sm font-semibold text-ceramic leading-snug">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate">
                      {item.condition} · {item.storage} · {item.colour}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate">Qty {item.qty}</p>
                  </div>
                  <span className="text-sm font-bold text-ceramic">{formatGBP(item.price)}</span>
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

        {/* ── Checkout Form (right on desktop) ── */}
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

          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Contact */}
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ceramic">
                {t("contact")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("firstName")}</label>
                  <input type="text" autoComplete="given-name" placeholder="Jane" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("lastName")}</label>
                  <input type="text" autoComplete="family-name" placeholder="Smith" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("email")}</label>
                  <input type="email" autoComplete="email" placeholder="jane@example.com" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("phone")}</label>
                  <input type="tel" autoComplete="tel" placeholder="+44 7700 900000" className={inputClass} />
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
                  <input type="text" autoComplete="street-address" placeholder="123 High Street" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("city")}</label>
                  <input type="text" autoComplete="address-level2" placeholder="London" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("zip")}</label>
                  <input type="text" autoComplete="postal-code" placeholder="SW1A 1AA" className={inputClass} />
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
                    <input type="text" autoComplete="cc-exp" placeholder="MM / YY" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("cvc")}</label>
                    <input type="text" autoComplete="cc-csc" placeholder="CVC" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("nameOnCard")}</label>
                  <input type="text" autoComplete="cc-name" placeholder="Jane Smith" className={inputClass} />
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
