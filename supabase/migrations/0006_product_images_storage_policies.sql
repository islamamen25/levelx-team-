-- 0006 — Product image uploads from the admin dashboard.
--
-- Applied live 2026-08-04. Recorded here for the history; note the standing
-- warning in CLAUDE.md §4 that this directory has drifted and can no longer
-- rebuild the live schema on its own.
--
-- Problem: `storage.objects` has RLS enabled by default and had **zero policies**,
-- so every browser-side upload was denied — the admin's included. The only path
-- that worked was the cowork script (levelx-images.py), which authenticates with
-- the service_role key. service_role has rolbypassrls, so these policies do not
-- touch it: the script keeps working exactly as before.
--
-- Public *reads* are deliberately not granted. `product-images` is a public
-- bucket, and public buckets serve /object/public/... without evaluating SELECT
-- policies — which is why the storefront already displayed images with no
-- policies at all. The SELECT policy below is admin-only, so admins can
-- list/enumerate the bucket without publishing a file index to anon.
--
-- Verified after applying, with request.jwt.claims set per case:
--   admin                     → INSERT accepted
--   authenticated non-admin   → 42501 row-level security violation
--   anon                      → 42501 row-level security violation
--   public read, no auth      → HTTP 200

create policy "product_images_admin_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Backstop only. The form downscales to <500 KB WebP before sending and
-- app/api/admin/upload/route.ts re-checks type and size, so nothing legitimate
-- comes close to 5 MB. `allowed_mime_types` is left null on purpose: constraining
-- it here would add a second, more confusing way for levelx-images.py to fail.
update storage.buckets set file_size_limit = 5242880 where id = 'product-images';
