"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { DbProduct, DbVariant, ProductCondition } from "@/lib/supabase";

const CONDITION_STYLES: Record<ProductCondition, string> = {
  Premium:   "bg-violet-100 text-violet-700 border border-violet-200",
  Excellent: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Good:      "bg-blue-100 text-blue-700 border border-blue-200",
  Fair:      "bg-amber-100 text-amber-700 border border-amber-200",
};

const CONDITION_ORDER: ProductCondition[] = ["Premium", "Excellent", "Good", "Fair"];

type SortField = "name" | "brand" | "price" | "stock";
type SortDir   = "asc" | "desc";

type Row = { product: DbProduct; variants: DbVariant[] };

interface ProductTableProps {
  initialProducts: Row[];
  categories: { id: string; name: string }[];
  locale: string;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronUp className="h-3 w-3 text-gray-300" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-[var(--color-ceramic)]" />
    : <ChevronDown className="h-3 w-3 text-[var(--color-ceramic)]" />;
}

function lowestPrice(variants: DbVariant[]): number {
  if (!variants.length) return 0;
  return Math.min(...variants.map((v) => v.sale_price ?? v.price));
}

function totalStock(variants: DbVariant[]): number {
  return variants.reduce((s, v) => s + v.stock_quantity, 0);
}

function topCondition(variants: DbVariant[]): ProductCondition {
  for (const c of CONDITION_ORDER) {
    if (variants.some((v) => v.condition === c)) return c;
  }
  return "Good";
}

export function ProductTable({ initialProducts, categories, locale }: ProductTableProps) {
  const router = useRouter();

  const [search, setSearch]         = useState("");
  const [categoryFilter, setCat]    = useState("All");
  const [sortField, setSortField]   = useState<SortField>("name");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const CATS = ["All", ...categories.map((c) => c.name)];

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let list = [...initialProducts];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ product: p }) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        (p.slug ?? "").toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "All") {
      const catId = categories.find((c) => c.name === categoryFilter)?.id;
      if (catId) list = list.filter(({ product: p }) => p.category_id === catId);
    }

    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortField === "name")  { av = a.product.name;          bv = b.product.name; }
      if (sortField === "brand") { av = a.product.brand ?? "";   bv = b.product.brand ?? ""; }
      if (sortField === "price") { av = lowestPrice(a.variants); bv = lowestPrice(b.variants); }
      if (sortField === "stock") { av = totalStock(a.variants);  bv = totalStock(b.variants); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [initialProducts, search, categoryFilter, sortField, sortDir, categories]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.ok) router.refresh();
  };

  // Add/edit live on their own pages so there is room for the full form.
  const openAdd  = () => router.push(`/${locale}/dashboard/catalog/new`);
  const openEdit = (row: Row) => router.push(`/${locale}/dashboard/catalog/edit?id=${row.product.id}`);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-9 pl-9 text-sm border-gray-100 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {CATS.map((cat) => (
            <button key={cat} onClick={() => setCat(cat)}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                categoryFilter === cat
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

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-slate)]">
        <span>{filtered.length} products</span>
        <span>·</span>
        <span>{filtered.reduce((s, r) => s + totalStock(r.variants), 0).toLocaleString()} units in stock</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent">
              <TableHead className="w-[300px]">
                <button onClick={() => handleSort("name")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  Product <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("brand")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  Brand <SortIcon field="brand" sortField={sortField} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>
                <button onClick={() => handleSort("price")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  From <SortIcon field="price" sortField={sortField} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort("stock")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-slate)] hover:text-[var(--color-ceramic)] transition-colors">
                  Stock <SortIcon field="stock" sortField={sortField} sortDir={sortDir} />
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

            {filtered.map((row) => {
              const { product, variants } = row;
              const stock    = totalStock(variants);
              const price    = lowestPrice(variants);
              const cond     = topCondition(variants);
              const image    = (product.images as string[])?.[0];

              return (
                <TableRow key={product.id}
                  className="border-gray-50 hover:bg-[var(--color-obsidian)]/50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl shrink-0 overflow-hidden bg-[#F5F5F7]">
                        {image
                          ? <img src={image} alt={product.name} className="h-full w-full object-contain p-1" />
                          : <div className="h-full w-full" />}
                      </div>
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

                  <TableCell>
                    <span className="text-sm text-[var(--color-ceramic)]">{product.brand ?? "—"}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-[var(--color-slate)]">{categoryName(product.category_id)}</span>
                  </TableCell>

                  <TableCell>
                    {variants.length > 0 ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CONDITION_STYLES[cond]}`}>
                        {cond}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">No variants</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-sm font-bold text-[var(--color-ceramic)]">
                      {price > 0 ? `EGP ${price.toLocaleString()}` : "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${stock > 10 ? "bg-emerald-400" : stock > 0 ? "bg-amber-400" : "bg-red-400"}`} />
                      <span className={`text-sm font-medium ${stock === 0 ? "text-red-500" : "text-[var(--color-ceramic)]"}`}>
                        {stock}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(row)}
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

      {/* Add / Edit now navigate to their own full pages — see openAdd/openEdit */}

      {/* Delete Confirm Dialog */}
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
              <Button
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white text-sm">
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
