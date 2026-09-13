/**
 * Only ever return a same-origin, relative path. Both the OAuth callback
 * (`app/api/auth/callback/route.ts`) and the password sign-in/up actions
 * (`lib/auth-actions.ts`) accept a `next` value that ultimately comes from a
 * query string or hidden form field the browser controls — an absolute or
 * protocol-relative value ("https://evil.com", "//evil.com") would otherwise
 * turn a successful login into an open redirect.
 */
export function sanitizeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
