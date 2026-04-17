import { Paintbrush } from "lucide-react";
import { BuilderClient } from "@/components/admin/builder-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "مُنشئ الواجهة — LevelX" : "Storefront Builder — LevelX",
  };
}

// ── Default config (fallback if Supabase fetch fails or is empty) ─────────────
const DEFAULT_CONFIG = {
  theme: {
    primary:   "#00A699",
    secondary: "#1D1D1F",
    accent:    "#F5A623",
    surface:   "#FFFFFF",
    radius:    "0.75rem",
  },
  layout: [
    { id: "hero",        label: "Hero Slider",       visible: true,  order: 0 },
    { id: "categories",  label: "Category Tiles",    visible: true,  order: 1 },
    { id: "featured",    label: "Featured Products", visible: true,  order: 2 },
    { id: "bestsellers", label: "Bestsellers",       visible: true,  order: 3 },
    { id: "brands",      label: "Top Brands",        visible: true,  order: 4 },
    { id: "newsletter",  label: "Newsletter",        visible: true,  order: 5 },
    { id: "trust",       label: "Trust Banner",      visible: true,  order: 6 },
  ],
};

async function getStoreConfig() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_configuration?id=eq.1&select=theme,layout`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return DEFAULT_CONFIG;
    const rows = await res.json();
    if (!rows?.[0]) return DEFAULT_CONFIG;
    return {
      theme:  rows[0].theme  ?? DEFAULT_CONFIG.theme,
      layout: rows[0].layout ?? DEFAULT_CONFIG.layout,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default async function BuilderPage({ params }: Props) {
  const { locale } = await params;
  const initial = await getStoreConfig();

  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">

        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-mint)] mb-1">
              {locale === "ar" ? "لوحة التحكم" : "Admin CMS"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-obsidian)]">
                <Paintbrush className="h-5 w-5 text-[var(--color-ceramic)]" />
              </div>
              <h1 className="text-display-lg text-[var(--color-ceramic)]"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
                {locale === "ar" ? "مُنشئ الواجهة" : "Storefront Builder"}
              </h1>
            </div>
            <p className="mt-2 text-sm text-[var(--color-slate)]">
              {locale === "ar"
                ? "تخصيص ألوان العلامة التجارية وترتيب أقسام الصفحة الرئيسية"
                : "Customise brand colours and manage home page section layout — changes saved to Supabase instantly"}
            </p>
          </div>
        </div>

        {/* ── Client Builder (interactive) ── */}
        <BuilderClient initial={initial} />

      </div>
    </div>
  );
}
