# TROUBLESHOOTING.md

Problemas comuns e como resolver.

---

## Build e deploy

### `Missing NEXT_PUBLIC_SUPABASE_URL`

**Causa:** variável não configurada na Vercel.
**Solução:** Settings → Environment Variables → adicione e faça **Redeploy**.

### `Type error` no build

**Causa:** erro de TypeScript.
**Solução:** rode `npm run typecheck` localmente e corrija antes de commitar.

### `Module not found`

**Causa:** dependência faltando ou `package-lock.json` desatualizado.
**Solução:** `npm install` local e commite o `package-lock.json`.

### Build passa local mas falha na Vercel

**Causa:** diferença de ambiente (variáveis, versão do Node).
**Solução:** confira as variáveis e a versão do Node (use 20.x).

---

## Autenticação

### Login não funciona

1. Confirme que o usuário existe (Supabase → Authentication → Users).
2. Verifique se o e-mail foi confirmado (se `Confirm email` está ativo).
3. Confira as Redirect URLs no Supabase.
4. Veja os logs da Vercel.

### Link de recuperação abre em branco

**Causa:** Redirect URL não cadastrada.
**Solução:** Supabase → Authentication → URL Configuration → adicione o domínio.

### E-mail de recuperação não chega

**Causa:** SMTP compartilhado do plano Free (limite baixo).
**Solução:** configure SMTP próprio (Resend, SendGrid, SES).

### Usuário logado mas sem acesso

**Causa:** perfil sem `store_id`.
**Solução:**
```sql
select * from profiles where id = '<USER-UID>';
-- se store_id for null, vincule a uma loja
```

### "Muitas tentativas" no login

**Causa:** rate limiting ativo.
**Solução:** aguarde 5 minutos. Se for um falso positivo, ajuste os limites em
`src/lib/rate-limit.ts`.

---

## Banco de dados

### `column "is_super_admin" does not exist`

**Causa:** `008_saas.sql` rodou fora de ordem.
**Solução:** rode `008` e depois `009` novamente.

### `new row violates row-level security policy`

**Causa:** usuário sem `store_id` ou política incorreta.
**Solução:** verifique o perfil e as políticas RLS da tabela.

### `permission denied for function create_sale`

**Causa:** `grant execute` não aplicado.
**Solução:** rode `009_seguranca_integridade.sql` novamente.

### Venda não baixa o estoque

**Causa:** função `apply_stock` não existe ou falhou.
**Solução:** confirme que o `009` rodou e veja os logs do Postgres.

### Dados de uma loja aparecem em outra

**Causa:** RLS desativado ou política incorreta. **GRAVE.**
**Solução:** verifique `alter table ... enable row level security` em todas as tabelas
e as políticas. **Não venda até resolver.**

---

## Storage e imagens

### Upload falha com 403

**Causa:** primeira pasta do arquivo ≠ `store_id`.
**Solução:** confirme a política do bucket `catalogo` e que o usuário tem `store_id`.

### Imagem não aparece

1. Confirme que o bucket é público.
2. Verifique se a URL começa com `https://<projeto>.supabase.co/storage/v1/object/public/catalogo/`.
3. Veja se o arquivo existe no Storage.

### "Imagem muito grande"

**Causa:** arquivo > 12 MB ou compressão não reduziu o suficiente.
**Solução:** use uma imagem menor. O limite final é 2 MB.

### Imagem antiga não é removida

**Causa:** limpeza é best-effort (falha silenciosa).
**Solução:** não é crítico. Para limpar, remova manualmente no Storage.

---

## Catálogo

### Catálogo não abre em `/c/<slug>`

1. Confirme que `active = true` e `slug` está preenchido.
2. Verifique se o slug não tem caracteres inválidos.
3. Veja se a loja não está bloqueada.

### Slug duplicado

**Causa:** outro lojista já usa o mesmo slug.
**Solução:** escolha outro. O sistema avisa.

---

## Assinatura

### Loja bloqueada mesmo com plano ativo

**Causa:** `plan_ends_at` no passado ou `active = false`.
**Solução:** super admin → `/admin` → ajuste o plano/validade.

### Reativar loja mudou o plano

**Causa:** bug antigo (corrigido no `009`).
**Solução:** rode o `009` novamente e ajuste o plano manualmente se necessário.

---

## Cloudflare

### `ERR_TOO_MANY_REDIRECTS`

**Causa:** SSL mode `Flexible` + Vercel.
**Solução:** mude para **Full (strict)** ou use **DNS only**.

### Login falha com proxy ativo

**Causa:** cache de POST.
**Solução:** bypass cache em `/api/*` e rotas de auth, ou use **DNS only**.

---

## Performance

### App lento

1. Verifique o tamanho das imagens (devem ser WebP).
2. Veja os logs da Vercel (funções lentas).
3. Confira os índices no banco.
4. Ative Speed Insights na Vercel.

### Banco lento

1. Veja **Logs → Postgres** no Supabase.
2. Identifique consultas lentas.
3. Adicione índices se necessário.

---

## Como diagnosticar

1. **Logs da Vercel**: Deployments → Functions/Logs.
2. **Logs do Supabase**: Logs Explorer.
3. **Health check**: `GET /api/health`.
4. **Console do navegador**: erros de cliente.
5. **Auditoria**: tabela `audit_logs` mostra ações recentes.

> Ao reportar um problema, sempre informe: o que fez, o que esperava, o que aconteceu,
> e a mensagem de erro exata.
