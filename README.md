# Dalce Estoque

Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (Auth + Postgres com RLS).
Multi-loja: cada usuário só enxerga dados da própria loja (RLS no banco).

## Configuração
1. Supabase → SQL Editor → rode `supabase/schema.sql`.
2. Supabase → Authentication → Providers → Email: desative "Confirm email".
3. Crie um usuário em Authentication → Add user com e-mail `usuario@dalce.app` (o login usa só o "usuario") e senha.
4. Vincule o usuário a uma loja (SQL Editor):
```sql
with s as (insert into stores (name) values ('Minha Loja') returning id)
insert into profiles (id, store_id, name)
select (select id from auth.users where email = 'usuario@dalce.app'), s.id, 'Nome do Usuário' from s;
```
5. Vercel → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (veja `.env.example`).

## Local
`npm install && npm run dev`

## Cloudflare (depois)
Usar `@opennextjs/cloudflare` (Workers). Nada neste projeto impede a migração.

## Banco (ordem)
Instalação nova: `schema.sql` → `003_vendas_detalhe.sql`. Já instalado: `002_payment_method.sql` (se ainda não rodou) → `003_vendas_detalhe.sql`.

Ordem completa dos SQLs: schema.sql → 003_vendas_detalhe.sql → 004_pdv.sql.
Ordem completa dos SQLs: schema.sql → 003 → 004 → 005_estoque_fiado.sql.
Ordem completa dos SQLs: schema.sql → 003 → 004 → 005 → 006_catalogo.sql.
