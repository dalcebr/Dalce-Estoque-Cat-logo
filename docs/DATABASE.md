# Referencia do Banco de Dados

Schema completo do PostgreSQL (Supabase) do Dalce Estoque.

## Ordem de Migrations

Execute os arquivos SQL no SQL Editor do Supabase, nesta ordem:

| # | Arquivo | Descricao |
|---|---------|-----------|
| 1 | `schema.sql` | Tabelas base, funcao current_store_id(), RLS |
| 2 | `003_vendas_detalhe.sql` | Colunas extras em sales, tabela sale_items, trigger |
| 3 | `004_pdv.sql` | Tabelas categories, products, sale_payments |
| 4 | `005_estoque_fiado.sql` | Colunas stock, tabela fiado_receipts, RPCs |
| 5 | `006_catalogo.sql` | Tabela catalog_settings, funcao public_catalog() |
| 6 | `007_cadastros.sql` | Tabela customers, variation_groups, coluna image |
| 7 | `008_security_hardening.sql` | Correcoes de seguranca, indices, constraints |

> `002_payment_method.sql` e uma migracao de compatibilidade para instalacoes antigas.

## Tabelas

### `stores` - Lojas

Tabela raiz do multi-tenancy. Cada loja e um tenant isolado.

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `name` | text | NOT NULL | | Nome da loja |
| `monthly_goal` | numeric(12,2) | NULL | | Meta mensal em BRL |
| `created_at` | timestamptz | NOT NULL | `now()` | Data de criacao |

**Constraints**:
- `stores_name_not_empty`: `trim(name) <> ''`

**RLS Policies**:
- `loja propria (ler)`: SELECT onde `id = current_store_id()`
- `loja propria (editar)`: UPDATE onde `id = current_store_id()`

---

### `profiles` - Perfis de usuario

Vincula um usuario do Supabase Auth a uma loja.

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | | PK, FK para `auth.users(id)` ON DELETE CASCADE |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `name` | text | NOT NULL | | Nome de exibicao |

**RLS Policies**:
- `perfil proprio`: SELECT onde `id = auth.uid()`
- Sem INSERT/UPDATE/DELETE = negado por RLS (somente service role)

---

### `sales` - Vendas

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `number` | int | NULL | Auto (trigger) | Numero sequencial por loja |
| `total` | numeric(12,2) | NOT NULL | | Valor total |
| `cost` | numeric(12,2) | NOT NULL | `0` | Custo total |
| `payment_method` | text | NULL | | Metodo principal de pagamento |
| `status` | text | NOT NULL | `'finalizada'` | `'finalizada'` ou `'cancelada'` |
| `customer_name` | text | NULL | | Nome do cliente |
| `seller_name` | text | NULL | | Nome do vendedor |
| `note` | text | NULL | | Observacao |
| `created_at` | timestamptz | NOT NULL | `now()` | Data/hora da venda |

**Constraints**:
- `total >= 0`
- `cost >= 0`
- `status IN ('finalizada', 'cancelada')`

**Indices**:
- `sales_store_date_idx`: `(store_id, created_at)`
- `sales_store_number_idx`: UNIQUE `(store_id, number)`

**Trigger**:
- `sales_number`: BEFORE INSERT executa `set_sale_number()` para auto-incrementar `number` por loja

**RLS**: `vendas da loja` - ALL onde `store_id = current_store_id()`

---

### `sale_items` - Itens da venda

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `sale_id` | uuid | NOT NULL | | FK para `sales(id)` ON DELETE CASCADE |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `product_id` | uuid | NULL | | FK para `products(id)` ON DELETE SET NULL |
| `name` | text | NOT NULL | | Nome do item (snapshot) |
| `qty` | int | NOT NULL | `1` | Quantidade |
| `total` | numeric(12,2) | NOT NULL | | Valor total do item |

**Constraints**:
- `qty > 0`
- `total >= 0`

