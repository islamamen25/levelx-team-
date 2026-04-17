"use client";

import { useState } from "react";
import {
  ChevronUp, ChevronDown, Eye, EyeOff, Plus, GripVertical, Trash2, ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductSelectorModal } from "@/components/admin/product-selector-modal";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PageSection {
  id:           string;
  label:        string;
  visible:      boolean;
  order:        number;
  product_ids?: string[];
}

// Sections that are pure layout — no product selection needed
const LAYOUT_ONLY = new Set(["hero", "categories", "newsletter", "trust", "brands"]);

// Built-in section icons / colours
const SECTION_META: Record<string, { emoji: string; color: string }> = {
  hero:        { emoji: "🖼️",  color: "bg-blue-50 text-blue-600 border-blue-100" },
  categories:  { emoji: "📂",  color: "bg-violet-50 text-violet-600 border-violet-100" },
  featured:    { emoji: "⭐",  color: "bg-amber-50 text-amber-600 border-amber-100" },
  bestsellers: { emoji: "🏆",  color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  brands:      { emoji: "🏷️",  color: "bg-slate-50 text-slate-600 border-slate-100" },
  newsletter:  { emoji: "✉️",  color: "bg-pink-50 text-pink-600 border-pink-100" },
  trust:       { emoji: "🛡️",  color: "bg-teal-50 text-teal-600 border-teal-100" },
  flash_deals: { emoji: "⚡",  color: "bg-orange-50 text-orange-600 border-orange-100" },
  apple:       { emoji: "🍎",  color: "bg-gray-50 text-gray-600 border-gray-100" },
};

const DEFAULT_META = { emoji: "📄", color: "bg-gray-50 text-gray-600 border-gray-100" };

// ── Component ─────────────────────────────────────────────────────────────────
interface SectionManagerProps {
  value:    PageSection[];
  onChange: (sections: PageSection[]) => void;
}

export function SectionManager({ value, onChange }: SectionManagerProps) {
  const [addOpen,      setAddOpen]      = useState(false);
  const [newLabel,     setNewLabel]     = useState("");
  const [newId,        setNewId]        = useState("");
  const [deleteIdx,    setDeleteIdx]    = useState<number | null>(null);
  // Product selector state
  const [selectorIdx,  setSelectorIdx]  = useState<number | null>(null);

  // Sorted by order
  const sorted = [...value].sort((a, b) => a.order - b.order);

  const reindex = (list: PageSection[]): PageSection[] =>
    list.map((s, i) => ({ ...s, order: i }));

  // ── Move up / down ────────────────────────────────────────────────────────
  const move = (idx: number, dir: -1 | 1) => {
    const list = [...sorted];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    onChange(reindex(list));
  };

  // ── Toggle visibility ─────────────────────────────────────────────────────
  const toggleVisible = (idx: number) => {
    const list = sorted.map((s, i) =>
      i === idx ? { ...s, visible: !s.visible } : s
    );
    onChange(reindex(list));
  };

  // ── Add custom section ─────────────────────────────────────────────────────
  const addSection = () => {
    if (!newLabel.trim()) return;
    const id = newId.trim() || newLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const newSection: PageSection = {
      id,
      label:   newLabel.trim(),
      visible: true,
      order:   sorted.length,
    };
    onChange([...value, newSection]);
    setNewLabel("");
    setNewId("");
    setAddOpen(false);
  };

  // ── Update product_ids for a section ─────────────────────────────────────
  const updateProductIds = (idx: number, ids: string[]) => {
    const list = sorted.map((s, i) =>
      i === idx ? { ...s, product_ids: ids } : s
    );
    onChange(reindex(list));
  };

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeSection = (idx: number) => {
    const list = sorted.filter((_, i) => i !== idx);
    onChange(reindex(list));
    setDeleteIdx(null);
  };

  const visibleCount = sorted.filter((s) => s.visible).length;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--color-slate)]">
          <span>{sorted.length} sections</span>
          <span>·</span>
          <span className="text-emerald-600 font-semibold">{visibleCount} visible</span>
          <span>·</span>
          <span className="text-gray-400">{sorted.length - visibleCount} hidden</span>
        </div>
        <Button onClick={() => setAddOpen(true)}
          variant="outline" size="sm"
          className="h-8 px-3 text-xs border-dashed border-gray-200 text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
        </Button>
      </div>

      {/* Section list */}
      <div className="space-y-2">
        {sorted.map((section, idx) => {
          const meta = SECTION_META[section.id] ?? DEFAULT_META;
          const isFirst = idx === 0;
          const isLast  = idx === sorted.length - 1;

          return (
            <div key={section.id}
              className={[
                "group flex items-center gap-3 rounded-xl border p-3 transition-all",
                section.visible
                  ? "bg-white border-gray-100 shadow-sm"
                  : "bg-[var(--color-obsidian)] border-gray-100 opacity-60",
              ].join(" ")}>

              {/* Drag handle (visual only) */}
              <GripVertical className="h-4 w-4 text-gray-200 shrink-0 cursor-grab" />

              {/* Order badge */}
              <span className="text-[10px] font-bold text-gray-300 w-4 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Icon */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base ${meta.color}`}>
                {meta.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ceramic)] leading-tight">
                  {section.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-mono text-[var(--color-slate)]">
                    id: {section.id}
                  </p>
                  {/* Product count pill — only for product sections */}
                  {!LAYOUT_ONLY.has(section.id) && (section.product_ids?.length ?? 0) > 0 && (
                    <span className="text-[10px] font-semibold text-[var(--color-mint)]">
                      · {section.product_ids!.length} product{section.product_ids!.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Product selector button — only for product-based sections */}
              {!LAYOUT_ONLY.has(section.id) && (
                <button
                  onClick={() => setSelectorIdx(idx)}
                  className={[
                    "shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all",
                    (section.product_ids?.length ?? 0) > 0
                      ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
                      : "border-gray-200 bg-white text-[var(--color-slate)] hover:border-[var(--color-mint)] hover:text-[var(--color-mint)]",
                  ].join(" ")}
                  title="Select products for this section">
                  <ShoppingBag className="h-3 w-3" />
                  {(section.product_ids?.length ?? 0) > 0
                    ? `${section.product_ids!.length} Products`
                    : "Pick Products"}
                </button>
              )}

              {/* Visibility badge */}
              <Badge className={[
                "shrink-0 text-[10px] px-2 py-0.5 border",
                section.visible
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                  : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-50",
              ].join(" ")}>
                {section.visible ? "Visible" : "Hidden"}
              </Badge>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Move up */}
                <button
                  onClick={() => move(idx, -1)}
                  disabled={isFirst}
                  className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)] disabled:opacity-20 disabled:cursor-not-allowed">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                {/* Move down */}
                <button
                  onClick={() => move(idx, 1)}
                  disabled={isLast}
                  className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)] disabled:opacity-20 disabled:cursor-not-allowed">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {/* Toggle visibility */}
                <button
                  onClick={() => toggleVisible(idx)}
                  className={[
                    "rounded-lg p-1.5 transition-colors",
                    section.visible
                      ? "hover:bg-amber-50 text-emerald-500 hover:text-amber-500"
                      : "hover:bg-emerald-50 text-gray-300 hover:text-emerald-500",
                  ].join(" ")}
                  title={section.visible ? "Hide section" : "Show section"}>
                  {section.visible
                    ? <Eye className="h-3.5 w-3.5" />
                    : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                {/* Delete (only custom sections can be deleted) */}
                {!SECTION_META[section.id] && (
                  <button
                    onClick={() => setDeleteIdx(idx)}
                    className="rounded-lg p-1.5 hover:bg-red-50 transition-colors text-gray-200 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-slate)]">
          <ChevronUp className="h-3 w-3" /><ChevronDown className="h-3 w-3" />
          Reorder
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-slate)]">
          <Eye className="h-3 w-3" /> Show / Hide
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-slate)]">
          <GripVertical className="h-3 w-3" /> Drag handle (coming soon)
        </div>
      </div>

      {/* ── Add Section Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-gray-100 p-6 gap-0">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--color-ceramic)]">Add Custom Section</h3>
              <p className="text-xs text-[var(--color-slate)] mt-0.5">
                Create a new home page section slot
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-ceramic)]">Section Label *</label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder='e.g. "Flash Deals"'
                  className="h-9 text-sm border-gray-100"
                  onKeyDown={(e) => e.key === "Enter" && addSection()}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-ceramic)]">
                  Section ID <span className="text-gray-300 font-normal">(auto-generated)</span>
                </label>
                <Input
                  value={newId || newLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="flash_deals"
                  className="h-9 text-sm font-mono border-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setAddOpen(false)}
                className="flex-1 h-9 border-gray-100 text-sm">Cancel</Button>
              <Button onClick={addSection} disabled={!newLabel.trim()}
                className="flex-1 h-9 bg-[var(--color-ceramic)] text-white text-sm hover:bg-[var(--color-ceramic)]/90">
                Add Section
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Product Selector Modal ── */}
      {selectorIdx !== null && (
        <ProductSelectorModal
          open={selectorIdx !== null}
          onClose={() => setSelectorIdx(null)}
          sectionLabel={sorted[selectorIdx]?.label ?? ""}
          initialSelected={sorted[selectorIdx]?.product_ids ?? []}
          onConfirm={(ids) => {
            updateProductIds(selectorIdx, ids);
            setSelectorIdx(null);
          }}
        />
      )}

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteIdx !== null} onOpenChange={() => setDeleteIdx(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-gray-100 p-6 gap-0">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-ceramic)]">Remove Section?</h3>
              <p className="text-sm text-[var(--color-slate)] mt-1">
                This will remove{" "}
                <strong>{deleteIdx !== null ? sorted[deleteIdx]?.label : ""}</strong>{" "}
                from the layout. You can re-add it later.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteIdx(null)}
                className="flex-1 h-9 border-gray-100 text-sm">Cancel</Button>
              <Button onClick={() => deleteIdx !== null && removeSection(deleteIdx)}
                className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white text-sm">
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
