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
 * Convenience: extract best available client identifier from a Request.
 * Priority: CF-Connecting-IP → X-Forwarded-For → X-Real-IP → "unknown"
 */
export function getClientId(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