**Indices**:
- `sale_items_sale_idx`: `(sale_id)`

**RLS**: `itens da loja` - ALL onde `store_id = current_store_id()`

---

### `sale_payments` - Pagamentos da venda

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `sale_id` | uuid | NOT NULL | | FK para `sales(id)` ON DELETE CASCADE |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `method` | text | NOT NULL | | Metodo: dinheiro, pix, debito, credito, fiado, outro |
| `amount` | numeric(12,2) | NOT NULL | | Valor pago |

**Constraints**:
- `amount > 0`

**Indices**:
- `sale_payments_sale_idx`: `(sale_id)`

**RLS**: `pagamentos da loja` - ALL onde `store_id = current_store_id()`

---

### `categories` - Categorias de produto

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `name` | text | NOT NULL | | Nome da categoria |
| `color` | text | NOT NULL | `'#0f8b83'` | Cor hexadecimal |

**Constraints**:
- UNIQUE `(store_id, name)`
- `categories_name_not_empty`: `trim(name) <> ''`

**RLS**: `categorias da loja` - ALL onde `store_id = current_store_id()`

---

### `products` - Produtos

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `category_id` | uuid | NULL | | FK para `categories(id)` ON DELETE SET NULL |
| `name` | text | NOT NULL | | Nome do produto |
| `price` | numeric(12,2) | NOT NULL | | Preco de venda |
| `cost` | numeric(12,2) | NOT NULL | `0` | Custo |
| `stock` | int | NOT NULL | `0` | Estoque atual (pode ser negativo) |
| `min_stock` | int | NOT NULL | `0` | Estoque minimo para alerta |
| `active` | boolean | NOT NULL | `true` | Produto ativo ou arquivado |
| `image` | text | NULL | | Imagem base64 (data URI WebP) |
| `created_at` | timestamptz | NOT NULL | `now()` | Data de criacao |

**Constraints**:
- `price >= 0`
- `cost >= 0`
- `products_name_not_empty`: `trim(name) <> ''`
- `products_image_size`: `image IS NULL OR length(image) < 512000`

**Indices**:
- `products_store_active_idx`: `(store_id) WHERE active` (parcial)

**RLS**: `produtos da loja` - ALL onde `store_id = current_store_id()`

---

### `customers` - Clientes

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `name` | text | NOT NULL | | Nome do cliente |
| `phone` | text | NULL | | Telefone |
| `cpf` | text | NULL | | CPF (11 digitos, sem formatacao) |
| `created_at` | timestamptz | NOT NULL | `now()` | Data de criacao |

**Constraints**:
- `customers_name_not_empty`: `trim(name) <> ''`

**Indices**:
- `customers_store_name_idx`: UNIQUE `(store_id, lower(name))`
- `customers_store_idx`: `(store_id)`

**RLS**: `clientes da loja` - ALL onde `store_id = current_store_id()`

---

### `fiado_receipts` - Recebimentos de fiado

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `customer_name` | text | NOT NULL | | Nome do cliente (texto livre) |
| `amount` | numeric(12,2) | NOT NULL | | Valor recebido |
| `method` | text | NOT NULL | `'dinheiro'` | Metodo de pagamento |
| `created_at` | timestamptz | NOT NULL | `now()` | Data do recebimento |

**Constraints**:
- `amount > 0`

**Indices**:
- `fiado_receipts_store_customer_idx`: `(store_id, customer_name)`

**RLS**: `recebimentos da loja` - ALL onde `store_id = current_store_id()`

---

