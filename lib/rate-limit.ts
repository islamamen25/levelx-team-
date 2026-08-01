/**
 * lib/rate-limit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * In-memory sliding-window rate limiter.
 *
 * ⚠️  Production note: replace the store with Upstash Redis for multi-instance
 *     deployments:  https://github.com/upstash/ratelimit
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 10, windowMs: 60_000 });
 *   if (!result.allowed) return rateLimitResponse(result);
 */

export interface RateLimitOptions {
  /** Max requests in the window */
  limit:    number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed:   boolean;
  limit:     number;
  remaining: number;
  resetAt:   number;   // Unix ms
}

interface WindowEntry {
  timestamps: number[];
}

// Module-level store — survives across requests in the same Node.js process
const store = new Map<string, WindowEntry>();

// Prune entries older than 5 minutes every 2 minutes to prevent memory leaks
let pruneTimer: ReturnType<typeof setInterval> | null = null;
function ensurePruner() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const cutoff = Date.now() - 5 * 60_000;
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 2 * 60_000);
  // Don't keep Node alive just for pruning
  if (pruneTimer.unref) pruneTimer.unref();
}

/**
 * Check and record a request against the rate limit.
 * Calling this function ALWAYS records the request (consume-on-check).
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  ensurePruner();

  const now    = Date.now();
  const cutoff = now - opts.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Slide the window — drop timestamps outside it
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  const count   = entry.timestamps.length;
  const allowed = count < opts.limit;

  if (allowed) {
    entry.timestamps.push(now);
  }

  const oldest  = entry.timestamps[0] ?? now;
  const resetAt = oldest + opts.windowMs;

  return {
    allowed,
    limit:     opts.limit,
    remaining: Math.max(0, opts.limit - entry.timestamps.length),
    resetAt,
  };
}

/**
 * Build standard rate-limit response headers (RFC 6585 + Draft-07 RateLimit).
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit":     String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset":     String(Math.ceil(result.resetAt / 1000)),
    "Retry-After":           String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}

/**
 * Extract the best available client identifier from a Request.
 *
 * ⚠️ Only trust headers the hosting platform sets ITSELF, overwriting whatever
 * the client sent. This function used to read `cf-connecting-ip` first — a
 * Cloudflare header, and this app deploys to **Vercel** (see CLAUDE.md §2; the
 * Wrangler scripts are vestigial). Nothing in the request path set or stripped
 * it, so any client could invent a fresh value per request and land in a new
 * rate-limit bucket every time. Verified: 8/8 requests passed a 5/min limit
 * from one IP by rotating that header. That defeated every limit in the app,
 * including the one guarding paid OpenAI calls in /api/chat.
 *
 * In production ONLY `x-vercel-forwarded-for` is consulted — the one header
 * Vercel's edge sets itself. The spoofable fallbacks are gated behind a dev
 * check rather than merely ranked below it, so the guarantee is readable in
 * this function instead of resting on an assumption about which headers the
 * platform happens to overwrite.
 *
 * If the trusted header is missing in production we return a single shared
 * bucket. That throttles unrelated callers together — deliberately failing
 * CLOSED (stricter), never open.
 */
export function getClientId(req: Request): string {
  const headers = req.headers;

  const trusted = headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (trusted) return trusted;

  // Local dev only: Vercel's header is absent, so fall back to what the dev
  // server sees. Never reached in production.
  if (process.env.NODE_ENV !== "production") {
    return (
      headers.get("x-real-ip") ??
      headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "dev-local"
    );
  }

  return "unknown";
}
