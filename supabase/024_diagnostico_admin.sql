-- 024_diagnostico_admin.sql
-- Diagnóstico: descubra por que o login do painel recusa sua conta.
-- Rode no SQL Editor do Supabase. NÃO altera nada, só consulta.
--
-- Usuário configurado: dalati

-- 1) A função current_role_name() existe?
select
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'current_role_name'
  ) as funcao_current_role_name_existe;

-- 2) Sua conta (dalati): papel, loja e e-mail.
--    Procura por username 'dalati' OU e-mail 'dalati@dalce.app'.
select
  p.id,
  p.name,
  p.username,
  p.role,
  p.store_id,
  u.email
from profiles p
join auth.users u on u.id = p.id
where p.username = 'dalati'
   or u.email = 'dalati@dalce.app';

-- 3) Todos os perfis cadastrados (para localizar sua conta pelo e-mail).
select
  p.id,
  p.name,
  p.username,
  p.role,
  p.store_id,
  u.email
from profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;

-- 4) Todos os admins cadastrados (deve listar pelo menos você).
select p.id, p.name, p.username, p.role, u.email
from profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';

-- 5) Se o item (2) retornar role diferente de 'admin' (ou nenhuma linha),
--    rode o comando abaixo para promover a conta dalati:
--
-- update profiles
--    set role = 'admin'
--  where id = (select id from auth.users where email = 'dalati@dalce.app');
