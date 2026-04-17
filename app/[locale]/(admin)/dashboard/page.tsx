import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Package, Paintbrush, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { KPI_DATA } from "@/lib/mock-dashboard";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "لوحة المؤشرات — LevelX" : "CEO Dashboard — LevelX",
  };
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const periodLabels = {
    "7d":  t("tabs.7d"),
    "30d": t("tabs.30d"),
    "90d": t("tabs.90d"),
    "12m": t("tabs.12m"),
  } as const;

  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              className="text-[var(--color-ceramic)]"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-slate)]">
              {locale === "ar" ? "آخر تحديث: ٧ أبريل ٢٠٢٦" : "Last updated: 7 April 2026"}
            </p>
          </div>
        </div>

        {/* KPI Grid — stays eager: KpiCard is tiny, no heavy deps */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPI_DATA.map((metric) => (
            <KpiCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Charts + Period tabs — Client Component (ssr: false requires client) */}
        <DashboardCharts locale={locale} periodLabels={periodLabels} />

        {/* Quick Nav */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              href:  `/${locale}/dashboard/catalog`,
              icon:  Package,
              title: locale === "ar" ? "كتالوج المنتجات" : "Product Catalog",
              desc:  locale === "ar" ? "إدارة المنتجات والمتغيرات والعروض" : "Manage products, variants, conditions & offers",
              color: "bg-blue-50 text-blue-600",
            },
            {
              href:  `/${locale}/dashboard/builder`,
              icon:  Paintbrush,
              title: locale === "ar" ? "مُنشئ الواجهة" : "Storefront Builder",
              desc:  locale === "ar" ? "تخصيص الألوان وأقسام الصفحة الرئيسية" : "Customise brand colours & home page sections",
              color: "bg-violet-50 text-violet-600",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-ceramic)]">{item.title}</p>
                  <p className="text-xs text-[var(--color-slate)] mt-0.5 line-clamp-1">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-200 group-hover:text-[var(--color-ceramic)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
