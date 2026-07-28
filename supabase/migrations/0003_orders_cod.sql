-- ============================================================
-- LevelX Phase 3 — Orders (Cash on Delivery)
-- Adds: order_status + payment_method enums, orders, order_items,
--        create_cod_order() RPC, RLS
--
-- Context: checkout previously persisted nothing — the submit handler
-- cleared the cart and showed a success screen. This makes orders real,
-- with COD as the only payment method until Paymob is integrated.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────
do $$ begin
  create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  -- 'paymob' reserved now so adding it later needs no enum migration
  create type payment_method as enum ('cod', 'paymob');
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────
-- 2. ORDER NUMBER SEQUENCE
--    Human-quotable reference (LX-260728-0001) — customers read this
--    over the phone, so it must not be a UUID.
-- ─────────────────────────────────────────────
create sequence if not exists order_number_seq start 1000;

-- ─────────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────────
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text unique not null,

  customer_name  text not null,
  email          text,
  phone          text not null,          -- the contact channel that matters for COD
  address        text not null,
  city           text not null,
  postal_code    text,
  notes          text,

  payment_method payment_method not null default 'cod',
  status         order_status   not null default 'pending',

  -- Money is computed server-side in create_cod_order(); these are the
  -- authoritative stored figures, not what the browser claimed.
  subtotal       numeric(12,2) not null check (subtotal >= 0),
  vat            numeric(12,2) not null check (vat      >= 0),
  total          numeric(12,2) not null check (total    >= 0),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx     on orders (status);
create index if not exists orders_phone_idx      on orders (phone);

-- ─────────────────────────────────────────────
-- 4. ORDER ITEMS
--    product_name/price/qty are DENORMALIZED on purpose: an order is a
--    historical record. If a product is renamed, repriced or deleted a
--    year from now, this row must still say what was actually sold and
--    for how much. FKs are ON DELETE SET NULL for the same reason —
--    deleting a product must not delete sales history.
-- ─────────────────────────────────────────────
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders (id) on delete cascade,
  product_id   uuid references products (id) on delete set null,
  variant_id   uuid references variants (id) on delete set null,

  product_name text          not null,
  sku_code     text,
  price        numeric(12,2) not null check (price >= 0),
  qty          integer       not null check (qty > 0),

  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items (order_id);

-- Keep updated_at fresh on status changes (function added in 0001)
drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
-- 5. create_cod_order() — the ONLY way to place an order
--
--    SECURITY DEFINER, for two reasons that both matter:
--
--    (a) Atomicity. An order and its items must be written in one
--        transaction. Two separate client inserts can fail between the
--        first and second, leaving an order with no items.
--
--    (b) Price integrity. The client sends variant_id + qty ONLY.
--        Prices, VAT and total are looked up and computed here from the
--        variants table. A tampered browser payload cannot set its own
--        price — which it could if the client inserted rows directly.
--
--    This also means `orders` needs no SELECT policy for anon at all
--    (see §6), because nothing is ever read back to the customer except
--    the order_number this function returns.
-- ─────────────────────────────────────────────
create or replace function create_cod_order(
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_city          text,
  p_email         text default null,
  p_postal_code   text default null,
  p_notes         text default null,
  p_items         jsonb default '[]'::jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vat_rate  constant numeric := 0.14;   -- Egypt standard VAT
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
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if btrim(coalesce(p_customer_name, '')) = ''
     or btrim(coalesce(p_phone,   '')) = ''
     or btrim(coalesce(p_address, '')) = ''
     or btrim(coalesce(p_city,    '')) = '' then
    raise exception 'Missing required customer details';
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
    v_qty := greatest(1, coalesce((v_item ->> 'qty')::integer, 1));

    -- Authoritative price straight from the DB; sale_price wins when set.
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
$$;

-- Guests must be able to place orders; that is the whole point.
grant execute on function create_cod_order(text, text, text, text, text, text, text, jsonb)
  to anon, authenticated;

-- ─────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
--    No SELECT policy for anon on either table — a customer must never
--    be able to enumerate other people's orders, names, phones or
--    addresses. Writes happen only through the SECURITY DEFINER function
--    above, so no INSERT policy is needed for anon either.
-- ─────────────────────────────────────────────
alter table orders      enable row level security;
alter table order_items enable row level security;

drop policy if exists orders_admin_all on orders;
create policy orders_admin_all
  on orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists order_items_admin_all on order_items;
create policy order_items_admin_all
  on order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
