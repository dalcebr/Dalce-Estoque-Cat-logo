-- Rode depois do 006.
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  name text not null,
  phone text,
  cpf text,
  created_at timestamptz not null default now()
);
create unique index if not exists customers_store_name_idx on customers (store_id, lower(name));
alter table customers enable row level security;
create policy "clientes da loja" on customers for all using (store_id = current_store_id()) with check (store_id = current_store_id());
-- traz para a base os clientes que já apareceram nas vendas
insert into customers (store_id, name)
select store_id, min(trim(customer_name)) from sales
where customer_name is not null and trim(customer_name) <> ''
group by store_id, lower(trim(customer_name)) on conflict do nothing;

alter table products add column if not exists image text;

create table if not exists variation_groups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  name text not null,
  options text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table variation_groups enable row level security;
create policy "variacoes da loja" on variation_groups for all using (store_id = current_store_id()) with check (store_id = current_store_id());
