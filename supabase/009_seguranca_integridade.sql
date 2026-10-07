-- ============================================================================
-- Dalce Estoque · 009_seguranca_integridade.sql
-- Correções de segurança e integridade identificadas na auditoria de produção.
--
-- O que este arquivo resolve:
--   1. apply_stock / cancel_sale passam a validar a loja (anti-IDOR) e a
--      rodar com search_path fixo.
--   2. create_sale(): venda + itens + pagamentos + baixa de estoque em UMA
--      transação. Antes eram 4 chamadas separadas e podiam deixar dados
--      inconsistentes se uma falhasse.
--   3. receive_fiado(): recebimento validado no servidor.
--   4. Índices que faltavam para as consultas mais pesadas (fiado, relatórios).
--   5. Bucket de Storage para imagens de produto/logo (substitui base64).
--   6. Correção do bug de negócio: reativar loja não deve forçar plano "pro".
--
-- Rode DEPOIS de: schema.sql → 003 → 004 → 005 → 006 → 007 → 008
-- É idempotente: pode rodar mais de uma vez sem erro.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. apply_stock: valida que o produto pertence à loja do usuário
-- ---------------------------------------------------------------------------
create or replace function apply_stock(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid := current_store_id();
  v_item  jsonb;
  v_pid   uuid;
  v_qty   int;
begin
  if v_store is null then
    raise exception 'not authenticated';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(items, '[]'::jsonb))
  loop
    v_pid := nullif(v_item->>'productId', '')::uuid;
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_pid is null or v_qty = 0 then
      continue;
    end if;

    -- A cláusula store_id = v_store é o que impede baixar estoque de outra loja.
    update products
       set stock = stock - v_qty
     where id = v_pid
       and store_id = v_store;

    if not found then
      raise exception 'produto % não pertence à sua loja', v_pid;
    end if;
  end loop;
end $$;

