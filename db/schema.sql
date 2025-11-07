create extension if not exists pgcrypto;

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  frontier text,
  hash text unique not null,
  summary text,
  visible boolean default false,
  created_at timestamptz default now()
);

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null,
  profile text
);

create table if not exists entity_receipt (
  entity_id uuid references entities(id) on delete cascade,
  receipt_id uuid references receipts(id) on delete cascade,
  role text,
  primary key (entity_id, receipt_id)
);

alter table receipts enable row level security;
create policy receipts_read on receipts for select using (true);

alter table entities enable row level security;
create policy entities_read on entities for select using (true);

alter table entity_receipt enable row level security;
create policy entity_receipt_read on entity_receipt for select using (true);

create index if not exists idx_receipts_pub on receipts(published_at desc);
create index if not exists idx_receipts_frontier on receipts(frontier);
create index if not exists idx_entity_slug on entities(slug);
