-- 023_admin_role_helper.sql
-- Corrige a deteccao de administrador.
--
-- Problema: o login e o middleware leem `profiles.role` com o cliente do
-- usuario. Se a policy de RLS nao permitir a leitura (ou se o perfil nao
-- existir), o sistema trata o usuario como loja comum e nao redireciona
-- para o painel.
--
-- Solucao: expor uma funcao `security definer` que retorna o papel do
-- usuario autenticado ignorando RLS. O login e o middleware passam a usar
-- essa funcao.
--
-- Rode no SQL Editor do Supabase, apos 022_store_cascade.sql.

-- Retorna o papel ('admin' | 'owner') do usuario autenticado, ou null.
create or replace function current_role_name() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

-- Retorna true se o usuario autenticado e administrador.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role = 'admin' from profiles where id = auth.uid()), false) $$;

grant execute on function current_role_name() to authenticated;
grant execute on function is_admin() to authenticated;

-- Garante que a policy de leitura do proprio perfil existe (idempotente).
drop policy if exists "perfil próprio" on profiles;
create policy "perfil próprio" on profiles for select using (id = auth.uid());

-- Administradores nao pertencem a nenhuma loja: permite store_id nulo.
alter table profiles alter column store_id drop not null;

-- Diagnostico: lista os administradores cadastrados.
-- select p.id, p.name, p.username, p.role, u.email
--   from profiles p join auth.users u on u.id = p.id
--  where p.role = 'admin';
