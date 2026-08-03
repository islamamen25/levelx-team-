/**
 * lib/ai-budget.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AI token-budget tracker + three-state circuit breaker.
 *
 * Circuit states:
 *   CLOSED    → normal operation, AI calls go through
 *   OPEN      → budget exceeded or repeated failures, deterministic fallback used
 *   HALF_OPEN → cooling-down, one probe call allowed to test recovery
 *
 * Hard caps (per IP, per rolling 24-hour window):
 *   SOFT_CAP  →  50 000 tokens  — warn in logs, continue
 *   HARD_CAP  → 100 000 tokens  — circuit trips to OPEN, fallback activated
 *
 * Per-minute request limit (separate from rate-limit.ts which is per-endpoint):
 *   MAX_RPM = 20 requests / IP / min
 */

import { createSupabasePublicClient } from "@/lib/supabase/server";

// ── Configuration ─────────────────────────────────────────────────────────────
const SOFT_CAP_TOKENS  =  50_000;
const HARD_CAP_TOKENS  = 100_000;
const WINDOW_MS        = 24 * 60 * 60 * 1000;   // 24 h
const HALF_OPEN_AFTER  =  5 * 60 * 1000;         // 5 min cooldown before probe
const FAILURE_THRESHOLD = 3;                      // consecutive failures → OPEN

// ── Types ─────────────────────────────────────────────────────────────────────
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface BudgetEntry {
  tokens:          number;
  windowStart:     number;
  consecutiveFails: number;
  circuitState:    CircuitState;
  openedAt:        number | null;
}

export interface BudgetCheckResult {
  allowed:       boolean;
  state:         CircuitState;
  tokensUsed:    number;
  tokensRemaining: number;
  reason?:       string;
}

export interface FallbackResponse {
  role:    "assistant";
  content: string;
}

// ── In-memory store ───────────────────────────────────────────────────────────
const budgets = new Map<string, BudgetEntry>();

function getEntry(ip: string): BudgetEntry {
  const now   = Date.now();
  let   entry = budgets.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window or first request
    entry = {
      tokens:           0,
      windowStart:      now,
      consecutiveFails: 0,
      circuitState:     "CLOSED",
      openedAt:         null,
    };
    budgets.set(ip, entry);
  }
  return entry;
}

// ── Circuit breaker logic ─────────────────────────────────────────────────────
function resolveCircuitState(entry: BudgetEntry): CircuitState {
  if (entry.circuitState === "OPEN" && entry.openedAt !== null) {
    const elapsed = Date.now() - entry.openedAt;
    if (elapsed >= HALF_OPEN_AFTER) {
      entry.circuitState = "HALF_OPEN";
    }
  }
  return entry.circuitState;
}

/**
 * Check if an AI call is allowed for the given IP.
 * Call BEFORE making the OpenAI request.
 */
export function checkAiBudget(ip: string): BudgetCheckResult {
  const entry = getEntry(ip);
  const state = resolveCircuitState(entry);
  const remaining = Math.max(0, HARD_CAP_TOKENS - entry.tokens);

  if (state === "OPEN") {
    return {
      allowed: false,
      state,
      tokensUsed: entry.tokens,
      tokensRemaining: remaining,
      reason: "Circuit breaker OPEN — AI budget exhausted. Using smart fallback.",
    };
  }

  if (entry.tokens >= HARD_CAP_TOKENS) {
    entry.circuitState = "OPEN";
    entry.openedAt     = Date.now();
    return {
      allowed: false,
      state: "OPEN",
      tokensUsed: entry.tokens,
      tokensRemaining: 0,
      reason: `Hard cap of ${HARD_CAP_TOKENS.toLocaleString()} tokens/day reached.`,
    };
  }

  if (entry.tokens >= SOFT_CAP_TOKENS) {
    console.warn(`[AI Budget] SOFT CAP: IP ${ip} at ${entry.tokens} tokens`);
  }

  return {
    allowed: true,
    state,
    tokensUsed: entry.tokens,
    tokensRemaining: remaining,
  };
}

