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

export interface PageSection {
  id:          string;
  label:       string;
  visible:     boolean;
  order:       number;
  product_ids?: string[];   // IDs of products pinned to this section (PIM → CMS bridge)
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
    { id: "featured",    label: "Featured Products", visible: true,  order: 2 },
    { id: "bestsellers", label: "Bestsellers",       visible: true,  order: 3 },
    { id: "brands",      label: "Top Brands",        visible: true,  order: 4 },
    { id: "newsletter",  label: "Newsletter",        visible: true,  order: 5 },
    { id: "trust",       label: "Trust Banner",      visible: true,  order: 6 },
  ],
};

export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_configuration?id=eq.1&select=theme,layout`,
      {
        headers: {
          apikey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        // No caching — always fresh so builder changes appear immediately
        cache: "no-store",
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
