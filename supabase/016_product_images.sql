-- 016_product_images.sql
-- Galeria de fotos dos produtos (até 5 por produto).
--
-- • products.images  → array de caminhos no bucket "product-images"
--                      (ex.: "{storeId}/{uuid}.webp")
-- • products.image   → mantido como a FOTO PRINCIPAL (capa) para
--                      compatibilidade com o restante do sistema.
--
-- A primeira posição do array é a capa por padrão, mas o usuário pode
-- escolher qualquer foto como capa (ela é movida para a posição 0).
--
-- Rode depois de 015_catalog_sort_categories.sql.

-- 1) Coluna da galeria
alter table products add column if not exists images text[] not null default '{}';

-- 2) Migra a imagem única existente para a galeria (quando ainda vazia)
update products
set images = array[image]
where image is not null
  and (images is null or cardinality(images) = 0);

-- 3) Garante que a capa (image) seja a primeira foto da galeria
update products
set image = images[1]
where cardinality(images) > 0
  and (image is null or image <> images[1]);

-- 4) Índice GIN para consultas por imagem (opcional, ajuda em buscas)
create index if not exists products_images_idx on products using gin (images);

-- 5) Atualiza o RPC público para expor a galeria completa.
--    `image` continua sendo a capa; `images` traz todas as fotos.
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
              coalesce(p2.images[1], p2.image) as image
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
