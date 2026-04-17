"use client";

import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MONTHLY_DATA } from "@/lib/mock-dashboard";

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#00A699" },
  target:  { label: "Target",  color: "#D2D2D7" },
};

export function GmvChart() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-ceramic)]">{t("charts.gmv")}</h3>
      <div dir="ltr">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6E6E73" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6E6E73" }}
              tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A699" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00A699" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="#00A699"
              strokeWidth={2}
            />
            <Line
              dataKey="target"
              type="monotone"
              stroke="#D2D2D7"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
