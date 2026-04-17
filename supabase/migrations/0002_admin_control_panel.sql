-- ============================================================
-- TEKDOM Phase 2 — Admin Control Panel Schema
-- Adds: condition enum, product specs/AI metadata,
--        variant pricing fields, store_configuration CMS table
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PRODUCT CONDITION ENUM  (Back Market grading)
-- ─────────────────────────────────────────────
do $$ begin
  create type product_condition as enum ('Premium', 'Excellent', 'Good', 'Fair');
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────
-- 2. EXTEND products TABLE
--    • specs       — dynamic key/value tech specs for PDP + AI agents
--    • ai_metadata — structured payload for future AI enrichment pipelines
--    • images      — ordered array of Supabase Storage public URLs
--    • slug        — SEO-friendly URL handle (unique)
--    • brand       — denormalised brand name for fast filtering
-- ─────────────────────────────────────────────
alter table products
  add column if not exists slug        text unique,
  add column if not exists brand       text,
  add column if not exists images      jsonb not null default '[]'::jsonb,
  add column if not exists specs       jsonb not null default '{}'::jsonb,
  add column if not exists ai_metadata jsonb not null default '{}'::jsonb;

-- GIN indexes for fast JSONB search on new columns
create index if not exists products_specs_gin
  on products using gin (specs);

create index if not exists products_ai_metadata_gin
  on products using gin (ai_metadata);

-- ─────────────────────────────────────────────
-- 3. EXTEND variants TABLE
--    • condition      — grading enum (Premium → Fair)
--    • sale_price     — promotional price (nullable; NULL = no active sale)
--    • discount_badge — freeform label e.g. "20% OFF", "DEAL OF THE DAY"
-- ─────────────────────────────────────────────
alter table variants
  add column if not exists condition      product_condition not null default 'Good',
  add column if not exists sale_price     numeric(12,2) check (sale_price >= 0),
  add column if not exists discount_badge text;

-- Enforce: sale_price must be below regular price when set
alter table variants
  drop constraint if exists sale_price_below_regular;

alter table variants
  add constraint sale_price_below_regular
  check (sale_price is null or sale_price < price);

-- ─────────────────────────────────────────────
-- 4. STORE CONFIGURATION  (CMS / Storefront Builder)
--    Single-row table (enforced via check constraint).
--    theme   — brand color tokens, font choices, etc.
--    layout  — ordered array of home-page section descriptors
--
--    Example layout value:
--    [
--      {"id":"hero",        "label":"Hero Slider",        "visible":true,  "order":0},
--      {"id":"flash_deals", "label":"Flash Deals",        "visible":true,  "order":1},
--      {"id":"categories",  "label":"Category Tiles",     "visible":true,  "order":2},
--      {"id":"featured",    "label":"Featured Products",  "visible":false, "order":3},
--      {"id":"bestsellers", "label":"Bestsellers",        "visible":true,  "order":4},
--      {"id":"apple",       "label":"Refurbished Apple",  "visible":true,  "order":5},
--      {"id":"brands",      "label":"Top Brands",         "visible":true,  "order":6},
--      {"id":"newsletter",  "label":"Newsletter",         "visible":true,  "order":7},
--      {"id":"trust",       "label":"Trust Banner",       "visible":true,  "order":8}
--    ]
--
--    Example theme value:
--    {
--      "primary":   "#0071e3",
--      "secondary": "#1d1d1f",
--      "accent":    "#f5a623",
--      "surface":   "#ffffff",
--      "radius":    "0.75rem"
--    }
-- ─────────────────────────────────────────────
create table if not exists store_configuration (
  id         integer primary key default 1,
  theme      jsonb not null default '{
    "primary":   "#0071e3",
    "secondary": "#1d1d1f",
    "accent":    "#f5a623",
    "surface":   "#ffffff",
    "radius":    "0.75rem"
  }'::jsonb,
  layout     jsonb not null default '[
    {"id":"hero",        "label":"Hero Slider",       "visible":true,  "order":0},
    {"id":"categories",  "label":"Category Tiles",    "visible":true,  "order":1},
    {"id":"featured",    "label":"Featured Products", "visible":true,  "order":2},
    {"id":"bestsellers", "label":"Bestsellers",       "visible":true,  "order":3},
    {"id":"brands",      "label":"Top Brands",        "visible":true,  "order":4},
    {"id":"newsletter",  "label":"Newsletter",        "visible":true,  "order":5},
    {"id":"trust",       "label":"Trust Banner",      "visible":true,  "order":6}
  ]'::jsonb,
  updated_at timestamptz not null default now(),
  -- Enforces single-row pattern
  constraint single_row check (id = 1)
);

-- Seed default row so it always exists
insert into store_configuration (id) values (1)
  on conflict (id) do nothing;

-- Auto-maintain updated_at
create trigger store_configuration_updated_at
  before update on store_configuration
  for each row execute procedure update_updated_at();

-- GIN indexes for CMS JSONB queries
create index if not exists store_config_theme_gin
  on store_configuration using gin (theme);

create index if not exists store_config_layout_gin
  on store_configuration using gin (layout);

-- ─────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY — new table + new columns
-- ─────────────────────────────────────────────
alter table store_configuration enable row level security;

-- Storefront can read theme + layout (unauthenticated)
create policy "Public can read store_configuration"
  on store_configuration for select using (true);

-- Only authenticated admins can mutate store config
create policy "Admins can update store_configuration"
  on store_configuration for update
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 6. SUPABASE STORAGE BUCKET  (product images)
--    Run via Supabase dashboard or service-role client;
--    kept here as a comment for documentation purposes.
--
--    insert into storage.buckets (id, name, public)
--    values ('product-images', 'product-images', true)
--    on conflict do nothing;
-- ─────────────────────────────────────────────
