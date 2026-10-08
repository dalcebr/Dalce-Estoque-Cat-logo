-- 021_promote_admin.sql
-- Promove um usuario existente a administrador do sistema.
-- Rode no SQL Editor do Supabase DEPOIS de 020_admin_panel.sql.
--
-- Como usar:
--   1. Crie o usuario normalmente pelo app (ou pelo painel do Supabase Auth).
--   2. Troque 'SEU_USUARIO' abaixo pelo username do usuario (sem @dalce.app).
--   3. Rode este arquivo.

update profiles
   set role = 'admin'
 where id = (
   select id from auth.users
    where email = 'SEU_USUARIO@dalce.app'
 );

-- Confirme o resultado:
-- select p.id, p.name, p.username, p.role, u.email
--   from profiles p join auth.users u on u.id = p.id
--  where p.role = 'admin';
