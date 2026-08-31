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
import type { DbProduct, DbVariant, DbTranslation, ProductCondition } from "@/lib/supabase";
import { toSquareWebp } from "@/lib/image-client";

const CONDITIONS: { value: ProductCondition; label: string; desc: string; color: string }[] = [
  { value: "Premium",   label: "Premium",   desc: "Like new, flawless",          color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "Excellent", label: "Excellent", desc: "Minor signs, fully tested",   color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "Good",      label: "Good",      desc: "Light wear, works perfectly", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "Fair",      label: "Fair",      desc: "Visible wear, fully working", color: "bg-amber-100 text-amber-700 border-amber-200" },
];

// Storefront image spec (IMAGE-GUIDE.md, 2026-07-27): square, 1500×1500 ideal,
// under 500 KB. levelx-images.py already enforces this for the cowork path; this
// is the same treatment for images dropped straight onto the form, so both paths
// put comparable files in the bucket. Without it a 6 MB phone photo would be
// served verbatim on every product page.
// toSquareWebp() itself now lives in lib/image-client.ts — extracted once the
// Storefront Builder's brand-logo / category-tile editors needed the identical
// square/white-bg/size-budget treatment, so this file and that one couldn't drift.

export interface VariantDraft {
  sku_code: string;
  price: string;
  sale_price: string;
  discount_badge: string;
  stock_quantity: string;
  condition: ProductCondition;
}

interface TranslationDraft {
  title: string;
  description: string;
  specs: { key: string; value: string }[];
}

interface FormState {
  name: string;
  brand: string;
  slug: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  images: string[];
  specs: { key: string; value: string }[];
  variants: VariantDraft[];
  translations: { en: TranslationDraft; ar: TranslationDraft };
}

const defaultVariant = (): VariantDraft => ({
  sku_code: "",
  price: "",
  sale_price: "",
  discount_badge: "",
  stock_quantity: "0",
  condition: "Good",
});

const emptyTranslation = (): TranslationDraft => ({
  title: "",
  description: "",
  specs: [{ key: "", value: "" }],
});

function translationToDraft(t?: DbTranslation): TranslationDraft {
  if (!t) return emptyTranslation();
  const specs = Object.entries((t.specs as Record<string, string>) ?? {}).map(
    ([key, value]) => ({ key, value })
  );
  return {
    title: t.title ?? "",
    description: t.description ?? "",
    specs: specs.length ? specs : [{ key: "", value: "" }],
  };
}

function initForm(product?: DbProduct, variants?: DbVariant[], translations?: DbTranslation[]): FormState {
  const translationState = {
    en: translationToDraft(translations?.find((t) => t.lang === "en")),
    ar: translationToDraft(translations?.find((t) => t.lang === "ar")),
  };
  if (!product) {
    return {
      name: "", brand: "", slug: "", description: "", categoryId: "",
      isActive: true,
      images: [],
      specs: [{ key: "", value: "" }],
      variants: [defaultVariant()],
      translations: translationState,
    };
  }
  return {
    name: product.name,
    brand: product.brand ?? "",
    slug: product.slug ?? "",
    description: product.description ?? "",
    categoryId: product.category_id ?? "",
    isActive: product.is_active,
    images: (product.images as string[]) ?? [],
    specs: Object.entries((product.specs as Record<string, string>) ?? {}).map(
      ([key, value]) => ({ key, value })
    ),
    variants: variants?.length
      ? variants.map((v) => ({
          sku_code: v.sku_code,
          price: String(v.price),
          sale_price: v.sale_price != null ? String(v.sale_price) : "",
          discount_badge: v.discount_badge ?? "",
          stock_quantity: String(v.stock_quantity),
          condition: v.condition,
        }))
      : [defaultVariant()],
    translations: translationState,
  };
}

// On-screen names for the fields the API can reject, so an error points at a
// box the admin can actually see rather than at a JSON key.
const FIELD_LABELS: Record<string, string> = {
  name: "Product name",
  slug: "URL slug",
  brand: "Brand",
  description: "Description",
  category_id: "Category",
  images: "Images",
  specs: "Specifications",
  variants: "Variants",
  translations: "Translations",
  sku_code: "SKU",
  price: "Price",
  sale_price: "Sale price",
  discount_badge: "Discount badge",
  stock_quantity: "Stock quantity",
  condition: "Condition",
  title: "Title",
  lang: "Language",
};

/**
 * A failed save used to render as the two words "Validation failed" on a form
 * with around twenty inputs, which is unusable — the commonest case by far is a
 * brand-new product saved with the SKU still empty, because defaultVariant()
 * starts it blank. The route now returns the full Zod issue path, so say which
 * box is wrong and, for variants, which row.
 */
