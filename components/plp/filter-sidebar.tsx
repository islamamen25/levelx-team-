"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface FilterSidebarProps {
  brands: string[];
  categories: string[];
  locale: string;
}

const CONDITIONS = ["Fair", "Good", "Excellent", "Premium"] as const;
const PRICE_PRESETS = [
  { label: "< £200",       min: "0",   max: "200"  },
  { label: "£200 – £500",  min: "200", max: "500"  },
  { label: "£500 – £800",  min: "500", max: "800"  },
  { label: "£800+",        min: "800", max: ""     },
] as const;

export function FilterSidebar({ brands, categories, locale }: FilterSidebarProps) {
  const t = useTranslations("plp");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeConditions = (searchParams.get("condition") ?? "").split(",").filter(Boolean);
  const activeBrands     = (searchParams.get("brand")     ?? "").split(",").filter(Boolean);
  const activeCategory   = searchParams.get("category") ?? "";
  const priceMin         = searchParams.get("priceMin") ?? "";
  const priceMax         = searchParams.get("priceMax") ?? "";

  const hasFilters =
    activeConditions.length > 0 ||
    activeBrands.length > 0 ||
    activeCategory !== "" ||
    priceMin !== "" ||
    priceMax !== "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(
        { pathname, query: Object.fromEntries(params.entries()) },
        { locale: locale as "en" | "ar" },
      );
    });
  }

  function toggleList(key: string, active: string[], value: string) {
    const next = active.includes(value)
      ? active.filter((v) => v !== value)
      : [...active, value];
    update(key, next.join(","));
  }

  function clearAll() {
    startTransition(() => {
      router.replace({ pathname }, { locale: locale as "en" | "ar" });
    });
  }

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-ceramic">{t("filters")}</h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-[var(--color-mint)] hover:underline"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      <Accordion multiple defaultValue={["category", "condition", "brand", "price"]}>
        {/* ── Category ── */}
        <AccordionItem value="category">
          <AccordionTrigger>Category</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => update("category", isActive ? "" : cat)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
                        : "border-[var(--color-iron)] text-ceramic hover:border-ceramic/60",
                    ].join(" ")}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Condition ── */}
        <AccordionItem value="condition">
          <AccordionTrigger>{t("filterCondition")}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {CONDITIONS.map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={activeConditions.includes(c)}
                    onChange={() => toggleList("condition", activeConditions, c)}
                    className="h-4 w-4 rounded border-[var(--color-iron)] text-[var(--color-mint)] accent-[var(--color-mint)]"
                  />
                  <span className="text-sm text-ceramic">{c}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Brand ── */}
        <AccordionItem value="brand">
          <AccordionTrigger>{t("filterBrand")}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {brands.map((b) => (
                <label key={b} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={activeBrands.includes(b)}
                    onChange={() => toggleList("brand", activeBrands, b)}
                    className="h-4 w-4 rounded border-[var(--color-iron)] accent-[var(--color-mint)]"
                  />
                  <span className="text-sm text-ceramic">{b}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Price ── */}
        <AccordionItem value="price">
          <AccordionTrigger>{t("filterPrice")}</AccordionTrigger>
          <AccordionContent>
            {/* Preset chips */}
            <div className="mb-3 flex flex-wrap gap-2">
              {PRICE_PRESETS.map(({ label, min, max }) => {
                const active = priceMin === min && priceMax === max;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      update("priceMin", min);
                      update("priceMax", max);
                    }}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
                        : "border-[var(--color-iron)] text-ceramic hover:border-ceramic",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Custom range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t("filterPriceMin")}
                value={priceMin}
                onChange={(e) => update("priceMin", e.target.value)}
                className="w-full rounded-lg border border-[var(--color-iron)] px-3 py-2 text-sm text-ceramic focus:border-[var(--color-mint)] focus:outline-none"
              />
              <span className="text-slate">–</span>
              <input
                type="number"
                placeholder={t("filterPriceMax")}
                value={priceMax}
                onChange={(e) => update("priceMax", e.target.value)}
                className="w-full rounded-lg border border-[var(--color-iron)] px-3 py-2 text-sm text-ceramic focus:border-[var(--color-mint)] focus:outline-none"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
