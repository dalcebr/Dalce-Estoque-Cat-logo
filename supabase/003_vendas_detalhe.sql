-- Rode no SQL Editor (depois do schema.sql).
alter table sales
  add column if not exists number int,
  add column if not exists status text not null default 'finalizada' check (status in ('finalizada','cancelada')),
  add column if not exists customer_name text,
  add column if not exists seller_name text,
  add column if not exists payment_method text;

create or replace function set_sale_number() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.number is null then
    select coalesce(max(number), 0) + 1 into new.number from sales where store_id = new.store_id;
  end if;
  return new;
end $$;
drop trigger if exists sales_number on sales;
create trigger sales_number before insert on sales for each row execute function set_sale_number();

with n as (select id, row_number() over (partition by store_id order by created_at) rn from sales where number is null)
update sales s set number = n.rn from n where s.id = n.id;
create unique index if not exists sales_store_number_idx on sales (store_id, number);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  store_id uuid not null references stores(id),
  name text not null,
  qty int not null default 1 check (qty > 0),
  total numeric(12,2) not null check (total >= 0)
);
alter table sale_items enable row level security;
create policy "itens da loja" on sale_items for all using (store_id = current_store_id()) with check (store_id = current_store_id());

-- Exemplo de venda para testar:
-- with v as (insert into sales (store_id, total, cost, payment_method)
--   select id, 20, 0, 'débito' from stores limit 1 returning id, store_id)
-- insert into sale_items (sale_id, store_id, name, qty, total) select id, store_id, 'Produto exemplo', 2, 20 from v;
