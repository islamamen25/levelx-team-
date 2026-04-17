"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MONTHLY_DATA } from "@/lib/mock-dashboard";

const chartConfig: ChartConfig = {
  aov: { label: "AOV", color: "#00A699" },
};

export function AovChart() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-ceramic)]">{t("charts.aov")}</h3>
      <div dir="ltr">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6E6E73" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6E6E73" }}
              tickFormatter={(v) => `£${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="aov" fill="#00A699" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
