# Dalce Estoque

SaaS de gestão para pequenos negócios: **PDV, estoque, fiado, relatórios e catálogo online**.

Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (Auth + Postgres com RLS).

Multi-loja de verdade: cada loja só enxerga os próprios dados (RLS no banco) e o dono do
sistema tem um painel para gerenciar lojas, planos e vencimentos.

---

## Índice da documentação

| Documento | Conteúdo |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura, stack e decisões técnicas |
| [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Configurar banco, auth e storage |
| [VERCEL_SETUP.md](docs/VERCEL_SETUP.md) | Deploy, domínio e variáveis |
| [CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md) | DNS, SSL e proteção |
| [GITHUB_SETUP.md](docs/GITHUB_SETUP.md) | Repositório, branches e CI |
| [MONGODB_SETUP.md](docs/MONGODB_SETUP.md) | Por que **não** usar MongoDB aqui |
| [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Todas as variáveis de ambiente |
| [SECURITY.md](docs/SECURITY.md) | Auditoria e modelo de segurança |
| [API.md](docs/API.md) | Server actions, RPCs e endpoints |
| [DATABASE.md](docs/DATABASE.md) | Modelo de dados e índices |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Processo de deploy |
| [TESTING.md](docs/TESTING.md) | Checklist de testes |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Problemas comuns |
| [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Checklist final de produção |
| [CHECKLIST-LANCAMENTO.md](docs/CHECKLIST-LANCAMENTO.md) | Roteiro comercial de lançamento |

---

## 1. O que o produto entrega

**Para o lojista**
- PDV rápido (carrinho, múltiplos pagamentos, troco, venda rápida, recibo compartilhável)
- Estoque com alerta de baixo/zerado e baixa automática na venda
- Fiado por cliente com histórico e recebimentos
- Cadastros de produtos, categorias, clientes e variações
- Relatórios com comparativo de período, formas de pagamento e mais vendidos
- Catálogo online público (`/c/seu-link`) com WhatsApp, redes sociais e Google Analytics
- Meta mensal, tema claro/escuro e histórico de ações (auditoria)

**Para você (dono do sistema)**
- Cadastro self-service: o cliente cria a própria loja em 1 minuto
- Teste grátis de 14 dias com bloqueio automático ao vencer
- Painel `/admin`: lojas, donos, volume vendido, plano, vencimento
- Ações: mudar plano (30/90/365 dias), suspender/reativar, redefinir senha do cliente
- Auditoria de tudo que acontece nas lojas

---

## 2. Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS 4 + lucide-react |
| Banco | PostgreSQL (Supabase) com RLS |
| Auth | Supabase Auth |
| Storage | Supabase Storage (bucket `catalogo`) |
| Deploy | Vercel |
| DNS/CDN | Cloudflare (opcional) |

---

## 3. Instalação (passo a passo)

### 3.1 Banco de dados

No Supabase → **SQL Editor**, rode os arquivos **nesta ordem**:

```
supabase/schema.sql
supabase/002_payment_method.sql
supabase/003_vendas_detalhe.sql
supabase/004_pdv.sql
supabase/005_estoque_fiado.sql
supabase/006_catalogo.sql
supabase/007_cadastros.sql
supabase/008_saas.sql                    ← planos, painel do dono, auditoria
supabase/009_seguranca_integridade.sql   ← segurança, transações e Storage
```

> O `009` é **obrigatório**: cria o bucket de imagens, as funções transacionais
> (`create_sale`, `cancel_sale`, `receive_fiado`) e os índices de performance.
> Detalhes em [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

### 3.2 Autenticação

Supabase → **Authentication → Providers → Email**:
- Em produção, mantenha **"Confirm email" ativado**.
- Configure **URL Configuration** com o domínio final.

### 3.3 Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**secreta**) |
| `NEXT_PUBLIC_APP_NAME` | Nome do seu produto |
| `NEXT_PUBLIC_APP_URL` | URL pública (ex.: `https://app.seudominio.com`) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | E-mail de suporte mostrado no app |

Detalhes em [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md).

### 3.4 Rodar localmente

```bash
npm install
npm run dev
```

Acesse <http://localhost:3000>.

### 3.5 Criar sua conta de dono do sistema

1. Acesse `/cadastro` e crie sua loja (ex.: "Dalce Matriz").
2. No SQL Editor, promova seu usuário:
```sql
update profiles set is_super_admin = true
where id = (select id from auth.users where email = 'seu-email@dominio.com');
```
3. Saia e entre novamente: o menu passa a mostrar **Painel do dono** (`/admin`).

---

## 4. Publicar (Vercel)

1. Suba o repositório no GitHub e importe na Vercel.
2. Configure as variáveis de ambiente (Production e Preview).
3. Deploy. Depois, ajuste `NEXT_PUBLIC_APP_URL` para o domínio final e faça novo deploy.

Passo a passo completo em [VERCEL_SETUP.md](docs/VERCEL_SETUP.md) e
[DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 5. Como vender (operação comercial)

1. Divulgue o link de cadastro: `https://seu-dominio/cadastro`.
2. O cliente cria a loja e usa **14 dias grátis** com tudo liberado.
3. Ao vencer, o acesso é bloqueado automaticamente (os dados ficam salvos) e ele vê a tela
   `/assinatura` com os planos.
4. Você recebe o pagamento (Pix, cartão, boleto — como preferir) e libera no painel:
   `/admin` → **Plano** → escolha Pro/Business e o período (30/90/365 dias).
5. Cliente sem pagar? **Suspender**. Voltou a pagar? **Ativar**.

### Planos sugeridos (edite em `src/lib/plans.ts`)

| Plano | Preço | Período |
|---|---|---|
| Teste grátis | R$ 0 | 14 dias |
| Pro | R$ 49,90 | mensal |
| Business | R$ 89,90 | mensal |

---

## 6. Estrutura do projeto

```
src/app/            rotas (App Router)
  admin/            painel do dono do sistema
  assinatura/       planos e status da assinatura
  bloqueado/        tela de acesso suspenso/vencido
  cadastro/         cadastro self-service de novas lojas
  c/[slug]/         vitrine pública do catálogo
  api/health/       health check para monitoramento
  vendas, estoque, fiado, cadastros, relatorios, catalogo, ajustes
src/components/     componentes de UI (client/server)
src/lib/            regras, formatação, planos, auditoria, Supabase, imagens
supabase/           scripts SQL (rode na ordem numérica)
docs/               documentação completa
```

---

## 7. Segurança

- **RLS em todas as tabelas**: isolamento total entre lojas, garantido no banco.
- **Funções `security definer`** com `search_path` fixo e validação de `store_id`.
- **Vendas transacionais**: venda + itens + pagamentos + estoque em uma única transação.
- **Lojas vencidas/suspensas** não leem nem gravam dados (bloqueio no banco **e** no middleware).
- **Rate limiting** em login, cadastro e recuperação de senha.
- **Imagens no Storage** com pasta isolada por loja (não mais base64 no banco).
- **`SUPABASE_SERVICE_ROLE_KEY`** só no servidor, para redefinir senha de clientes.
- **Auditoria** de ações sensíveis em `audit_logs`.

Detalhes e riscos residuais em [SECURITY.md](docs/SECURITY.md).

---

## 8. Testar

Antes de entregar a um cliente, rode o checklist de [TESTING.md](docs/TESTING.md).
O teste mais importante é o de **isolamento entre lojas** (seção 2).

---

## 9. Próximos passos sugeridos

- Integração de pagamento automático (Stripe/Mercado Pago) para liberar plano sem ação manual.
- Convite de operadores por loja (o campo `profiles.role` já está preparado).
- Impressão térmica (ESC/POS) e emissão fiscal.
- Backup/exportação CSV dos dados da loja.
- Rate limiting distribuído (Upstash Redis) ao escalar.
