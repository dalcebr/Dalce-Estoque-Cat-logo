-- Rode no SQL Editor do Supabase.
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_goal numeric(12,2),
  created_at timestamptz not null default now()
);
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references stores(id),
  name text not null
);
create table sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  total numeric(12,2) not null check (total >= 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  created_at timestamptz not null default now()
);
create index sales_store_date_idx on sales (store_id, created_at);

create or replace function current_store_id() returns uuid
language sql stable security definer set search_path = public as
$$ select store_id from profiles where id = auth.uid() $$;

alter table stores enable row level security;
alter table profiles enable row level security;
alter table sales enable row level security;

create policy "perfil próprio" on profiles for select using (id = auth.uid());
create policy "loja própria (ler)" on stores for select using (id = current_store_id());
create policy "loja própria (editar)" on stores for update using (id = current_store_id()) with check (id = current_store_id());
create policy "vendas da loja" on sales for all using (store_id = current_store_id()) with check (store_id = current_store_id());
