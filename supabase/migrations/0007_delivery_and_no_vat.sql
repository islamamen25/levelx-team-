-- 0007_delivery_and_no_vat.sql
--
-- Two checkout changes, applied together because they both live in
-- create_cod_order() and in the app:
--
--  1. VAT is no longer a computed line. The store owner is folding 14% into the
--     product prices themselves, so v_vat is now a flat 0. The `orders.vat`
--     column stays (older orders keep their real figure; new ones store 0).
--
--  2. Delivery fees become configurable. A new `store_configuration.delivery`
--     jsonb row holds the rule; `orders` gains `shipping` and `governorate`.
--     create_cod_order() recomputes the fee server-side from that row — the
--     client sends only the governorate, never a price, exactly like item prices.
--
-- ── ROLLOUT (zero-downtime) ──────────────────────────────────────────────────
-- This migration ADDS a 9-parameter create_cod_order() overload (… + p_governorate)
-- and leaves the existing 8-parameter one in place, so the currently-deployed code
-- keeps working until the new code ships. After deploy, migration 0008 drops the
-- old overload.
--
-- `orders` has 0 rows at time of writing; if you would rather skip the two-step
-- dance, add `drop function if exists create_cod_order(text,text,text,text,text,
-- text,text,jsonb);` below and deploy the app immediately after.
--
-- Rollback: drop the 9-param function; the 8-param one still charges VAT and no
-- shipping. `alter table orders drop column shipping, drop column governorate;`
-- and `alter table store_configuration drop column delivery;` if fully reverting.

-- ─────────────────────────────────────────────
-- 1. SCHEMA
-- ─────────────────────────────────────────────
alter table store_configuration
  add column if not exists delivery jsonb not null
  default '{"mode":"free","fee":0,"free_over":0,"governorates":[]}'::jsonb;

alter table orders
  add column if not exists shipping numeric(12,2) not null default 0 check (shipping >= 0);

alter table orders
  add column if not exists governorate text;

-- ─────────────────────────────────────────────
-- 2. create_cod_order() — 9-param overload
--    Adds p_governorate; drops VAT; computes shipping from store_configuration.
-- ─────────────────────────────────────────────
create or replace function public.create_cod_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_email text default null::text,
  p_postal_code text default null::text,
  p_notes text default null::text,
  p_items jsonb default '[]'::jsonb,
  p_governorate text default null::text
)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_max_qty   constant integer := 99;   -- mirrors app/api/orders/route.ts
  v_max_items constant integer := 50;   -- mirrors app/api/orders/route.ts
  v_order_id  uuid;
  v_number    text;
  v_subtotal  numeric(12,2) := 0;
  v_vat       numeric(12,2) := 0;        -- VAT is folded into product prices now
  v_shipping  numeric(12,2) := 0;
  v_total     numeric(12,2);
  v_item      jsonb;
  v_qty       integer;
  v_price     numeric(12,2);
  v_pid       uuid;
  v_pname     text;
  v_sku       text;
  v_want      integer;
  v_stock     integer;
  v_delivery  jsonb;
  v_mode      text;
  v_free_over numeric;
  v_gov_fee   numeric;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if jsonb_array_length(p_items) > v_max_items then
    raise exception 'Order cannot contain more than % lines', v_max_items;
  end if;

  if btrim(coalesce(p_customer_name, '')) = ''
     or btrim(coalesce(p_phone,   '')) = ''
     or btrim(coalesce(p_address, '')) = ''
     or btrim(coalesce(p_city,    '')) = '' then
    raise exception 'Missing required customer details';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_items) e
     where coalesce((e ->> 'qty')::integer, 1) not between 1 and v_max_qty
  ) then
    raise exception 'Quantity per item must be between 1 and %', v_max_qty;
  end if;

  -- Stock check on the TOTAL requested per variant (two lines of one variant can
  -- each pass individually while together exceeding stock). Before any insert.
  select v.sku_code, agg.want, v.stock_quantity
    into v_sku, v_want, v_stock
    from (
      select (e ->> 'variant_id')::uuid            as vid,
             sum(coalesce((e ->> 'qty')::integer, 1)) as want
        from jsonb_array_elements(p_items) e
       group by 1
    ) agg
    join public.variants v on v.id = agg.vid
   where v.stock_quantity < agg.want
   limit 1;

  if found then
    raise exception 'Insufficient stock for %: % requested, % available',
      v_sku, v_want, v_stock;
  end if;

  v_number := 'LX-' || to_char(now(), 'YYMMDD') || '-'
              || lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_number, customer_name, email, phone,
    address, city, postal_code, notes, governorate,
    payment_method, status, subtotal, vat, shipping, total
  ) values (
    v_number, p_customer_name, nullif(btrim(coalesce(p_email,'')), ''), p_phone,
    p_address, p_city, nullif(btrim(coalesce(p_postal_code,'')), ''),
    nullif(btrim(coalesce(p_notes,'')), ''),
    nullif(btrim(coalesce(p_governorate,'')), ''),
    'cod', 'pending', 0, 0, 0, 0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item ->> 'qty')::integer, 1);

    select v.product_id,
           coalesce(v.sale_price, v.price),
           v.sku_code,
           p.name
      into v_pid, v_price, v_sku, v_pname
      from public.variants v
      join public.products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid
       and p.is_active;

    if not found then
      raise exception 'Variant % is unavailable', v_item ->> 'variant_id';
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku_code, price, qty
    ) values (
      v_order_id, v_pid, (v_item ->> 'variant_id')::uuid, v_pname, v_sku, v_price, v_qty
    );

    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  -- ── Delivery fee — authoritative, from the store's own settings ──
  --   free               -> 0
  --   threshold, over X   -> 0   (the free line beats any per-governorate price)
  --   otherwise           -> the governorate's own fee if listed, else the base fee
  select delivery into v_delivery from public.store_configuration where id = 1;
  v_mode := coalesce(v_delivery ->> 'mode', 'free');

  if v_mode = 'free' then
    v_shipping := 0;
  else
    v_free_over := coalesce((v_delivery ->> 'free_over')::numeric, 0);
    if v_mode = 'threshold' and v_free_over > 0 and v_subtotal >= v_free_over then
      v_shipping := 0;
    else
      select (g ->> 'fee')::numeric
        into v_gov_fee
        from jsonb_array_elements(coalesce(v_delivery -> 'governorates', '[]'::jsonb)) g
       where g ->> 'name' = p_governorate
       limit 1;
      v_shipping := greatest(0, coalesce(v_gov_fee, (v_delivery ->> 'fee')::numeric, 0));
    end if;
  end if;

  v_total := v_subtotal + v_vat + v_shipping;

  update public.orders
     set subtotal = v_subtotal, vat = v_vat, shipping = v_shipping, total = v_total
   where id = v_order_id;

  return v_number;
end;
$function$;

grant execute on function public.create_cod_order(
  text, text, text, text, text, text, text, jsonb, text
) to anon, authenticated;
