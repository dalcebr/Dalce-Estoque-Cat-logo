# API.md

O **Dalce Estoque** não expõe uma API REST tradicional. O backend é composto por
**Server Actions** (chamadas RPC do Next.js) e **funções PL/pgSQL** no Supabase.

Isso é intencional: reduz a superfície de ataque, elimina CORS e mantém a autorização
no mesmo lugar que a lógica.

---

## 1. Route Handlers (HTTP)

### `GET /api/health`

Health check para monitoramento externo.

| Item | Valor |
|---|---|
| Autenticação | Nenhuma (público) |
| Autorização | N/A |
| Parâmetros | Nenhum |
| Resposta 200 | `{ status: "ok", db: "ok", uptime, latencyMs, timestamp }` |
| Resposta 503 | `{ status: "degradado", db: "erro", ... }` |
| Cache | `no-store` |
| Dados sensíveis | Nenhum (só confirma que o Postgres responde) |

**Uso:** configure UptimeRobot/Better Stack apontando para `https://app.seudominio.com/api/health`.

---

## 2. Server Actions

Todas as actions são chamadas via POST pelo Next.js (proteção CSRF nativa). A
autorização é sempre validada no servidor.

### Autenticação

| Action | Arquivo | Validação | Rate limit |
|---|---|---|---|
| `signIn` | `login/actions.ts` | e-mail + senha | 10 / 5 min por IP |
| `signUp` | `cadastro/actions.ts` | nome, e-mail, senha (≥6) | 5 / hora por IP |
| `requestPasswordReset` | `recuperar-senha/actions.ts` | e-mail | 5 / hora por IP |
| `updatePassword` | `redefinir-senha/actions.ts` | senha (≥6), sessão válida | — |
| `signOut` | `actions.ts` | sessão | — |

### Vendas

| Action | Arquivo | Autorização | Observação |
|---|---|---|---|
| `createSale` | `vendas/nova/actions.ts` | sessão + loja ativa | RPC transacional `create_sale` |
| `cancelSale` | `vendas/actions.ts` | sessão + `store_id` | RPC `cancel_sale` (devolve estoque) |

### Estoque e produtos

| Action | Arquivo | Autorização |
|---|---|---|
| `saveProduct` | `cadastros/actions.ts` | sessão + RLS |
| `archiveProduct` | `cadastros/actions.ts` | sessão + RLS |
| `saveCategory` / `deleteCategory` | `cadastros/actions.ts` | sessão + RLS |
| `saveCustomer` | `cadastros/actions.ts` | sessão + RLS |
| `saveVariation` / `deleteVariation` | `cadastros/actions.ts` | sessão + RLS |
| `adjustStock` | `estoque/actions.ts` | sessão + RLS |

### Fiado

| Action | Arquivo | Autorização |
|---|---|---|
| `receiveFiado` | `fiado/actions.ts` | sessão + RPC `receive_fiado` |

### Catálogo

| Action | Arquivo | Autorização |
|---|---|---|
| `saveCatalog` | `catalogo/actions.ts` | sessão + RLS |

### Ajustes

| Action | Arquivo | Autorização |
|---|---|---|
| `saveStore` | `ajustes/actions.ts` | sessão + RLS |

### Admin (super admin)

| Action | Arquivo | Autorização |
|---|---|---|
| `setPlan` | `admin/actions.ts` | `is_super_admin` (servidor) |
| `toggleStore` | `admin/actions.ts` | `is_super_admin` (servidor) |
| `resetOwnerPassword` | `admin/actions.ts` | `is_super_admin` + `service_role` |

---

## 3. Funções RPC (Postgres)

Chamadas via `supabase.rpc(...)`. Todas são `security definer` com `search_path` fixo.

| Função | Parâmetros | Retorno | Valida |
|---|---|---|---|
| `create_sale` | `p_items jsonb, p_payments jsonb, p_customer text, p_note text` | `jsonb` (id, number, created_at, total) | loja ativa, itens, pagamentos, estoque |
| `cancel_sale` | `p_sale uuid` | `void` | `store_id`, idempotência |
| `apply_stock` | `items jsonb` | `void` | `store_id` do produto |
| `receive_fiado` | `p_name text, p_amount numeric, p_method text` | `void` | loja, valor, método |
| `admin_set_plan` | `p_store uuid, p_plan text, p_days int` | `void` | `is_super_admin` |
| `admin_set_active` | `p_store uuid, p_active boolean` | `void` | `is_super_admin` |
| `current_store_id` | — | `uuid` | `auth.uid()` |
| `is_super_admin` | — | `boolean` | `auth.uid()` |
| `store_active` | `p_store uuid` | `boolean` | — |

### Erros de negócio (mensagens seguras de exibir)

- `carrinho vazio`
- `os pagamentos não fecham o total`
- `identifique o cliente para vender no fiado`
- `produto indisponível`
- `valor inválido`
- `loja inativa`

---

## 4. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Chamar action sem sessão | Toda action valida `auth.getUser()` |
| Passar `store_id` de outra loja | Actions ignoram; RLS filtra |
| IDOR em IDs de recurso | RLS + validação de `store_id` nas RPCs |
| Força bruta no login | Rate limiting por IP |
| Spam de cadastro | Rate limiting por IP |
| Abuso de upload | Limite de tamanho + tipo + pasta isolada |
| CSRF | Proteção nativa das server actions |
| Vazamento via API pública | Só `/api/health` é público e não expõe dados |

---

## 5. Convenções

- **Erros**: retornam `{ error: string }` com mensagem amigável (nunca stack trace).
- **Sucesso**: retornam `{ ok: true, ... }`.
- **Validação**: sempre no servidor, mesmo que o cliente já valide.
- **Revalidação**: `revalidatePath` após mutações para atualizar o cache.
- **Auditoria**: ações importantes chamam `logAction()`.
