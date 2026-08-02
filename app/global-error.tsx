"use client";

/**
 * Last-resort boundary. Replaces the whole document, so it must render its own
 * <html>/<body> and may not rely on anything from app/[locale]/layout.tsx — this is
 * exactly the boundary that catches a failure *in* that layout.
 *
 * Deliberately dependency-free: no next-intl, no shared UI, no fonts. An error page
 * that throws leaves the user on Next's unstyled English fallback, which is the failure
 * this file exists to prevent. Locale is read from the URL rather than from a provider
 * for the same reason. Prefer app/[locale]/error.tsx for anything routine.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isArabic =
    typeof window !== "undefined" && window.location.pathname.startsWith("/ar");

  const copy = isArabic
    ? {
        title: "حدث خطأ غير متوقع",
        body: "معلش، حصلت مشكلة عندنا. جرّب تاني، ولو استمرت كلّمنا.",
        retry: "حاول مرة أخرى",
        home: "العودة للرئيسية",
        ref: "رقم الخطأ",
      }
    : {
        title: "Something went wrong",
        body: "Sorry — that is on us. Try again, and contact us if it keeps happening.",
        retry: "Try again",
        home: "Back to home",
        ref: "Reference",
      };

  return (
    <html lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#1d1d1f",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0 }}>
            Level<span style={{ color: "#24BE90" }}>X</span>
          </p>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "1.5rem" }}>
            {copy.title}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6e6e73", marginTop: "0.5rem" }}>
            {copy.body}
          </p>

          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                background: "#24BE90",
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              {copy.retry}
            </button>
            <a
              href={isArabic ? "/ar" : "/en"}
              style={{
                border: "1px solid #d2d2d7",
                borderRadius: "999px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#1d1d1f",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                minHeight: "44px",
              }}
            >
              {copy.home}
            </a>
          </div>

          {/* Support can map this back to the server log without the user reading a stack. */}
          {error.digest && (
            <p style={{ fontSize: "0.6875rem", color: "#a1a1a6", marginTop: "1.5rem" }}>
              {copy.ref}: <span style={{ fontFamily: "monospace" }}>{error.digest}</span>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
