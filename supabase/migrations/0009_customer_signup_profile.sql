-- 0009_customer_signup_profile.sql
--
-- Customer sign-up (AuthDrawer) needs every new auth.users row to get a
-- profiles row automatically, so `profiles.role` — not `auth.users.raw_user_meta_data`,
-- which the user can rewrite client-side via `supabase.auth.updateUser()` — stays the
-- single source of truth for RBAC everywhere ((admin)/layout.tsx, requireAdmin(),
-- is_admin()).
--
-- Before this migration there was NO trigger on auth.users at all: the one existing
-- admin got their profiles row by hand, and a second real user
-- (ahmed.amin1887@gmail.com, created 2026-07-27) has none — confirmed live via
-- `select u.id from auth.users u left join public.profiles p on p.id = u.id where p.id
-- is null`. `role` already defaults to 'user' at the column level and the check
-- constraint is `role in ('user','admin')`, so new customers land on 'user' —
-- the plan's "customer" is UI copy only, not a distinct DB value.
--
-- No new RLS policy is needed for the insert: this trigger is SECURITY DEFINER, so
-- it bypasses RLS, and profiles already has no INSERT/UPDATE policy for
-- `authenticated` (only `profiles_own_select` and the admin-only `profiles_admin_all`)
-- — meaning a signed-in user has no path to write their own role, before or after
-- this migration.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill the one live user this gap already produced.
insert into public.profiles (id, role)
select u.id, 'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
