# CLOUDFLARE_SETUP.md

Configuração do Cloudflare para o **Dalce Estoque**: DNS, SSL, cache e proteção,
compatível com a Vercel (app) e o Supabase (banco/API).

> O Cloudflare é **opcional**. Você pode usar apenas o DNS da Vercel.
> Ele vale a pena quando você quer: DNS rápido e gratuito, proteção contra ataques,
> cache de assets e regras de firewall.

---

## 1. Criar a conta e adicionar o domínio

1. Acesse <https://dash.cloudflare.com/sign-up> e crie a conta.
2. Clique em **Add a site**.
3. Digite seu domínio (ex.: `seudominio.com`) e clique em **Continue**.
4. Escolha o plano **Free** (suficiente para começar).
5. O Cloudflare mostra **dois nameservers** (ex.: `ada.ns.cloudflare.com`).
6. No painel do seu **registrador** (Registro.br, GoDaddy, Namecheap…), troque os
   nameservers pelos que o Cloudflare indicou.
7. Volte ao Cloudflare e clique em **Check nameservers now**.

**Resultado esperado:** em minutos a algumas horas, o domínio aparece com status **Active**.

---

## 2. Registros DNS

Vá em **DNS → Records**. Configure:

| Tipo | Nome | Conteúdo | Proxy | Para quê |
|---|---|---|---|---|
| `CNAME` | `app` | `cname.vercel-dns.com` | 🟠 Proxied | App na Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` | 🟠 Proxied | Redireciona para o app |
| `CNAME` | `@` (raiz) | `cname.vercel-dns.com` | 🟠 Proxied | Domínio raiz (Cloudflare faz flatten) |

> **Não** crie registros para o Supabase. O app fala com o Supabase pela URL
> `*.supabase.co`, que já tem DNS próprio. Você não aponta DNS para o banco.

### ⚠️ Ponto crítico: proxy e Vercel

A Vercel recomenda **DNS only** (nuvem cinza) para o domínio do app, porque o proxy
do Cloudflare pode interferir em:

- validação do certificado SSL da Vercel;
- headers de cache e `x-forwarded-for` (usado no rate limiting);
- streaming de respostas do React Server Components.

**Duas abordagens válidas:**

**A) Simples e recomendada (DNS only):**
- Deixe `app` como **DNS only** (nuvem cinza).
- A Vercel emite e renova o SSL automaticamente.
- Você perde o cache/proteção do Cloudflare no app, mas ganha zero dor de cabeça.

**B) Com proxy (avançado):**
- Deixe `app` como **Proxied** (nuvem laranja).
- Em **SSL/TLS → Overview**, defina o modo como **Full (strict)**.
- Em **SSL/TLS → Edge Certificates**, ative **Always Use HTTPS**.
- Em **Caching → Configuration**, defina **Cache Level: Standard** e **Browser Cache TTL: Respect Existing Headers**.
- Crie uma regra em **Rules → Page Rules** (ou **Cache Rules**) para **Bypass Cache** em:
  - `app.seudominio.com/api/*`
  - `app.seudominio.com/*` quando o método não for `GET` (server actions usam POST).

> Se o login ou as server actions começarem a falhar com erro 403/502, volte para a
> abordagem **A** (DNS only). É a causa mais comum de problemas.

---

## 3. SSL/TLS

**SSL/TLS → Overview**:

- Modo: **Full (strict)** (se usar proxy) ou **Flexible** nunca — evita loop de redirect.
- **Edge Certificates**:
  - **Always Use HTTPS**: ON.
  - **Automatic HTTPS Rewrites**: ON.
  - **Minimum TLS Version**: `TLS 1.2`.
  - **Opportunistic Encryption**: ON.

**Resultado esperado:** `https://app.seudominio.com` abre com cadeado válido e
`http://` redireciona para `https://`.

---

## 4. Cache

**Caching → Configuration**:

- **Caching Level**: `Standard`.
- **Browser Cache TTL**: `Respect Existing Headers` (o Next.js já define os headers certos).
- **Always Online**: ON (mostra versão em cache se a origem cair).

**Regras de bypass obrigatórias** (para não cachear dados de usuário):

Em **Rules → Cache Rules → Create rule**:

- Nome: `Bypass API e auth`
- Quando: `URI Path` **starts with** `/api/` **OR** `URI Path` **starts with** `/login`
  **OR** `URI Path` **starts with** `/cadastro`
- Então: **Bypass cache**.

> ⚠️ **Nunca** cacheie páginas autenticadas. Se o Cloudflare servir a página de um
> usuário para outro, você tem um vazamento de dados entre lojas. Na dúvida, use
> **DNS only** (abordagem A).

---

## 5. Segurança

**Security → Settings**:

- **Security Level**: `Medium`.
- **Bot Fight Mode**: ON (plano Free).
- **Challenge Passage**: `30 minutes`.

**Security → WAF** (plano Free tem regras gerenciadas básicas):

- Ative o **OWASP Core Ruleset** se disponível.

**Rate limiting** (plano Free tem regras limitadas):

- Crie uma regra para `/login` e `/cadastro`: máximo `20` requisições por minuto por IP.
- Isso complementa o rate limiting em memória do app (veja `docs/SECURITY.md`).

---

## 6. Redirects

**Rules → Redirect Rules**:

- `www.seudominio.com/*` → `https://app.seudominio.com/$1` (301).
- `seudominio.com/*` → `https://app.seudominio.com/$1` (301).

> Se preferir, configure isso na própria Vercel em **Settings → Domains** (a Vercel
> redireciona automaticamente os domínios adicionados).

---

## 7. Conflitos comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `ERR_TOO_MANY_REDIRECTS` | SSL mode `Flexible` + Vercel | Mude para **Full (strict)** |
| Login falha / 403 nas actions | Proxy cacheando POST | Bypass cache em `/api/*` e nas rotas de auth |
| Certificado inválido | Proxy + validação da Vercel | Use **DNS only** no registro do app |
| IP errado no rate limit | Proxy esconde o IP real | O app lê `x-forwarded-for`; confirme que o Cloudflare envia o header |
| Assets antigos após deploy | Cache agressivo | Bypass cache ou purge em **Caching → Purge** |

---

## 8. Checklist

- [ ] Domínio ativo no Cloudflare (nameservers trocados).
- [ ] Registro `app` apontando para `cname.vercel-dns.com`.
- [ ] SSL em **Full (strict)** (se proxy) ou **DNS only** (recomendado).
- [ ] **Always Use HTTPS** ativado.
- [ ] Bypass cache em `/api/*` e rotas de autenticação.
- [ ] Bot Fight Mode ativado.
- [ ] Redirect de `www` e raiz para o app.
- [ ] Testado login, cadastro e catálogo público pelo domínio final.
