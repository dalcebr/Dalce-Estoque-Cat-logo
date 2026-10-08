-- 019_catalog_variations_fix.sql
-- Corrige o catálogo público para expor as variações de cada produto.
--
-- Sintoma: as variações aparecem no cadastro do produto, mas no catálogo
-- (vitrine) as opções não aparecem / não podem ser selecionadas.
-- Causa: a função `public_catalog` no banco ainda é a versão antiga
-- (anterior à 018), que não retorna o campo `variations`.
--
-- Esta migração recria a função com as variações. É idempotente: pode ser
-- executada mesmo que a 018 já tenha sido aplicada.
--
-- Rode depois de 018_product_variations.sql.

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
