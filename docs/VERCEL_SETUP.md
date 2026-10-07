# VERCEL_SETUP.md

Deploy do **Dalce Estoque** (Next.js 15) na Vercel, do zero até produção com domínio próprio.

---

## 1. Pré-requisitos

- Repositório no GitHub com o código (veja `docs/GITHUB_SETUP.md`).
- Projeto Supabase configurado (veja `docs/SUPABASE_SETUP.md`).
- Conta na Vercel (<https://vercel.com>) — pode entrar com o GitHub.

---

## 2. Importar o projeto

1. Acesse <https://vercel.com/new>.
2. Em **Import Git Repository**, escolha o repositório do Dalce Estoque.
   - Se não aparecer, clique em **Adjust GitHub App Permissions** e autorize o repositório.
3. Em **Configure Project**:
   - **Framework Preset**: `Next.js` (detectado automaticamente).
   - **Root Directory**: deixe em branco (o projeto está na raiz).
   - **Build Command**: `next build` (padrão).
   - **Output Directory**: `.next` (padrão).
   - **Install Command**: `npm install` (padrão).
   - **Node.js Version**: `20.x` ou superior.
4. **Não clique em Deploy ainda** — primeiro configure as variáveis (próximo passo).

---

## 3. Variáveis de ambiente

Ainda na tela de import (ou depois em **Settings → Environment Variables**), adicione:

| Variável | Obrigatória | Onde obter | Ambiente | Exemplo |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API → Project URL | Production, Preview, Development | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Project Settings → API → anon public | Production, Preview, Development | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Project Settings → API → service_role | **Somente Production** | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Seu domínio final | Production | `https://app.seudominio.com` |
| `NEXT_PUBLIC_APP_NAME` | ➖ | Você escolhe | Todos | `Dalce Estoque` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | ➖ | Seu e-mail de suporte | Todos | `suporte@seudominio.com` |

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` nunca deve ser marcada para Preview/Development** se
> o repositório for público ou compartilhado — previews podem ser acessados por terceiros.
> Marque apenas **Production**.

> ⚠️ Toda variável `NEXT_PUBLIC_*` é embutida no bundle do navegador. Nunca coloque
> segredos com esse prefixo.

Depois de preencher, clique em **Deploy**.

---

## 4. Primeiro deploy

A Vercel vai rodar `npm install` e `next build`. Acompanhe os logs.

**Resultado esperado:** build verde e uma URL do tipo `https://dalce-estoque.vercel.app`.

Se o build falhar:

| Erro | Causa | Solução |
|---|---|---|
| `Missing NEXT_PUBLIC_SUPABASE_URL` | Variável não configurada | Adicione em Settings → Environment Variables e faça redeploy |
| `Type error` | Erro de TypeScript | Rode `npm run typecheck` localmente e corrija |
| `Module not found` | Dependência faltando | Rode `npm install` local e commite o `package-lock.json` |

---

## 5. Domínio próprio

1. **Settings → Domains → Add**.
2. Digite o domínio: `app.seudominio.com` (recomendado usar um subdomínio para o app).
3. A Vercel mostra o registro DNS necessário. Duas opções:

   **Opção A — nameservers da Vercel (mais simples):**
   - Aponte os nameservers do seu domínio para `ns1.vercel-dns.com` e `ns2.vercel-dns.com`.
   - A Vercel gerencia todo o DNS.

   **Opção B — manter o DNS no Cloudflare (recomendado, veja `docs/CLOUDFLARE_SETUP.md`):**
   - Adicione um registro `CNAME` apontando `app` → `cname.vercel-dns.com`.
   - **Importante:** deixe o proxy do Cloudflare como **DNS only** (nuvem cinza) para o
     domínio do app, ou configure corretamente se usar proxy (ver seção 8).

4. Aguarde a propagação (de segundos a algumas horas).
5. **Resultado esperado:** a Vercel mostra o domínio com o status **Valid Configuration** e
   o cadeado de HTTPS.

---

## 6. Ambientes

A Vercel cria três ambientes automaticamente:

| Ambiente | Quando roda | URL | Variáveis |
|---|---|---|---|
| **Production** | Push na branch `main` | Domínio próprio | Todas |
| **Preview** | Push em qualquer outra branch / PR | URL única por deploy | Sem `service_role` |
| **Development** | `vercel dev` local | `localhost:3000` | Use `.env.local` |

**Recomendação:** trabalhe em branches (`feat/...`, `fix/...`) e só faça merge na `main`
quando estiver testado. Cada PR ganha uma URL de preview para validar antes de publicar.

---

## 7. Redirects e rewrites

O projeto **não precisa** de redirects/rewrites manuais: o roteamento é feito pelo
App Router do Next.js. O middleware (`src/middleware.ts`) cuida de:

- Redirecionar visitantes não autenticados para `/login`.
- Redirecionar usuários logados que acessam `/login` ou `/cadastro` para a home.
- Bloquear lojas vencidas/suspensas, liberando apenas `/bloqueado`, `/assinatura` e `/c/`.

Se um dia precisar de redirects, crie `vercel.json` na raiz:

```json
{
  "redirects": [
    { "source": "/loja", "destination": "/catalogo", "permanent": true }
  ]
}
```

---

## 8. CORS

O app é **same-origin** (frontend e server actions no mesmo domínio), então **não há
configuração de CORS a fazer**. As chamadas ao Supabase usam a anon key e são protegidas
por RLS.

Se no futuro você expuser uma API pública para terceiros, configure os headers de CORS
explicitamente no route handler e restrinja as origens permitidas.

---

## 9. Logs e observabilidade

- **Runtime Logs**: **Deployments → (deploy) → Functions / Logs**. Mostra erros de server
  actions e route handlers em tempo real.
- **Build Logs**: **Deployments → (deploy) → Building**.
- **Health check**: `GET /api/health` retorna `200` (ok) ou `503` (banco indisponível).
  Configure um monitor externo (UptimeRobot, Better Stack) apontando para essa URL.
- **Analytics**: **Settings → Analytics** (Web Analytics + Speed Insights) — opcional, útil
  para medir performance real dos clientes.

---

## 10. Redeploy e rollback

**Redeploy** (após mudar variáveis):
- **Deployments → (deploy desejado) → ⋯ → Redeploy**.

**Rollback** (produção quebrou):
- **Deployments → encontre o último deploy bom → ⋯ → Promote to Production**.
- O rollback é instantâneo e não altera o código no Git.

> ⚠️ Rollback de código **não** reverte o banco. Se uma migração SQL quebrou algo,
> restaure o backup (veja `docs/SUPABASE_SETUP.md`, seção 9).

---

## 11. Checklist de produção

- [ ] Build verde na `main`.
- [ ] Todas as variáveis configuradas (Production).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **somente** em Production.
- [ ] Domínio próprio com HTTPS válido.
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio real.
- [ ] Redirect URLs do Supabase incluindo o domínio da Vercel.
- [ ] Health check monitorado.
- [ ] Logs verificados após o primeiro acesso real.
- [ ] Teste de login, cadastro e catálogo público no domínio final.
