@AGENTS.md
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 0. Pre-flight (read first)
Next.js 16.2 has breaking changes from training data. **Before writing any Next/React code**, consult `node_modules/next/dist/docs/` for the relevant API. Heed deprecation notices.

**Product data → Supabase:** any task that creates, imports, or updates rows in
`products` / `variants` / `product_translations` — **read [`COWORK.md`](COWORK.md) first**.
It holds the write contract (columns, enums, the `UNIQUE (product_id, lang)` upsert),
the rules that decide whether a product is visible on the storefront at all, and the
mandatory `POST /api/revalidate` step. Direct DB writes do **not** invalidate the
Next.js cache — skip that call and your data will not appear for up to an hour.

---

## 1. Project Identity
Premium electronics & home appliances e-commerce — Egyptian market.
- **Visual DNA:** Hyper-minimalist (Apple) + Storytelling scroll (Dyson) + Trust signals (Back Market)
- **Key UX Patterns:** Bento Grid listings · Split-screen PDP · One-page checkout
- **Location:** `D:\level X\tekdom`
- **Status:** Late-stage development — most features done, minor work remaining

---

## 2. Tech Stack (Exact Versions)
| Layer | Technology |
|---|---|
| Framework | Next.js **16.2** (App Router) + React **19.2** |
| Styling | Tailwind CSS **v4** + shadcn/ui (style `base-nova`, icons `lucide`) + GSAP + Lenis |
| AI Layer | Vercel AI SDK **6.0** + OpenAI + Meilisearch (semantic vector search) |
| Database | Supabase (PostgreSQL + RLS) — ref: `xeylyyfmcucphggqwxdv` |
| Client State | Zustand |
| i18n | next-intl |
| Payments | Paymob (HMAC webhook validation) |
| Logistics | Bosta (async shipment trigger) |
| Auth/OTP | WhatsApp Business API |
| Infra | Cloudflare Workers via `@opennextjs/cloudflare` + Wrangler (Cairo edge node); Cloudflare WAF in front |

---

## 3. Commands
- `npm run dev` — local dev server
- `npm run build` — production Next build
- `npm run lint` — ESLint (config: `eslint.config.mjs`)
- `npm run build:cloudflare` — OpenNext Cloudflare build
- `npm run preview` — local Cloudflare Worker preview
- `npm run deploy` — deploy to Cloudflare via Wrangler
- `npx tsx scripts/seed-meilisearch.ts` — reseed Meilisearch index

No test runner is configured.

---

