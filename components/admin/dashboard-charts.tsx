"use client";

/**
 * dashboard-charts.tsx
 * Client Component wrapper for all dashboard charts + period tabs.
 *
 * Why this exists:
 *   next/dynamic with `ssr: false` is only allowed in Client Components.
 *   The parent dashboard/page.tsx is a Server Component (async, uses
 *   getTranslations). We extract the interactive + chart portions here so the
 *   server page stays clean, while Recharts (~280 KB parsed) is still
 *   code-split and deferred until after the page is interactive.
 */

import dynamic from "next/dynamic";
import { useState } from "react";

type Period = "7d" | "30d" | "90d" | "12m";

// ── Chart skeleton — shown while Recharts bundle loads ────────────────────────
function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm animate-pulse">
      <div className="mb-4 h-4 w-32 rounded-lg bg-gray-100" />
      <div className="h-[260px] w-full rounded-xl bg-gray-50" />
    </div>
  );
}

// ── Dynamic imports — each chart is code-split and deferred ───────────────────
const GmvChart     = dynamic(() => import("@/components/admin/gmv-chart").then((m) => ({ default: m.GmvChart })),         { loading: ChartSkeleton, ssr: false });
const AovChart     = dynamic(() => import("@/components/admin/aov-chart").then((m) => ({ default: m.AovChart })),         { loading: ChartSkeleton, ssr: false });
const ReturnsChart = dynamic(() => import("@/components/admin/returns-chart").then((m) => ({ default: m.ReturnsChart })), { loading: ChartSkeleton, ssr: false });
const SalesChart   = dynamic(() => import("@/components/admin/sales-chart").then((m) => ({ default: m.SalesChart })),     { loading: ChartSkeleton, ssr: false });

interface DashboardChartsProps {
  locale:       string;
  periodLabels: Record<Period, string>;
}

export function DashboardCharts({ locale, periodLabels }: DashboardChartsProps) {
  const [activePeriod, setActivePeriod] = useState<Period>("12m");
  const periods: Period[] = ["7d", "30d", "90d", "12m"];

  return (
    <>
      {/* Period tabs */}
      <div className="mb-8 flex justify-end">
        <div className="flex gap-1 rounded-xl bg-[var(--color-obsidian)] p-1">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setActivePeriod(period)}
              className={[
                "rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                period === activePeriod
                  ? "bg-white text-[var(--color-ceramic)] shadow-sm"
                  : "text-[var(--color-slate)] hover:text-[var(--color-ceramic)]",
              ].join(" ")}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid — deferred: Recharts loads after page is interactive */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GmvChart />
        <AovChart />
        <ReturnsChart />
        <SalesChart />
      </div>
    </>
  );
}
