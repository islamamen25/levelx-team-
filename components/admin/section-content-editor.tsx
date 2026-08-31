"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toSquareWebp } from "@/lib/image-client";
import { isRenderableImage } from "@/lib/images";
import type { PageSection } from "@/components/admin/section-manager";
import type { BrandOverride, CategoryTileOverride, TileShape, FeaturedChipOverride } from "@/lib/store-config";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  is_visible: boolean;
  in_carousel: boolean;
}

interface SectionContentEditorProps {
  open:      boolean;
  onClose:   () => void;
  section:   PageSection;
  onConfirm: (patch: Partial<PageSection>) => void;
}

const SHAPE_OPTIONS: { value: TileShape; label: string; radius: string }[] = [
  { value: "square",  label: "Square",  radius: "rounded-none" },
  { value: "rounded", label: "Rounded", radius: "rounded-lg" },
  { value: "circle",  label: "Circle",  radius: "rounded-full" },
];

/**
 * Every admin-supplied image in this dialog goes through the exact same guard the
 * homepage uses to decide whether to render it (isRenderableImage(), lib/images.ts).
 * That is deliberate, not redundant: next/image throws — with no error boundary
 * catching it — for a host outside its allowlist, and that has already taken the
 * storefront down once (see lib/images.ts's own history note). Blocking a bad URL
 * *here* is what stops it from ever reaching Supabase in the first place; the API
 * route and the homepage component both re-check it independently as well, because
 * cowork writes straight to the DB and skips this dialog entirely.
 */
