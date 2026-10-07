# Dalce Estoque

SaaS de gestão para pequenos negócios: **PDV, estoque, fiado, relatórios e catálogo online**.
Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (Auth + Postgres com RLS).

Multi-loja de verdade: cada loja só enxerga os próprios dados (RLS no banco) e o dono do
sistema tem um painel para gerenciar lojas, planos e vencimentos.

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

## 2. Instalação (passo a passo)

### 2.1 Banco de dados
No Supabase → **SQL Editor**, rode os arquivos **nesta ordem**:

```
supabase/schema.sql
supabase/003_vendas_detalhe.sql
supabase/004_pdv.sql
supabase/005_estoque_fiado.sql
supabase/006_catalogo.sql
supabase/007_cadastros.sql
supabase/008_saas.sql      ← planos, painel do dono, auditoria, segurança
```

> Se você já tinha o banco instalado, rode apenas o `008_saas.sql`.

### 2.2 Autenticação
Supabase → **Authentication → Providers → Email**:
- Em produção, mantenha **"Confirm email" ativado** (recomendado).
- Em testes locais, pode desativar para entrar mais rápido.

### 2.3 Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**secreta**) |
| `NEXT_PUBLIC_APP_NAME` | Nome do seu produto |
| `NEXT_PUBLIC_APP_URL` | URL pública (ex.: `https://app.seudominio.com`) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | E-mail de suporte mostrado no app |

### 2.4 Rodar localmente
```bash
npm install
npm run dev
```

### 2.5 Criar sua conta de dono do sistema
1. Acesse `/cadastro` e crie sua loja (ex.: "Dalce Matriz").
2. No SQL Editor, promova seu usuário:
```sql
update profiles set is_super_admin = true
where id = (select id from auth.users where email = 'seu-email@dominio.com');
```
3. Saia e entre novamente: o menu passa a mostrar **Painel do dono** (`/admin`).

---

## 3. Publicar (Vercel)

1. Suba o repositório no GitHub e importe na Vercel.
2. Configure as variáveis de ambiente da seção 2.3 (Production e Preview).
3. Deploy. Depois, ajuste `NEXT_PUBLIC_APP_URL` para o domínio final e faça novo deploy.

---

## 4. Como vender (operação comercial)

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

## 5. Estrutura do projeto

```
src/app/            rotas (App Router)
  admin/            painel do dono do sistema
  assinatura/       planos e status da assinatura
  bloqueado/        tela de acesso suspenso/vencido
  cadastro/         cadastro self-service de novas lojas
  c/[slug]/         vitrine pública do catálogo
  vendas, estoque, fiado, cadastros, relatorios, catalogo, ajustes
src/components/     componentes de UI (client/server)
src/lib/            regras, formatação, planos, auditoria, Supabase
supabase/           scripts SQL (rode na ordem numérica)
```

---

## 6. Segurança

- RLS em todas as tabelas: isolamento total entre lojas.
- Funções `security definer` com `search_path` fixo.
- Lojas vencidas/suspensas não conseguem ler nem gravar dados (bloqueio no banco **e** no middleware).
- `SUPABASE_SERVICE_ROLE_KEY` só é usada no servidor, para redefinir senha de clientes.
- Auditoria de ações sensíveis em `audit_logs`.

---

## 7. Próximos passos sugeridos

- Integração de pagamento automático (Stripe/Mercado Pago) para liberar plano sem ação manual.
- Convite de operadores por loja (o campo `profiles.role` já está preparado).
- Impressão térmica (ESC/POS) e emissão fiscal.
- Backup/exportação CSV dos dados da loja.
