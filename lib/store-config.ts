import { cacheLife, cacheTag } from "next/cache";

/**
 * Server-side utility — fetches store_configuration from Supabase.
 * Used by the locale layout (theme injection) and home page (section order).
 * Always returns a safe default so the site never breaks if Supabase is down.
 */

export interface ThemeConfig {
  primary:   string;
  secondary: string;
  accent:    string;
  surface:   string;
  radius:    string;
}

/** One row in the Builder's "Brands" editor (`brands` section only). */
export interface BrandOverride {
  name:        string;
  logo_url?:   string;
  /** Name caption below the logo. Defaults to shown (undefined ⇒ true) so rows saved
      before this field existed keep their current look. */
  show_label?: boolean;
}

/** One row in the Builder's "Category tiles" editor (`categories` section only). */
export interface CategoryTileOverride {
  category_slug: string;
  label?:        string;
  sublabel?:     string;   // e.g. "Below EGP 399" — promo copy, not a category property
  image_url?:    string;
  /** Hex colour for the icon badge / soft background / sublabel banner — set freely per
      tile, independent of the category's own `color_key` (which is DB-wide, not a promo
      choice for one strip). Unset ⇒ falls back to the category's colour. */
  accent_color?: string;
}

export type TileShape = "square" | "rounded" | "circle";

/** One row in the Builder's "Chips" editor (`featured` section only) — the small filter
    row above the deals carousel. Empty list ⇒ today's automatic category-based chips. */
export interface FeaturedChipOverride {
  label?:     string;   // shown below the icon/photo; omit to show none (icon/photo only)
  image_url?: string;   // photo instead of the default Tag/category icon
  href?:      string;   // internal path, e.g. "/products?brand=Apple"; defaults to "/products"
}

export interface PageSection {
  id:          string;
  label:       string;
  visible:     boolean;
  order:       number;
  product_ids?: string[];   // IDs of products pinned to this section (PIM → CMS bridge)
  image_url?:  string;      // Side/lifestyle image for sections that show one (featured, brands)
  brands?:      BrandOverride[];         // `brands` section: overrides the built-in logo row
  tile_shape?:  TileShape;               // `categories` section: only read when `tiles` below is non-empty
  tiles?:       CategoryTileOverride[];  // `categories` section: overrides the built-in icon tiles
  /** `categories` section: one colour applied to every tile's icon badge — including the
      automatic strip, not just Builder-added tile rows — so the row reads as one set
      instead of each category's own DB pastel. A tile's own `accent_color` still wins
      over this when both are set, for the rare case an admin wants one tile to stand out. */
  tile_accent_color?: string;
  /** `categories` section: colour and size of the sub-label text drawn over a tile (e.g.
      "Below EGP 399"). Unset ⇒ white / "md", same as before this existed. Deliberately
      section-wide, not per-tile — the point raised in feedback was every tile matching,
      not fine-tuning one at a time. */
  tile_text_color?: string;
  tile_text_size?:  "sm" | "md" | "lg";
  chips?:       FeaturedChipOverride[];  // `featured` section: overrides the automatic filter chips
}

export interface StoreConfig {
  theme:  ThemeConfig;
  layout: PageSection[];
}

export const DEFAULT_CONFIG: StoreConfig = {
  theme: {
    primary:   "#00A699",
    secondary: "#1D1D1F",
    accent:    "#F5A623",
    surface:   "#FFFFFF",
    radius:    "0.75rem",
  },
  layout: [
    { id: "hero",        label: "Hero Slider",       visible: true,  order: 0 },
    { id: "categories",  label: "Category Tiles",    visible: true,  order: 1 },
    { id: "featured",    label: "Featured Products", visible: true,  order: 2, image_url: "https://images.unsplash.com/photo-1760520338238-4137dd2dc28f?w=800&q=80&fit=crop" },
    { id: "bestsellers", label: "Bestsellers",       visible: true,  order: 3 },
    { id: "brands",      label: "Top Brands",        visible: true,  order: 4, image_url: "https://images.unsplash.com/photo-1776919017122-8140e279c889?w=800&q=80&fit=crop" },
    { id: "newsletter",  label: "Newsletter",        visible: true,  order: 5 },
    { id: "trust",       label: "Trust Banner",      visible: true,  order: 6 },
  ],
};

export async function getStoreConfig(): Promise<StoreConfig> {
  "use cache";
  cacheLife("minutes");
  cacheTag("store-config");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_configuration?id=eq.1&select=theme,layout`,
      {
        headers: {
          apikey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }
    );

    if (!res.ok) return DEFAULT_CONFIG;
    const rows: { theme: ThemeConfig; layout: PageSection[] }[] = await res.json();
    if (!rows?.[0]) return DEFAULT_CONFIG;

    return {
      theme:  rows[0].theme  ?? DEFAULT_CONFIG.theme,
      layout: rows[0].layout ?? DEFAULT_CONFIG.layout,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Converts theme config → inline CSS custom property overrides.
 * Injected into <head> via a <style> tag in the locale layout.
 * Overrides the hardcoded tokens in globals.css at runtime.
 */
export function buildThemeCSS(theme: ThemeConfig): string {
  return `
    :root {
      --brand-primary:   ${theme.primary};
      --brand-secondary: ${theme.secondary};
      --brand-accent:    ${theme.accent};
      --brand-surface:   ${theme.surface};
      --brand-radius:    ${theme.radius};

      /* Override LevelX design-system tokens with builder values */
      --color-mint:       ${theme.primary};
      --color-mint-hover: ${theme.primary}cc;
      --color-mint-soft:  ${theme.primary}1a;
      --color-ceramic:    ${theme.secondary};
      --color-ring:       ${theme.primary};
    }
  `.trim();
}
