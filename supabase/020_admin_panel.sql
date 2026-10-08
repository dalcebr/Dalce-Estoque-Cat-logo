-- 020_admin_panel.sql
-- Painel de administrador: criacao de acessos (lojas), congelamento,
-- exclusao total e exportacao/importacao de dados.
-- Rode no SQL Editor do Supabase, apos 019_catalog_variations_fix.sql.

-- ============================================================
-- 1. Colunas de controle
-- ============================================================

-- Papel do usuario: 'owner' (dono da loja) ou 'admin' (administrador do sistema).
alter table profiles add column if not exists role text not null default 'owner';
alter table profiles add column if not exists username text;
alter table profiles add column if not exists created_at timestamptz not null default now();

-- Congelamento da loja: quando true, nenhum usuario da loja consegue acessar.
alter table stores add column if not exists frozen boolean not null default false;
alter table stores add column if not exists frozen_at timestamptz;
alter table stores add column if not exists frozen_reason text;
alter table stores add column if not exists owner_username text;

-- Constraint de papel (idempotente).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table profiles add constraint profiles_role_check check (role in ('owner', 'admin'));
  end if;
end $$;

-- Username unico (case-insensitive) quando informado.
create unique index if not exists profiles_username_idx on profiles (lower(username)) where username is not null;

-- ============================================================
-- 2. Funcoes auxiliares de autorizacao
-- ============================================================

-- Retorna true se o usuario autenticado e administrador do sistema.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role = 'admin' from profiles where id = auth.uid()), false) $$;

-- Retorna true se a loja do usuario autenticado esta congelada.
create or replace function current_store_frozen() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select s.frozen from stores s where s.id = current_store_id()), false) $$;

-- ============================================================
-- 3. RLS: admin pode ler/escrever tudo
-- ============================================================

-- stores: admin le e edita qualquer loja.
drop policy if exists "admin gerencia lojas" on stores;
create policy "admin gerencia lojas" on stores
  for all using (is_admin()) with check (is_admin());

-- profiles: admin le e edita qualquer perfil.
drop policy if exists "admin gerencia perfis" on profiles;
create policy "admin gerencia perfis" on profiles
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- 4. Bloqueio de acesso para lojas congeladas
--    As policies de dados passam a exigir que a loja nao esteja
--    congelada. Como todas as tabelas usam current_store_id(),
--    recriamos as policies com o guard adicional.
-- ============================================================

-- Helper: loja do usuario esta ativa (nao congelada)?
create or replace function store_active() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select not s.frozen from stores s where s.id = current_store_id()), false) $$;

-- Recria as policies de dados adicionando o guard store_active().
-- (Mantem o mesmo nome das policies originais para nao quebrar nada.)
drop policy if exists "vendas da loja" on sales;
create policy "vendas da loja" on sales for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "itens da loja" on sale_items;
create policy "itens da loja" on sale_items for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "pagamentos da loja" on sale_payments;
create policy "pagamentos da loja" on sale_payments for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "categorias da loja" on categories;
create policy "categorias da loja" on categories for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "produtos da loja" on products;
create policy "produtos da loja" on products for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "clientes da loja" on customers;
create policy "clientes da loja" on customers for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "recebimentos da loja" on fiado_receipts;
create policy "recebimentos da loja" on fiado_receipts for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "catalogo da loja" on catalog_settings;
create policy "catalogo da loja" on catalog_settings for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "variacoes da loja" on variation_groups;
create policy "variacoes da loja" on variation_groups for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

drop policy if exists "variacoes do produto da loja" on product_variations;
create policy "variacoes do produto da loja" on product_variations for all
  using (store_id = current_store_id() and store_active())
  with check (store_id = current_store_id() and store_active());

-- ============================================================
-- 5. Catalogo publico: nao exibe lojas congeladas
--    Mantem a versao completa (com categorias, colecoes e variacoes)
--    definida em 019_catalog_variations_fix.sql, apenas adicionando
--    o filtro `not s.frozen`.
-- ============================================================
create or replace function public_catalog(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_slug is null or length(p_slug) < 3 or length(p_slug) > 30 then null
    else (
      select jsonb_build_object(
        'name', s.name,
        'settings', to_jsonb(c) - 'store_id' - 'slug' - 'active' - 'updated_at' - 'hero_subtitle',
        'categories', coalesce((
          select jsonb_agg(jsonb_build_object('name', t.name, 'color', t.color, 'image', t.image) order by t.name)
          from (
            select distinct on (k.id)
              k.name,
              k.color,
              coalesce(k.image, p2.images[1], p2.image) as image
            from products p2
            join categories k on k.id = p2.category_id
            where p2.store_id = s.id and p2.active
            order by k.id, p2.created_at desc nulls last
          ) t
        ), '[]'::jsonb),
        'collections', coalesce((
          select jsonb_agg(distinct p3.collection)
          from products p3
          where p3.store_id = s.id and p3.active and p3.collection is not null
        ), '[]'::jsonb),
        'products', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'price', p.price,
              'image', coalesce(p.images[1], p.image),
              'images', to_jsonb(p.images),
              'available', p.stock > 0,
              'category', k.name,
              'color', k.color,
              'description', p.description,
              'collection', p.collection,
              'material', p.material,
              'featured', p.featured,
              'created_at', p.created_at,
              'variations', coalesce((
                select jsonb_agg(
                  jsonb_build_object(
                    'group', v.group_name,
                    'option', v.option,
                    'stock', v.stock,
                    'price', v.price
                  ) order by v.position, v.option
                )
                from product_variations v
                where v.product_id = p.id
              ), '[]'::jsonb),
              'sold_count', coalesce((
                select sum(si.qty)
                from sale_items si
                join sales sa on sa.id = si.sale_id
                where si.product_id = p.id and sa.store_id = s.id and sa.status = 'finalizada'
              ), 0)
            ) order by p.featured desc, p.name
          )
          from products p
          left join categories k on k.id = p.category_id
          where p.store_id = s.id
            and p.active
            and (c.stock_mode <> 'hide' or p.stock > 0)
        ), '[]'::jsonb)
      )
      from catalog_settings c
      join stores s on s.id = c.store_id
      where c.slug = lower(p_slug) and c.active and not s.frozen
    )
  end
$$;
grant execute on function public_catalog(text) to anon, authenticated;

-- ============================================================
-- 6. Indices de apoio
-- ============================================================
create index if not exists profiles_store_idx on profiles (store_id);
create index if not exists stores_frozen_idx on stores (frozen) where frozen;