grant execute on function apply_stock(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. cancel_sale: valida a loja e devolve o estoque de forma atômica
-- ---------------------------------------------------------------------------
create or replace function cancel_sale(p_sale uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid := current_store_id();
  v_status text;
begin
  if v_store is null then
    raise exception 'not authenticated';
  end if;

  select status into v_status
    from sales
   where id = p_sale
     and store_id = v_store
   for update;

  if v_status is null then
    raise exception 'venda não encontrada';
  end if;

  if v_status = 'cancelada' then
    return; -- idempotente: cancelar duas vezes não devolve estoque duas vezes
  end if;

  update products p
     set stock = p.stock + i.qty
    from sale_items i
   where i.sale_id = p_sale
     and i.product_id = p.id
     and p.store_id = v_store;

  update sales set status = 'cancelada' where id = p_sale and store_id = v_store;
end $$;

grant execute on function cancel_sale(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. create_sale: venda completa em uma única transação
--    Recebe itens e pagamentos em JSON, valida tudo no servidor e só então
--    grava. Se qualquer etapa falhar, nada é gravado.
-- ---------------------------------------------------------------------------
create or replace function create_sale(p_items jsonb, p_payments jsonb, p_customer text default null, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_store   uuid;
  v_seller  text;
  v_item    jsonb;
  v_pay     jsonb;
  v_pid     uuid;
  v_qty     int;
  v_price   numeric(12,2);
  v_cost    numeric(12,2);
  v_line    numeric(12,2);
  v_total   numeric(12,2) := 0;
  v_costtot numeric(12,2) := 0;
  v_paid    numeric(12,2) := 0;
  v_main    text;
  v_sale    uuid;
  v_number  int;
  v_created timestamptz;
  v_customer text := nullif(trim(coalesce(p_customer, '')), '');
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select store_id, name into v_store, v_seller from profiles where id = v_uid;
  if v_store is null then
    raise exception 'profile not found';
  end if;

  if not store_active(v_store) then
    raise exception 'loja inativa';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'carrinho vazio';
  end if;

  -- ---- valida itens e calcula total/custo com preço vindo do banco --------
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := nullif(v_item->>'productId', '')::uuid;
    v_qty := greatest(1, coalesce((v_item->>'qty')::int, 1));

    if v_pid is not null then
      select price, cost into v_price, v_cost
        from products
       where id = v_pid and store_id = v_store and active;
      if v_price is null then
        raise exception 'produto indisponível';
      end if;
    else
      -- venda rápida: preço livre, mas validado
      v_price := coalesce((v_item->>'price')::numeric, 0);
      v_cost  := 0;
      if v_price <= 0 then
        raise exception 'valor inválido';
      end if;
    end if;

    v_line := round(v_price * v_qty, 2);
    v_total := v_total + v_line;
    v_costtot := v_costtot + round(v_cost * v_qty, 2);
  end loop;

  -- ---- valida pagamentos --------------------------------------------------
  for v_pay in select * from jsonb_array_elements(coalesce(p_payments, '[]'::jsonb))
  loop
    if coalesce((v_pay->>'amount')::numeric, 0) <= 0 then
      raise exception 'pagamento inválido';
    end if;
    v_paid := v_paid + (v_pay->>'amount')::numeric;
  end loop;

  if abs(v_paid - v_total) > 0.009 then
    raise exception 'os pagamentos não fecham o total';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_payments) x
     where x->>'method' = 'fiado'
  ) and v_customer is null then
    raise exception 'identifique o cliente para vender no fiado';
  end if;

  select method into v_main
    from jsonb_array_elements(p_payments) x
   order by (x->>'amount')::numeric desc
   limit 1;

  -- ---- grava a venda ------------------------------------------------------
  insert into sales (store_id, total, cost, payment_method, customer_name, seller_name, note)
  values (v_store, v_total, v_costtot, v_main, v_customer, v_seller, nullif(trim(coalesce(p_note, '')), ''))
  returning id, number, created_at into v_sale, v_number, v_created;

  -- ---- itens --------------------------------------------------------------
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := nullif(v_item->>'productId', '')::uuid;
    v_qty := greatest(1, coalesce((v_item->>'qty')::int, 1));

    if v_pid is not null then
      select price into v_price from products where id = v_pid and store_id = v_store;
      insert into sale_items (sale_id, store_id, product_id, name, qty, total)
      select v_sale, v_store, v_pid, p.name, v_qty, round(p.price * v_qty, 2)
        from products p where p.id = v_pid and p.store_id = v_store;
    else
      v_price := coalesce((v_item->>'price')::numeric, 0);
      insert into sale_items (sale_id, store_id, product_id, name, qty, total)
      values (v_sale, v_store, null, 'Venda rápida', v_qty, round(v_price * v_qty, 2));
    end if;
  end loop;

  -- ---- pagamentos ---------------------------------------------------------
  for v_pay in select * from jsonb_array_elements(p_payments)
  loop
    insert into sale_payments (sale_id, store_id, method, amount)
    values (v_sale, v_store, v_pay->>'method', round((v_pay->>'amount')::numeric, 2));
  end loop;

  -- ---- baixa de estoque ---------------------------------------------------
  perform apply_stock((
    select coalesce(jsonb_agg(jsonb_build_object('productId', x->>'productId', 'qty', x->>'qty')), '[]'::jsonb)
      from jsonb_array_elements(p_items) x
     where nullif(x->>'productId', '') is not null
  ));

  -- ---- cliente novo entra na base ----------------------------------------
  if v_customer is not null then
    insert into customers (store_id, name)
    values (v_store, v_customer)
    on conflict do nothing;
  end if;

  return jsonb_build_object('id', v_sale, 'number', v_number, 'created_at', v_created, 'total', v_total);
end $$;

grant execute on function create_sale(jsonb, jsonb, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. receive_fiado: recebimento validado no servidor
-- ---------------------------------------------------------------------------
create or replace function receive_fiado(p_name text, p_amount numeric, p_method text default 'dinheiro')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid := current_store_id();
  v_name  text := nullif(trim(coalesce(p_name, '')), '');
begin
  if v_store is null then
    raise exception 'not authenticated';
  end if;
  if v_name is null then
    raise exception 'informe o cliente';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'valor inválido';
  end if;
  if p_method not in ('dinheiro', 'pix', 'débito', 'crédito', 'outros') then
    raise exception 'forma de pagamento inválida';
  end if;

  insert into fiado_receipts (store_id, customer_name, amount, method)
  values (v_store, v_name, round(p_amount, 2), p_method);
end $$;

grant execute on function receive_fiado(text, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Índices que faltavam (consultas de fiado e relatórios)
-- ---------------------------------------------------------------------------
create index if not exists sale_payments_store_method_idx on sale_payments (store_id, method);
create index if not exists sale_payments_sale_idx on sale_payments (sale_id);
create index if not exists sale_items_sale_idx on sale_items (sale_id);
create index if not exists sale_items_store_idx on sale_items (store_id);
create index if not exists fiado_receipts_store_name_idx on fiado_receipts (store_id, lower(customer_name));
create index if not exists products_store_active_idx on products (store_id, active);
create index if not exists products_store_category_idx on products (store_id, category_id);
create index if not exists sales_store_status_date_idx on sales (store_id, status, created_at desc);
create index if not exists customers_store_idx on customers (store_id);

-- ---------------------------------------------------------------------------
-- 6. Storage: bucket público para imagens de produto e logo
--    As imagens ficam em <store_id>/<arquivo>. A política de escrita exige
--    que a primeira pasta seja a loja do usuário — ninguém grava na pasta
--    de outra loja.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 2097152,
        array['image/webp', 'image/jpeg', 'image/png', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/gif'];

drop policy if exists "catalogo leitura publica" on storage.objects;
create policy "catalogo leitura publica" on storage.objects
  for select using (bucket_id = 'catalogo');

drop policy if exists "catalogo escrita da loja" on storage.objects;
create policy "catalogo escrita da loja" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catalogo'
    and (storage.foldername(name))[1] = current_store_id()::text
  );

drop policy if exists "catalogo atualizacao da loja" on storage.objects;
create policy "catalogo atualizacao da loja" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'catalogo'
    and (storage.foldername(name))[1] = current_store_id()::text
  );

drop policy if exists "catalogo remocao da loja" on storage.objects;
create policy "catalogo remocao da loja" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'catalogo'
    and (storage.foldername(name))[1] = current_store_id()::text
  );

-- ---------------------------------------------------------------------------
-- 7. Correção: reativar loja não deve sobrescrever o plano do cliente
--    (o bug estava em src/app/admin/actions.ts, corrigido no código também)
-- ---------------------------------------------------------------------------
create or replace function admin_set_active(p_store uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text;
begin
  if not is_super_admin() then
    raise exception 'not allowed';
  end if;

  select name into v_name from profiles where id = v_uid;

  if p_active then
    -- reativa mantendo o plano atual; se estava "blocked", volta para "pro"
    update stores
       set active = true,
           plan = case when plan = 'blocked' then 'pro' else plan end,
           plan_ends_at = case
             when plan = 'blocked' then now() + interval '30 days'
             else plan_ends_at
           end,
           updated_at = now()
     where id = p_store;
  else
    update stores
       set active = false, plan = 'blocked', updated_at = now()
     where id = p_store;
  end if;

  insert into audit_logs (store_id, actor_id, actor_name, action, detail)
  values (p_store, v_uid, v_name, case when p_active then 'loja.ativada' else 'loja.suspensa' end, null);
end $$;

grant execute on function admin_set_active(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Verificação rápida (rode para conferir que tudo foi criado)
-- ---------------------------------------------------------------------------
-- select proname from pg_proc
--  where proname in ('apply_stock','cancel_sale','create_sale','receive_fiado','admin_set_active')
--  order by proname;
-- select id, public from storage.buckets where id = 'catalogo';
