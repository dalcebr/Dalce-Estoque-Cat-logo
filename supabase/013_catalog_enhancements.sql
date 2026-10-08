-- 013_catalog_enhancements.sql
-- Ajustes na aba Catálogo:
--   • remove o subtítulo do banner (agora só título + descrição)
--   • amplia a lista de fontes disponíveis
-- Rode depois de 012_catalog_simplify.sql.

-- Remove o subtítulo do banner (não é mais usado).
alter table catalog_settings drop column if exists hero_subtitle;

-- Remove a constraint que referenciava a coluna `logo` (removida na 012).
alter table catalog_settings drop constraint if exists catalog_logo_size;

-- Atualiza o default de fontes com a lista ampliada (mantém os valores já salvos).
alter table catalog_settings alter column fonts set default '{
  "font_1":"inter",
  "font_2":"playfair",
  "store_name_font":1,
  "heading_font":2,
  "card_font":1,
  "body_font":1
}'::jsonb;

-- Recria o RPC público (o subtítulo sai do payload).
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
