/**
 * Locale-aware display formatting — the single source of truth.
 *
 * This used to be copy-pasted into eight components. That duplication caused a
 * real bug: when prices were switched from Arabic-Indic to Latin digits, each
 * copy had to be fixed separately, and product-selector-modal.tsx was missed
 * for weeks. Import from here instead of re-declaring.
 */

/**
 * `ar-EG-u-nu-latn` = Egyptian Arabic formatting with **Latin** digits.
 * Egyptian commerce uses Latin digits in practice, and product names already
 * render with them, so Arabic-Indic numerals would clash inside a single card.
 *
 * `locale` defaults to Arabic — the primary market language, and the correct
 * fallback for the few admin surfaces that do not thread a locale through yet
 * (see product-selector-modal.tsx).
 */
export function formatEGP(n: number, locale: string = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Date + time, Latin digits in both locales to match how prices render. */
export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
