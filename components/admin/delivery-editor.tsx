"use client";

import { useLocale } from "next-intl";
import { Plus, Trash2, Truck, Package, Gift } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DeliveryConfig } from "@/lib/delivery";
import { EGYPT_GOVERNORATES } from "@/lib/egypt-governorates";

interface DeliveryEditorProps {
  value: DeliveryConfig;
  onChange: (delivery: DeliveryConfig) => void;
}

const MODES = [
  { id: "free",      Icon: Gift,    ar: "مجاني دائماً",        en: "Always free" },
  { id: "threshold", Icon: Package, ar: "مجاني فوق مبلغ",       en: "Free over an amount" },
  { id: "flat",      Icon: Truck,   ar: "سعر ثابت",            en: "Flat rate" },
] as const;

/** "" for a zero value so the field reads empty while the admin is typing. */
const numToInput = (n: number) => (n ? String(n) : "");
const inputToNum = (raw: string) => (raw === "" ? 0 : Math.max(0, Number(raw) || 0));

export function DeliveryEditor({ value, onChange }: DeliveryEditorProps) {
  const locale = useLocale();
  const ar = locale === "ar";
  const set = (patch: Partial<DeliveryConfig>) => onChange({ ...value, ...patch });

  const usedGovs = new Set(value.governorates.map((g) => g.name));
  const firstUnused = EGYPT_GOVERNORATES.find((g) => !usedGovs.has(g.value))?.value ?? "";

  return (
    <div className="space-y-6">
      {/* ── Mode ── */}
      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
          {ar ? "طريقة حساب التوصيل" : "How delivery is charged"}
        </Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map(({ id, Icon, ar: arLabel, en }) => {
            const active = value.mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set({ mode: id })}
                className={[
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all",
                  active
                    ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)]"
                    : "border-gray-200 bg-white hover:border-[var(--color-mint)]/50",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 text-[var(--color-mint)]" strokeWidth={2} />
                <span className="text-xs font-bold text-[var(--color-ceramic)]">{ar ? arLabel : en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fee (flat + threshold) ── */}
      {value.mode !== "free" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="delivery-fee" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
              {ar ? "سعر التوصيل (ج.م)" : "Delivery fee (EGP)"}
            </Label>
            <Input
              id="delivery-fee"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              value={numToInput(value.fee)}
              onChange={(e) => set({ fee: inputToNum(e.target.value) })}
            />
          </div>
          {value.mode === "threshold" && (
            <div>
              <Label htmlFor="delivery-threshold" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
                {ar ? "التوصيل مجاني فوق (ج.م)" : "Free delivery above (EGP)"}
              </Label>
              <Input
                id="delivery-threshold"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={numToInput(value.free_over)}
                onChange={(e) => set({ free_over: inputToNum(e.target.value) })}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Per-governorate overrides ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-slate)]">
            {ar ? "أسعار محافظات مخصّصة" : "Per-governorate prices"}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!firstUnused || value.mode === "free"}
            onClick={() => set({ governorates: [...value.governorates, { name: firstUnused, fee: value.fee }] })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {ar ? "إضافة محافظة" : "Add governorate"}
          </Button>
        </div>

        {value.mode === "free" ? (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-[var(--color-slate)]">
            {ar
              ? "التوصيل مجاني دائماً — أسعار المحافظات متجاهلة في هذا الوضع."
              : "Delivery is always free — per-governorate prices are ignored in this mode."}
          </p>
        ) : value.governorates.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-[var(--color-slate)]">
            {ar
              ? `كل المحافظات تدفع السعر الأساسي (${value.fee} ج.م). أضف محافظة لسعر مختلف.`
              : `Every governorate pays the base fee (EGP ${value.fee}). Add one for a different price.`}
          </p>
        ) : (
          <div className="space-y-2">
            {value.governorates.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.name}
                  onChange={(e) => {
                    const next = [...value.governorates];
                    next[i] = { ...next[i], name: e.target.value };
                    set({ governorates: next });
                  }}
                  className="h-9 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g.value} value={g.value} disabled={usedGovs.has(g.value) && g.value !== row.name}>
                      {ar ? g.ar : g.en}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  className="w-28"
                  value={numToInput(row.fee)}
                  onChange={(e) => {
                    const next = [...value.governorates];
                    next[i] = { ...next[i], fee: inputToNum(e.target.value) };
                    set({ governorates: next });
                  }}
                />
                <button
                  type="button"
                  aria-label={ar ? "حذف" : "Remove"}
                  onClick={() => set({ governorates: value.governorates.filter((_, j) => j !== i) })}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[var(--color-slate)] transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--color-slate)]">
        {ar
          ? "بيُحسب سعر التوصيل على الخادم من نفس الإعدادات دي وقت تأكيد الطلب — العميل مش بيقدر يغيّره."
          : "The delivery fee is recomputed on the server from these same settings when an order is placed — a customer cannot change it."}
      </p>
    </div>
  );
}
