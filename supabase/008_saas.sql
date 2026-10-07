-- ============================================================================
-- Dalce Estoque · 008_saas.sql
-- Transforma a base em um SaaS multi-loja comercializável:
--   * planos (trial / pro / business) com validade e bloqueio por vencimento
--   * cadastro de novas lojas pelo próprio cliente (self-service)
--   * painel do dono do sistema (métricas, gestão de lojas e planos)
--   * auditoria de ações sensíveis
--   * correções de segurança (funções com search_path fixo)
-- Rode DEPOIS de: schema.sql → 003 → 004 → 005 → 006 → 007
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Funções auxiliares (security definer, search_path fixo)
-- ---------------------------------------------------------------------------
create or replace function current_store_id() returns uuid
language sql stable security definer set search_path = public as
$$ select store_id from profiles where id = auth.uid() $$;

create or replace function store_active(p_store uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select active and (trial_ends_at is null or trial_ends_at > now())
                    from stores where id = p_store), false) $$;

-- ---------------------------------------------------------------------------
-- 2. Colunas novas
-- ---------------------------------------------------------------------------
alter table stores
  add column if not exists plan text not null default 'trial',
  add column if not exists active boolean not null default true,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists plan_ends_at timestamptz,
  add column if not exists document text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table profiles
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists role text not null default 'owner',
  add column if not exists created_at timestamptz not null default now();

-- is_super_admin() só pode ser criada DEPOIS da coluna existir (o Postgres
-- valida o corpo das funções SQL no momento da criação).
create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select is_super_admin from profiles where id = auth.uid()), false) $$;

-- lojas existentes: 14 dias de teste a partir de agora
update stores set trial_ends_at = now() + interval '14 days' where trial_ends_at is null and plan = 'trial';

-- ---------------------------------------------------------------------------
-- 3. Auditoria
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete set null,
  actor_id uuid,
  actor_name text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_store_idx on audit_logs (store_id, created_at desc);
alter table audit_logs enable row level security;

drop policy if exists "auditoria da loja" on audit_logs;
create policy "auditoria da loja" on audit_logs for select using (store_id = current_store_id() or is_super_admin());
drop policy if exists "auditoria inserir" on audit_logs;
create policy "auditoria inserir" on audit_logs for insert with check (store_id = current_store_id() or is_super_admin());

-- ---------------------------------------------------------------------------
-- 4. RLS: bloqueia lojas inativas/vencidas (o dono do sistema continua vendo)
-- ---------------------------------------------------------------------------
drop policy if exists "loja própria (ler)" on stores;
create policy "loja própria (ler)" on stores for select using (id = current_store_id() or is_super_admin());

drop policy if exists "loja própria (editar)" on stores;
create policy "loja própria (editar)" on stores for update
  using (id = current_store_id() and store_active(id))
  with check (id = current_store_id());

drop policy if exists "vendas da loja" on sales;
create policy "vendas da loja" on sales for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "categorias da loja" on categories;
create policy "categorias da loja" on categories for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "produtos da loja" on products;
create policy "produtos da loja" on products for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "pagamentos da loja" on sale_payments;
create policy "pagamentos da loja" on sale_payments for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "itens da loja" on sale_items;
create policy "itens da loja" on sale_items for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "recebimentos da loja" on fiado_receipts;
create policy "recebimentos da loja" on fiado_receipts for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "clientes da loja" on customers;
create policy "clientes da loja" on customers for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "variacoes da loja" on variation_groups;
create policy "variacoes da loja" on variation_groups for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

drop policy if exists "catalogo da loja" on catalog_settings;
create policy "catalogo da loja" on catalog_settings for all
  using (store_id = current_store_id() and store_active(store_id))
  with check (store_id = current_store_id() and store_active(store_id));

-- ---------------------------------------------------------------------------
-- 5. Cadastro self-service: cria loja + perfil + catálogo + auditoria
-- ---------------------------------------------------------------------------
create or replace function create_store_for_user(p_name text, p_user_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_store uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from profiles where id = v_uid) then raise exception 'profile already exists'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'store name required'; end if;

  insert into stores (name, plan, active, trial_ends_at)
  values (trim(p_name), 'trial', true, now() + interval '14 days')
  returning id into v_store;

  insert into profiles (id, store_id, name, role, is_super_admin)
  values (v_uid, v_store, coalesce(nullif(trim(p_user_name), ''), 'Proprietário'), 'owner', false);

  insert into catalog_settings (store_id, active, slug)
  values (v_store, false, null)
  on conflict (store_id) do nothing;

  insert into audit_logs (store_id, actor_id, actor_name, action, detail)
  values (v_store, v_uid, coalesce(nullif(trim(p_user_name), ''), 'Proprietário'), 'loja.criada', trim(p_name));

  return v_store;
