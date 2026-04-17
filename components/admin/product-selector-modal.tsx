"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Package, Check, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SearchProduct } from "@/app/api/admin/products/search/route";

interface ProductSelectorModalProps {
  open:            boolean;
  onClose:         () => void;
  sectionLabel:    string;
  initialSelected: string[];
  onConfirm:       (ids: string[]) => void;
}

export function ProductSelectorModal({
  open,
  onClose,
  sectionLabel,
  initialSelected,
  onConfirm,
}: ProductSelectorModalProps) {
  const [query,    setQuery]    = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [source,   setSource]   = useState<"db" | "mock">("mock");

  // ── Reset selection when modal opens ─────────────────────────────────────
  useEffect(() => {
    if (open) setSelected(new Set(initialSelected));
  }, [open, initialSelected]);

  // ── Fetch products (debounced) ────────────────────────────────────────────
  const fetchProducts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/products/search?${params}`);
      const json = await res.json();
      setProducts(json.products ?? []);
      setSource(json.source ?? "mock");
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open + re-fetch on query change (debounced 300ms)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchProducts(query), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, query, fetchProducts]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  const handleClear = () => setSelected(new Set());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-2xl border-gray-100 p-0 gap-0 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-ceramic)]">
              Select Products
            </h3>
            <p className="text-xs text-[var(--color-slate)] mt-0.5">
              for <span className="font-semibold text-[var(--color-ceramic)]">{sectionLabel}</span>
              {source === "mock" && (
                <span className="ml-2 text-[10px] text-amber-500 font-medium">
                  · using demo data (add real products in Catalog)
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-[var(--color-slate)]" />
          </button>
        </div>

        {/* ── Search ── */}
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or brand…"
              className="h-9 pl-8 text-sm border-gray-100 bg-[var(--color-obsidian)]"
              autoFocus
            />
          </div>
        </div>

        {/* ── Product List ── */}
        <div className="overflow-y-auto max-h-[360px]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--color-slate)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-300">
              <Package className="h-8 w-8" />
              <span className="text-sm">No products found</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {products.map((product) => {
                const isSelected = selected.has(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggle(product.id)}
                    className={[
                      "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                      isSelected
                        ? "bg-[var(--color-mint-soft)]"
                        : "hover:bg-[var(--color-obsidian)]",
                    ].join(" ")}>

                    {/* Product image / gradient */}
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl overflow-hidden"
                      style={{
                        background: product.gradient.startsWith("http")
                          ? undefined
                          : product.gradient,
                      }}>
                      {product.gradient.startsWith("http") && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.gradient} alt={product.name}
                          className="h-full w-full object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-ceramic)] leading-tight truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--color-slate)]">{product.brand}</span>
                        <span className="text-[10px] text-gray-200">·</span>
                        <span className="text-[10px] text-[var(--color-slate)]">{product.category}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-[var(--color-ceramic)] shrink-0">
                      {product.price > 0 ? `£${product.price.toLocaleString()}` : "—"}
                    </span>

                    {/* Checkbox */}
                    <div className={[
                      "h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-[var(--color-mint)] border-[var(--color-mint)]"
                        : "border-gray-200 bg-white",
                    ].join(" ")}>
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-[var(--color-obsidian)]">
          <div className="flex items-center gap-2">
            {selected.size > 0 ? (
              <>
                <Badge className="bg-[var(--color-mint)] text-white text-xs px-2.5 py-0.5 hover:bg-[var(--color-mint)]">
                  {selected.size} selected
                </Badge>
                <button onClick={handleClear}
                  className="text-xs text-[var(--color-slate)] hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-300">No products selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}
              className="h-8 px-4 text-xs border-gray-200">
              Cancel
            </Button>
            <Button onClick={handleConfirm}
              className="h-8 px-4 text-xs bg-[var(--color-ceramic)] text-white hover:bg-[var(--color-ceramic)]/90">
              Confirm Selection
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
