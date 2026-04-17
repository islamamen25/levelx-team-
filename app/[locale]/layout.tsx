import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { ChatWidget } from "@/components/chat/chat-widget";
import { getStoreConfig, buildThemeCSS } from "@/lib/store-config";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LevelX — Premium Refurbished Electronics",
  description:
    "Expert-verified refurbished smartphones, laptops and more. 1-year warranty, 30-day returns, free UK delivery.",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const [messages, storeConfig] = await Promise.all([
    getMessages(),
    getStoreConfig(),
  ]);

  const dir      = locale === "ar" ? "rtl" : "ltr";
  const isArabic = locale === "ar";
  const themeCSS = buildThemeCSS(storeConfig.theme);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${tajawal.variable} h-full antialiased`}
      data-locale={locale}
    >
      <head>
        {/* ── Dynamic brand theme injected from Storefront Builder ── */}
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body
        className={`min-h-full flex flex-col bg-obsidian text-ceramic overflow-x-hidden ${
          isArabic ? "font-[var(--font-tajawal)]" : ""
        }`}
      >
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <Navbar locale={locale} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
            <ChatWidget />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
