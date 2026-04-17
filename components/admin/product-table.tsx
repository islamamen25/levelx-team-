"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductForm } from "@/components/admin/product-form";
import { PRODUCTS } from "@/lib/mock-products";
import type { MockProduct } from "@/lib/mock-products";
import type { ProductCondition } from "@/lib/supabase";

// ── Condition badge styles ────────────────────────────────────────────────────
const CONDITION_STYLES: Record<ProductCondition, string> = {
  Premium:   "bg-violet-100 text-violet-700 border border-violet-200",
  Excellent: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Good:      "bg-blue-100 text-blue-700 border border-blue-200",
  Fair:      "bg-amber-100 text-amber-700 border border-amber-200",
};

const CATEGORIES = ["All", "Smartphones", "Laptops", "Tablets", "Consoles", "Smartwatches", "Headphones"];

type SortField = "name" | "brand" | "price" | "stock";
type SortDir = "asc" | "desc";

// ── Component ─────────────────────────────────────────────────────────────────
export function ProductTable() {
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("All");
  const [sortField, setSortField]     = useState<SortField>("name");
  const [sortDir, setSortDir]         = useState<SortDir>("asc");
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editProduct, setEditProduct] = useState<MockProduct | undefined>();
  const [products, setProducts]       = useState<MockProduct[]>(PRODUCTS);
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-[var(--color-ceramic)]" />
      : <ChevronDown className="h-3 w-3 text-[var(--color-ceramic)]" />;
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    if (category !== "All") {
      list = list.filter((p) => p.category === category);
    }
    list.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortField === "name")  { aVal = a.name;  bVal = b.name; }
      if (sortField === "brand") { aVal = a.brand; bVal = b.brand; }
      if (sortField === "price") { aVal = Math.min(...a.variants.map((v) => v.price)); bVal = Math.min(...b.variants.map((v) => v.price)); }
      if (sortField === "stock") { aVal = a.variants.reduce((s, v) => s + v.stock, 0); bVal = b.variants.reduce((s, v) => s + v.stock, 0); }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, search, category, sortField, sortDir]);

  // ── Delete (mock) ─────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  const openAdd = () => { setEditProduct(undefined); setDialogOpen(true); };
  const openEdit = (p: MockProduct) => { setEditProduct(p); setDialogOpen(true); };

  const lowestPrice = (p: MockProduct) =>
    Math.min(...p.variants.map((v) => v.price));
  const totalStock = (p: MockProduct) =>
    p.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-9 pl-9 text-sm border-gray-100 bg-white"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                category === cat
                  ? "bg-[var(--color-ceramic)] text-white"
                  : "bg-[var(--color-obsidian)] text-[var(--color-slate)] hover:text-[var(--color-ceramic)]",
              ].join(" ")}>
              {cat}
            </button>
          ))}
        </div>

        <Button onClick={openAdd}
          className="h-9 px-5 text-sm bg-[var(--color-ceramic)] hover:bg-[var(--color-ceramic)]/90 text-white shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* ── Stats row ── */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-slate)]">
        <span>{filtered.length} products</span>
        <span>·</span>
        <span>{filtered.reduce((s, p) => s + totalStock(p), 0).toLocaleString()} units in stock</span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent">
              <TableHead className="w-[300px]">
                <button onClick={() => handleSort("name")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  Product <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("brand")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  Brand <SortIcon field="brand" />
                </button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>
                <button onClick={() => handleSort("price")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  From <SortIcon field="price" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("stock")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  Stock <SortIcon field="stock" />
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center gap-2 py-12 text-gray-300">
                    <Package className="h-10 w-10" />
                    <span className="text-sm">No products found</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((product) => {
              const stock = totalStock(product);
              const price = lowestPrice(product);
              // Default condition display from first condition_option (highest grade available)
              const topCondition = product.condition_options.at(-1)?.tier ?? "Good";

              return (
                <TableRow key={product.id}
                  className="border-gray-50 hover:bg-[var(--color-obsidian)]/50 transition-colors group">
                  {/* Product */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Gradient image placeholder */}
                      <div className="h-10 w-10 rounded-xl shrink-0 overflow-hidden"
                        style={{ background: product.images[0]?.gradient ?? "#f5f5f7" }} />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ceramic)] leading-tight line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-[var(--color-slate)] font-mono mt-0.5">
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Brand */}
                  <TableCell>
                    <span className="text-sm text-[var(--color-ceramic)]">{product.brand}</span>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <span className="text-xs text-[var(--color-slate)]">{product.category}</span>
                  </TableCell>

                  {/* Condition */}
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CONDITION_STYLES[topCondition as ProductCondition] ?? CONDITION_STYLES.Good}`}>
                      {topCondition}
                    </span>
                  </TableCell>

                  {/* Price */}
                  <TableCell>
                    <span className="text-sm font-bold text-[var(--color-ceramic)]">
                      £{price.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* Stock */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${stock > 10 ? "bg-emerald-400" : stock > 0 ? "bg-amber-400" : "bg-red-400"}`} />
                      <span className={`text-sm font-medium ${stock === 0 ? "text-red-500" : "text-[var(--color-ceramic)]"}`}>
                        {stock}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(product)}
                        className="rounded-lg p-2 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(product.id)}
                        className="rounded-lg p-2 hover:bg-red-50 transition-colors text-[var(--color-slate)] hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-0 rounded-2xl overflow-hidden gap-0 border-gray-100">
          <ProductForm
            product={editProduct}
            onClose={() => setDialogOpen(false)}
            onSaved={() => {}}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-gray-100 p-6">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-ceramic)]">Delete Product?</h3>
              <p className="text-sm text-[var(--color-slate)] mt-1">
                This action cannot be undone. The product and all its variants will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}
                className="flex-1 h-9 border-gray-100 text-sm">Cancel</Button>
              <Button onClick={() => deleteId && handleDelete(deleteId)}
                className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white text-sm">
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