### `catalog_settings` - Configuracoes do catalogo

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `store_id` | uuid | NOT NULL | | PK, FK para `stores(id)` ON DELETE CASCADE |
| `active` | boolean | NOT NULL | `false` | Catalogo ativo? |
| `slug` | text | NULL | | Link personalizado (unico) |
| `logo` | text | NULL | | Logo base64 |
| `phone` | text | NULL | | Telefone |
| `email` | text | NULL | | Email de contato |
| `stock_mode` | text | NOT NULL | `'all'` | Modo de exibicao de estoque |
| `instagram` | text | NULL | | Username Instagram |
| `facebook` | text | NULL | | Username Facebook |
| `analytics_id` | text | NULL | | Google Analytics ID |
| `highlight` | text | NULL | | Texto de destaque |
| `top_text` | text | NULL | | Texto superior |
| `about` | text | NULL | | Sobre a loja |
| `theme` | text | NOT NULL | `'azul'` | Tema visual |
| `updated_at` | timestamptz | NOT NULL | `now()` | Ultima atualizacao |

**Constraints**:
- `slug ~ '^[a-z0-9-]{3,30}$'`
- `stock_mode IN ('all', 'hide', 'unavailable')`
- `catalog_logo_size`: `logo IS NULL OR length(logo) < 512000`
- `slug` UNIQUE

**RLS**: `catalogo da loja` - ALL onde `store_id = current_store_id()`

---

### `variation_groups` - Grupos de variacao

| Coluna | Tipo | Nullable | Default | Descricao |
|--------|------|----------|---------|-----------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `store_id` | uuid | NOT NULL | | FK para `stores(id)` |
| `name` | text | NOT NULL | | Nome do grupo (ex: "Tamanho", "Cor") |
| `options` | text[] | NOT NULL | `'{}'` | Array de opcoes |
| `created_at` | timestamptz | NOT NULL | `now()` | Data de criacao |

**RLS**: `variacoes da loja` - ALL onde `store_id = current_store_id()`

## Funcoes

### `current_store_id()`

```sql
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
```

Retorna o `store_id` do usuario autenticado consultando `profiles`. Usada em todas as RLS policies.

### `set_sale_number()`

```sql
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
```

Trigger BEFORE INSERT em `sales`. Auto-incrementa `number` por loja.

### `apply_stock(items jsonb)`

```sql
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER
```

Baixa estoque de multiplos produtos. Valida que cada produto pertence a loja do usuario.

### `cancel_sale(p_sale uuid)`

```sql
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER
```

Cancela venda e restaura estoque. Verifica propriedade da venda.

### `public_catalog(p_slug text)`

```sql
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
```

Retorna dados publicos do catalogo. Acessivel por `anon` e `authenticated`. Valida slug e retorna apenas catalogos ativos.

## Diagrama de Relacionamentos

```
auth.users
    |
    | 1:1
    v
profiles -----> stores (1 profile : 1 store)
                  |
    +-------------+-------------+-------------+-------------+
    |             |             |             |             |
    v             v             v             v             v
 sales      categories     products     customers    catalog_settings
    |             |             ^
    +------+      +-------------+
    |      |
    v      v
sale_items  sale_payments
                                                    variation_groups
                                                    fiado_receipts
```

## Tipos de Dados Importantes

### Metodos de pagamento

Valores aceitos em `sale_payments.method` e `sales.payment_method`:

- `dinheiro` - Dinheiro
- `pix` - PIX
- `debito` - Cartao de debito
- `credito` - Cartao de credito
- `fiado` - Fiado (a prazo, sem pagamento imediato)
- `outro` - Outros

### Status da venda

Valores aceitos em `sales.status`:

- `finalizada` - Venda concluida
- `cancelada` - Venda cancelada (estoque devolvido)

### Modo de estoque no catalogo

Valores aceitos em `catalog_settings.stock_mode`:

- `all` - Mostra todos os produtos
- `hide` - Esconde produtos sem estoque
- `unavailable` - Mostra como "indisponivel"

### Temas do catalogo

Valores aceitos em `catalog_settings.theme`:

- `azul` - Tema azul (padrao)
- `noite` - Tema escuro com amarelo
- `vibrante` - Tema colorido (rosa, ciano, verde)
- `floresta` - Tema verde
