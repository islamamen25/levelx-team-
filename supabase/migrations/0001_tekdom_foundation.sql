-- ============================================================
-- TEKDOM Phase 1 — SKU-First Foundation Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. CATEGORIES (lightweight, tree-capable)
-- ─────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references categories(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. PRODUCTS  (master catalogue record)
-- ─────────────────────────────────────────────
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  category_id   uuid references categories(id) on delete set null,
  is_serialized boolean not null default false,  -- true = high-value, tracks serial numbers
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. VARIANTS  (SKU-first — one row per SKU)
--    JSONB `attributes` drives faceted search
--    e.g. {"color":"black","storage":"512GB","ram":"16GB"}
-- ─────────────────────────────────────────────
create table if not exists variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  sku_code       text not null unique,
  price          numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  attributes     jsonb not null default '{}'::jsonb,  -- faceted search payload
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- GIN index for fast JSONB faceted search
create index if not exists variants_attributes_gin
  on variants using gin (attributes);

-- ─────────────────────────────────────────────
-- 4. SERIAL ITEMS  (individual unit tracking)
--    Only used when products.is_serialized = true
-- ─────────────────────────────────────────────
create table if not exists serial_items (
  id               uuid primary key default gen_random_uuid(),
  variant_id       uuid not null references variants(id) on delete cascade,
  serial_number    text not null unique,
  warranty_status  text not null default 'active'
                     check (warranty_status in ('active','expired','voided','claimed')),
  sold_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 5. UPDATED_AT TRIGGER  (auto-maintain)
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute procedure update_updated_at();

create trigger variants_updated_at
  before update on variants
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
alter table categories   enable row level security;
alter table products     enable row level security;
alter table variants     enable row level security;
alter table serial_items enable row level security;

-- PUBLIC read access (storefront — unauthenticated visitors can browse)
create policy "Public can read categories"
  on categories for select using (true);

create policy "Public can read products"
  on products for select using (true);

create policy "Public can read variants"
  on variants for select using (true);

-- Serial items: authenticated users only (internal staff / warranty lookup)
create policy "Authenticated users can read serial_items"
  on serial_items for select
  using (auth.role() = 'authenticated');

-- Admin write access (service role bypasses RLS, but explicit policies for anon safety)
create policy "Admins can insert products"
  on products for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update products"
  on products for update
  using (auth.role() = 'authenticated');

create policy "Admins can insert variants"
  on variants for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update variants"
  on variants for update
  using (auth.role() = 'authenticated');

create policy "Admins can manage serial_items"
  on serial_items for all
  using (auth.role() = 'authenticated');
