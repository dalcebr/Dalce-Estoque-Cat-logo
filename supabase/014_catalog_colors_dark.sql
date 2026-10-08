-- 014_catalog_colors_dark.sql
-- Personalização de cores separada por tema (claro e escuro).
--   • adiciona a coluna `colors_dark` (tema escuro)
--   • o RPC público passa a devolver `colors_dark`
-- Rode depois de 013_catalog_enhancements.sql.

-- Coluna de cores do tema escuro (mesma estrutura de `colors`).
alter table catalog_settings
  add column if not exists colors_dark jsonb not null default '{}'::jsonb;

-- Recria o RPC público incluindo colors_dark no payload.
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