function describeSaveError(
  status: number,
  err: { error?: string; details?: { fields?: { path: string; message: string }[] } } | null,
): string {
  if (status === 401 || status === 403) {
    return "Your session expired, or this account is not an admin. Sign in again and retry.";
  }

  const fields = err?.details?.fields;
  if (!fields?.length) return err?.error ?? `Save failed (HTTP ${status}).`;

  const lines = fields.map(({ path, message }) => {
    const parts = path.split(".");
    const label = FIELD_LABELS[parts[parts.length - 1]] ?? path;
    // Zod's "String must contain at least 1 character(s)" is how an empty
    // required box reads. Say that instead.
    const reason = /at least 1 character/i.test(message) ? "is required" : message;

    if (parts[0] === "variants" && parts.length === 3) {
      return `Variant ${Number(parts[1]) + 1} — ${label} ${reason}`;
    }
    if (parts[0] === "translations" && parts.length === 3) {
      return `${parts[1] === "0" ? "English" : "Arabic"} — ${label} ${reason}`;
    }
    return `${label} ${reason}`;
  });

  return lines.join(" · ");
}

interface ProductFormProps {
  product?: DbProduct;
  variants?: DbVariant[];
  translations?: DbTranslation[];
  onClose: () => void;
  onSaved: () => void;
  categories?: { id: string; name: string }[];
  /** Render for a full page instead of a dialog: no height cap, back arrow instead of X. */
  fullPage?: boolean;
}

