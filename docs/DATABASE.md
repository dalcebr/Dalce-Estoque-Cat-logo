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
| 8 | `009_storage_setup.sql` | Buckets de Storage (product-images, catalog-logos) |
| 9 | `010_catalog_enhancements.sql` | Campos extras do catalogo (description, collection, material, featured) |
| 10 | `011_catalog_customization.sql` | Personalizacao do catalogo (cores, fontes, beneficios) |
| 11 | `012_catalog_simplify.sql` | Simplificacao do catalogo |
| 12 | `013_catalog_enhancements.sql` | Melhorias do catalogo |
| 13 | `014_catalog_colors_dark.sql` | Tema escuro do catalogo |
| 14 | `015_catalog_sort_categories.sql` | Ordenacao de categorias e sold_count |
| 15 | `016_product_images.sql` | Galeria de fotos dos produtos (ate 5, coluna `images`) |
| 16 | `017_category_images.sql` | Foto de capa das categorias (coluna `image`) |

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
| `image` | text | NULL | | Foto de capa (storage path no bucket `product-images`) |

**Constraints**:
- UNIQUE `(store_id, name)`
- `categories_name_not_empty`: `trim(name) <> ''`

**Foto de capa**:
- Opcional. Quando definida, aparece no card da categoria na vitrine.
- Convertida para **WebP** no upload (mesmo padrao dos produtos: ate 1600 px,
  qualidade `0.92`) e com editor de recorte antes de enviar.
- Sem capa, o catalogo usa a primeira foto de um produto da categoria.

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
| `image` | text | NULL | | Foto principal (capa) - storage path ou base64 legado |
| `images` | text[] | NOT NULL | `'{}'` | Galeria de fotos (ate 5). A posicao 0 e a capa |
| `created_at` | timestamptz | NOT NULL | `now()` | Data de criacao |

**Constraints**:
- `price >= 0`
- `cost >= 0`
- `products_name_not_empty`: `trim(name) <> ''`
- `products_image_size`: `image IS NULL OR length(image) < 512000`

**Indices**:
- `products_store_active_idx`: `(store_id) WHERE active` (parcial)
- `products_images_idx`: GIN `(images)`

**Galeria de fotos**:
- Cada produto aceita ate **5 fotos** (`images`).
- A **primeira posicao** e a capa (foto principal) e e espelhada em `image`
  para compatibilidade com o restante do sistema.
- O usuario pode escolher qualquer foto como capa (ela e movida para a posicao 0).
- Todos os formatos de imagem sao convertidos para **WebP** no upload
  (client-side, via canvas) antes de irem para o bucket `product-images`.
- **Qualidade**: a imagem e reduzida para no maximo **1600 px** no maior lado
  (apenas se for maior), com downscale em etapas e qualidade WebP `0.92`.
  Imagens menores que 1600 px sao mantidas na resolucao original.
- **Recorte**: apos escolher a foto, o usuario pode ajustar o enquadramento
  (arrastar + zoom, recorte quadrado 1:1) antes do upload. Tambem e possivel
  recortar novamente uma foto ja enviada (o arquivo antigo e substituido).

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
| `store_name` | text | NULL | | Nome da loja exibido no catalogo |
| `phone` | text | NULL | | Numero / WhatsApp |
| `email` | text | NULL | | Email de contato |
| `stock_mode` | text | NOT NULL | `'all'` | Modo de exibicao de estoque |
| `instagram` | text | NULL | | Username Instagram |
| `hero_title` | text | NULL | | Titulo do banner principal |
| `hero_description` | text | NULL | | Descricao do banner |
| `hero_image` | text | NULL | | Imagem do banner (storage path) |
| `hero_button_text` | text | NOT NULL | `'VER PRODUTOS'` | Texto do botao do banner |
| `benefits` | jsonb | NOT NULL | `[]` | Beneficios (ate 4): `{icon,title,description}` |
| `colors` | jsonb | NOT NULL | (ver abaixo) | Cores do tema claro |
| `colors_dark` | jsonb | NOT NULL | (ver abaixo) | Cores do tema escuro |
| `fonts` | jsonb | NOT NULL | (ver abaixo) | Fonte 1, fonte 2 e onde cada uma e usada |
| `dark_mode_enabled` | boolean | NOT NULL | `true` | Exibe botao de modo escuro |
| `whatsapp_message` | text | NOT NULL | `'Ola! Gostaria de fazer um pedido:'` | Mensagem inicial do pedido |
| `updated_at` | timestamptz | NOT NULL | `now()` | Ultima atualizacao |

