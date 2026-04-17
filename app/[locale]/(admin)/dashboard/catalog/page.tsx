import { getTranslations } from "next-intl/server";
import { Package, TrendingUp, AlertTriangle, Tags } from "lucide-react";
import { ProductTable } from "@/components/admin/product-table";
import { PRODUCTS } from "@/lib/mock-products";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "إدارة المنتجات — LevelX" : "Product Catalog — LevelX",
  };
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;

  // Summary stats from mock data (will come from Supabase when wired)
  const totalProducts  = PRODUCTS.length;
  const totalStock     = PRODUCTS.reduce((s, p) => s + p.variants.reduce((vs, v) => vs + v.stock, 0), 0);
  const lowStock       = PRODUCTS.filter((p) => p.variants.reduce((s, v) => s + v.stock, 0) < 5).length;
  const totalVariants  = PRODUCTS.reduce((s, p) => s + p.variants.length, 0);

  const stats = [
    { label: locale === "ar" ? "إجمالي المنتجات" : "Total Products",  value: totalProducts,            icon: Package,      color: "bg-blue-50 text-blue-600" },
    { label: locale === "ar" ? "إجمالي المخزون"  : "Units in Stock",  value: totalStock.toLocaleString(), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { label: locale === "ar" ? "مخزون منخفض"    : "Low Stock Items",  value: lowStock,                 icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: locale === "ar" ? "المتغيرات"       : "Total Variants",   value: totalVariants,            icon: Tags,         color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">

        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-mint)] mb-1">
              {locale === "ar" ? "لوحة التحكم" : "Admin PIM"}
            </p>
            <h1 className="text-display-lg text-[var(--color-ceramic)]"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
              {locale === "ar" ? "كتالوج المنتجات" : "Product Catalog"}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-slate)]">
              {locale === "ar"
                ? "إدارة المنتجات والعروض والمواصفات"
                : "Manage products, offers, conditions & specifications"}
            </p>
          </div>
        </div>

        {/* ── Bento Stats Grid ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                    {stat.label}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-3xl font-extrabold tracking-tight text-[var(--color-ceramic)]">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Product Table ── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-ceramic)]">
                {locale === "ar" ? "جميع المنتجات" : "All Products"}
              </h2>
              <p className="text-xs text-[var(--color-slate)] mt-0.5">
                {locale === "ar"
                  ? "ابحث وصفّي وعدّل المنتجات"
                  : "Search, filter, sort and manage your catalogue"}
              </p>
            </div>
          </div>
          <ProductTable />
        </div>

      </div>
    </div>
  );
}