/**
 * Record actual token usage AFTER a successful AI call.
 * Resets the consecutive-failure counter.
 */
export function recordAiSuccess(ip: string, tokensUsed: number): void {
  const entry = getEntry(ip);
  entry.tokens            += tokensUsed;
  entry.consecutiveFails   = 0;
  if (entry.circuitState === "HALF_OPEN") {
    entry.circuitState = "CLOSED";  // Recovery confirmed
    entry.openedAt     = null;
    console.info(`[AI Budget] Circuit CLOSED (recovered) for IP ${ip}`);
  }
}

/**
 * Record an AI call failure.
 * After FAILURE_THRESHOLD consecutive failures, trips the circuit to OPEN.
 */
export function recordAiFailure(ip: string, error: unknown): void {
  const entry = getEntry(ip);
  entry.consecutiveFails++;

  console.error(
    `[AI Budget] Failure #${entry.consecutiveFails} for IP ${ip}:`,
    error instanceof Error ? error.message : error
  );

  if (
    entry.consecutiveFails >= FAILURE_THRESHOLD &&
    entry.circuitState === "CLOSED"
  ) {
    entry.circuitState = "OPEN";
    entry.openedAt     = Date.now();
    console.error(
      `[AI Budget] Circuit OPENED for IP ${ip} after ${FAILURE_THRESHOLD} failures`
    );
  }

  if (entry.circuitState === "HALF_OPEN") {
    // Probe failed — back to OPEN
    entry.circuitState = "OPEN";
    entry.openedAt     = Date.now();
  }
}

// ── Deterministic fallback ────────────────────────────────────────────────────
/**
 * Returns a non-AI, deterministic product suggestion response.
 * Used when the circuit is OPEN. Fetches top products from Supabase.
 * Never throws — always returns a valid UX response.
 */
export async function getAiFallbackResponse(userMessage: string): Promise<FallbackResponse> {
  try {
    const q = userMessage.toLowerCase();
    const keywords = q.split(/\s+/).filter((w) => w.length > 2);

    // Created per call rather than at module scope: this runs only when the
    // circuit is OPEN, so there is no reason to hold a client open otherwise.
    let query = createSupabasePublicClient()
      .from("products")
      .select("id, name, brand, slug, variants(price, sale_price, condition)")
      .eq("is_active", true)
      .limit(10);

    // Keyword search on name/brand
    if (keywords.length) {
      query = query.or(
        keywords.map((k) => `name.ilike.%${k}%,brand.ilike.%${k}%`).join(",")
      );
    }

    const { data } = await query;
    const picks = (data ?? []).slice(0, 3);

    if (picks.length === 0) {
      return {
        role: "assistant",
        content:
          "I'd love to help! Browse our full [product catalogue](/products) for great deals.\n\n" +
          "_Our AI assistant is temporarily unavailable. We'll be back shortly._",
      };
    }

    const lines = picks.map((p) => {
      const variants = (p.variants as { price: number; sale_price: number | null; condition: string }[]) ?? [];
      const minPrice = variants.length ? Math.min(...variants.map((v) => v.sale_price ?? v.price)) : 0;
      const topCond  = variants[0]?.condition ?? "Good";
      return `• **[${p.name}](/products/${p.slug})** — from EGP ${minPrice.toLocaleString()} (${topCond})`;
    });

    return {
      role: "assistant",
      content:
        `Here are some great options:\n\n${lines.join("\n")}\n\n` +
        `All devices come with a **1-year warranty** and **30-day free returns**.\n\n` +
        `_Our AI assistant is temporarily unavailable — showing curated recommendations instead._`,
    };
  } catch {
    return {
      role: "assistant",
      content:
        "I'd love to help! Browse our full [product catalogue](/products) for great deals.\n\n" +
        "_Our AI assistant is temporarily unavailable. We'll be back shortly._",
    };
  }
}
