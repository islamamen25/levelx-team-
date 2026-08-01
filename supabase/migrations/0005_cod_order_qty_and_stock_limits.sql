-- 0005_cod_order_qty_and_stock_limits.sql
-- Applied to the live database 2026-08-01.
--
-- create_cod_order() is granted to anon, so it is callable directly at
-- /rest/v1/rpc/create_cod_order with the public key — bypassing the Next.js
-- route entirely. Every quantity limit lived only in that route's Zod schema
-- (qty <= 99, items <= 50), and the function itself did `greatest(1, ...)`
-- with no ceiling and never looked at stock_quantity. A direct caller could
-- order 100000 units of an item with 1 unit in stock.
--
-- The limits now live where they are authoritative. Kept identical to the
-- route's numbers so the two paths cannot disagree.
--
-- Stock is CHECKED but deliberately NOT decremented. Decrementing without a
-- restore-on-cancel path would drift stock to zero and silently stop the store
-- selling — and COD orders are cancelled often. Inventory movement is a
-- separate feature with its own admin surface; this change only stops the
-- abuse. Consequence, accepted: two concurrent orders can still each pass the
-- check and slightly oversell.
--
-- Verified against the live endpoint with the anon key:
--   qty 100000            -> "Quantity per item must be between 1 and 99"
--   qty 5, stock 1        -> "Insufficient stock for ...: 5 requested, 1 available"
--   qty -50               -> quantity range error (previously clamped to 1)
--   two lines of qty 1    -> "2 requested, 1 available"  (aggregate check)
--   51 lines              -> "Order cannot contain more than 50 lines"
--   valid qty 1, stock 1  -> succeeded
--
-- Rollback: re-apply the body from 0003_orders_cod.sql.

create or replace function public.create_cod_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_email text default null::text,
  p_postal_code text default null::text,
  p_notes text default null::text,
  p_items jsonb default '[]'::jsonb
)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_vat_rate  constant numeric := 0.14;
  v_max_qty   constant integer := 99;   -- mirrors app/api/orders/route.ts
  v_max_items constant integer := 50;   -- mirrors app/api/orders/route.ts
  v_order_id  uuid;
  v_number    text;
  v_subtotal  numeric(12,2) := 0;
  v_vat       numeric(12,2);
  v_total     numeric(12,2);
  v_item      jsonb;
  v_qty       integer;
  v_price     numeric(12,2);
  v_pid       uuid;
  v_pname     text;
  v_sku       text;
  v_want      integer;
  v_stock     integer;
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

  -- Reject out-of-range quantities outright rather than clamping them. The old
  -- greatest(1, ...) silently turned -5 into 1, which is a surprising thing for
  -- an order record to do with a number a customer supplied.
  if exists (
    select 1
      from jsonb_array_elements(p_items) e
     where coalesce((e ->> 'qty')::integer, 1) not between 1 and v_max_qty
  ) then
    raise exception 'Quantity per item must be between 1 and %', v_max_qty;
  end if;

  -- Stock is validated on the TOTAL requested per variant, not per line:
  -- two lines of the same variant each pass individually while together
  -- exceeding what exists. Runs before the order row is created, so a rejection
  -- leaves nothing behind.
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
    address, city, postal_code, notes,
    payment_method, status, subtotal, vat, total
  ) values (
    v_number, p_customer_name, nullif(btrim(coalesce(p_email,'')), ''), p_phone,
    p_address, p_city, nullif(btrim(coalesce(p_postal_code,'')), ''),
    nullif(btrim(coalesce(p_notes,'')), ''),
    'cod', 'pending', 0, 0, 0
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

  v_vat   := round(v_subtotal * v_vat_rate, 2);
  v_total := v_subtotal + v_vat;

  update public.orders
     set subtotal = v_subtotal, vat = v_vat, total = v_total
   where id = v_order_id;

  return v_number;
end;
$function$;