export function ProductForm({ product, variants, translations, onClose, onSaved, categories = [], fullPage = false }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(() => initForm(product, variants, translations));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Uploads go through `POST /api/admin/upload`, not the browser Supabase client.
   *
   * They used to call `supabase.storage.upload()` from here and could never succeed:
   * login is a Server Action storing the session in httpOnly cookies, so the browser
   * singleton in `lib/supabase.ts` has no session and every request it makes is `anon`
   * — which storage RLS rightly denies. The server route runs `requireAdmin()`, so the
   * upload reaches storage as an authenticated admin.
   *
   * The earlier bug is still worth not reintroducing: this was once
   * `if (!error) { ...push url }` with no else, so a rejected upload was skipped in
   * silence — the spinner stopped and nothing appeared, indistinguishable from an
   * upload that never started. Every failure below produces a visible message.
   */
  const uploadImages = useCallback(async (files: File[]) => {
    const problems: string[] = [];
    const images: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        problems.push(`${file.name} (not an image)`);
        continue;
      }
      images.push(file);
    }

    if (images.length === 0) {
      setError(problems.length ? `Could not upload: ${problems.join(", ")}` : "No images selected.");
      return;
    }

    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("slug", form.slug || form.name || "");

    for (const file of images) {
      try {
        body.append("files", await toSquareWebp(file));
      } catch {
        problems.push(`${file.name} (could not be read as an image)`);
      }
    }

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });

      if (res.status === 401 || res.status === 403) {
        setError("Your session expired, or this account is not an admin. Sign in again and retry.");
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { urls?: string[]; failed?: string[]; error?: string }
        | null;

      if (!data) {
        setError(`Upload failed (HTTP ${res.status}).`);
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.urls?.length) setForm((f) => ({ ...f, images: [...f.images, ...data.urls!] }));
      problems.push(...(data.failed ?? []));
      if (problems.length) setError(`Could not upload: ${problems.join(", ")}`);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }, [form.slug, form.name]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadImages(Array.from(e.dataTransfer.files));
  }, [uploadImages]);

  const removeImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const updateSpec = (idx: number, field: "key" | "value", val: string) =>
    setForm((f) => {
      const specs = [...f.specs];
      specs[idx] = { ...specs[idx], [field]: val };
      return { ...f, specs };
    });

  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: "", value: "" }] }));
  const removeSpec = (idx: number) =>
    setForm((f) => ({ ...f, specs: f.specs.filter((_, i) => i !== idx) }));

  const updateTranslationField = (lang: "en" | "ar", field: "title" | "description", val: string) =>
    setForm((f) => ({
      ...f,
      translations: { ...f.translations, [lang]: { ...f.translations[lang], [field]: val } },
    }));

  const updateTranslationSpec = (lang: "en" | "ar", idx: number, field: "key" | "value", val: string) =>
    setForm((f) => {
      const specs = [...f.translations[lang].specs];
      specs[idx] = { ...specs[idx], [field]: val };
      return { ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], specs } } };
    });

  const addTranslationSpec = (lang: "en" | "ar") =>
    setForm((f) => ({
      ...f,
      translations: {
        ...f.translations,
        [lang]: { ...f.translations[lang], specs: [...f.translations[lang].specs, { key: "", value: "" }] },
      },
    }));

  const removeTranslationSpec = (lang: "en" | "ar", idx: number) =>
    setForm((f) => ({
      ...f,
      translations: {
        ...f.translations,
        [lang]: { ...f.translations[lang], specs: f.translations[lang].specs.filter((_, i) => i !== idx) },
      },
    }));

  const updateVariant = (idx: number, field: keyof VariantDraft, val: string) =>
    setForm((f) => {
      const v = [...f.variants];
      v[idx] = { ...v[idx], [field]: val };
      return { ...f, variants: v };
    });

  const addVariant = () =>
    setForm((f) => ({ ...f, variants: [...f.variants, defaultVariant()] }));
  const removeVariant = (idx: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      brand: form.brand || null,
      slug: form.slug || undefined,
      description: form.description || null,
      category_id: form.categoryId || null,
      is_active: form.isActive,
      images: form.images,
      specs: Object.fromEntries(
        form.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])
      ),
      variants: form.variants.map((v) => ({
        sku_code: v.sku_code,
        // null, not 0, for a blank or unparseable box. `parseFloat("") || 0`
        // sent a real 0, which validated fine and listed the product at 0 EGP
        // without showing anything. NaN also serialises to null, so "abc" is
        // rejected as a missing price rather than silently becoming free.
        price: v.price.trim() === "" ? null : Number(v.price),
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
        discount_badge: v.discount_badge || null,
        stock_quantity: parseInt(v.stock_quantity) || 0,
        condition: v.condition,
        attributes: {},
      })),
      // Only send a translation row for a language once it has some content,
      // so we don't create empty AR/EN rows for products that haven't been
      // translated yet.
      translations: (["en", "ar"] as const)
        .map((lang) => {
          const t = form.translations[lang];
          const specs = Object.fromEntries(
            t.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])
          );
          return {
            lang,
            title: t.title.trim() || null,
            description: t.description.trim() || null,
            specs,
          };
        })
        .filter((t) => t.title || t.description || Object.keys(t.specs).length > 0),
    };

    const url = product ? `/api/admin/products?id=${product.id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setError(describeSaveError(res.status, err));
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            title={form.isActive ? "Published — visible on the storefront" : "Draft — hidden from the storefront"}
            onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className={[
              "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-xs font-semibold transition-colors",
              form.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-[var(--color-slate)]",
            ].join(" ")}
          >
            <span
              className={[
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                form.isActive ? "bg-emerald-500" : "bg-gray-300",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  form.isActive ? "translate-x-[18px]" : "translate-x-1",
                ].join(" ")}
              />
            </span>
            {form.isActive ? "Published" : "Draft"}
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-[var(--color-slate)]" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={fullPage ? "px-6 pt-4 pb-6" : "px-6 pt-4 pb-6 overflow-y-auto max-h-[70vh]"}>
        <Tabs defaultValue="basic">
          <TabsList className="mb-5 bg-[var(--color-obsidian)] rounded-xl p-1 h-auto gap-1">
            {[
              { value: "basic",        label: "Basic Info" },
              { value: "pricing",      label: "Pricing & Condition" },
              { value: "specs",        label: "Specs" },
              { value: "translations", label: "Translations" },
              { value: "images",       label: "Images" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Apple iPhone 15" required dir="auto"
                  className="h-9 text-sm border-gray-200 focus:border-[var(--color-mint)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. Apple" dir="auto" className="h-9 text-sm border-gray-200" />
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
                {categories.length > 0 ? (
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-[var(--color-ceramic)] focus:outline-none focus:ring-1 focus:ring-[var(--color-mint)]"
                  >
                    <option value="">Select category…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <Input value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    placeholder="Category UUID"
                    className="h-9 text-sm border-gray-200 font-mono" />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Description</Label>
              <Textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Product description for PDP and AI agents…"
                rows={4} dir="auto" className="text-sm border-gray-200 resize-none" />
              <p className="text-[11px] text-[var(--color-slate)]">
                Fallback text shown if no English/Arabic translation is set on the Translations tab.
              </p>
            </div>
          </TabsContent>

          {/* Pricing & Condition */}
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
                    <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Regular Price (EGP) *</Label>
                    <Input type="number" min="0" step="0.01" value={variant.price}
                      onChange={(e) => updateVariant(idx, "price", e.target.value)}
                      placeholder="0.00" required className="h-9 text-sm border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Sale Price (EGP)</Label>
                    <Input type="number" min="0" step="0.01" value={variant.sale_price}
                      onChange={(e) => updateVariant(idx, "sale_price", e.target.value)}
                      placeholder="Optional" className="h-9 text-sm border-gray-200" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Discount Badge</Label>
                  <div className="flex items-center gap-2">
                    <Input value={variant.discount_badge}
                      onChange={(e) => updateVariant(idx, "discount_badge", e.target.value)}
                      placeholder='e.g. "20% OFF"'
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

          {/* Specs */}
          <TabsContent value="specs" className="space-y-3 mt-0">
            <p className="text-xs text-[var(--color-slate)]">
              Dynamic key/value specs shown on PDP and available to AI agents.
            </p>
            <div className="space-y-2">
              {form.specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={spec.key} onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    placeholder="e.g. Display" dir="auto" className="h-9 text-sm border-gray-200 flex-1" />
                  <Input value={spec.value} onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    placeholder='e.g. 6.1" OLED' dir="auto" className="h-9 text-sm border-gray-200 flex-1" />
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

          {/* Translations — the storefront reads name/description/specs per
              locale from product_translations, falling back to the Basic
              Info / Specs tabs above when a language has no translation row. */}
          <TabsContent value="translations" className="space-y-6 mt-0">
            <p className="text-xs text-[var(--color-slate)]">
              Per-language title, description and specs shown on the storefront (falls back to Basic
              Info / Specs above when empty for a language).
            </p>
            {([
              { lang: "en" as const, label: "English", dir: "ltr" as const },
              { lang: "ar" as const, label: "العربية", dir: "rtl" as const },
            ]).map(({ lang, label, dir }) => (
              <div key={lang} className="rounded-xl border border-gray-100 bg-[var(--color-obsidian)] p-4 space-y-3">
                <span className="text-xs font-bold text-[var(--color-ceramic)] uppercase tracking-wider">
                  {label}
                </span>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Title</Label>
                  <Input value={form.translations[lang].title}
                    onChange={(e) => updateTranslationField(lang, "title", e.target.value)}
                    placeholder={lang === "en" ? "e.g. Apple iPhone 15" : "مثال: آيفون 15"}
                    dir={dir} className="h-9 text-sm border-gray-200 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Description</Label>
                  <Textarea value={form.translations[lang].description}
                    onChange={(e) => updateTranslationField(lang, "description", e.target.value)}
                    placeholder={lang === "en" ? "Product description in English…" : "وصف المنتج بالعربية…"}
                    rows={4} dir={dir} className="text-sm border-gray-200 bg-white resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[var(--color-ceramic)]">Specs</Label>
                  <div className="space-y-2">
                    {form.translations[lang].specs.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={spec.key}
                          onChange={(e) => updateTranslationSpec(lang, idx, "key", e.target.value)}
                          placeholder={lang === "en" ? "e.g. Capacity" : "مثال: السعة"}
                          dir={dir} className="h-9 text-sm border-gray-200 bg-white flex-1" />
                        <Input value={spec.value}
                          onChange={(e) => updateTranslationSpec(lang, idx, "value", e.target.value)}
                          placeholder={lang === "en" ? "e.g. 10000mAh" : "مثال: 10000 مللي أمبير"}
                          dir={dir} className="h-9 text-sm border-gray-200 bg-white flex-1" />
                        <button type="button" onClick={() => removeTranslationSpec(lang, idx)}
                          disabled={form.translations[lang].specs.length === 1}
                          className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => addTranslationSpec(lang)}
                    className="h-9 border-dashed border-gray-200 text-xs text-[var(--color-slate)] hover:text-[var(--color-ceramic)]">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Spec Row
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="space-y-4 mt-0">
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
              {uploading
                ? <Loader2 className="h-8 w-8 text-[var(--color-mint)] animate-spin" />
                : <Upload className="h-8 w-8 text-gray-300" />}
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
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {form.images.map((url, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
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
              </div>
            )}
            {form.images.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs">No images yet</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {error && (
        <div role="alert" className="mx-6 mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[var(--color-obsidian)]">
        <Button type="button" variant="outline" onClick={onClose}
          className="h-9 px-5 text-sm border-gray-200">Cancel</Button>
        <Button type="submit" disabled={saving}
          className="h-9 px-6 text-sm bg-[var(--color-ceramic)] hover:bg-[var(--color-ceramic)]/90 text-white">
          {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
          {product ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
