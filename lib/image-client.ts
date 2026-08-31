"use client";

/**
 * Client-side image downscale/compress before upload, shared by every admin surface
 * that accepts an image: the product form and the Storefront Builder's brand-logo /
 * category-tile editors (components/admin/section-content-editor.tsx). Originally lived
 * only in product-form.tsx as `toStoreWebp`; extracted here rather than duplicated once
 * a second caller needed the exact same square/white-background/size-budget treatment.
 *
 * Browser-only (createImageBitmap, canvas) — never import this into a server component.
 */

export interface SquareWebpOptions {
  /** Output canvas side in px. Never upscales — a 600px source stays 600px. */
  side?: number;
  /** Encode quality steps down until the file fits this budget, or bottoms out at 0.55. */
  maxKB?: number;
}

// Storefront image spec (IMAGE-GUIDE.md, 2026-07-27): square, 1500×1500 ideal,
// under 500 KB. levelx-images.py already enforces this for the cowork path.
const DEFAULT_SIDE   = 1500;
const DEFAULT_MAX_KB = 500;

/** Square, white-background WebP. Never upscales — a 600px source stays 600px. */
export async function toSquareWebp(file: File, opts: SquareWebpOptions = {}): Promise<File> {
  const side  = opts.side   ?? DEFAULT_SIDE;
  const maxKB = opts.maxKB  ?? DEFAULT_MAX_KB;

  const bitmap = await createImageBitmap(file);
  const target = Math.min(side, Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }

  // White, not transparent: WebP keeps alpha, and a transparent PNG would show
  // the page background through the image on a dark card.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target, target);

  const scale = Math.min(target / bitmap.width, target / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  ctx.drawImage(bitmap, (target - w) / 2, (target - h) / 2, w, h);
  bitmap.close();

  let out: Blob | null = null;
  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (out && out.size <= maxKB * 1024) break;
  }
  if (!out) throw new Error("Could not encode image");

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([out], `${base}.webp`, { type: "image/webp" });
}
