"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, Loader2, Package, Phone, MapPin, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { OrderRow, OrderStatus } from "@/lib/queries/orders";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   "bg-amber-100 text-amber-800 border border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border border-blue-200",
  shipped:   "bg-violet-100 text-violet-700 border border-violet-200",
  delivered: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
};

const STATUS_LABELS: Record<OrderStatus, { ar: string; en: string }> = {
  pending:   { ar: "قيد الانتظار", en: "Pending"   },
  confirmed: { ar: "مؤكَّد",       en: "Confirmed" },
  shipped:   { ar: "تم الشحن",     en: "Shipped"   },
  delivered: { ar: "تم التسليم",   en: "Delivered" },
  cancelled: { ar: "ملغي",         en: "Cancelled" },
};

function formatEGP(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string, locale: string) {
  // Latin digits in both locales, matching how prices are rendered store-wide.
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

interface OrderTableProps {
  initialOrders: OrderRow[];
  locale: string;
}

export function OrderTable({ initialOrders, locale }: OrderTableProps) {
  const router = useRouter();
  const isAr = locale === "ar";

  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"All" | OrderStatus>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId]     = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...initialOrders];

    if (statusFilter !== "All") {
      list = list.filter((o) => o.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.city ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [initialOrders, search, statusFilter]);

  async function changeStatus(id: string, status: OrderStatus) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      // Re-fetch from the server rather than patching local state, so the row
      // always shows what the DB actually holds.
      router.refresh();
    } catch {
      setError(isAr ? "تعذّر تحديث حالة الطلب. حاول مرة أخرى." : "Could not update the order status. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  if (initialOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Package className="h-12 w-12 text-gray-200" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-[var(--color-ceramic)]">
          {isAr ? "لا توجد طلبات بعد" : "No orders yet"}
        </p>
        <p className="max-w-sm text-xs text-[var(--color-slate)]">
          {isAr
            ? "الطلبات الجديدة هتظهر هنا أول ما عميل يكمّل الشراء من المتجر."
            : "New orders appear here as soon as a customer completes checkout."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-slate)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث برقم الطلب أو الاسم أو الهاتف..." : "Search order number, name or phone…"}
            className="ps-9"
            aria-label={isAr ? "بحث في الطلبات" : "Search orders"}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value as "All" | OrderStatus)}
          aria-label={isAr ? "تصفية حسب الحالة" : "Filter by status"}
          className="h-10 min-w-[9rem] rounded-xl border border-gray-200 bg-white px-3 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]/15"
        >
          <option value="All">{isAr ? "كل الحالات" : "All statuses"}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s][isAr ? "ar" : "en"]}</option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {/* Table — scrolls inside its own container so the page never scrolls sideways */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{isAr ? "رقم الطلب" : "Order"}</TableHead>
              <TableHead>{isAr ? "العميل" : "Customer"}</TableHead>
              <TableHead>{isAr ? "الهاتف" : "Phone"}</TableHead>
              <TableHead>{isAr ? "المدينة" : "City"}</TableHead>
              <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              <TableHead>{isAr ? "الإجمالي" : "Total"}</TableHead>
              <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => {
              const open = expandedId === o.id;
              return [
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedId(open ? null : o.id)}
                >
                  <TableCell>
                    <button
                      type="button"
                      aria-label={isAr ? "عرض التفاصيل" : "Toggle details"}
                      aria-expanded={open}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-slate)] hover:bg-gray-50"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(open ? null : o.id); }}
                    >
                      {open
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />}
                    </button>
                  </TableCell>

                  <TableCell>
                    <span dir="ltr" className="font-mono text-xs font-bold text-[var(--color-ceramic)]">
                      {o.order_number}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span dir="auto" className="text-sm font-semibold text-[var(--color-ceramic)]">
                      {o.customer_name}
                    </span>
                  </TableCell>

                  <TableCell>
                    {/* Phone numbers must stay LTR inside an RTL page. */}
                    <a
                      href={`tel:${o.phone}`}
                      dir="ltr"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-[var(--color-mint)] hover:underline"
                    >
                      {o.phone}
                    </a>
                  </TableCell>

                  <TableCell>
                    <span dir="auto" className="text-sm text-[var(--color-slate)]">{o.city}</span>
                  </TableCell>

                  <TableCell>
                    <span className="whitespace-nowrap text-xs text-[var(--color-slate)]">
                      {formatDate(o.created_at, locale)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="whitespace-nowrap text-sm font-extrabold text-[var(--color-ceramic)]">
                      {formatEGP(Number(o.total), locale)}
                    </span>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <select
                        value={o.status}
                        disabled={savingId === o.id}
                        onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                        aria-label={isAr ? `حالة الطلب ${o.order_number}` : `Status for order ${o.order_number}`}
                        className={`h-8 rounded-full px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]/30 disabled:opacity-50 ${STATUS_STYLES[o.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s][isAr ? "ar" : "en"]}</option>
                        ))}
                      </select>
                      {savingId === o.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-slate)]" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>,

                open && (
                  <TableRow key={`${o.id}-details`} className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableCell colSpan={8}>
                      <div className="grid grid-cols-1 gap-6 px-2 py-3 md:grid-cols-[1fr_260px]">
                        {/* Line items */}
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-slate)]">
                            {isAr ? "المنتجات" : "Items"}
                          </p>
                          <ul className="flex flex-col gap-1.5">
                            {o.order_items.map((it) => (
                              <li key={it.id} className="flex items-baseline justify-between gap-4 text-sm">
                                <span dir="auto" className="text-[var(--color-ceramic)]">
                                  {it.product_name}
                                  <span className="text-[var(--color-slate)]"> × {it.qty}</span>
                                  {it.sku_code && (
                                    <span dir="ltr" className="ms-2 font-mono text-[10px] text-[var(--color-slate)]">
                                      {it.sku_code}
                                    </span>
                                  )}
                                </span>
                                <span className="whitespace-nowrap font-semibold text-[var(--color-ceramic)]">
                                  {formatEGP(Number(it.price) * it.qty, locale)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-3 flex flex-col gap-1 border-t border-gray-200 pt-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[var(--color-slate)]">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                              <span>{formatEGP(Number(o.subtotal), locale)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--color-slate)]">{isAr ? "ضريبة القيمة المضافة" : "VAT"}</span>
                              <span>{formatEGP(Number(o.vat), locale)}</span>
                            </div>
                            <div className="flex justify-between font-extrabold">
                              <span>{isAr ? "الإجمالي" : "Total"}</span>
                              <span>{formatEGP(Number(o.total), locale)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery details */}
                        <div className="flex flex-col gap-3 text-sm">
                          <div>
                            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-slate)]">
                              <MapPin className="h-3 w-3" /> {isAr ? "التوصيل" : "Delivery"}
                            </p>
                            <p dir="auto" className="text-[var(--color-ceramic)]">{o.address}</p>
                            <p dir="auto" className="text-[var(--color-slate)]">
                              {o.city}{o.postal_code ? ` · ${o.postal_code}` : ""}
                            </p>
                          </div>

                          <div>
                            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-slate)]">
                              <Phone className="h-3 w-3" /> {isAr ? "التواصل" : "Contact"}
                            </p>
                            <a href={`tel:${o.phone}`} dir="ltr" className="block text-[var(--color-mint)] hover:underline">
                              {o.phone}
                            </a>
                            {o.email && (
                              <a href={`mailto:${o.email}`} dir="ltr" className="block break-all text-[var(--color-slate)] hover:underline">
                                {o.email}
                              </a>
                            )}
                          </div>

                          {o.notes && (
                            <div>
                              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-slate)]">
                                <StickyNote className="h-3 w-3" /> {isAr ? "ملاحظات" : "Notes"}
                              </p>
                              <p dir="auto" className="text-[var(--color-ceramic)]">{o.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              ];
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--color-slate)]">
          {isAr ? "لا توجد طلبات مطابقة للبحث." : "No orders match your search."}
        </p>
      )}
    </div>
  );
}
