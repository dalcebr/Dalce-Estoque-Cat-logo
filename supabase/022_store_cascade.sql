-- 022_store_cascade.sql
-- Garante que excluir uma loja apague TODOS os seus dados em cascata.
-- Rode no SQL Editor do Supabase, apos 021_promote_admin.sql.
--
-- Sem isso, o DELETE em `stores` falha por violacao de chave estrangeira,
-- pois as tabelas filhas referenciam stores(id) sem ON DELETE CASCADE.

-- Recria as FKs de store_id com ON DELETE CASCADE.
-- (Idempotente: remove a constraint antiga antes de recriar.)

do $$
declare
  r record;
  tables text[] := array[
    'profiles', 'sales', 'sale_items', 'sale_payments', 'categories',
    'products', 'customers', 'fiado_receipts', 'variation_groups',
    'product_variations'
  ];
begin
  for r in
    select tc.table_name, tc.constraint_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on kcu.constraint_name = tc.constraint_name
       and kcu.table_schema = tc.table_schema
     where tc.constraint_type = 'FOREIGN KEY'
       and tc.table_schema = 'public'
       and kcu.column_name = 'store_id'
       and tc.table_name = any(tables)
  loop
    execute format('alter table public.%I drop constraint %I', r.table_name, r.constraint_name);
  end loop;
end $$;

alter table profiles           add constraint profiles_store_id_fkey           foreign key (store_id) references stores(id) on delete cascade;
alter table sales              add constraint sales_store_id_fkey              foreign key (store_id) references stores(id) on delete cascade;
alter table sale_items         add constraint sale_items_store_id_fkey         foreign key (store_id) references stores(id) on delete cascade;
alter table sale_payments      add constraint sale_payments_store_id_fkey      foreign key (store_id) references stores(id) on delete cascade;
alter table categories         add constraint categories_store_id_fkey         foreign key (store_id) references stores(id) on delete cascade;
alter table products           add constraint products_store_id_fkey           foreign key (store_id) references stores(id) on delete cascade;
alter table customers          add constraint customers_store_id_fkey          foreign key (store_id) references stores(id) on delete cascade;
alter table fiado_receipts     add constraint fiado_receipts_store_id_fkey     foreign key (store_id) references stores(id) on delete cascade;
alter table variation_groups   add constraint variation_groups_store_id_fkey   foreign key (store_id) references stores(id) on delete cascade;
alter table product_variations add constraint product_variations_store_id_fkey foreign key (store_id) references stores(id) on delete cascade;

-- catalog_settings ja usa ON DELETE CASCADE na PK (store_id).
