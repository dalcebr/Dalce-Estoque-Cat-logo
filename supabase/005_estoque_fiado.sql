-- Rode depois do 004.
alter table products
  add column if not exists stock int not null default 0,
  add column if not exists min_stock int not null default 0;
alter table sale_items add column if not exists product_id uuid references products(id) on delete set null;

create table if not exists fiado_receipts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  customer_name text not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'dinheiro',
  created_at timestamptz not null default now()
);
alter table fiado_receipts enable row level security;
create policy "recebimentos da loja" on fiado_receipts for all using (store_id = current_store_id()) with check (store_id = current_store_id());

-- baixa de estoque ao vender (pode ficar negativo)
create or replace function apply_stock(items jsonb) returns void language sql as $$
  update products p set stock = p.stock - (t.x->>'qty')::int
  from jsonb_array_elements(items) as t(x) where p.id = (t.x->>'productId')::uuid
$$;

-- cancelar venda devolve o estoque
create or replace function cancel_sale(p_sale uuid) returns void language plpgsql as $$
begin
  if exists (select 1 from sales where id = p_sale and status = 'finalizada') then
    update products p set stock = p.stock + i.qty from sale_items i where i.sale_id = p_sale and i.product_id = p.id;
    update sales set status = 'cancelada' where id = p_sale;
  end if;
end $$;
