import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
// Relative, not "@/lib/images" — path aliases are not resolved when Next loads its config.
import { REMOTE_IMAGE_PATTERNS } from "./lib/images";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// The browser talks to Supabase directly (auth + the anon-key reads in
// lib/supabase.ts), so its origin has to be allowed in connect-src.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";

/**
 * Content-Security-Policy — shipped in REPORT-ONLY mode on purpose.
 *
 * Report-only lets the browser flag violations without blocking anything, so a
 * missed directive cannot take the storefront down. Promote it to the enforcing
 * `Content-Security-Policy` header once the console is quiet under real use.
 *
 * Two directives are doing actual work today even in report-only:
 *   frame-ancestors 'none' — duplicated as X-Frame-Options below, which IS
 *     enforced. That is the one control with a concrete attack behind it:
 *     without it an attacker can iframe /dashboard/orders invisibly and trick a
 *     signed-in admin into clicking a status control.
 *   object-src 'none' / base-uri 'self' — cheap, nothing here uses either.
 *
 * Known looseness, to fix before enforcing:
 *   'unsafe-inline' in script-src  — Next.js bootstraps with inline scripts;
 *     removing it needs a nonce threaded through the document.
 *   'unsafe-eval'                  — required by Turbopack in dev.
 *   'unsafe-inline' in style-src   — Tailwind v4 plus the brand theme injected
 *     as a literal <style> block in app/[locale]/layout.tsx.
 *   img-src https:                 — product images are stored as absolute URLs
 *     on arbitrary hosts (the active product points at m.media-amazon.com).
 *     This tightens to 'self' + the storage origin once images live in Supabase.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} https://*.supabase.co`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // Enforced. Blocks framing outright — the admin dashboard is the target that
  // matters. Kept alongside CSP's frame-ancestors because that one is currently
  // report-only and therefore advisory.
  { key: "X-Frame-Options", value: "DENY" },

  // Stops the browser second-guessing Content-Type. Relevant because
  // product-images is a public bucket with no MIME restriction configured.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Full URLs leak order numbers and ?id= admin params into third-party
  // referers; send only the origin cross-site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here uses these APIs, so deny them rather than leave them available
  // to any future injected script.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },

  // No `includeSubDomains` and no `preload` — both are effectively one-way for
  // a domain, and this project's DNS/subdomain layout was not verified here.
  // Add them deliberately once you know every subdomain is HTTPS-only.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },

  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Shared with the UI via lib/images.ts so a host can never be allowed in one place
  // and rejected in the other — that mismatch is what crashed the product page.
  images: {
    remotePatterns: [...REMOTE_IMAGE_PATTERNS],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
