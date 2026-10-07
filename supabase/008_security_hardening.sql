-- 008_security_hardening.sql
-- CRITICAL: Fixes RLS bypass vulnerabilities in database functions.
-- Run after 007_cadastros.sql.

-- ============================================================
-- 1. apply_stock: MUST verify store_id ownership
--    OLD: plain SQL function that updates by product ID without
--         checking if the caller owns those products.
--    FIX: rewrite as plpgsql with explicit store_id check.
-- ============================================================
create or replace function apply_stock(items jsonb)
returns void
language plpgsql
security invoker          -- runs as calling user (RLS applies)
set search_path = public
as $$
declare
  _store uuid := current_store_id();
  _item  jsonb;
  _pid   uuid;
  _qty   int;
begin
  if _store is null then
    raise exception 'not authenticated';
  end if;

  for _item in select * from jsonb_array_elements(items)
  loop
    _pid := (_item->>'productId')::uuid;
    _qty := (_item->>'qty')::int;

    if _pid is null or _qty is null or _qty <= 0 then
      raise exception 'invalid item: productId and qty > 0 required';
    end if;

    -- Only update products belonging to the caller's store
    update products
       set stock = stock - _qty
     where id = _pid
       and store_id = _store;

    if not found then
      raise exception 'product % not found in your store', _pid;
    end if;
  end loop;
end
$$;

-- ============================================================
-- 2. cancel_sale: MUST verify store_id ownership
--    OLD: checks status but not store ownership.
--    FIX: add store_id = current_store_id() guard.
-- ============================================================
create or replace function cancel_sale(p_sale uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  _store uuid := current_store_id();
begin
  if _store is null then
    raise exception 'not authenticated';
  end if;

  -- Only cancel sales belonging to the caller's store
  if exists (
    select 1 from sales
     where id = p_sale
       and store_id = _store
       and status = 'finalizada'
  ) then
    -- Restore stock for items with linked products (same store check)
    update products p
       set stock = p.stock + i.qty
      from sale_items i
     where i.sale_id = p_sale
       and i.product_id = p.id
       and p.store_id = _store;

    update sales
       set status = 'cancelada'
     where id = p_sale
       and store_id = _store;
  end if;
end
$$;

-- ============================================================
-- 3. set_sale_number trigger: already security definer (needed
--    for trigger context), but add explicit store_id safety.
-- ============================================================
create or replace function set_sale_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.number is null then
    select coalesce(max(number), 0) + 1
      into new.number
      from sales
     where store_id = new.store_id;
  end if;
  return new;
end
$$;

-- ============================================================
-- 4. public_catalog: already security definer (intentional for
--    anonymous access). Add input validation and limit output.
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
        'settings', to_jsonb(c) - 'store_id' - 'slug' - 'active' - 'updated_at',
        'products', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'price', p.price,
              'image', p.image,
              'available', p.stock > 0,
              'category', k.name,
              'color', k.color
            ) order by p.name
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

-- ============================================================
-- 5. Add missing RLS policies for profiles table
--    Currently only has SELECT. Add explicit denial for
--    INSERT/UPDATE/DELETE to prevent escalation.
-- ============================================================
-- Profiles should only be managed by service role (admin).
-- The SELECT policy already exists: "perfil próprio" for id = auth.uid()
-- No INSERT/UPDATE/DELETE policies means those ops are denied by RLS. Good.

-- ============================================================
-- 6. Add index for performance on common queries
-- ============================================================
create index if not exists products_store_active_idx on products (store_id) where active;
create index if not exists customers_store_idx on customers (store_id);
create index if not exists sale_items_sale_idx on sale_items (sale_id);
create index if not exists sale_payments_sale_idx on sale_payments (sale_id);
create index if not exists fiado_receipts_store_customer_idx on fiado_receipts (store_id, customer_name);

-- ============================================================
-- 7. Tighten column constraints
-- ============================================================
-- Prevent empty names
alter table stores add constraint stores_name_not_empty check (trim(name) <> '');
alter table categories add constraint categories_name_not_empty check (trim(name) <> '');
alter table products add constraint products_name_not_empty check (trim(name) <> '');
alter table customers add constraint customers_name_not_empty check (trim(name) <> '');

-- Limit base64 image size at DB level (500KB encoded ~ reasonable for resized images)
-- This prevents DoS via oversized image uploads until Supabase Storage migration
alter table products add constraint products_image_size check (image is null or length(image) < 512000);
alter table catalog_settings add constraint catalog_logo_size check (logo is null or length(logo) < 512000);
