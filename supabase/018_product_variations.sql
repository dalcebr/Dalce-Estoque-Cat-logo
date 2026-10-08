-- 018_product_variations.sql
-- Variações aplicadas aos produtos.
--
-- • variation_groups  → catálogo de grupos reutilizáveis (ex.: "Tamanho" → P, M, G)
-- • product_variations → quais grupos/opções um produto usa, com estoque e
--                        preço próprios por opção.
--
-- Rode depois de 017_category_images.sql.

-- 1) Variações do produto
create table if not exists product_variations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  product_id uuid not null references products(id) on delete cascade,
  group_id uuid references variation_groups(id) on delete set null,
  group_name text not null,
  option text not null,
  stock int not null default 0,
  price numeric(12,2),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_variations_product_idx on product_variations (product_id, position);
create unique index if not exists product_variations_unique_idx on product_variations (product_id, group_name, option);

alter table product_variations enable row level security;
drop policy if exists "variacoes do produto da loja" on product_variations;
create policy "variacoes do produto da loja" on product_variations
  for all using (store_id = current_store_id()) with check (store_id = current_store_id());

-- 2) Quantidade de opções por grupo (contagem rápida na listagem de variações)
--    Não é uma coluna: é derivada de variation_groups.options.

-- 3) RPC público: expõe as variações de cada produto no catálogo.
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
      where c.slug = lower(p_slug) and c.active
    )
  end
$$;
grant execute on function public_catalog(text) to anon, authenticated;
