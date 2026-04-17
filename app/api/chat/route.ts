/**
 * app/api/chat/route.ts — LevelX AI Shopping Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 * Security layers applied (in order):
 *   1. Rate limit      — 10 req/min per IP (hard wall, no retry allowed)
 *   2. Input validation — Zod schema on messages array (prompt-injection guard)
 *   3. Budget check    — Circuit breaker; OPEN → deterministic fallback
 *   4. AI call         — Streamed via Vercel AI SDK with stepCountIs(5) guard
 *   5. Usage recording — Token count written back to budget tracker
 *   6. Failure handling — recordAiFailure() on any exception, never throws raw
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searchProductsTool } from "@/lib/tools/search-products";
import { rateLimit, rateLimitHeaders, getClientId } from "@/lib/rate-limit";
import {
  checkAiBudget,
  recordAiSuccess,
  recordAiFailure,
  getAiFallbackResponse,
} from "@/lib/ai-budget";

// ── Zod: strict input schema ──────────────────────────────────────────────────
const MessageSchema = z.object({
  role:    z.enum(["user", "assistant", "system"]),
  content: z
    .string()
    .min(1)
    .max(2000, "Message too long")              // prevent token stuffing
    .transform((s) => s.replace(/<[^>]*>/g, "").trim()),  // strip HTML tags
});

const ChatRequestSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1)
    .max(20, "Too many messages in context")    // prevent context stuffing
    .refine(
      (msgs) => msgs.at(-1)?.role === "user",
      "Last message must be from user"
    ),
});

// ── Rate limit config — per IP ────────────────────────────────────────────────
const RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;   // 10 req/min

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientId(req);

  // ── 1. Rate limiting ──────────────────────────────────────────────────────
  const rl = rateLimit(`chat:${ip}`, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another message." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  // ── 2. Input validation ───────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { messages } = parsed.data;

  // ── 3. AI budget / circuit breaker check ─────────────────────────────────
  const budget = checkAiBudget(ip);

  if (!budget.allowed) {
    // Circuit is OPEN — return deterministic fallback as a streamed-style response
    const lastUserMsg = messages.findLast((m) => m.role === "user")?.content ?? "";
    const fallback    = getAiFallbackResponse(lastUserMsg);

    console.warn(
      `[Chat] Circuit OPEN for ${ip}: ${budget.reason} — serving fallback`
    );

    // Return as a simple JSON response the client can render directly
    return NextResponse.json(
      {
        fallback: true,
        message:  fallback,
        budget: {
          tokensUsed:      budget.tokensUsed,
          tokensRemaining: budget.tokensRemaining,
        },
      },
      {
        status: 200,
        headers: {
          "X-AI-Circuit-State":    budget.state,
          "X-AI-Tokens-Remaining": String(budget.tokensRemaining),
        },
      }
    );
  }

  // ── 4. AI call with full error handling ───────────────────────────────────
  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `You are the LevelX shopping assistant — a friendly, concise expert on refurbished electronics.
Help customers find the right device. Use the search_products tool to look up products.
Always mention our 1-year warranty and 30-day returns when recommending products.
Keep responses short and helpful. Format prices in GBP (£).
If no products match, suggest broadening the search.`,
      messages,
      tools:    { search_products: searchProductsTool },
      stopWhen: stepCountIs(5),
      // ── 5. Token tracking callback ─────────────────────────────────────────
      // AI SDK v4: totalUsage.inputTokens + totalUsage.outputTokens
      onFinish: ({ totalUsage }) => {
        const total = (totalUsage?.inputTokens ?? 0) + (totalUsage?.outputTokens ?? 0);
        if (total > 0) recordAiSuccess(ip, total);
      },
    });

    const response = result.toUIMessageStreamResponse();

    // Attach budget headers to the streaming response
    response.headers.set("X-AI-Circuit-State",    budget.state);
    response.headers.set("X-AI-Tokens-Remaining", String(budget.tokensRemaining));
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));

    return response;

  } catch (err) {
    // ── 6. Failure recording + graceful fallback ────────────────────────────
    recordAiFailure(ip, err);

    console.error("[Chat] AI call failed:", err);

    // Never expose raw error to client — serve deterministic fallback
    const lastUserMsg = messages.findLast((m) => m.role === "user")?.content ?? "";
    const fallback    = getAiFallbackResponse(lastUserMsg);

    return NextResponse.json(
      {
        fallback: true,
        message:  fallback,
        error:    "AI assistant temporarily unavailable. Showing curated results.",
      },
      { status: 200 }  // 200 so the client renders normally
    );
  }
}
