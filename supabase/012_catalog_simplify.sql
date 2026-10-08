-- 012_catalog_simplify.sql
-- Reorganiza a aba Catálogo: apenas os campos essenciais + cores e fontes.
-- Rode depois de 011_catalog_customization.sql.

-- Nome da loja exibido no catálogo (independente do nome interno da loja)
alter table catalog_settings add column if not exists store_name text;

-- Cores personalizáveis de cada elemento (JSONB)
alter table catalog_settings add column if not exists colors jsonb not null default '{
  "page_bg":"#FFFFFF",
  "card_bg":"#F7F7F7",
  "card_text":"#111111",
  "store_name":"#111111",
  "heading":"#111111",
  "body_text":"#444444",
  "button_bg":"#C9852B",
  "button_text":"#FFFFFF",
  "header_bg":"#FFFFFF",
  "footer_bg":"#F7F7F7"
}'::jsonb;

-- Fontes: duas fontes + onde cada uma é usada (JSONB)
alter table catalog_settings add column if not exists fonts jsonb not null default '{
  "font_1":"inter",
  "font_2":"playfair",
  "store_name_font":1,
  "heading_font":2,
  "card_font":1,
  "body_font":1
}'::jsonb;

-- Remove colunas que não fazem mais parte da aba Catálogo.
-- (Comente as linhas abaixo se preferir manter os dados antigos.)
alter table catalog_settings drop column if exists logo;
alter table catalog_settings drop column if exists facebook;
alter table catalog_settings drop column if exists analytics_id;
alter table catalog_settings drop column if exists highlight;
alter table catalog_settings drop column if exists top_text;
alter table catalog_settings drop column if exists about;
alter table catalog_settings drop column if exists theme;
alter table catalog_settings drop column if exists primary_color;
alter table catalog_settings drop column if exists font_family;
alter table catalog_settings drop column if exists footer_text;

-- Recria o RPC público com os campos atuais.
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
