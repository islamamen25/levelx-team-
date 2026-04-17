import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");

  const year = new Date().getFullYear();

  const shopLinks = [
    { label: tn("products"), href: "/products" },
    { label: tn("categories"), href: "/categories" },
    { label: tn("deals"), href: "/deals" },
  ];

  const companyLinks = [
    { label: t("about"), href: "/about" },
    { label: t("careers"), href: "/careers" },
    { label: t("blog"), href: "/blog" },
  ];

  const supportLinks = [
    { label: t("faq"), href: "/faq" },
    { label: t("warranty"), href: "/warranty" },
    { label: t("returns"), href: "/returns" },
    { label: t("contact"), href: "/contact" },
  ];

  return (
    <footer className="mt-auto border-t border-[var(--color-iron)] bg-[#F5F5F7]">
      <div className="container-px mx-auto py-14 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              locale={locale as "en" | "ar"}
              className="inline-block text-2xl font-black tracking-tight text-ceramic"
            >
              Level<span className="text-[var(--color-mint)]">X</span>
            </Link>
            <p className="mt-3 max-w-[200px] text-sm leading-relaxed text-slate">
              {t("tagline")}
            </p>
            {/* Social icons */}
            <div className="mt-4 flex gap-3">
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-iron)] text-slate transition-colors hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              {/* YouTube */}
              <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-iron)] text-slate transition-colors hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg>
              </a>
              {/* X / Twitter */}
              <a href="#" aria-label="X" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-iron)] text-slate transition-colors hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ceramic">
              {t("shop")}
            </p>
            <ul className="space-y-3">
              {shopLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    locale={locale as "en" | "ar"}
                    className="text-sm text-slate transition-colors hover:text-[var(--color-mint)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ceramic">
              {t("company")}
            </p>
            <ul className="space-y-3">
              {companyLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    locale={locale as "en" | "ar"}
                    className="text-sm text-slate transition-colors hover:text-[var(--color-mint)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ceramic">
              {t("support")}
            </p>
            <ul className="space-y-3">
              {supportLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    locale={locale as "en" | "ar"}
                    className="text-sm text-slate transition-colors hover:text-[var(--color-mint)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[var(--color-iron)] pt-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs text-slate">
            © {year} {tc("brand")}. {t("rights")}
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              locale={locale as "en" | "ar"}
              className="text-xs text-slate transition-colors hover:text-[var(--color-mint)]"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terms"
              locale={locale as "en" | "ar"}
              className="text-xs text-slate transition-colors hover:text-[var(--color-mint)]"
            >
              {t("terms")}
            </Link>
          </div>
          </div>
          {/* Payment badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {["Visa", "Mastercard", "PayPal", "Klarna", "Apple Pay"].map((p) => (
              <span key={p} className="rounded border border-[var(--color-iron)] px-2.5 py-1 text-[10px] font-bold text-slate">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
