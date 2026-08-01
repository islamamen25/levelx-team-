import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Package, Paintbrush, FolderTree, ShoppingCart, ArrowRight, FlaskConical } from "lucide-react";
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
            {/* A hardcoded "Last updated: 7 April 2026" used to sit here. It was
                never wired to anything, so it aged into a false freshness claim.
                Restore a real timestamp only when the data behind it is real. */}
          </div>
        </div>

        {/* Everything below is placeholder data from lib/mock-dashboard.ts. Said
            plainly and up front: real orders now exist, so unlabelled invented
            revenue sitting next to a working orders screen is actively
            misleading. Remove this banner when the KPIs read real data. */}
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <FlaskConical className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">{t("demoTitle")}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">{t("demoBody")}</p>
            </div>
          </div>
          <Link
            href={`/${locale}/dashboard/orders`}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-amber-800 sm:self-auto"
          >
            {t("demoCta")}
            <ArrowRight className={`h-3.5 w-3.5 ${locale === "ar" ? "rotate-180" : ""}`} />
          </Link>
        </div>

        {/* KPI Grid — stays eager: KpiCard is tiny, no heavy deps */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPI_DATA.map((metric) => (
            <KpiCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Charts + Period tabs — Client Component (ssr: false requires client) */}
        <DashboardCharts locale={locale} periodLabels={periodLabels} demoBadge={t("demoBadge")} />

        {/* Quick Nav */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href:  `/${locale}/dashboard/orders`,
              icon:  ShoppingCart,
              title: locale === "ar" ? "الطلبات" : "Orders",
              desc:  locale === "ar" ? "متابعة الطلبات وتأكيدها وتحديث حالتها" : "Track, confirm & update order status",
              color: "bg-amber-50 text-amber-600",
            },
            {
              href:  `/${locale}/dashboard/catalog`,
              icon:  Package,
              title: locale === "ar" ? "كتالوج المنتجات" : "Product Catalog",
              desc:  locale === "ar" ? "إدارة المنتجات والمتغيرات والعروض" : "Manage products, variants, conditions & offers",
              color: "bg-blue-50 text-blue-600",
            },
            {
              href:  `/${locale}/dashboard/categories`,
              icon:  FolderTree,
              title: locale === "ar" ? "الأقسام" : "Categories",
              desc:  locale === "ar" ? "إضافة وتعديل وإخفاء أقسام المتجر" : "Add, edit, reorder & hide store categories",
              color: "bg-emerald-50 text-emerald-600",
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
