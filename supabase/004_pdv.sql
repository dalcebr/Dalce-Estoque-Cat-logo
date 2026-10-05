-- Rode depois do 003.
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  name text not null,
  color text not null default '#0f8b83',
  unique (store_id, name)
);
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  store_id uuid not null references stores(id),
  method text not null,
  amount numeric(12,2) not null check (amount > 0)
);
alter table sales add column if not exists note text;

alter table categories enable row level security;
alter table products enable row level security;
alter table sale_payments enable row level security;
create policy "categorias da loja" on categories for all using (store_id = current_store_id()) with check (store_id = current_store_id());
create policy "produtos da loja" on products for all using (store_id = current_store_id()) with check (store_id = current_store_id());
create policy "pagamentos da loja" on sale_payments for all using (store_id = current_store_id()) with check (store_id = current_store_id());
