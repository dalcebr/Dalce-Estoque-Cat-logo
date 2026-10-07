-- 010_catalog_enhancements.sql
-- Adiciona campos extras aos produtos para o catálogo premium.
-- Rode depois de 009_storage_setup.sql.

-- Descrição do produto (exibida na página de detalhe do catálogo)
alter table products add column if not exists description text;

-- Coleção (agrupamento livre, ex.: "Verão 2025", "Dia das Mães")
alter table products add column if not exists collection text;

-- Material do produto (ex.: "Prata 925", "Ouro 18k")
alter table products add column if not exists material text;

-- Ordem de destaque (produtos com destaque aparecem primeiro)
alter table products add column if not exists featured boolean not null default false;

-- Índice para filtro por coleção
create index if not exists products_store_collection_idx on products (store_id, collection) where collection is not null;

-- Atualiza o RPC público para incluir os novos campos + imagem
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
        'settings', to_jsonb(c) - 'store_id' - 'slug' - 'active' - 'updated_at',
        'categories', coalesce((
          select jsonb_agg(distinct jsonb_build_object('name', k.name, 'color', k.color))
          from products p2
          join categories k on k.id = p2.category_id
          where p2.store_id = s.id and p2.active
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
              'image', p.image,
              'available', p.stock > 0,
              'category', k.name,
              'color', k.color,
              'description', p.description,
              'collection', p.collection,
              'material', p.material,
              'featured', p.featured,
              'created_at', p.created_at
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
