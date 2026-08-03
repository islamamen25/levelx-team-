"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useScrolled } from "@/hooks/use-scrolled";
import { Search, ShoppingBag, Menu, X, ChevronRight, User } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { CategoryBar } from "@/components/layout/category-bar";
import type { CategoryNode } from "@/lib/queries/categories";
import { useCartStore } from "@/lib/cart-store";

interface NavbarProps {
  locale: string;
  categories: CategoryNode[];
}

// Only routes that exist. This list previously held /deals and /about too, which meant
// three of the four mobile menu entries were 404s — effectively no working mobile nav.
const NAV_LINKS = [
  { key: "products" as const, href: "/products" },
  { key: "categories" as const, href: "/categories" },
] as const;

export function Navbar({ locale, categories }: NavbarProps) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const scrolled = useScrolled(8);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((s) => s.totalItems());

  const otherLocale = locale === "en" ? "ar" : "en";
  // usePathname() never includes the query string, so switching locale used
  // to silently drop it — e.g. /en/dashboard/catalog/edit?id=<uuid> became
  // /ar/dashboard/catalog/edit (no id), which 404s because that route
  // requires ?id=. Re-attach whatever search params are on the current URL.
  const query = searchParams.toString();
  const basePath = (pathname.replace(/^\/(en|ar)/, "") || "/") + (query ? `?${query}` : "");

  return (
    <header className="fixed inset-x-0 top-0 z-50 transition-shadow duration-300">
      {/* ── Row 1: Logo | Search | Actions ── */}
      <div
        className={[
          "border-b border-[var(--color-iron)] transition-all duration-300",
          scrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-white",
        ].join(" ")}
      >
        <nav className="container-px mx-auto flex h-14 items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            locale={locale as "en" | "ar"}
            className="flex-shrink-0"
            aria-label={tc("brand")}
          >
            <span className="text-xl font-black tracking-tight text-ceramic">
              Level<span className="text-[var(--color-mint)]">X</span>
            </span>
          </Link>

          {/* Search bar — grows on desktop */}
          <button
            type="button"
            aria-label={tc("search")}
            className="hidden flex-1 items-center gap-3 rounded-full border border-[var(--color-iron)] bg-[var(--color-obsidian)] px-5 py-2.5 text-sm text-slate transition-colors hover:border-[var(--color-mint)]/50 md:flex"
            style={{ maxWidth: "520px" }}
          >
            <Search className="h-4 w-4 flex-shrink-0 text-slate" strokeWidth={2} />
            <span className="truncate">{t("searchPlaceholder")}</span>
          </button>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Actions row */}
          <div className="flex items-center gap-1">
            {/* Mobile search */}
            <button
              type="button"
              aria-label={tc("search")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ceramic transition-colors hover:bg-[var(--color-graphite)] md:hidden"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>

            {/* The trade-in pill (/trade-in, 404) and the Account button (a <button>
                with no onClick — there is no customer account system) were removed
                rather than left as controls that do nothing. "Need help?" stays: the
                chat widget is the thing that answers it. */}
            <span className="hidden whitespace-nowrap text-sm font-medium text-ceramic lg:block lg:ps-1">
              {t("help")}
            </span>

            {/* Cart */}
            <Link
              href="/checkout"
              locale={locale as "en" | "ar"}
              aria-label={tc("cart")}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ceramic transition-colors hover:bg-[var(--color-graphite)]"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-mint)] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Sign in — sits next to the locale pill so it is reachable from every
                page. Styled exactly like the cart control (h-9 w-9 round) so the
                action row reads as one set rather than a pill plus a stray icon.

                Note for whoever wires customer accounts later: there is no signup
                route, so today this only lets an existing Supabase user in — in
                practice, staff. A customer who somehow signs in and is not an admin
                is redirected to the home page by (admin)/layout.tsx; they are logged
                in but nothing in the UI says so. That is a gap to close when accounts
                become a real feature, not a reason to hide the entry point. */}
            <Link
              href="/login"
              locale={locale as "en" | "ar"}
              aria-label={t("signIn")}
              title={t("signIn")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ceramic transition-colors hover:bg-[var(--color-graphite)]"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>

            {/* Locale pill — ALWAYS visible */}
            <Link
              href={basePath}
              locale={otherLocale as "en" | "ar"}
              className="inline-flex h-8 items-center rounded-full border border-[var(--color-iron)] px-3 text-xs font-bold text-ceramic transition-colors hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]"
            >
              {t("language")}
            </Link>

            {/* Mobile menu trigger */}
            <button
              type="button"
              aria-label={tc("menu")}
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ceramic transition-colors hover:bg-[var(--color-graphite)] md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </nav>
      </div>

      {/* ── Row 2: Category bar (desktop only) ── */}
      <div className="hidden md:block">
        <CategoryBar locale={locale} categories={categories} />
      </div>

      {/* ── Mobile Sheet ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={locale === "ar" ? "left" : "right"}
          className="w-[min(320px,85vw)] border-[var(--color-iron)] bg-white p-0"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-iron)] px-6 py-5">
            <span className="text-lg font-black tracking-tight text-ceramic">
              Level<span className="text-[var(--color-mint)]">X</span>
            </span>
            <SheetClose
              aria-label={tc("close")}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ceramic hover:bg-[var(--color-graphite)]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </SheetClose>
          </div>

          <nav className="flex flex-col overflow-y-auto px-4 py-4">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                locale={locale as "en" | "ar"}
                onClick={() => setMobileOpen(false)}
                className="group flex items-center justify-between rounded-xl px-3 py-4 text-base font-semibold text-ceramic hover:bg-[var(--color-graphite)] hover:text-[var(--color-mint)]"
              >
                {t(key)}
                <ChevronRight
                  className={[
                    "h-4 w-4 text-slate transition-transform group-hover:translate-x-0.5",
                    locale === "ar" ? "rotate-180" : "",
                  ].join(" ")}
                  strokeWidth={2}
                />
              </Link>
            ))}

            {/* Categories, inline.
                CategoryBar is `hidden md:block` and this sheet never rendered it, so a
                phone user could not browse categories at all beyond the six home-page
                tiles. The tree is already fetched for the desktop bar — reuse it. */}
            {categories.length > 0 && (
              <>
                <p className="mt-4 px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate">
                  {t("categories")}
                </p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}` as never}
                    locale={locale as "en" | "ar"}
                    onClick={() => setMobileOpen(false)}
                    dir="auto"
                    className="rounded-xl px-3 py-3 text-sm font-medium text-ceramic hover:bg-[var(--color-graphite)] hover:text-[var(--color-mint)]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </>
            )}
          </nav>

          <div className="mt-auto border-t border-[var(--color-iron)] px-6 py-5">
            <Link
              href={basePath}
              locale={otherLocale as "en" | "ar"}
              className="inline-flex h-8 items-center rounded-full border border-[var(--color-iron)] px-4 text-sm font-bold text-ceramic hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]"
            >
              {t("language")}
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
