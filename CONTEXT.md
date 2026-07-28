# CONTEXT.md — LevelX (tekdom) Project State

> **Purpose:** Resume work in a new conversation without losing context.
> **Project:** `D:\level X\tekdom` — Next.js 16.2 e-commerce store (Egyptian market, refurbished electronics)
> **Supabase Project ID:** `xeylyyfmcucphggqwxdv` (name "levelx", eu-west-1)
> **Live site:** https://levelx-team.vercel.app · **Repo:** `github.com/islamamen25/levelx-team-`
> **Last verified:** 2026-07-22 (live DB + live site + passing build)

---

## 1. Current Plan

> ⚠️ **Corrected 2026-07-28.** The line below ("built, deployed, secured, verified
> end-to-end") was **true of the storefront but not of checkout**. A posture assessment
> that quarried the live DB found the checkout persisted nothing — no `orders` table
> existed. That is now fixed (§2.P). The catalog finding is still open and is the real
> blocker.

The **storefront** is built, deployed, secured, and verified on production. **Checkout is
now real** (Cash on Delivery, §2.P). What remains, in priority order:

1. 🔴 **Real product data — the actual bottleneck.** 61 products exist, **only 1 is
   sellable**. Of the 60 inactive: **59 have no variant (⇒ no price)**, 54 have no images,
   9 lack an Arabic translation, 6 lack a category. Needs owner pricing input.
2. 🟠 **Admin orders screen** — orders are written but there is no UI to read or fulfil
   them. Currently SQL / Supabase dashboard only.
3. 🟠 **Migration drift** — `supabase/migrations/` cannot rebuild the live schema. 6 of
   12 `categories` columns exist in no migration. On a free tier that auto-pauses, this
   is real risk. Needs a baseline migration.
4. **Paymob / Bosta / WhatsApp** — still zero code. `orders.payment_method` already
   reserves `'paymob'`.
5. **Meilisearch** — semantic search over 1 product has little value until (1) is done.
6. **Cosmetic:** `pg_net` in `public` schema (advisor WARN, left intentionally).

---

## 2. Completed & Verified ✅

### A. Category Tree System
- DB: `categories` self-referential tree, `product_category` M2M pivot, `is_visible`/`is_active`, indexes
- SQL functions: `get_category_tree()` (self-calling), `get_category_flat()` (recursive CTE), `is_admin()` (SECURITY DEFINER, `search_path=public`)
- 5 root categories + 12 subcategories
- Queries in [`lib/queries/categories.ts`](lib/queries/categories.ts): `getCategoryTree/Flat/BySlug`, `getCarouselCategories` (cached, `cacheTag("categories")`), `getAllCategoriesAdmin` (uncached, server client)

### B. Dynamic Category Pages
[`app/[locale]/category/[slug]/`](app/[locale]/category/[slug]/) — `page.tsx` + `loading.tsx` + `not-found.tsx`. Build generates real slugs from the DB.

### C. Category Admin Dashboard
[`app/[locale]/(admin)/dashboard/categories/page.tsx`](app/[locale]/(admin)/dashboard/categories/page.tsx) — full CRUD, visibility toggle, and home-page presentation controls (§2.I) via `/api/admin/categories`.

### D. Products Wired to Supabase
- [`lib/queries/products.ts`](lib/queries/products.ts) — `getProductBySlug`, `generateStaticProductParams`, `getProductsByCategoryId`, `getProductsFiltered`, `getBrandsForCategory`, `getProductsAdmin`
- PDP, PLP, and admin catalog all read live data. `lib/mock-products.ts` is **deleted** (only unrelated `lib/mock-dashboard.ts` remains, for KPI charts)
- **Products without a `slug` are filtered out** of listings and category pages — they used to render `/products/null` links that 404'd

### E. Product Add/Edit as Full Pages *(2026-07-22)*
The form used to be crammed into a `max-w-2xl` dialog with a `70vh` scroll cap. Now:
- `/dashboard/catalog/new` — add
- `/dashboard/catalog/edit?id=<uuid>` — edit
- [`components/admin/product-form-page.tsx`](components/admin/product-form-page.tsx) wraps `ProductForm` with router-based close/save; `ProductForm` gained a `fullPage` prop that drops the height cap
- **Why `?id=` and not `/[id]`:** a dynamic segment needs a prerendered fallback shell, which the `(admin)` layout's cookie-based session check cannot produce under `cacheComponents`. A static segment sidesteps it.

### F. Supabase TypeScript Types
[`lib/supabase/types.ts`](lib/supabase/types.ts) — generated `Database` type, kept in sync manually when columns change.

### G. Security — ALL AUDIT ITEMS RESOLVED (verified live)
> `CLAUDE.md §9` (June 2026) is **historical**. Every 🔴 and ⚠️ item is fixed. Check Supabase advisors live instead of trusting it.

- **Admin guard:** [`app/[locale]/(admin)/layout.tsx`](app/[locale]/(admin)/layout.tsx) — session + `profiles.role='admin'`, else redirect to `/[locale]/login`
- **RLS:** enabled on all 13 tables; writes gated by `is_admin()`; public SELECT limited to `is_active`/`is_visible = true`
- **Admin API:** every `app/api/admin/*` route uses [`requireAdmin()`](lib/supabase/require-admin.ts) + rate limiting + Zod
- **Hardening applied:** `update_updated_at()` → `SET search_path = ''`; `is_admin()` → `REVOKE EXECUTE FROM anon` (kept for `authenticated`, RLS needs it); `notify_n8n_category_change()` → `REVOKE EXECUTE FROM PUBLIC`

### H. Auth (login + password reset)
- `/[locale]/login` — email + password; Server Action (`login/actions.ts`) → `signInWithPassword` → `/dashboard`
- `/[locale]/reset-password` — consumes Supabase's recovery session, calls `auth.updateUser({ password })`
- **"Forgot password?"** link on the login page ([`components/auth/forgot-password.tsx`](components/auth/forgot-password.tsx)) calls `resetPasswordForEmail(email, { redirectTo })` so the mail lands on `/reset-password` — no longer dependent on the Auth Site URL
- **Admin account:** `islamamen2525@gmail.com` → `profiles.role = 'admin'`. Verified logging in and reaching `/dashboard` on production.

### I. Home Page Category Tiles — DB-driven + admin-controlled *(2026-07-22)*
The tiles read categories from the DB but mapped icons/colours through a hardcoded `SLUG_CONFIG` whose slugs no longer matched reality, so **every tile fell back to a generic icon**.

Added five per-category presentation columns, all editable at `/dashboard/categories` with a **live preview**:

| Column | Meaning |
|---|---|
| `in_carousel` | Show on the home page |
| `sort_order` | Ascending; ties fall back to name |
| `icon` | Lucide icon name (22 options) |
| `color_key` | Accent matching `--color-cat-<key>` (8 options) |
| `display_name` | Optional shorter label |

Shared helpers live in [`lib/category-presentation.ts`](lib/category-presentation.ts). `components/home/category-carousel.tsx` was **deleted** — it was never rendered anywhere and duplicated the tiles.

> **Gotcha hit during this work:** `in_carousel` defaults to `true`, so subcategories crowded the tiles out on first deploy. Subcategories were set to `false`; the admin can still opt any one back in.

### J. Header Category Bar — DB-driven *(2026-07-22)*
[`components/layout/category-bar.tsx`](components/layout/category-bar.tsx) was a hardcoded `MEGA_NAV` array advertising categories the store does not sell. It now receives the category tree: the locale layout fetches `getCategoryTree()` → `Navbar` → `CategoryBar`. Tabs are roots, dropdowns list children, links point at `/category/[slug]`.

### K. Data Cleanup *(2026-07-22)*
The DB held 15 products: 7 with corrupt names (`????: B0FN4WPLNQ`) and most with no variant (so no price → invisible in the shop).
- **14 hidden** via `is_active = false` (non-destructive and reversible; a hard `DELETE` was blocked by a safety guard)
- **1 kept** as the working test product, converted to clean English: `3-in-1 Multi USB Charging Cable`, slug `3-in-1-multi-usb-charging-cable`, brand `LevelX`, category `Chargers`, 1300 EGP, condition Good

### L. Locale-aware prices
`formatEGP` was hardcoded to `ar-EG`, so the English store rendered Arabic-Indic digits. It now takes the active locale — `/en` shows `EGP 1,300`, `/ar` keeps `١٬٣٠٠ ج.م.` Fixed in `product-panel.tsx`, `product-card.tsx`, `smart-addons.tsx`.

### M. Cache invalidation webhook — WORKING, verified end-to-end *(2026-07-22)*
See §4 for the full story; the short version:
- Secrets now live in **Supabase Vault** (`revalidate_webhook_url`, `revalidate_webhook_secret`), because Supabase forbids `ALTER DATABASE ... SET app.*`
- `notify_n8n_category_change()` reads them at runtime and POSTs `{type:"category", slug}` to `/api/revalidate`
- **Proven live:** toggling a category in the dashboard produced `200 {"ok":true,"target":"category:car-accessories"}` in `net._http_response`

### N. Deployment — Vercel
- Project `levelx-team` (team `islamamen25s-projects`), auto-deploys from GitHub
- **Production branch is `master`** — set via **Settings → Environments → Production → Branch Tracking** (there is no separate "Production Branch" field, and Vercel does *not* follow GitHub's default-branch change)
- Env vars set for Production + Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET`
- Build passes: 85 pages, locale routes `◐` (Partial Prerender), API routes `ƒ` (Dynamic)

### P. Checkout — Cash on Delivery, orders now persist *(2026-07-28)*
Until this change `components/checkout/checkout-form.tsx` submitted to nothing: the handler
was `clearCart(); setPlaced(true);`. It collected card number, expiry and CVC in plain
inputs and discarded them, then told the customer "Order placed!". No `orders` table existed.

- **Migration `0003_orders_cod.sql`** — `orders` + `order_items`, `order_status` and
  `payment_method` enums, `order_number_seq`.
- **`create_cod_order()`** `SECURITY DEFINER` RPC is the only write path — atomic
  (order+items in one transaction) and price-authoritative (client sends `variant_id`+`qty`
  only; prices/VAT/total computed from `variants` server-side).
- **Card fields deleted**, not wired up — card collection belongs behind Paymob, which
  does not exist yet. Replaced with a COD notice; trust badges changed from
  SSL/Encrypted/Buyer-protection to no-prepayment/inspect-first/30-day-returns.
- **VAT corrected 20% → 14%.** The 20% was also baked into the `tax` *translation label*
  in both locales, not just the calculation — a UK-template leftover, like the `£` symbols
  removed earlier.
- **RLS:** no SELECT policy for `anon` on either table — verified live that `anon` sees 0
  rows while an order exists.
- **Verified end-to-end:** a real order placed through the browser UI produced
  `LX-260728-1001`, correct Arabic storage, `2600 + 364 VAT = 2964`, cart cleared only
  after a successful response. An unknown variant returns `409 ITEM_UNAVAILABLE` and
  leaves **zero** orphan rows (atomicity confirmed). Test rows deleted afterwards.
- ⚠️ **No admin orders screen yet.**

### O. n8n — product import pipeline is LIVE
Instance moved to **`https://n8n.islamai.shop`** (old `n8n.srv1344298.hstgr.cloud` is gone).

| Workflow | ID | Nodes | Role |
|---|---|---|---|
| **TEKDOM 1 — Intake & Enrichment** | `UfpZ0BYZ05ua4S1A` | 41 | 🟢 active |
| **TEKDOM 2 — DB Writer** | `Z4iopTC6qSTmtlSh` | 20 | 🟢 active |
| ~~TEKDOM monolith~~ | `Q1LKEh5okGIThDbh` | 54 | archived |

Flow: Drive folder polled every minute → lock file by renaming `DONE_` → parse Excel → enrich (barcode + Google images) → **Telegram approval** → TEKDOM 2 writes to Supabase (bilingual AR/EN via `product_translations`). Rejected items get a second enrichment pass (barcode → Google → official site) and a second review.

`n8n/amazon-data-entry.workflow.json` was **deleted** — it described a superseded single-workflow design and importing it would have created a duplicate. [`n8n/README.md`](n8n/README.md) now documents what actually runs, read from the n8n API.

---

## 3. Debugging Notes — bugs found and fixed this session

| Symptom | Root cause | Fix |
|---|---|---|
| `npm run build` failed: `get_category_flat: fetch failed` | Supabase project auto-paused (`INACTIVE`); its subdomain stopped resolving | `restore_project` via MCP |
| Product links 404'd (`/products/null`) | Imported products had `slug = null` | Generated slugs + filter `.not("slug","is",null)` in three queries |
| `/dashboard/catalog` crashed | `lib/queries/products.ts` had a **file-level `'use cache'`** that applied to `getProductsAdmin()`, which reads `cookies()` — dynamic data is illegal inside a cache scope | Removed the file-level directive; each cached function declares its own |
| Categories page unreachable | Nothing in the app linked to `/dashboard/categories` | Added it to the dashboard quick-nav |
| English store showed Arabic-Indic prices | `formatEGP` hardcoded to `ar-EG` | Pass the active locale |
| `/api/revalidate` always returned 401 | **The secret itself began with an Arabic character (`ا`)** — HTTP headers must be ASCII, so the value was mangled in transit and could never match | Regenerated a 48-char ASCII secret; synced to Vercel via CLI |
| `ALTER DATABASE postgres SET app.n8n_webhook_url` → `permission denied` | Supabase does not grant superuser for custom GUCs, so the original trigger design **could never be configured** | Rewrote the function to read from Supabase Vault |

### Browser-testing caveat
The site uses **Lenis smooth-scroll**, which confuses automated browsers: screenshots time out, `<main>` measures as empty, and buttons report zero size. This is **not** a real bug — verify by fetching the server HTML (`curl` / `web_fetch_vercel_url`) instead of trusting the automation pane.

---

## 4. Key Decisions

- **Caching (Next 16.2):** `'use cache'` + `cacheLife()` + `cacheTag()`; **`revalidateTag(tag, profile)` needs a 2nd arg**. Admin pages use `await connection()`. **Never** `export const dynamic` (incompatible with `cacheComponents: true`). **Never** put `'use cache'` at file level if any export reads cookies.
- **Cache tags:** `"categories"`, `"category:${slug}"`, `"products"`, `"product:${slug}"`, `"store-config"`
- **PPR pattern:** static layout shell + `<Suspense fallback={null}>{children}</Suspense>`; `setRequestLocale(locale)` in every next-intl layout; `getMessages({ locale })`
- **Routing:** no `middleware.ts` — `proxy.ts` does i18n only; auth lives in `(admin)/layout.tsx` + `requireAdmin()`
- **Supabase clients:** `createSupabaseServerClient()` (cookies/session) vs `createSupabasePublicClient()` (anon, cached reads)
- **Secrets in Postgres:** use **Supabase Vault**, not `current_setting('app.*')` — the latter cannot be configured on Supabase
- **Webhook security:** secret in the `x-webhook-secret` header, never in a URL — and **ASCII only**
- **The revalidate webhook is largely redundant:** `/api/admin/categories` already calls `revalidateTag` directly. The DB trigger only adds value for changes made *outside* the app (e.g. Supabase table editor).
- **DB naming gotcha:** the variants table is **`variants`**, not `product_variants`

---

## 5. Current State

**Everything is complete, deployed, and verified on production.** No task is mid-flight.

**Operational note:** the Supabase project is **free-tier and auto-pauses (`INACTIVE`) after ~7 days idle**. When paused, its subdomain stops resolving and `npm run build` fails at `generateStaticParams` with `fetch failed`. **Fix:** MCP `restore_project` → wait 1–3 min for `ACTIVE_HEALTHY`. Any browser hit also resets the idle timer.

**Next action:** pick from §1 — most valuable is adding real products (only one exists), either by hand at `/dashboard/catalog/new` or through the TEKDOM Excel pipeline.

---

## 6. Important Context

### Tech Stack
- Next.js **16.2.2** (App Router, Turbopack, PPR via `cacheComponents: true`) · React **19.2**
- Tailwind **v4** (no config file; `@theme` in `app/globals.css`; P3 oklch)
- next-intl (`en`/`ar`) · Supabase (`supabase-js` + `@supabase/ssr`) · Zustand cart · Vercel AI SDK 6 + Meilisearch
- Deployed on **Vercel**; `@opennextjs/cloudflare` scripts still exist in `package.json` but Vercel ignores them

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
| Category icon/colour registry | `lib/category-presentation.ts` |
| Store config (cached) | `lib/store-config.ts` |
| Admin route guard | `app/[locale]/(admin)/layout.tsx` |
| Login | `app/[locale]/login/{page.tsx,actions.ts}` |
| Password reset | `app/[locale]/reset-password/page.tsx` + `components/auth/{reset-password-form,forgot-password}.tsx` |
| Product add / edit pages | `app/[locale]/(admin)/dashboard/catalog/{new,edit}/page.tsx` |
| Home tiles | `components/home/category-tiles.tsx` |
| Header mega menu | `components/layout/category-bar.tsx` |
| PDP / Category page | `app/[locale]/products/[slug]/page.tsx` · `app/[locale]/category/[slug]/page.tsx` |
| Revalidate webhook | `app/api/revalidate/route.ts` |
| Admin APIs | `app/api/admin/{products,categories,store-config,products/search}/route.ts` |

### Env Vars
```
NEXT_PUBLIC_SUPABASE_URL=https://xeylyyfmcucphggqwxdv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
REVALIDATE_SECRET=...              # x-webhook-secret header — ASCII only!
# optional: OPENAI_API_KEY, MEILISEARCH_HOST/API_KEY/INDEX_NAME
# planned (commented in .env.example): Paymob, Bosta, WhatsApp
```
`.env.local` is gitignored (added by `vercel link`) and also holds a `VERCEL_OIDC_TOKEN`.

### Commands
`npm run dev` · `npm run build` · `npm run lint` · `npx tsx scripts/seed-meilisearch.ts`
Vercel CLI is authenticated as `islamamen25` and the repo is linked — `npx vercel env ls|add|rm`, `npx vercel ls` all work.

### Critical Rules
1. `revalidateTag(tag, "hours")` — always 2 args (Next 16.2)
2. Never `export const dynamic = "force-dynamic"` (breaks `cacheComponents`)
3. Never put `'use cache'` at file level in a module that also reads cookies
4. Admin/dynamic pages → `await connection()`
5. `setRequestLocale(locale)` in every next-intl layout
6. No `middleware.ts` — use `proxy.ts`
7. Tailwind v4 — no config file, oklch colours
8. `.from("variants")` — not `product_variants`
9. Postgres secrets → Supabase Vault, never `current_setting('app.*')`
10. Anything sent in an HTTP header must be **ASCII**
