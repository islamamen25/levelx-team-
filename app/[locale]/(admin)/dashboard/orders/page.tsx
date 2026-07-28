import { connection } from "next/server";
import { ShoppingCart, Clock, Banknote, PackageCheck } from "lucide-react";
import { OrderTable } from "@/components/admin/order-table";
import { getOrdersAdmin } from "@/lib/queries/orders";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "الطلبات — LevelX" : "Orders — LevelX",
  };
}

export default async function OrdersPage({ params }: Props) {
  // Reads cookies() for the admin session — must be dynamic, never cached.
  await connection();
  const { locale } = await params;
  const isAr = locale === "ar";

  const orders = await getOrdersAdmin();

  // "Open" = still needs action from us. Delivered and cancelled are done.
  const openOrders   = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const pending      = orders.filter((o) => o.status === "pending").length;
  // Revenue counts delivered orders only — COD money is not real until the
  // courier actually collects it.
  const collected    = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + Number(o.total), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-EG", {
      style: "currency", currency: "EGP", maximumFractionDigits: 0,
    }).format(n);

  const stats = [
    {
      label: isAr ? "إجمالي الطلبات" : "Total Orders",
      value: String(orders.length),
      icon:  ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: isAr ? "بانتظار التأكيد" : "Awaiting Confirmation",
      value: String(pending),
      icon:  Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: isAr ? "قيد التنفيذ" : "Open Orders",
      value: String(openOrders.length),
      icon:  PackageCheck,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: isAr ? "محصَّل (تم التسليم)" : "Collected (Delivered)",
      value: fmt(collected),
      icon:  Banknote,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">

        {/* Page header */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-mint)]">
            {isAr ? "لوحة التحكم" : "Admin"}
          </p>
          <h1
            className="text-[var(--color-ceramic)]"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800 }}
          >
            {isAr ? "الطلبات" : "Orders"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-slate)]">
            {isAr
              ? "كل الطلبات دلوقتي دفع عند الاستلام — اتصل بالعميل للتأكيد قبل الشحن."
              : "All orders are Cash on Delivery — call the customer to confirm before shipping."}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                    {stat.label}
                  </span>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
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

        {/* Orders table */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-bold text-[var(--color-ceramic)]">
              {isAr ? "كل الطلبات" : "All Orders"}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-slate)]">
              {isAr
                ? "اضغط على أي طلب لعرض المنتجات وعنوان التوصيل."
                : "Click any order to see its items and delivery address."}
            </p>
          </div>
          <OrderTable initialOrders={orders} locale={locale} />
        </div>

      </div>
    </div>
  );
}