function ImageField({
  label,
  value,
  onChange,
  slugHint,
}: {
  label: string;
  value: string | undefined;
  onChange: (url: string) => void;
  slugHint: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [urlDraft, setUrlDraft]   = useState(value ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setUrlDraft(value ?? ""), [value]);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const webp = await toSquareWebp(file);
      const body = new FormData();
      body.append("slug", slugHint);
      body.append("files", webp);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as
        | { urls?: string[]; failed?: string[]; error?: string }
        | null;
      if (!data || data.error) {
        setError(data?.error ?? `Upload failed (HTTP ${res.status}).`);
        return;
      }
      if (data.urls?.length) {
        onChange(data.urls[0]);
      } else {
        setError(data.failed?.[0] ?? "Upload failed.");
      }
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function commitUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      setError("");
      onChange("");
      return;
    }
    if (!isRenderableImage(trimmed)) {
      setError("Only an uploaded image or an images.unsplash.com URL is allowed.");
      return;
    }
    setError("");
    onChange(trimmed);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--color-ceramic)]">{label}</label>
        {!!value && (
          <button
            type="button"
            onClick={() => { onChange(""); setUrlDraft(""); setError(""); }}
            className="text-[10px] text-[var(--color-slate)] hover:text-red-500 transition-colors"
          >
            Reset to default
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[var(--color-obsidian)]">
          {value && isRenderableImage(value) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={(e) => e.key === "Enter" && commitUrl()}
            placeholder="Paste an image URL…"
            className="h-8 text-xs border-gray-100"
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="h-7 px-2.5 text-[11px] border-gray-200"
            >
              {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            {error && <span className="text-[10px] text-red-500">{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionContentEditor({ open, onClose, section, onConfirm }: SectionContentEditorProps) {
  const [imageUrl,  setImageUrl]  = useState(section.image_url ?? "");
  const [brands,    setBrands]    = useState<BrandOverride[]>(section.brands ?? []);
  const [tileShape, setTileShape] = useState<TileShape>(section.tile_shape ?? "rounded");
  const [tiles,     setTiles]     = useState<CategoryTileOverride[]>(section.tiles ?? []);
  const [tileAccentColor, setTileAccentColor] = useState(section.tile_accent_color ?? "");
  const [tileTextColor, setTileTextColor] = useState(section.tile_text_color ?? "");
  const [tileTextSize,  setTileTextSize]  = useState<"sm" | "md" | "lg">(section.tile_text_size ?? "md");
  const [chips,     setChips]     = useState<FeaturedChipOverride[]>(section.chips ?? []);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // No reset-on-open effect needed: the parent (section-manager.tsx) only renders this
  // component while contentIdx !== null, so every open is a genuine fresh mount and the
  // useState initializers above already pick up the current section. An effect keyed on
  // `section` would actually be worse here, not just redundant — `sorted` is rebuilt with
  // new object references on every SectionManager render, so it would re-fire and wipe
  // out in-progress edits any time the parent re-rendered for an unrelated reason while
  // this dialog was open.

  useEffect(() => {
    if (!open || section.id !== "categories") return;
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [open, section.id]);

  function updateBrand(i: number, patch: Partial<BrandOverride>) {
    setBrands((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function removeBrand(i: number) {
    setBrands((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTile(i: number, patch: Partial<CategoryTileOverride>) {
    setTiles((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function removeTile(i: number) {
    setTiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateChip(i: number, patch: Partial<FeaturedChipOverride>) {
    setChips((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeChip(i: number) {
    setChips((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleConfirm() {
    const patch: Partial<PageSection> = {};
    if (section.id === "featured" || section.id === "brands") {
      patch.image_url = imageUrl;
    }
    if (section.id === "brands") {
      patch.brands = brands.filter((b) => b.name.trim());
    }
    if (section.id === "categories") {
      patch.tile_shape = tileShape;
      patch.tiles = tiles.filter((t) => t.category_slug);
      patch.tile_accent_color = tileAccentColor;
      patch.tile_text_color = tileTextColor;
      patch.tile_text_size = tileTextSize;
    }
    if (section.id === "featured") {
      patch.chips = chips.filter((c) => c.label?.trim() || c.image_url || c.href?.trim());
    }
    onConfirm(patch);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl border-gray-100 p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-ceramic)]">Edit content</h3>
            <p className="mt-0.5 text-xs text-[var(--color-slate)]">
              for <span className="font-semibold text-[var(--color-ceramic)]">{section.label}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <X className="h-4 w-4 text-[var(--color-slate)]" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 py-4">
          {(section.id === "featured" || section.id === "brands") && (
            <ImageField
              label="Side image"
              value={imageUrl}
              onChange={setImageUrl}
              slugHint="storefront"
            />
          )}

          {section.id === "featured" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-ceramic)]">
                  Filter chips
                  <span className="ml-1.5 font-normal text-[var(--color-slate)]">
                    — empty uses the automatic category chips
                  </span>
                </label>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setChips((prev) => [...prev, { label: "", image_url: "", href: "" }])}
                  className="h-7 px-2.5 text-[11px] border-dashed border-gray-200"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add chip
                </Button>
              </div>
              <div className="space-y-3">
                {chips.map((chip, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-gray-100 p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={chip.label ?? ""}
                          onChange={(e) => updateChip(i, { label: e.target.value })}
                          placeholder="Label (optional — photo/icon only if blank)"
                          className="h-8 text-xs border-gray-100"
                        />
                        <Input
                          value={chip.href ?? ""}
                          onChange={(e) => updateChip(i, { href: e.target.value })}
                          placeholder="/products?brand=Apple (optional — defaults to /products)"
                          className="h-8 text-xs border-gray-100 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeChip(i)}
                        className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Remove chip"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <ImageField
                      label="Photo"
                      value={chip.image_url}
                      onChange={(url) => updateChip(i, { image_url: url })}
                      slugHint="storefront-chips"
                    />
                  </div>
                ))}
                {chips.length === 0 && (
                  <p className="text-[11px] text-gray-300">No custom chips — showing the automatic category row.</p>
                )}
              </div>
            </div>
          )}

          {section.id === "brands" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-ceramic)]">
                  Brands
                  <span className="ml-1.5 font-normal text-[var(--color-slate)]">
                    — empty uses the built-in logo row
                  </span>
                </label>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setBrands((prev) => [...prev, { name: "", logo_url: "" }])}
                  className="h-7 px-2.5 text-[11px] border-dashed border-gray-200"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add brand
                </Button>
              </div>
              <div className="space-y-3">
                {brands.map((brand, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-gray-100 p-2.5">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={brand.name}
                        onChange={(e) => updateBrand(i, { name: e.target.value })}
                        placeholder="Brand name"
                        className="h-8 text-xs border-gray-100"
                      />
                      <ImageField
                        label="Logo"
                        value={brand.logo_url}
                        onChange={(url) => updateBrand(i, { logo_url: url })}
                        slugHint="storefront-brands"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-[var(--color-slate)]">
                        <input
                          type="checkbox"
                          checked={brand.show_label !== false}
                          onChange={(e) => updateBrand(i, { show_label: e.target.checked })}
                          className="h-3.5 w-3.5 accent-[var(--color-mint)]"
                        />
                        Show name below logo
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBrand(i)}
                      className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove brand"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {brands.length === 0 && (
                  <p className="text-[11px] text-gray-300">No custom brands — showing the built-in row.</p>
                )}
              </div>
            </div>
          )}

          {section.id === "categories" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-ceramic)]">Tile shape</label>
                <div className="flex gap-2">
                  {SHAPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTileShape(opt.value)}
                      className={[
                        "flex flex-1 flex-col items-center gap-1.5 border p-2.5 transition-all",
                        opt.radius,
                        tileShape === opt.value
                          ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)]"
                          : "border-gray-200 hover:border-gray-300",
                      ].join(" ")}
                    >
                      <span
                        className={`h-6 w-6 ${opt.radius}`}
                        style={{ backgroundColor: tileShape === opt.value ? "var(--color-mint)" : "#d1d5db" }}
                      />
                      <span className="text-[10px] font-semibold text-[var(--color-ceramic)]">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-300">Only applies once at least one tile below is set.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--color-ceramic)]">Icon colour</label>
                  {tileAccentColor && (
                    <button
                      type="button"
                      onClick={() => setTileAccentColor("")}
                      className="text-[10px] text-[var(--color-slate)] hover:text-red-500 transition-colors"
                    >
                      Reset to per-category colours
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={tileAccentColor || "#F5A623"}
                    onChange={(e) => setTileAccentColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-gray-100 p-0.5"
                  />
                  <p className="text-[10px] text-gray-300">
                    One colour for every tile&apos;s icon — including the automatic strip below,
                    not just custom tiles. Leave unset to keep each category&apos;s own colour.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--color-ceramic)]">Sub-label text</label>
                  {tileTextColor && (
                    <button
                      type="button"
                      onClick={() => setTileTextColor("")}
                      className="text-[10px] text-[var(--color-slate)] hover:text-red-500 transition-colors"
                    >
                      Reset to white
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={tileTextColor || "#ffffff"}
                    onChange={(e) => setTileTextColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-gray-100 p-0.5"
                  />
                  <div className="flex gap-1">
                    {(["sm", "md", "lg"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTileTextSize(size)}
                        className={[
                          "h-8 w-8 rounded border text-[10px] font-bold uppercase transition-all",
                          tileTextSize === size
                            ? "border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint)]"
                            : "border-gray-200 text-[var(--color-slate)] hover:border-gray-300",
                        ].join(" ")}
                        title={`${size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"} text`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-300">
                    Colour + size of the &quot;Below EGP 399&quot;-style text over a tile. There&apos;s no
                    background behind it — pick a colour with enough contrast on your photos.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--color-ceramic)]">
                    Tiles
                    <span className="ml-1.5 font-normal text-[var(--color-slate)]">
                      — empty uses the automatic icon strip
                    </span>
                  </label>
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => setTiles((prev) => [
                      ...prev,
                      { category_slug: categories[0]?.slug ?? "", label: "", sublabel: "", image_url: "" },
                    ])}
                    disabled={categories.length === 0}
                    className="h-7 px-2.5 text-[11px] border-dashed border-gray-200"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add tile
                  </Button>
                </div>
                <div className="space-y-3">
                  {tiles.map((tile, i) => {
                    const cat = categories.find((c) => c.slug === tile.category_slug);
                    const hidden = cat && !(cat.is_visible && cat.in_carousel);
                    return (
                      <div key={i} className="space-y-2 rounded-xl border border-gray-100 p-2.5">
                        <div className="flex items-start gap-2">
                          <select
                            value={tile.category_slug}
                            onChange={(e) => updateTile(i, { category_slug: e.target.value })}
                            className="h-8 flex-1 rounded-lg border border-gray-100 bg-white px-2 text-xs text-[var(--color-ceramic)]"
                          >
                            <option value="" disabled>Choose a category…</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.slug}>{c.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeTile(i)}
                            className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                            title="Remove tile"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {hidden && (
                          <p className="text-[10px] font-medium text-amber-500">
                            Hidden or not in the home carousel — this tile won&apos;t appear until fixed at
                            Categories.
                          </p>
                        )}
                        <Input
                          value={tile.label ?? ""}
                          onChange={(e) => updateTile(i, { label: e.target.value })}
                          placeholder={cat?.name ? `Label (defaults to "${cat.name}")` : "Label"}
                          className="h-8 text-xs border-gray-100"
                        />
                        <Input
                          value={tile.sublabel ?? ""}
                          onChange={(e) => updateTile(i, { sublabel: e.target.value })}
                          placeholder='Sub-label, e.g. "Below EGP 399" (optional)'
                          className="h-8 text-xs border-gray-100"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-[11px] text-[var(--color-slate)]">
                            <input
                              type="color"
                              value={tile.accent_color || "#00A699"}
                              onChange={(e) => updateTile(i, { accent_color: e.target.value })}
                              className="h-7 w-9 cursor-pointer rounded border border-gray-100 p-0.5"
                            />
                            Override for this tile
                            <span className="text-gray-300">
                              — {tile.accent_color ? tile.accent_color : "using Icon colour above"}
                            </span>
                          </label>
                          {tile.accent_color && (
                            <button
                              type="button"
                              onClick={() => updateTile(i, { accent_color: "" })}
                              className="text-[10px] text-[var(--color-slate)] hover:text-red-500 transition-colors"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <ImageField
                          label="Photo"
                          value={tile.image_url}
                          onChange={(url) => updateTile(i, { image_url: url })}
                          slugHint="storefront-categories"
                        />
                      </div>
                    );
                  })}
                  {tiles.length === 0 && (
                    <p className="text-[11px] text-gray-300">
                      {categories.length === 0
                        ? "Loading categories…"
                        : "No custom tiles — showing the automatic icon strip."}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-[var(--color-obsidian)] px-5 py-3.5">
          <Button variant="outline" onClick={onClose} className="h-8 px-4 text-xs border-gray-200">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-8 px-4 text-xs bg-[var(--color-ceramic)] text-white hover:bg-[var(--color-ceramic)]/90"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
