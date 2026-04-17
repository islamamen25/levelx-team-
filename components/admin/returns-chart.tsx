"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { RETURNS_DATA } from "@/lib/mock-dashboard";

const chartConfig: ChartConfig = {
  returnRate: { label: "Return Rate %", color: "#f59e0b" },
};

function getBarColor(rate: number) {
  if (rate >= 5) return "#ef4444";
  if (rate >= 4) return "#f59e0b";
  return "#00A699";
}

export function ReturnsChart() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-ceramic)]">{t("charts.returns")}</h3>
      <div dir="ltr">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={RETURNS_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6E6E73" }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#6E6E73" }}
              width={75}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="returnRate" radius={[0, 4, 4, 0]}>
              {RETURNS_DATA.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.returnRate)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
