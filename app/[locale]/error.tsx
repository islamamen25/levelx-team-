"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

/**
 * Boundary for any page under /[locale]. The locale layout still renders around this,
 * so the user keeps the header, footer and a way back into the store — unlike
 * app/global-error.tsx, which replaces the document and only catches failures in the
 * layout itself.
 *
 * Copy is inline rather than from next-intl on purpose: an error boundary that depends
 * on the translation layer can throw while rendering the error, and the user lands on
 * Next's unstyled English fallback — the exact outcome this file prevents. Same reason
 * app/global-error.tsx carries its own strings. This is the one place where duplicating
 * a handful of strings beats the abstraction.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const isArabic = params?.locale === "ar";

  useEffect(() => {
    // Surfaces in the browser console and, in v16.2, forwards to the dev server log.
    console.error("[LevelX] page error:", error);
  }, [error]);

  const copy = isArabic
    ? {
        title: "حدث خطأ غير متوقع",
        body: "معلش، حصلت مشكلة أثناء تحميل الصفحة. جرّب تاني، ولو استمرت المشكلة كلّمنا.",
        retry: "حاول مرة أخرى",
        shop: "تصفّح المنتجات",
        ref: "رقم الخطأ",
      }
    : {
        title: "Something went wrong",
        body: "Sorry — we hit a problem loading this page. Try again, and contact us if it keeps happening.",
        retry: "Try again",
        shop: "Browse products",
        ref: "Reference",
      };

  return (
    <div className="bg-white pt-[6.5rem]">
      <div className="container-px mx-auto flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-2xl font-extrabold text-ceramic">{copy.title}</h1>
        <p className="mt-2 max-w-sm text-sm text-slate">{copy.body}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="min-h-11 rounded-full bg-[var(--color-mint)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-mint-hover)]"
          >
            {copy.retry}
          </button>
          {/* Plain <a>: a full navigation is the safer escape from a broken render tree
              than a client-side transition through the router that just failed. */}
          <a
            href={`/${isArabic ? "ar" : "en"}/products`}
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-iron)] px-6 py-3 text-sm font-bold text-ceramic transition hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]"
          >
            {copy.shop}
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 text-[11px] text-slate/70">
            {copy.ref}: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
