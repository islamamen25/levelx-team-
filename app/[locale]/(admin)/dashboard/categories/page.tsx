"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FolderTree, Plus, Pencil, Trash2, Eye, EyeOff,
  ChevronRight, Loader2, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CategoryRow {
  id:         string;
  name:       string;
  slug:       string;
  parent_id:  string | null;
  is_visible: boolean;
}

interface FormState {
  name:       string;
  slug:       string;
  parent_id:  string;
  is_visible: boolean;
}

const empty = (): FormState => ({ name: "", slug: "", parent_id: "", is_visible: true });

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CategoriesAdminPage() {
  const [cats,      setCats]      = useState<CategoryRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<FormState>(empty());
  const [saving,    setSaving]    = useState(false);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [,         startT]        = useTransition();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCats = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data: CategoryRow[] = await res.json();
    setCats(data);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  // ── Open Add / Edit ───────────────────────────────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setForm(empty());
    setError(null);
    setOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id ?? "", is_visible: cat.is_visible });
    setError(null);
    setOpen(true);
  };

  // ── Toggle visibility ─────────────────────────────────────────────────────
  const toggleVisible = async (cat: CategoryRow) => {
    await fetch(`/api/admin/categories?id=${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !cat.is_visible }),
    });
    fetchCats();
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name:       form.name,
      slug:       form.slug || toSlug(form.name),
      parent_id:  form.parent_id || null,
      is_visible: form.is_visible,
    };

    const url    = editId ? `/api/admin/categories?id=${editId}` : "/api/admin/categories";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      setError(typeof err.error === "string" ? err.error : "Save failed");
      return;
    }

    setOpen(false);
    fetchCats();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/categories?id=${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCats();
  };

  // ── Tree rendering (2-level) ───────────────────────────────────────────────
  const roots    = cats.filter((c) => !c.parent_id);
  const children = (id: string) => cats.filter((c) => c.parent_id === id);

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-mint)] mb-1">
              Admin
            </p>
            <h1 className="text-[var(--color-ceramic)]"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800 }}>
              Category Management
            </h1>
            <p className="mt-1 text-sm text-[var(--color-slate)]">
              Add, edit, or hide categories. Changes invalidate CDN cache automatically.
            </p>
          </div>
          <Button onClick={openAdd}
            className="h-9 px-5 text-sm bg-[var(--color-ceramic)] hover:bg-[var(--color-ceramic)]/90 text-white shrink-0 self-start md:self-auto">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Category
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 flex gap-6 text-sm text-[var(--color-slate)]">
          <span><strong className="text-[var(--color-ceramic)]">{cats.length}</strong> total</span>
          <span><strong className="text-[var(--color-ceramic)]">{cats.filter((c) => c.is_visible).length}</strong> visible</span>
          <span><strong className="text-[var(--color-ceramic)]">{roots.length}</strong> root categories</span>
        </div>

        {/* Tree */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-iron)]" />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {roots.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-20 text-center text-[var(--color-iron)]">
                <FolderTree className="h-12 w-12" />
                <p className="text-sm font-medium">No categories yet. Add your first one.</p>
              </div>
            )}

            {roots.map((root, ri) => (
              <div key={root.id}>
                {ri > 0 && <div className="border-t border-gray-50" />}

                {/* Root row */}
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-obsidian)]/40 transition-colors group">
                  <FolderTree className="h-4 w-4 text-[var(--color-mint)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-bold ${root.is_visible ? "text-[var(--color-ceramic)]" : "text-[var(--color-iron)] line-through"}`}>
                      {root.name}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-[var(--color-iron)]">{root.slug}</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-slate)]">
                    {children(root.id).length} sub
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleVisible(root)}
                      className="rounded-lg p-2 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)]"
                      title={root.is_visible ? "Hide" : "Show"}>
                      {root.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => openEdit(root)}
                      className="rounded-lg p-2 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(root.id)}
                      className="rounded-lg p-2 hover:bg-red-50 transition-colors text-[var(--color-slate)] hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children rows */}
                {children(root.id).map((child, ci) => (
                  <div key={child.id}>
                    <div className="border-t border-gray-50" />
                    <div className="flex items-center gap-3 pl-12 pr-5 py-3 hover:bg-[var(--color-obsidian)]/30 transition-colors group">
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--color-iron)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${child.is_visible ? "text-[var(--color-ceramic)]" : "text-[var(--color-iron)] line-through"}`}>
                          {child.name}
                        </span>
                        <span className="ml-2 font-mono text-[10px] text-[var(--color-iron)]">{child.slug}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleVisible(child)}
                          className="rounded-lg p-2 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)]"
                          title={child.is_visible ? "Hide" : "Show"}>
                          {child.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => openEdit(child)}
                          className="rounded-lg p-2 hover:bg-gray-100 transition-colors text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(child.id)}
                          className="rounded-lg p-2 hover:bg-red-50 transition-colors text-[var(--color-slate)] hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl border-gray-100 p-0 gap-0 overflow-hidden">
          <form onSubmit={handleSave}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-[var(--color-ceramic)]">
                {editId ? "Edit Category" : "Add Category"}
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4 text-[var(--color-slate)]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug || toSlug(e.target.value),
                  }))}
                  placeholder="e.g. Mobile Phones"
                  required
                  className="h-9 text-sm border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                  placeholder="auto-generated from name"
                  className="h-9 text-sm border-gray-200 font-mono"
                />
                <p className="text-[10px] text-[var(--color-iron)]">URL: /category/{form.slug || "…"}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Parent Category</Label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-[var(--color-ceramic)] focus:outline-none focus:ring-1 focus:ring-[var(--color-mint)]"
                >
                  <option value="">— Root category —</option>
                  {cats.filter((c) => !c.parent_id && c.id !== editId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${form.is_visible ? "bg-[var(--color-mint)]" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_visible ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-[var(--color-ceramic)]">Visible to customers</span>
              </label>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[var(--color-obsidian)]">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}
                className="h-9 px-5 text-sm border-gray-200">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}
                className="h-9 px-6 text-sm bg-[var(--color-ceramic)] hover:bg-[var(--color-ceramic)]/90 text-white">
                {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                {editId ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-gray-100 p-6">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-ceramic)]">Delete Category?</h3>
              <p className="text-sm text-[var(--color-slate)] mt-1">
                All subcategories linked to this will also be deleted (cascade). This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}
                className="flex-1 h-9 border-gray-100 text-sm">Cancel</Button>
              <Button onClick={handleDelete}
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
