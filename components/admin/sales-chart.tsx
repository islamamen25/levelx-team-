"use client";

import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { DAILY_SALES } from "@/lib/mock-dashboard";

const chartConfig: ChartConfig = {
  sales:  { label: "Sales (£)", color: "#00A699" },
  orders: { label: "Orders",    color: "#6E6E73" },
};

export function SalesChart() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-ceramic)]">{t("charts.sales")}</h3>
      <div dir="ltr">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <LineChart data={DAILY_SALES} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#6E6E73" }}
              interval={4}
            />
            <YAxis
              yAxisId="sales"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6E6E73" }}
              tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6E6E73" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              yAxisId="sales"
              dataKey="sales"
              type="monotone"
              stroke="#00A699"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="orders"
              dataKey="orders"
              type="monotone"
              stroke="#6E6E73"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
