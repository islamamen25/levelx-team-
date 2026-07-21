# CONTEXT.md — LevelX (tekdom) Project State

> **Purpose:** Resume work in a new conversation without losing context.
> **Project:** `D:\level X\tekdom` — Next.js 16.2 e-commerce store (Egyptian market, refurbished electronics)
> **Supabase Project ID:** `xeylyyfmcucphggqwxdv` (name "levelx", eu-west-1)
> **Last verified:** 2026-07-21 (live DB + code inspection + passing build)

---

## 1. Current Plan

The store's core is **built, wired to Supabase, and secured**. There is no active feature-build in flight. The near-term plan is polish + integrations:

1. Document missing env vars in `.env.example` (Paymob / Bosta / WhatsApp / `REVALIDATE_SECRET`)
2. Verify/build the external integrations (Paymob payments, Bosta logistics, WhatsApp OTP) — status not confirmed this session
3. Optional: wire Meilisearch semantic search fully to live DB products (if not already)
4. Optional cosmetic: move `pg_net` extension out of `public` schema

Everything in the original "category tree + product wiring + admin + security" scope is **DONE**.

---

## 2. Completed & Verified ✅

### A. Category Tree System — DONE
- DB: `categories` self-referential tree, `product_category` M2M pivot, `is_visible`/`is_active` columns, indexes
- SQL functions: `get_category_tree()` (self-calling), `get_category_flat()` (recursive CTE), `is_admin()` (SECURITY DEFINER, `search_path=public`)
- Seed: 5 roots (mobile, gaming, car-accessories, computing, smart-devices) + 12 subcategories
- Queries: [`lib/queries/categories.ts`](lib/queries/categories.ts) — `getCategoryTree/Flat/BySlug` (`'use cache'` + `cacheTag("categories")`), `getAllCategoriesAdmin` (server client, no cache)
- n8n webhook: `notify_n8n_category_change()` trigger on `is_visible` UPDATE → pg_net POST with `x-webhook-secret` header

### B. Dynamic Category Pages — DONE
- [`app/[locale]/category/[slug]/page.tsx`](app/[locale]/category/[slug]/page.tsx) + `loading.tsx` + `not-found.tsx`
- Build generates real slugs from DB (e.g. `/en/category/car-accessories`, +34 paths)

### C. Category Admin Dashboard — DONE
- [`app/[locale]/(admin)/dashboard/categories/page.tsx`](app/[locale]/(admin)/dashboard/categories/page.tsx) — CRUD + visibility toggle via `/api/admin/categories`

### D. Products Wired to Supabase — DONE
- [`lib/queries/products.ts`](lib/queries/products.ts) — `getProductBySlug`, `generateStaticProductParams`, `getProductsByCategoryId`, `getProductsFiltered`, `getBrandsForCategory`, `getProductsAdmin` (all cached except admin)
- PDP [`app/[locale]/products/[slug]/page.tsx`](app/[locale]/products/[slug]/page.tsx) fetches from DB; `ProductPanel`/`Gallery`/`SmartAddons` use `DbProduct`/`DbVariant`
- PLP [`app/[locale]/products/page.tsx`](app/[locale]/products/page.tsx) uses DB categories
- **`lib/mock-products.ts` DELETED — zero references in codebase** (only `lib/mock-dashboard.ts` remains, for KPI charts — unrelated)

### E. Admin Catalog Wired — DONE
- [`app/[locale]/(admin)/dashboard/catalog/page.tsx`](app/[locale]/(admin)/dashboard/catalog/page.tsx) — `getProductsAdmin()` + `getAllCategoriesAdmin()`; stats from real data
- `ProductTable`/`ProductForm` accept `DbProduct`/`DbVariant` + `{id,name}[]` categories; save/delete → `/api/admin/products`; `router.refresh()` after mutation

### F. Supabase TypeScript Types — DONE
- [`lib/supabase/types.ts`](lib/supabase/types.ts) exists (generated `Database` type); imported by server client, queries, and `require-admin`

### G. Security — ALL AUDIT ITEMS RESOLVED (verified live 2026-07-21)
> The old `CLAUDE.md §9` audit (June 2026) is now **historical** — every 🔴 and ⚠️ item is fixed.

- **Admin page guard:** [`app/[locale]/(admin)/layout.tsx`](app/[locale]/(admin)/layout.tsx) — `getUser()` + `profiles.role='admin'` → redirect
- **RLS:** enabled on all 13 tables; writes gated by `is_admin()` (`*_admin_all` policies); public SELECT only `is_active`/`is_visible=true`
- **Admin API:** every `app/api/admin/*` route uses [`requireAdmin()`](lib/supabase/require-admin.ts) (401 no session / 403 not admin) + rate limiting + Zod
- **Hardening applied this session (2026-07-21):**
  - `update_updated_at()` → `SET search_path = ''`
  - `is_admin()` → `REVOKE EXECUTE FROM anon` (kept for `authenticated` — RLS needs it)
  - `notify_n8n_category_change()` → `REVOKE EXECUTE FROM PUBLIC` (trigger-only, not API-callable)

### H. Build — PASSES
- `npm run build` succeeds (Next.js 16.2.2, Turbopack, PPR). Locale routes render `◐` (Partial Prerender), API routes `ƒ` (Dynamic).

---

## 3. Remaining Work (in priority order)

