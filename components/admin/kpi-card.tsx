"use client";

import { TrendingUp, TrendingDown, Banknote, ShoppingCart, RotateCcw, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import type { KpiMetric } from "@/lib/mock-dashboard";

// Banknote, not PoundSterling — the store prices in EGP, and a £ glyph on the
// revenue card was a leftover from before the currency was unified.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  gmv: Banknote,
  aov: ShoppingCart,
  returnRate: RotateCcw,
  dailyOrders: Package,
};

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const t = useTranslations("dashboard");
  const Icon = ICONS[metric.id] ?? Banknote;
  const isPositive = metric.changeType === "up";
  const isReturnRate = metric.id === "returnRate";
  // For return rate, "down" is good
  const isGood = isReturnRate ? !isPositive : isPositive;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
          {t(metric.id as "gmv" | "aov" | "returnRate" | "dailyOrders")}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-obsidian)]">
          <Icon className="h-4 w-4 text-[var(--color-ceramic)]" />
        </div>
      </div>
      {/* The value is placeholder data (lib/mock-dashboard.ts). Badge it on the
          card itself, not only in the page banner, so a cropped screenshot of a
          single card can't be mistaken for a real figure. */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-[var(--color-ceramic)]">
          {metric.value}
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
          {t("demoBadge")}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {isGood ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
        )}
        <span className={`text-xs font-semibold ${isGood ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? "+" : "-"}{metric.change}%
        </span>
        <span className="text-xs text-[var(--color-slate)]">{t("vs_last_period")}</span>
      </div>
    </div>
  );
}