end $$;

grant execute on function create_store_for_user(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Painel do dono do sistema
-- ---------------------------------------------------------------------------
create or replace function admin_overview()
returns jsonb
language sql stable security definer set search_path = public as $$
  select case when not is_super_admin() then null else jsonb_build_object(
    'stores', (select count(*) from stores),
    'active', (select count(*) from stores where active and (trial_ends_at is null or trial_ends_at > now())),
    'trial', (select count(*) from stores where plan = 'trial' and active and (trial_ends_at is null or trial_ends_at > now())),
    'expired', (select count(*) from stores where not active or (trial_ends_at is not null and trial_ends_at <= now())),
    'users', (select count(*) from profiles),
    'products', (select count(*) from products),
    'sales', (select count(*) from sales where status <> 'cancelada'),
    'revenue', (select coalesce(sum(total), 0) from sales where status <> 'cancelada'),
    'revenue30', (select coalesce(sum(total), 0) from sales where status <> 'cancelada' and created_at >= now() - interval '30 days'),
    'sales30', (select count(*) from sales where status <> 'cancelada' and created_at >= now() - interval '30 days')
  ) end
$$;

create or replace function admin_stores()
returns table (
  id uuid, name text, plan text, active boolean, trial_ends_at timestamptz, plan_ends_at timestamptz,
  created_at timestamptz, owner_name text, owner_email text, users bigint, products bigint, sales bigint,
  revenue numeric, last_sale timestamptz
)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.plan, s.active, s.trial_ends_at, s.plan_ends_at, s.created_at,
    (select p.name from profiles p where p.store_id = s.id order by p.created_at limit 1),
    (select u.email::text from profiles p join auth.users u on u.id = p.id where p.store_id = s.id order by p.created_at limit 1),
    (select count(*) from profiles p where p.store_id = s.id),
    (select count(*) from products pr where pr.store_id = s.id),
    (select count(*) from sales sa where sa.store_id = s.id and sa.status <> 'cancelada'),
    (select coalesce(sum(sa.total), 0) from sales sa where sa.store_id = s.id and sa.status <> 'cancelada'),
    (select max(sa.created_at) from sales sa where sa.store_id = s.id)
  from stores s
  where is_super_admin()
  order by s.created_at desc
$$;

create or replace function admin_set_plan(p_store uuid, p_plan text, p_days int)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_name text;
begin
  if not is_super_admin() then raise exception 'not allowed'; end if;
  if p_plan not in ('trial', 'pro', 'business', 'blocked') then raise exception 'invalid plan'; end if;
  select name into v_name from profiles where id = v_uid;

  if p_plan = 'blocked' then
    update stores set active = false, plan = 'blocked', updated_at = now() where id = p_store;
  elsif p_plan = 'trial' then
    update stores set active = true, plan = 'trial', trial_ends_at = now() + make_interval(days => greatest(coalesce(p_days, 14), 1)), updated_at = now() where id = p_store;
  else
    update stores set active = true, plan = p_plan, plan_ends_at = now() + make_interval(days => greatest(coalesce(p_days, 30), 1)), updated_at = now() where id = p_store;
  end if;

  insert into audit_logs (store_id, actor_id, actor_name, action, detail)
  values (p_store, v_uid, v_name, 'plano.alterado', p_plan || ' · ' || coalesce(p_days, 0) || ' dias');
end $$;

grant execute on function admin_overview() to authenticated;
grant execute on function admin_stores() to authenticated;
grant execute on function admin_set_plan(uuid, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Vitrine pública: só publica catálogo de loja ativa
-- ---------------------------------------------------------------------------
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
  where c.slug = lower(p_slug) and c.active and s.active
$$;
grant execute on function public_catalog(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Como promover o dono do sistema (rode manualmente, trocando o e-mail):
-- ---------------------------------------------------------------------------
-- update profiles set is_super_admin = true
-- where id = (select id from auth.users where email = 'seu-email@dominio.com');
