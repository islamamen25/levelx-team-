import { connection } from "next/server";
import { Paintbrush } from "lucide-react";
import { BuilderClient } from "@/components/admin/builder-client";
import { getStoreConfig } from "@/lib/store-config";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "مُنشئ الواجهة — LevelX" : "Storefront Builder — LevelX",
  };
}

export default async function BuilderPage({ params }: Props) {
  await connection();
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
