-- 0004_scope_child_tables_to_active_products.sql
-- Applied to the live database 2026-08-01.
--
-- products is gated to `is_active = true` for anon, but its three child tables
-- carried `USING (true)`. PostgREST queries children independently, so gating
-- the parent gated nothing: with the public anon key (which ships in every page)
-- an attacker could read 1 product yet 104 translations — 102 of them belonging
-- to unreleased products — plus 17 images and 2 variants. That is the entire
-- unannounced catalogue, including names, descriptions, SKUs, prices and stock.
--
-- Measured before → after:  translations 104 → 2,  images 17 → 2,  variants 2 → 1.
--
-- Each child policy now mirrors the parent. Admins are unaffected — they read
-- through the separate *_admin_all policies (is_admin()), which grant ALL. Every
-- anon reader in the app already filters is_active on products first
-- (lib/queries/products.ts, lib/ai-budget.ts, scripts/seed-meilisearch.ts), so
-- storefront results are byte-identical; verified by re-rendering the PDP.
--
-- Rollback:
--   alter policy product_translations_public_select on public.product_translations using (true);
--   alter policy product_images_public_select       on public.product_images       using (true);
--   alter policy variants_public_select             on public.variants             using (true);

alter policy product_translations_public_select
  on public.product_translations
  using (
    exists (
      select 1 from public.products p
      where p.id = product_translations.product_id
        and p.is_active
    )
  );

alter policy product_images_public_select
  on public.product_images
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.is_active
    )
  );

alter policy variants_public_select
  on public.variants
  using (
    exists (
      select 1 from public.products p
      where p.id = variants.product_id
        and p.is_active
    )
  );
