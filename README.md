# LevelX (tekdom)

Premium electronics & home-appliances e-commerce for the Egyptian market. Bilingual
storefront (ar/en) with an admin dashboard, AI-assisted search, and cash-on-delivery
checkout.

**Live:** https://levelx-team.vercel.app

> ⚠️ **Two codebases share this disk.** An older Next.js 14 prototype with **no
> `package.json`** that cannot run was moved to `D:\level X\_archive\` on 2026-08-03.
> All real work happens in `tekdom/` — this directory. If a file path outside `tekdom/`
> looks relevant, it is almost certainly the dormant prototype.

## Stack

Next.js **16.2** (App Router, PPR via `cacheComponents`) · React 19.2 · TypeScript ·
Tailwind **v4** (no config file — `@theme` in `app/globals.css`) · shadcn/ui ·
Supabase (Postgres + RLS) · next-intl · Zustand · Vercel AI SDK 6 + Meilisearch ·
deployed on **Vercel** (auto-deploys from `master`).

## Commands

```bash
npm run dev     # local dev server
npm run build   # production build — also the main correctness check
npm run lint    # ESLint (baseline: 15 problems, all pre-existing)
```

There is no test runner. Verification is `build` + `lint` + manual browser checks.

## Which doc do I read?

| I want to… | Read |
|---|---|
| Know the rules before writing code | [`CLAUDE.md`](CLAUDE.md) — conventions, Next 16.2 / Tailwind v4 constraints, **route + module + DB maps** |
| Know what's built and what's broken right now | [`CONTEXT.md`](CONTEXT.md) — current state, decisions, known issues |
| Write products/variants/translations to the DB | [`COWORK.md`](COWORK.md) — the write contract. **Read this before any DB write.** |
| Add a product by hand (non-technical) | [`ADD-PRODUCT-STEPS.md`](ADD-PRODUCT-STEPS.md) |
| Prepare product images | [`IMAGE-GUIDE.md`](IMAGE-GUIDE.md) — 1500×1500, <500 KB |
| Run the admin dashboard (first time) | `LevelX-Admin-Guide-Simple.docx` — beginner walkthrough |
| Run the admin dashboard (reference) | `LevelX-Admin-Guide.docx` — full field-by-field guide |
| See past design audits, or the retired n8n pipeline | [`docs/archive/`](docs/archive/) |

## Two things that will bite you

1. **Direct DB writes do not invalidate the Next.js cache.** After writing product data you
   must `POST /api/revalidate` or the storefront serves stale content for up to an hour.
   See `COWORK.md`.
2. **A product with no row in `variants` is invisible** in every listing and category page,
   even though its own URL works. This is the most common "I uploaded it but can't find it".

## Supabase

Project `xeylyyfmcucphggqwxdv` (eu-west-1). **Free tier — it auto-pauses after ~7 days
idle**, which breaks `npm run build` with `fetch failed`. Restore it from the Supabase
dashboard and wait for `ACTIVE_HEALTHY`.
