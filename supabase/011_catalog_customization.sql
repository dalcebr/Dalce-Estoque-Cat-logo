-- 011_catalog_customization.sql
-- Adds full visual customization fields to catalog_settings.
-- Run after 010_catalog_enhancements.sql.

-- Primary accent color (hex, e.g. #C9852B)
alter table catalog_settings add column if not exists primary_color text not null default '#C9852B';

-- Font family preference
alter table catalog_settings add column if not exists font_family text not null default 'Inter';

-- Hero banner
alter table catalog_settings add column if not exists hero_title text;
alter table catalog_settings add column if not exists hero_subtitle text;
alter table catalog_settings add column if not exists hero_description text;
alter table catalog_settings add column if not exists hero_image text;           -- storage path or URL
alter table catalog_settings add column if not exists hero_button_text text not null default 'VER PRODUTOS';

-- Benefits section (up to 3 benefits, stored as JSONB array)
-- Each: { "icon": "truck|shield|headphones|star|check|clock|heart|gift", "title": "...", "description": "..." }
alter table catalog_settings add column if not exists benefits jsonb not null default '[
  {"icon":"headphones","title":"Atendimento 24h","description":"De qualidade"},
  {"icon":"truck","title":"Envio rápido","description":"Para todo brasil"}
]'::jsonb;

-- Dark mode enabled
alter table catalog_settings add column if not exists dark_mode_enabled boolean not null default true;

-- Custom footer text
alter table catalog_settings add column if not exists footer_text text;

-- WhatsApp message template
alter table catalog_settings add column if not exists whatsapp_message text not null default 'Olá! Gostaria de fazer um pedido:';

-- Now update the RPC to include all new fields (they come automatically via to_jsonb(c))
-- We just need to re-create the function from 010 with the same logic
-- (to_jsonb(c) already includes all columns minus the excluded ones)

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
