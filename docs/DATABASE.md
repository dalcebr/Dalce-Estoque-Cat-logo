# DATABASE.md

Modelo de dados do **Dalce Estoque** (PostgreSQL / Supabase).

---

## 1. Visão geral

```text
stores (lojas)
  ├── profiles (usuários → loja)
  ├── products (produtos)
  │     └── categories (categorias)
  ├── variation_groups (variações)
  ├── customers (clientes)
  ├── sales (vendas)
  │     ├── sale_items (itens)
  │     └── sale_payments (pagamentos)
  ├── fiado_receipts (recebimentos de fiado)
  ├── catalog_settings (catálogo público)
  └── audit_logs (auditoria)
```

**Regra central:** toda tabela de dados tem `store_id`. O RLS filtra por
`store_id = current_store_id()`.

---

## 2. Tabelas principais

### `stores`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador da loja |
| `name` | text | Nome da loja |
| `plan` | text | `trial`, `pro`, `business`, `blocked` |
| `active` | boolean | Loja ativa |
| `trial_ends_at` | timestamptz | Fim do teste |
| `plan_ends_at` | timestamptz | Fim do plano pago |
| `created_at` / `updated_at` | timestamptz | Controle |

### `profiles`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `store_id` | uuid FK | Loja do usuário |
| `role` | text | `owner` / `member` |
| `is_super_admin` | boolean | Acesso ao painel admin |
| `created_at` | timestamptz | Controle |

### `products`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `store_id` | uuid FK | Isolamento |
| `name` | text | Nome |
| `price` | numeric(12,2) | Preço de venda |
| `cost` | numeric(12,2) | Custo |
| `stock` | int | Quantidade |
| `min_stock` | int | Estoque mínimo (alerta) |
| `category_id` | uuid FK | Categoria (opcional) |
| `image` | text | URL no Storage |
| `active` | boolean | Arquivado ou não |

### `sales` / `sale_items` / `sale_payments`

- `sales`: cabeçalho (total, custo, cliente, vendedor, status, número sequencial).
- `sale_items`: itens (produto, nome, quantidade, total).
- `sale_payments`: pagamentos (método, valor) — permite pagamento dividido.

### `fiado_receipts`

Recebimentos de dívidas de fiado (cliente, valor, método, data).

### `catalog_settings`

Configuração do catálogo público: `slug` (único), `active`, `logo`, `theme`,
`phone`, `email`, `instagram`, `facebook`, `analytics_id`, textos e `stock_mode`.

### `audit_logs`

Registro de ações: `store_id`, `actor_id`, `actor_name`, `action`, `detail`, `created_at`.

---

## 3. Índices

Criados no `009_seguranca_integridade.sql` para as consultas mais pesadas:

| Índice | Tabela | Uso |
|---|---|---|
| `sale_payments_store_method_idx` | sale_payments | Relatórios por forma de pagamento |
| `sale_payments_sale_idx` | sale_payments | Detalhe da venda |
| `sale_items_sale_idx` | sale_items | Detalhe da venda |
| `sale_items_store_idx` | sale_items | Relatórios |
| `fiado_receipts_store_name_idx` | fiado_receipts | Extrato de fiado por cliente |
| `products_store_active_idx` | products | Listagem de produtos ativos |
| `products_store_category_idx` | products | Filtro por categoria |
| `sales_store_status_date_idx` | sales | Relatórios por período |
| `customers_store_idx` | customers | Listagem de clientes |

> Todas as consultas filtram por `store_id`, então os índices começam por essa coluna.

---

## 4. Integridade e atomicidade

### Venda transacional

`create_sale` executa em **uma única transação**:

1. Valida loja ativa.
2. Valida itens e busca preços **no banco** (não confia no cliente).
3. Valida que a soma dos pagamentos = total.
4. Insere venda, itens e pagamentos.
5. Baixa o estoque.
6. Cadastra cliente novo (se houver).

Se qualquer passo falhar, **nada** é gravado. Antes eram 4 chamadas separadas que
podiam deixar dados inconsistentes.

### Cancelamento

`cancel_sale` valida `store_id`, é idempotente (cancelar duas vezes não devolve
estoque duas vezes) e usa `for update` para evitar concorrência.

---

## 5. RLS (Row Level Security)

Todas as tabelas têm RLS ativo. Padrão das políticas:

```sql
-- leitura: só a própria loja
using (store_id = current_store_id())

-- escrita: só a própria loja
with check (store_id = current_store_id())
```

`current_store_id()` é `security definer` com `search_path = public` fixo, resolvendo
a loja a partir de `auth.uid()`.

---

## 6. Performance

### O que já está otimizado

- Índices em todas as consultas quentes.
- Consultas sempre filtradas por `store_id` (usa índice).
- Agregações feitas no banco, não no cliente.
- Paginação/limite nas listagens.

### Pontos de atenção ao crescer

| Consulta | Risco | Solução |
|---|---|---|
| Relatórios por período | Fica lenta com muitas vendas | View materializada ou agregação pré-calculada |
| Extrato de fiado | Muitos registros por cliente | Já indexado; monitorar |
| Listagem de produtos | Muitos produtos | Já indexado; adicionar paginação se necessário |

---

## 7. Backups

- **Free**: backup diário, retenção 7 dias.
- **Pro**: PITR disponível.
- **Manual**: `pg_dump` (veja `docs/SUPABASE_SETUP.md`, seção 9).

---

## 8. Migrações

Os scripts em `supabase/` são **idempotentes** (`if not exists`, `create or replace`)
e devem ser rodados **na ordem**:

```text
schema.sql → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009
```

Para uma migração nova, crie `010_<descricao>.sql` seguindo o mesmo padrão.

---

## 9. Manutenção

- Monitore o tamanho do banco (Database → Reports).
- Revise consultas lentas (Logs → Postgres).
- Rode `VACUUM ANALYZE` periodicamente em tabelas grandes (o Supabase faz automático).
- Verifique índices não usados antes de adicionar novos.