1. ~~Document env vars in `.env.example`~~ — ✅ DONE (2026-07-21): all 7 code-used vars were already documented; added commented PLANNED placeholders for Paymob/Bosta/WhatsApp + a note that n8n webhook URL/secret live as Postgres settings, not env.
2. **Verify external integrations** (not confirmed this session): Paymob payment webhook (`app/api/webhooks/paymob/`), Bosta shipment trigger, WhatsApp OTP
3. **Meilisearch** semantic search — confirm it indexes live DB products (`scripts/seed-meilisearch.ts`, `app/api/search/semantic`)
4. **Cosmetic:** move `pg_net` out of `public` schema (only remaining advisor WARN; left intentionally — moving it can break the n8n webhook)
5. **Optional:** `app/[locale]/(shop)/layout.tsx` — not currently needed

---

## 4. Key Decisions

- **Caching (Next 16.2):** `'use cache'` directive + `cacheLife()` + `cacheTag()`; **`revalidateTag(tag, profile)` needs a 2nd arg** (e.g. `"hours"`). Admin pages use `await connection()` to force dynamic. **Never** `export const dynamic` (incompatible with `cacheComponents: true`).
- **Cache tags:** `"categories"`, `"category:${slug}"`, `"products"`, `"product:${slug}"`, `"store-config"`.
- **PPR pattern:** static layout shell + `<Suspense fallback={null}>{children}</Suspense>`; `setRequestLocale(locale)` in every next-intl layout/page; `getMessages({ locale })` (explicit locale, no `headers()` read).
- **Routing:** no `middleware.ts` — `proxy.ts` (next-intl) does i18n only; auth lives in `(admin)/layout.tsx` + `requireAdmin()`.
- **Supabase clients:** `createSupabaseServerClient()` (cookies/session, for admin + RLS-as-user) vs `createSupabasePublicClient()` (anon, cached public reads).
- **n8n webhook security:** secret in `x-webhook-secret` header, never in URL.
- **SQL:** `is_admin()` is SECURITY DEFINER (avoids RLS recursion); `get_category_tree()` self-calls (recursive CTE can't aggregate in recursive term).
- **DB naming gotcha:** variants table is **`variants`** (not `product_variants`) — always `.from("variants")`.

---

## 5. Current State

**Everything in the category + product + admin + security scope is complete, wired to live Supabase, secured, and building green.** No task is mid-flight.

**Operational note:** the Supabase project is **free-tier and auto-pauses (`INACTIVE`) after ~7 days idle**. When paused, `xeylyyfmcucphggqwxdv.supabase.co` stops resolving → `npm run build` fails at `generateStaticParams` with `fetch failed`. **Fix:** Supabase MCP `restore_project` → wait ~1–3 min to `ACTIVE_HEALTHY`. (It was paused and restored on 2026-07-21.)

**Next action:** pick item 1 from §3 (env docs) or confirm integration status (§3 item 2). Before any new security work, check **Supabase advisors live** — do not trust the historical audit in `CLAUDE.md §9`.

---

## 6. Important Context

### Tech Stack
- Next.js **16.2.2** (App Router, Turbopack, PPR via `cacheComponents: true`) · React **19.2**
- Tailwind **v4** (no config file; `@theme` in `app/globals.css`; P3 oklch)
- next-intl (`en`/`ar`; `i18n/routing.ts`, `i18n/navigation.ts`)
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`) · Zustand cart · Vercel AI SDK 6 + Meilisearch
- Deploy: Cloudflare Workers via `@opennextjs/cloudflare`

### DB Tables (13, all RLS-enabled)
`categories`, `products`, `variants`, `product_category`, `product_images`, `product_translations`, `profiles`, `store_configuration`, `serial_items`, `price_data`, `pending_approvals`, `advisory_signals`, `agent_states`

### Key Files
| Purpose | Path |
|---|---|
| SSR/anon Supabase clients | `lib/supabase/server.ts` |
| Generated DB types | `lib/supabase/types.ts` |
| Admin auth helper | `lib/supabase/require-admin.ts` |
| Category queries | `lib/queries/categories.ts` |
| Product queries | `lib/queries/products.ts` |
| Store config (cached) | `lib/store-config.ts` |
| Admin route guard | `app/[locale]/(admin)/layout.tsx` |
| PDP | `app/[locale]/products/[slug]/page.tsx` |
| Category page | `app/[locale]/category/[slug]/page.tsx` |
| Revalidate webhook | `app/api/revalidate/route.ts` |
| Admin APIs | `app/api/admin/{products,categories,store-config,products/search}/route.ts` |

### Env Vars
```
NEXT_PUBLIC_SUPABASE_URL=https://xeylyyfmcucphggqwxdv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
REVALIDATE_SECRET=...            # x-webhook-secret header for n8n
# + (undocumented, see §3.1) Paymob HMAC, Bosta, WhatsApp keys
```

### Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run build:cloudflare` · `npm run deploy` · `npx tsx scripts/seed-meilisearch.ts`

### Critical Rules
1. `revalidateTag(tag, "hours")` — always 2 args (Next 16.2)
2. Never `export const dynamic = "force-dynamic"` (breaks `cacheComponents`)
3. Admin/dynamic pages → `await connection()`
4. `setRequestLocale(locale)` in every next-intl layout
5. No `middleware.ts` — use `proxy.ts`
6. Tailwind v4 — no config file, oklch colors
7. `.from("variants")` — not `product_variants`
