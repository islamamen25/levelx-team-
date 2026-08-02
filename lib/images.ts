/**
 * lib/images.ts — the single source of truth for which image hosts this app may render.
 *
 * `next.config.ts` imports REMOTE_IMAGE_PATTERNS for `images.remotePatterns`, and the
 * UI imports `isRenderableImage()` to ask the same question *before* handing a URL to
 * `next/image`. Keeping both on one list matters: when they disagreed, `next/image`
 * threw `Invalid src prop` for a host the config did not allow, and because the app has
 * no error boundary that took the whole product page down — the only sellable product
 * in the store was unbuyable. Never re-declare the list; extend it here.
 *
 * A host being absent is a deliberate answer, not an oversight. Product images belong in
 * Supabase Storage (see IMAGE-GUIDE.md); pointing `remotePatterns` at a retailer's CDN to
 * make a broken image render would be hotlinking someone else's bandwidth.
 */

export const REMOTE_IMAGE_PATTERNS = [
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
  { protocol: "https", hostname: "images.unsplash.com" },
] as const;

type Pattern = (typeof REMOTE_IMAGE_PATTERNS)[number];

/** Mirrors next/image's wildcard rule: `*.host` matches one or more leading labels. */
function hostMatches(pattern: string, host: string): boolean {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1); // "*.supabase.co" -> ".supabase.co"
    return host.endsWith(suffix) && host.length > suffix.length;
  }
  return host === pattern;
}

/** `/a/b/**` matches any path under `/a/b`. No pathname means any path. */
function pathMatches(pattern: string | undefined, path: string): boolean {
  if (!pattern) return true;
  if (pattern.endsWith("/**")) return path.startsWith(pattern.slice(0, -3));
  return path === pattern;
}

/**
 * True when `next/image` will accept this src. Relative, data: and blob: URLs are
 * always fine — only remote hosts are gated. Anything unparseable is treated as not
 * renderable rather than being allowed through to throw at render time.
 */
export function isRenderableImage(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) {
    return true;
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  return REMOTE_IMAGE_PATTERNS.some((p: Pattern) => {
    const pathname = "pathname" in p ? (p.pathname as string) : undefined;
    return (
      `${p.protocol}:` === url.protocol &&
      hostMatches(p.hostname, url.hostname) &&
      pathMatches(pathname, url.pathname)
    );
  });
}