**Constraints**:
- `slug ~ '^[a-z0-9-]{3,30}$'`
- `stock_mode IN ('all', 'hide', 'unavailable')`
- `slug` UNIQUE

**RLS**: `catalogo da loja` - ALL onde `store_id = current_store_id()`

**`colors` / `colors_dark` (JSONB)** - mesma estrutura para os dois temas.
Grupos de chaves (todas hex `#RRGGBB`, exceto `hero_overlay_opacity` que e
`0`–`100`):

- **Fundo geral**: `page_bg`, `section_bg`, `divider`
- **Textos gerais**: `text_primary`, `text_secondary`, `text_tertiary`, `text_muted`
- **Cabecalho**: `header_bg`, `header_text`, `header_search_icon`, `header_wish_icon`, `header_cart_icon`, `header_wish_badge_bg`, `header_wish_badge_text`, `header_cart_badge_bg`, `header_cart_badge_text`, `header_icon_hover`, `header_wish_active`, `header_wish_inactive`
- **Banner/Hero**: `hero_overlay`, `hero_overlay_opacity`, `hero_title`, `hero_description`, `hero_button_bg`, `hero_button_text`, `hero_button_icon`, `hero_button_hover_bg`, `hero_button_hover_text`
- **Beneficios**: `benefit_bg`, `benefit_icon`, `benefit_title`, `benefit_description`, `benefit_border`, `benefit_hover_bg`, `benefit_hover_icon`
- **Categorias**: `category_title`, `category_bg`, `category_text`, `category_border`, `category_active_bg`, `category_active_text`, `category_active_border`, `category_hover_bg`, `category_hover_text`, `category_hover_border`
- **Secao de produtos**: `products_section_bg`, `products_title`
- **Pesquisa**: `search_bg`, `search_text`, `search_placeholder`, `search_icon`, `search_border`, `search_border_focus`
- **Filtros**: `filter_bg`, `filter_text`, `filter_border`, `filter_active_bg`, `filter_active_text`, `filter_active_border`, `filter_hover_bg`, `filter_hover_text`, `filter_hover_border`
- **Cards**: `card_bg`, `card_border`, `card_shadow`, `card_name`, `card_price`, `card_cart_icon`, `card_cart_icon_hover`
- **Favorito**: `fav_bg`, `fav_icon`, `fav_active_bg`, `fav_active_icon`, `fav_hover_bg`, `fav_hover_icon`
- **Sem imagem**: `placeholder_bg`, `placeholder_icon`, `placeholder_text`
- **Rodape**: `footer_bg`, `footer_title`, `footer_text`, `footer_link`, `footer_link_hover`, `footer_copyright`
- **Botao tema**: `theme_btn_bg`, `theme_btn_text`, `theme_btn_icon`, `theme_btn_border`
- **Estados**: `state_hover`, `state_focus`, `state_selection`, `state_disabled`, `state_error`, `state_success`, `state_warning`

**`fonts` (JSONB)** - chaves: `font_1`, `font_2` (valores: `inter`, `poppins`,
`montserrat`, `roboto`, `opensans`, `raleway`, `nunito`, `worksans`, `dmsans`,
`quicksand`, `josefin`, `oswald`, `bebas`, `righteous`, `playfair`, `lora`,
`cormorant`, `merriweather`, `cinzel`, `abril`, `dancing`, `pacifico`,
`greatvibes`, `satisfy`) e `store_name_font`, `heading_font`, `card_font`,
`body_font` (valores: `1` ou `2`).

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

O array `categories` traz `{name, color, image}`. A imagem segue esta ordem de
preferencia: capa da categoria (`categories.image`) → primeira foto do produto
mais recente da categoria → `products.image`.

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
