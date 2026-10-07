# ARCHITECTURE.md

Arquitetura do **Dalce Estoque** — SaaS multi-tenant de gestão (PDV, estoque, fiado,
relatórios) com catálogo digital público.

---

## 1. Visão geral

```text
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
│  React 19 · Next.js App Router · Tailwind CSS 4              │
│  (mobile-first, tema claro/escuro)                           │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────────────────────┐
│                    VERCEL (Next.js 15)                       │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Server         │  │ Route        │  │ Middleware      │  │
│  │ Components     │  │ Handlers     │  │ (sessão/rotas)  │  │
│  │ + Server       │  │ /api/health  │  │                 │  │
│  │ Actions        │  │              │  │                 │  │
│  └───────┬────────┘  └──────┬───────┘  └────────┬────────┘  │
└──────────┼──────────────────┼───────────────────┼───────────┘
           │                  │                   │
           │        @supabase/ssr (cookies)       │
           ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Auth         │  │ Postgres     │  │ Storage          │   │
│  │ (sessão)     │  │ + RLS        │  │ (bucket catalogo)│   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Não há backend separado.** As server actions e route handlers do Next.js são o backend.
Isso reduz superfície de ataque, latência e custo de manutenção.

---

## 2. Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, server actions, streaming, deploy simples |
| UI | React 19 + Tailwind CSS 4 | Componentização e estilos utilitários |
| Ícones | lucide-react | Consistência visual |
| Banco | PostgreSQL (Supabase) | Relacional + RLS nativo |
| Auth | Supabase Auth | Sessão via cookies, recuperação de senha |
| Storage | Supabase Storage | Imagens de produto e logo |
| Deploy | Vercel | Integração nativa com Next.js |
| DNS/CDN | Cloudflare (opcional) | DNS, SSL, proteção |

---

## 3. Multi-tenancy

O isolamento entre lojas é a **prioridade máxima** do sistema.

### Modelo

- Cada loja é uma linha em `stores`.
- Cada usuário é uma linha em `profiles`, com `store_id` apontando para sua loja.
- **Todas** as tabelas de dados têm `store_id`.

### Camadas de proteção

1. **RLS (Row Level Security)** — a camada principal. Toda tabela tem políticas que
   filtram por `store_id = current_store_id()`. Mesmo com bug no código, o banco recusa.
2. **`current_store_id()`** — função `security definer` com `search_path` fixo que
   resolve a loja do usuário autenticado a partir de `auth.uid()`.
3. **Server actions** — usam `getStore()` (que lê o perfil do usuário) e nunca confiam
   em `store_id` vindo do cliente.
4. **Funções transacionais** — `create_sale`, `cancel_sale`, `apply_stock`, `receive_fiado`
   validam `store_id` explicitamente, impedindo IDOR.
5. **Storage** — políticas exigem que a primeira pasta do arquivo seja o `store_id`.

### Fluxo de uma requisição autenticada

```text
1. Middleware valida a sessão (cookie) e o status da loja.
2. Server action chama getStore() → obtém { supabase, storeId }.
3. A consulta ao Postgres passa pelo RLS, que filtra por store_id.
4. O resultado nunca contém dados de outra loja.
```

---

## 4. Estrutura de pastas

```text
src/
├── app/
│   ├── (rotas)/              # páginas por área: pdv, estoque, vendas, fiado, etc.
│   ├── api/health/           # health check
│   ├── actions.ts            # actions globais
│   ├── layout.tsx            # layout raiz (tema, fontes)
│   ├── error.tsx             # erro global
│   ├── not-found.tsx         # 404
│   └── loading.tsx           # loading global
├── components/               # componentes reutilizáveis
├── lib/
│   ├── supabase/             # clientes (browser, server, admin, middleware)
│   ├── store.ts              # getStore() — contexto da loja
│   ├── plans.ts              # planos e status da assinatura
│   ├── image.ts              # upload/compressão de imagens
│   ├── rate-limit.ts         # rate limiting em memória
│   ├── audit.ts              # log de ações
│   └── format.ts             # formatação (moeda, data)
└── middleware.ts             # proteção de rotas
```

---

## 5. Fluxos principais

### Venda (PDV)

```text
Cliente monta carrinho → escolhe pagamento → createSale()
  → RPC create_sale (transação única no Postgres):
      valida itens e preços no banco
      valida pagamentos (soma = total)
      insere venda + itens + pagamentos
      baixa estoque
      cadastra cliente novo
  → tudo ou nada (atômico)
```

### Catálogo público

```text
Lojista configura em /catalogo → saveCatalog()
  → grava em catalog_settings (slug único, tema, logo, redes)
  → publica em /c/<slug> (página pública, sem autenticação)
  → aparece no sitemap
```

### Assinatura

```text
Trial de 14 dias → expira → middleware redireciona para /bloqueado
  → lojista regulariza em /assinatura
  → super admin ativa em /admin
```

---

## 6. Decisões de arquitetura

| Decisão | Motivo |
|---|---|
| Sem backend separado | Menos superfície de ataque, menos infra, deploy único |
| RLS como base do isolamento | Proteção no banco, não só no código |
| Funções PL/pgSQL para transações | Atomicidade real (venda completa ou nada) |
| Imagens no Storage (não base64) | Não incha o banco, cacheável por CDN, escala |
| Rate limiting em memória | Simples, sem dependência; trocar por Redis se escalar |
| Sem MongoDB | Postgres + RLS cobre tudo com mais segurança (ver `MONGODB_SETUP.md`) |

---

## 7. Escalabilidade

O que já está pronto:

- Índices nas consultas mais pesadas (fiado, relatórios, vendas por data).
- Consultas sempre filtradas por `store_id` (usa índice).
- Imagens servidas por CDN (Storage).
- Server components reduzem JS no cliente.

O que fazer quando crescer:

1. **Rate limiting distribuído** → Upstash Redis.
2. **Cache de catálogo** → `revalidate` + CDN.
3. **Relatórios pesados** → views materializadas ou agregações pré-calculadas.
4. **Plano Supabase** → subir de Free para Pro conforme volume.
