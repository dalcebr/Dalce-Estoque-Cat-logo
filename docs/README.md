# Dalce Estoque

Sistema multi-tenant de gestao de estoque e catalogo digital para lojistas brasileiros.

## Visao Geral

O Dalce Estoque e um SaaS que permite a lojistas:

- **Registrar vendas** com multiplas formas de pagamento (PDV simplificado)
- **Gerenciar estoque** com controle de quantidade minima e alertas
- **Manter cadastros** de produtos, categorias, clientes e variacoes
- **Publicar catalogo digital** (vitrine publica) com link personalizado (`/c/minha-loja`)
- **Controlar fiado** (vendas a credito por cliente)
- **Visualizar relatorios** com meta mensal, vendas do dia e do mes

## Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15.5 (App Router, Server Components, Server Actions) |
| UI | React 19 + Tailwind CSS 4 |
| Linguagem | TypeScript 5.6+ |
| Banco de Dados | PostgreSQL (via Supabase) com RLS |
| Autenticacao | Supabase Auth (email sintetico `usuario@dalce.app`) |
| Storage | Imagens em base64 no banco (com resize client-side) |
| Icones | Lucide React |
| Deploy | Vercel |
| DNS/CDN | Cloudflare |

## Pre-requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com) (para deploy)

## Quick Start (Desenvolvimento Local)

### 1. Clone o repositorio

```bash
git clone <url-do-repo>
cd dalce-estoque
```

### 2. Instale dependencias

```bash
npm install
```

### 3. Configure variaveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com as credenciais do seu projeto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

### 4. Configure o banco de dados

No SQL Editor do Supabase, execute os scripts na ordem:

1. `supabase/schema.sql`
2. `supabase/003_vendas_detalhe.sql`
3. `supabase/004_pdv.sql`
4. `supabase/005_estoque_fiado.sql`
5. `supabase/006_catalogo.sql`
6. `supabase/007_cadastros.sql`
7. `supabase/008_security_hardening.sql`

> O arquivo `002_payment_method.sql` e necessario apenas se voce rodou o `schema.sql` em uma versao anterior que nao incluia a coluna `payment_method`.

### 5. Crie um usuario

No painel do Supabase:

1. Va em **Authentication > Providers > Email** e desative "Confirm email"
2. Va em **Authentication > Add user** e crie com email `meunome@dalce.app` e uma senha
3. No SQL Editor, vincule a uma loja:

```sql
WITH s AS (
  INSERT INTO stores (name) VALUES ('Minha Loja') RETURNING id
)
INSERT INTO profiles (id, store_id, name)
SELECT
  (SELECT id FROM auth.users WHERE email = 'meunome@dalce.app'),
  s.id,
  'Meu Nome'
FROM s;
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` e faca login com o usuario (sem `@dalce.app`) e senha.

## Estrutura de Documentacao

| Documento | Descricao |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura do sistema, fluxo de dados, multi-tenancy |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Configuracao completa do Supabase |
| [VERCEL_SETUP.md](./VERCEL_SETUP.md) | Deploy na Vercel |
| [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) | Configuracao do Cloudflare |
| [GITHUB_SETUP.md](./GITHUB_SETUP.md) | Repositorio e CI/CD |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | Todas as variaveis de ambiente |
| [SECURITY.md](./SECURITY.md) | Arquitetura de seguranca |
| [API.md](./API.md) | Referencia de Server Actions |
| [DATABASE.md](./DATABASE.md) | Schema completo do banco |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guia de deploy passo a passo |
| [TESTING.md](./TESTING.md) | Estrategia de testes |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Problemas comuns e solucoes |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Checklist pre-lancamento |

## Licenca

Projeto proprietario. Todos os direitos reservados.