## 4. Architecture
- **Routing**: All user-facing routes live under `app/[locale]/`. The locale prefix is injected by `proxy.ts` (a `next-intl` `createMiddleware` wrapper) using `i18n/routing.ts`. Translations live in `messages/`. API routes under `app/api/{admin,chat,search}` are **not** locale-scoped.
- **Data layer**: Supabase client in `lib/supabase.ts`; RLS enforced server-side. Schema migrations in `supabase/migrations/`.
- **Search / AI**: Meilisearch (`lib/meilisearch.ts`) + OpenAI embeddings (`lib/embeddings.ts`). AI SDK tools registered under `lib/tools/` (e.g. `search-products.ts`). Spend guarded by `lib/ai-budget.ts` and `lib/rate-limit.ts`.
- **Client state**: Zustand cart store in `lib/cart-store.ts`.
- **Path aliases** (`tsconfig.json` + `components.json`): `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.

---

## 5. Strict Rules — Next.js 16.2
- **Caching is OPT-IN** — framework is dynamic by default.
  - Use `'use cache'` directive at top of file/component to enable static shell.
  - Use `cacheLife()` and `cacheTag()` for background revalidation.
- **NO `middleware.ts`** — use `proxy.ts` for edge routing and auth checks only. Never run heavy DB queries inside `proxy.ts`.
- **API Routes** — standard Web `Request`/`Response` only. Path: `app/api/.../route.ts`.

---

## 6. Strict Rules — Tailwind CSS v4
- **NO `tailwind.config.js`** — all config via `@theme` directives in `app/globals.css`.
- Colors in **P3 oklch** color space only.
- Dynamic utilities directly — `mt-15`, not `mt-[60px]`.
- Native container queries — `@container`, `@sm:` — no external plugins.

---

## 7. Strict Rules — Vercel AI SDK 6.0
- Multi-step tasks → `ToolLoopAgent` abstraction.
- Structured JSON → always `generateObject` / `streamObject` + Zod schema.
- Any tool that mutates/deletes DB → `needsApproval: true` (Human-in-the-Loop).

---

## 8. Critical Integration Rules

### Paymob (Payments)
- **NEVER** trust frontend SDK callbacks to fulfill orders.
- MUST validate HMAC signature in backend webhook before changing order status.
- Webhook route: `app/api/webhooks/paymob/route.ts`.

### Bosta (Logistics)
- Trigger "Create Shipment" ONLY after the HMAC-verified payment webhook succeeds.
- Always async — never block the payment response.

---

## 9. Security Audit — Phase 2 (June 2026) — ✅ RESOLVED (verified 2026-07-21)

> فحص شامل أُجري على قاعدة البيانات الحقيقية (`xeylyyfmcucphggqwxdv`) والكود.
>
> **✅ تحديث 2026-07-21:** جميع البنود 🔴 و⚠️ أدناه **عُولجت وتم التحقق منها حيّاً** على قاعدة
> البيانات الفعلية. القسم مُبقى كسجل تاريخي. الحالة الحالية:
> - **🔴 #1 حارس الإدارة** → `app/[locale]/(admin)/layout.tsx` موجود (session + `is_admin()` → redirect).
> - **🔴 #2 RLS** → مفعّل على كل الجداول الـ13؛ لا جدول مكشوف.
> - **🔴 #3 Admin API** → كل route داخل `api/admin/` يستخدم `requireAdmin()` (`lib/supabase/require-admin.ts`).
> - **⚠️ ثغرات الـ policies** → كل الكتابة عبر `*_admin_all` بـ `is_admin()`؛ لا policy بـ `true` للكتابة.
> - **تحذيرات advisor المتبقية (WARN فقط):** `update_updated_at` search_path (أُصلح 2026-07-21)،
>   `is_admin`/`notify_n8n_category_change` EXECUTE سُحبت من `anon` (والأخيرة من `authenticated` أيضاً).
>   يبقى فقط `pg_net` extension في schema `public` — تجميلي، نقله قد يكسر webhook n8n، متروك عمداً.
>
> ⚠️ **لا تُعِد تنفيذ البنود أدناه** — هي تاريخ. تحقّق حيّاً عبر Supabase advisors قبل أي عمل أمني جديد.

### 🔴 مشاكل عاجلة (عُولجت — سجل تاريخي)

**1. لوحة الإدارة بدون auth guard**
- `proxy.ts` يعمل i18n فقط — لا يتحقق من الجلسة ولا من الـ role
- لا يوجد `app/[locale]/(admin)/layout.tsx` يحمي المسار
- **الحل:** أضف `layout.tsx` داخل `(admin)/` يتحقق من Supabase session + `is_admin()`

**2. RLS معطّل على 7 جداول**
الجداول التالية مكشوفة بالكامل للـ anon key — أي شخص يقدر يقرأ ويكتب:
- `products` ← الأخطر: كتالوج المنتجات كله مكشوف
- `pending_approvals` ← بيانات الموافقات حساسة
- `product_images`, `product_translations`, `price_data`, `advisory_signals`, `agent_states`

**الحل:** تفعيل RLS + إضافة policies مناسبة لكل جدول

**3. Admin API Routes بدون auth**
الملفات التالية تستخدم `ANON_KEY` مباشرة بدون التحقق من هوية المستخدم:
- `app/api/admin/products/route.ts` ← CRUD على المنتجات مفتوح
- `app/api/admin/store-config/route.ts` ← تعديل إعدادات المتجر مفتوح
- `app/api/admin/products/search/route.ts` ← بدون auth
- `lib/queries/products.ts` → `getProductsAdmin()` تستخدم `createSupabasePublicClient()` (لا session)

**الحل:** كل route داخل `api/admin/` يجب يستخدم `createSupabaseServerClient()` ويتحقق من `is_admin()` قبل أي عملية

### ⚠️ RLS Policies بها ثغرات

| الجدول | المشكلة |
|--------|---------|
| `variants` UPDATE | شرط `auth.role() = 'authenticated'` فقط — أي مستخدم مسجّل يغير الأسعار |
| `variants` INSERT | `WITH CHECK` فارغ — أي حد يضيف variants |
| `store_configuration` UPDATE | شرط `true` بدون فلتر — أي authenticated user يعدّل إعدادات المتجر |
| `categories` | توجد policy إضافية `"Public can read categories"` بـ `USING: true` تكشف الأقسام المخفية (`is_visible=false`) |
| `serial_items` | تستخدم `auth.role() = 'authenticated'` بدلاً من `is_admin()` |

### ⚠️ متغيرات بيئة غير موثّقة في `.env.example`
- `REVALIDATE_SECRET` — مستخدم في `app/api/revalidate/route.ts` ولكن غير مذكور
- مفاتيح Paymob (HMAC) — غير موثّقة
- مفاتيح Bosta — غير موثّقة
- WhatsApp Business API key — غير موثّقة

### ✅ ما هو آمن
- `categories` RLS مفعّل + `is_admin()` تعمل كـ SECURITY DEFINER ✅
- `profiles` RLS مفعّل ✅
- `product_category` RLS مفعّل ✅
- `app/api/revalidate/` محمي بـ `REVALIDATE_SECRET` header ✅
- `app/api/chat/` محمي بـ rate limit + Zod validation + budget check ✅
- `app/api/admin/categories/route.ts` يستخدم `createSupabaseServerClient()` (صح) ✅

---

## 10. Workflow
- **Always verify** — run `npm run build` or `npm run lint` after changes; don't just write code.
- **Server logs** — monitor the Next.js terminal directly; browser errors forward there in v16.2.
- **UI checks** — use `@vercel/next-browser` or Playwright MCP to inspect component trees, PPR shells, hydration diffs.
- Reference docs are not yet checked in — derive context from `lib/`, `supabase/migrations/`, and `app/[locale]/`.

---

## 11. Product Data Ingestion
Product rows are generated via **cowork** and written **straight to Supabase**.
The write contract, storefront visibility rules, and the mandatory
`POST /api/revalidate` step live in [`COWORK.md`](COWORK.md) — read it before
touching `products` / `variants` / `product_translations`.

The older n8n pipeline is retired; see the fallback note at the end of `COWORK.md`.
