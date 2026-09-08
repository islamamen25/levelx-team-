"use client";

/**
 * Client-side image downscale/compress before upload, shared by every admin surface
 * that accepts an image: the product form, and the Storefront Builder's brand-logo /
 * category-tile / hero-slide editors (components/admin/section-content-editor.tsx).
 * Originally lived only in product-form.tsx as `toStoreWebp`; extracted here rather than
 * duplicated once a second caller needed the exact same square/white-background/
 * size-budget treatment, then split further (see `toBannerWebp` below) once a hero slide
 * needed the opposite treatment — its own aspect ratio kept, not squared.
 *
 * Browser-only (createImageBitmap, canvas) — never import this into a server component.
 */

export interface SquareWebpOptions {
  /** Output canvas side in px. Never upscales — a 600px source stays 600px. */
  side?: number;
  /** Encode quality steps down until the file fits this budget, or bottoms out at 0.55. */
  maxKB?: number;
}

export interface BannerWebpOptions {
  /** Cap on the longer edge in px. Never upscales — a 900px-wide source stays 900px wide. */
  maxDimension?: number;
  /** Encode quality steps down until the file fits this budget, or bottoms out at 0.55. */
  maxKB?: number;
}

// Storefront image spec (IMAGE-GUIDE.md, 2026-07-27): square, 1500×1500 ideal,
// under 500 KB. levelx-images.py already enforces this for the cowork path.
const DEFAULT_SIDE   = 1500;
const DEFAULT_MAX_KB = 500;

// The hero slider renders full-bleed (`sizes="100vw"`), not in a small square tile, so it
// gets a wider budget than the square path's 1500 — 1920 covers a full-width desktop
// viewport without needlessly upscaling a smaller source.
const DEFAULT_BANNER_MAX_DIMENSION = 1920;

type ResizeMode =
  | { mode: "square"; side: number; maxKB: number }
  | { mode: "original"; maxDimension: number; maxKB: number };

/**
 * Shared bitmap → canvas → encode pipeline. The two modes differ only in how the canvas
 * size and draw rectangle are computed:
 *   - "square": today's original behaviour — a white square canvas, the source scaled to
 *     fit *inside* it and centered (letterboxed), because a logo/icon tile is displayed at
 *     a fixed aspect ratio and needs a consistent, predictable frame.
 *   - "original": no forced canvas shape — the source is scaled down (never up) so its
 *     longer edge fits the cap, and drawn at 0,0 with no padding. Squaring a wide photo
 *     bakes white bars into the file; a hero slide is rendered with `object-cover` at
 *     full-bleed, and those bars would just get cropped into instead of trimmed away.
 */
async function toWebp(file: File, opts: ResizeMode): Promise<File> {
  const bitmap = await createImageBitmap(file);

  let canvasW: number, canvasH: number, drawX: number, drawY: number, drawW: number, drawH: number;

  if (opts.mode === "square") {
    const target = Math.min(opts.side, Math.max(bitmap.width, bitmap.height));
    canvasW = canvasH = target;
    const scale = Math.min(target / bitmap.width, target / bitmap.height);
    drawW = Math.round(bitmap.width * scale);
    drawH = Math.round(bitmap.height * scale);
    drawX = (target - drawW) / 2;
    drawY = (target - drawH) / 2;
  } else {
    const longer = Math.max(bitmap.width, bitmap.height);
    const scale  = Math.min(1, opts.maxDimension / longer); // never upscales
    canvasW = drawW = Math.round(bitmap.width * scale);
    canvasH = drawH = Math.round(bitmap.height * scale);
    drawX = drawY = 0;
  }

  const canvas = document.createElement("canvas");
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }

  if (opts.mode === "square") {
    // White, not transparent: WebP keeps alpha, and a transparent PNG would show
    // the page background through the image on a dark card.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.drawImage(bitmap, drawX, drawY, drawW, drawH);
  bitmap.close();

  let out: Blob | null = null;
  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (out && out.size <= opts.maxKB * 1024) break;
  }
  if (!out) throw new Error("Could not encode image");

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([out], `${base}.webp`, { type: "image/webp" });
}

/** Square, white-background WebP. Never upscales — a 600px source stays 600px. For
    logos, category-tile photos, and chip icons: assets shown at a fixed square frame. */
export async function toSquareWebp(file: File, opts: SquareWebpOptions = {}): Promise<File> {
  return toWebp(file, {
    mode:  "square",
    side:  opts.side  ?? DEFAULT_SIDE,
    maxKB: opts.maxKB ?? DEFAULT_MAX_KB,
  });
}

/** WebP at the source's own aspect ratio — no squaring, no padding. For the Hero
    slider's full-bleed images (rendered with `object-cover`): running one of those
    through `toSquareWebp` would bake white letterbox bars into the file that then get
    cropped into rather than trimmed away. */
export async function toBannerWebp(file: File, opts: BannerWebpOptions = {}): Promise<File> {
  return toWebp(file, {
    mode:         "original",
    maxDimension: opts.maxDimension ?? DEFAULT_BANNER_MAX_DIMENSION,
    maxKB:        opts.maxKB        ?? DEFAULT_MAX_KB,
  });
}
