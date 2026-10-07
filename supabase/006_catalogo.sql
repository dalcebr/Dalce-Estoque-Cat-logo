-- Rode depois do 005.
create table if not exists catalog_settings (
  store_id uuid primary key references stores(id) on delete cascade,
  active boolean not null default false,
  slug text unique check (slug ~ '^[a-z0-9-]{3,30}$'),
  logo text,
  phone text,
  email text,
  stock_mode text not null default 'all' check (stock_mode in ('all','hide','unavailable')),
  instagram text,
  facebook text,
  analytics_id text,
  highlight text,
  top_text text,
  about text,
  theme text not null default 'azul',
  updated_at timestamptz not null default now()
);
alter table catalog_settings enable row level security;
create policy "catalogo da loja" on catalog_settings for all using (store_id = current_store_id()) with check (store_id = current_store_id());

-- Vitrine pública: devolve só o necessário (sem estoque exato) e apenas se o catálogo estiver ativo.
create or replace function public_catalog(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'name', s.name,
    'settings', to_jsonb(c) - 'store_id' - 'slug' - 'active' - 'updated_at',
    'products', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'price', p.price, 'available', p.stock > 0, 'category', k.name, 'color', k.color) order by p.name)
      from products p left join categories k on k.id = p.category_id
      where p.store_id = s.id and p.active and (c.stock_mode <> 'hide' or p.stock > 0)
    ), '[]'::jsonb))
  from catalog_settings c join stores s on s.id = c.store_id
  where c.slug = lower(p_slug) and c.active
$$;
grant execute on function public_catalog(text) to anon, authenticated;
