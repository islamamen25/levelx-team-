"use client";

import { useState, useRef, useCallback } from "react";
import { X, Plus, Upload, Loader2, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import type { ProductCondition } from "@/lib/supabase";
import type { MockProduct } from "@/lib/mock-products";

// ── Condition config ──────────────────────────────────────────────────────────
const CONDITIONS: { value: ProductCondition; label: string; desc: string; color: string }[] = [
  { value: "Premium",   label: "Premium",   desc: "Like new, flawless",         color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "Excellent", label: "Excellent", desc: "Minor signs, fully tested",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "Good",      label: "Good",      desc: "Light wear, works perfectly",color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "Fair",      label: "Fair",      desc: "Visible wear, fully working",color: "bg-amber-100 text-amber-700 border-amber-200" },
];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VariantDraft {
  sku_code: string;
  price: string;
  sale_price: string;
  discount_badge: string;
  stock_quantity: string;
  condition: ProductCondition;
}

export interface ProductFormData {
  name: string;
  brand: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  specs: { key: string; value: string }[];
  variants: VariantDraft[];
}

const defaultVariant = (): VariantDraft => ({
  sku_code: "",
  price: "",
  sale_price: "",
  discount_badge: "",
  stock_quantity: "0",
  condition: "Good",
});

const defaultForm = (product?: MockProduct): ProductFormData => ({
  name: product?.name ?? "",
  brand: product?.brand ?? "",
  slug: product?.slug ?? "",
  description: "",
  category: product?.category ?? "",
  images: [],
  specs: product
    ? Object.entries(product.specs).map(([key, value]) => ({ key, value }))
    : [{ key: "", value: "" }],
  variants: product
    ? product.variants.map((v) => ({
        sku_code: v.id,
        price: String(v.price),
        sale_price: "",
        discount_badge: "",
        stock_quantity: String(v.stock),
        condition: "Good" as ProductCondition,
      }))
    : [defaultVariant()],
});

// ── Component ─────────────────────────────────────────────────────────────────
interface ProductFormProps {
  product?: MockProduct;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(defaultForm(product));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload ─────────────────────────────────────────────────────────
  const uploadImages = useCallback(async (files: File[]) => {
    setUploading(true);
    const urls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        urls.push(publicUrl);
      }
    }

    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadImages(Array.from(e.dataTransfer.files));
  }, [uploadImages]);

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  // ── Specs ─────────────────────────────────────────────────────────────────
  const updateSpec = (idx: number, field: "key" | "value", val: string) => {
    setForm((f) => {
      const specs = [...f.specs];
      specs[idx] = { ...specs[idx], [field]: val };
      return { ...f, specs };
    });
  };

  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: "", value: "" }] }));

  const removeSpec = (idx: number) =>
    setForm((f) => ({ ...f, specs: f.specs.filter((_, i) => i !== idx) }));

  // ── Variants ──────────────────────────────────────────────────────────────
  const updateVariant = (idx: number, field: keyof VariantDraft, val: string) => {
    setForm((f) => {
      const variants = [...f.variants];
      variants[idx] = { ...variants[idx], [field]: val };
      return { ...f, variants };
    });
  };

  const addVariant = () =>
    setForm((f) => ({ ...f, variants: [...f.variants, defaultVariant()] }));

  const removeVariant = (idx: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      brand: form.brand || null,
      slug: form.slug || undefined,
      description: form.description || null,
      images: form.images,
      specs: Object.fromEntries(
        form.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])
      ),
      variants: form.variants.map((v) => ({
        sku_code: v.sku_code,
        price: parseFloat(v.price) || 0,
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
        discount_badge: v.discount_badge || null,
        stock_quantity: parseInt(v.stock_quantity) || 0,
        condition: v.condition,
        attributes: {},
      })),
    };

    const url = product
      ? `/api/admin/products?id=${product.id}`
      : "/api/admin/products";

    const res = await fetch(url, {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Save failed");
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ceramic)] tracking-tight">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <p className="text-xs text-[var(--color-slate)] mt-0.5">
            {product ? `Editing: ${product.name}` : "Fill in the details below"}
          </p>
        </div>
        <button type="button" onClick={onClose}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
          <X className="h-4 w-4 text-[var(--color-slate)]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 pb-6 overflow-y-auto max-h-[70vh]">
        <Tabs defaultValue="basic">
          <TabsList className="mb-5 bg-[var(--color-obsidian)] rounded-xl p-1 h-auto gap-1">
            {[
              { value: "basic",    label: "Basic Info" },
              { value: "pricing",  label: "Pricing & Condition" },
              { value: "specs",    label: "Specs" },
              { value: "images",   label: "Images" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Basic Info ── */}
          <TabsContent value="basic" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Apple iPhone 15" required
                  className="h-9 text-sm border-gray-200 focus:border-[var(--color-mint)] focus:ring-[var(--color-mint)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. Apple"
                  className="h-9 text-sm border-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">URL Slug</Label>
                <Input value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                  placeholder="e.g. apple-iphone-15"
                  className="h-9 text-sm border-gray-200 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Category</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Smartphones"
                  className="h-9 text-sm border-gray-200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Description</Label>
              <Textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Product description for PDP and AI agents…"
                rows={4}
                className="text-sm border-gray-200 resize-none" />
            </div>
          </TabsContent>

          {/* ── Pricing & Condition ── */}
          <TabsContent value="pricing" className="space-y-5 mt-0">
            {form.variants.map((variant, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-[var(--color-obsidian)] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-ceramic)] uppercase tracking-wider">
                    Variant {idx + 1}
                  </span>
                  {form.variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Condition selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Condition Grade</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITIONS.map((c) => (
                      <button key={c.value} type="button"
                        onClick={() => updateVariant(idx, "condition", c.value)}
                        className={[
                          "flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                          variant.condition === c.value
                            ? `${c.color} border-current`
                            : "bg-white border-gray-100 hover:border-gray-200",
                        ].join(" ")}>
                        <span className="text-xs font-bold">{c.label}</span>
                        <span className="text-[10px] opacity-70">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[var(--color-ceramic)]">SKU Code *</Label>
                    <Input value={variant.sku_code}
                      onChange={(e) => updateVariant(idx, "sku_code", e.target.value)}
                      placeholder="LX-APL-IP15-128-BLK"
                      className="h-9 text-sm font-mono border-gray-200" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Stock Qty</Label>
                    <Input type="number" min="0" value={variant.stock_quantity}
                      onChange={(e) => updateVariant(idx, "stock_quantity", e.target.value)}
                      className="h-9 text-sm border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Regular Price (£) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-slate)]">£</span>
                      <Input type="number" min="0" step="0.01" value={variant.price}
                        onChange={(e) => updateVariant(idx, "price", e.target.value)}
                        placeholder="0.00" required
                        className="h-9 text-sm border-gray-200 pl-7" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Sale Price (£)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-slate)]">£</span>
                      <Input type="number" min="0" step="0.01" value={variant.sale_price}
                        onChange={(e) => updateVariant(idx, "sale_price", e.target.value)}
                        placeholder="Optional"
                        className="h-9 text-sm border-gray-200 pl-7" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Discount Badge</Label>
                  <div className="flex items-center gap-2">
                    <Input value={variant.discount_badge}
                      onChange={(e) => updateVariant(idx, "discount_badge", e.target.value)}
                      placeholder='e.g. "20% OFF" or "DEAL OF THE DAY"'
                      className="h-9 text-sm border-gray-200" />
                    {variant.discount_badge && (
                      <Badge className="shrink-0 bg-[var(--color-mint)] text-white hover:bg-[var(--color-mint)] text-[10px] px-2 py-0.5">
                        {variant.discount_badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addVariant}
              className="w-full h-9 border-dashed border-gray-200 text-xs text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Another Variant
            </Button>
          </TabsContent>

          {/* ── Specs ── */}
          <TabsContent value="specs" className="space-y-3 mt-0">
            <p className="text-xs text-[var(--color-slate)]">
              Dynamic key/value specs shown on PDP and available to AI agents.
            </p>
            <div className="space-y-2">
              {form.specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={spec.key}
                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    placeholder="e.g. Display"
                    className="h-9 text-sm border-gray-200 flex-1" />
                  <Input value={spec.value}
                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    placeholder='e.g. 6.1" OLED'
                    className="h-9 text-sm border-gray-200 flex-1" />
                  <button type="button" onClick={() => removeSpec(idx)}
                    disabled={form.specs.length === 1}
                    className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addSpec}
              className="h-9 border-dashed border-gray-200 text-xs text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Spec Row
            </Button>
          </TabsContent>

          {/* ── Images ── */}
          <TabsContent value="images" className="space-y-4 mt-0">
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all",
                dragOver
                  ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)]"
                  : "border-gray-200 bg-[var(--color-obsidian)] hover:border-gray-300",
              ].join(" ")}>
              {uploading ? (
                <Loader2 className="h-8 w-8 text-[var(--color-mint)] animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-gray-300" />
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--color-ceramic)]">
                  {uploading ? "Uploading…" : "Drop images here"}
                </p>
                <p className="text-xs text-[var(--color-slate)] mt-0.5">
                  PNG, JPG, WEBP — uploaded to Supabase Storage
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files && uploadImages(Array.from(e.target.files))} />
            </div>

            {/* Preview grid */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {form.images.map((url, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-medium">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {/* Placeholder if no images */}
                {form.images.length === 0 && (
                  <div className="col-span-4 flex flex-col items-center gap-2 py-8 text-gray-300">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-xs">No images yet</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      {error && (
        <div className="mx-6 mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[var(--color-obsidian)]">
        <Button type="button" variant="outline" onClick={onClose}
          className="h-9 px-5 text-sm border-gray-200">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}
          className="h-9 px-6 text-sm bg-[var(--color-ceramic)] hover:bg-[var(--color-ceramic)]/90 text-white">
          {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
          {product ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
