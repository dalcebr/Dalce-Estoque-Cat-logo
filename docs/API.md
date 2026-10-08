# Referencia de Server Actions

O Dalce Estoque usa Server Actions do Next.js para todas as mutacoes. Nao existe API REST separada. Todas as actions requerem autenticacao (exceto onde indicado).

## Autenticacao

### `signIn(prevState, formData)` - Login

- **Arquivo**: `src/app/login/actions.ts`
- **Auth**: Nao requer (e a action de login)
- **Parametros** (FormData):
  - `usuario` (string): Nome de usuario (sem `@dalce.app`). Aceita: `a-z`, `0-9`, `.`, `_`, `-`
  - `senha` (string): Senha do usuario (max 128 caracteres)
- **Retorno**: `{ error?: string }` ou redirect para `/`
- **Validacoes**:
  - Username deve corresponder a `^[a-z0-9._-]+$`
  - Senha nao pode ser vazia nem exceder 128 caracteres
- **Comportamento**: Constroi email sintetico (`usuario@dalce.app`) e autentica via Supabase Auth

### `signOut()` - Logout

- **Arquivo**: `src/app/login/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros**: Nenhum
- **Retorno**: Redirect para `/login`

## Dashboard

### `setGoal(formData)` - Definir meta mensal

- **Arquivo**: `src/app/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `meta` (string): Valor da meta em formato brasileiro (`1.000,50`). Deve ser > 0 e <= 100.000.000
- **Retorno**: Nenhum (revalida `/`)
- **Comportamento**: Atualiza `stores.monthly_goal` para a loja do usuario

## Vendas

### `createSale(input)` - Criar nova venda

- **Arquivo**: `src/app/vendas/nova/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (objeto):
  ```typescript
  {
    items: Array<{
      productId?: string;  // UUID do produto (opcional para venda rapida)
      name: string;        // Nome do item
      qty: number;         // Quantidade (>= 1)
      price: number;       // Preco unitario (>= 0)
    }>;
    payments: Array<{
      method: string;      // "dinheiro" | "pix" | "debito" | "credito" | "fiado" | "outro"
      amount: number;      // Valor pago (> 0)
    }>;
    customer?: string;     // Nome do cliente (obrigatorio se fiado)
    note?: string;         // Observacao (max 500 chars)
  }
  ```
- **Retorno**: `{ ok: true, code: string, time: string }` ou `{ error: string }`
- **Validacoes**:
  - Max 200 itens, max 10 pagamentos
  - UUIDs de produto validados
  - Precos recalculados a partir do banco (para produtos cadastrados)
  - Soma dos pagamentos deve bater com total
  - Fiado requer nome do cliente
- **Efeitos colaterais**:
  - Insere `sales`, `sale_items`, `sale_payments`
  - Auto-cadastra cliente se nao existir
  - Baixa estoque via RPC `apply_stock()`
  - Revalida `/` e `/vendas`

### `cancelSale(id)` - Cancelar venda

- **Arquivo**: `src/app/vendas/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros**:
  - `id` (string): UUID da venda
- **Retorno**: Nenhum
- **Validacoes**: UUID validado
- **Comportamento**: Chama RPC `cancel_sale()` que:
  - Verifica que a venda e da loja do usuario
  - Verifica status `finalizada`
  - Devolve estoque dos itens
  - Muda status para `cancelada`

## Estoque

### `updateProduct(formData)` - Atualizar produto (via estoque)

- **Arquivo**: `src/app/estoque/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `id` (string): UUID do produto
  - `name` (string): Nome (max 80 chars)
  - `price` (string): Preco de venda (formato BR)
  - `cost` (string): Custo (formato BR)
  - `stock` (string): Quantidade em estoque
  - `min_stock` (string): Estoque minimo
- **Retorno**: Redirect para `/estoque`
- **Validacoes**: UUID, nome nao vazio, preco >= 0, custo >= 0, stock finito

## Fiado

### `receiveFiado(formData)` - Registrar recebimento de fiado

- **Arquivo**: `src/app/fiado/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `name` (string): Nome do cliente
  - `amount` (string): Valor recebido (formato BR, > 0)
  - `method` (string): Metodo de pagamento (default: `dinheiro`)
- **Retorno**: Nenhum (revalida `/fiado`)

## Catalogo

### `saveCatalog(settings)` - Salvar configuracoes do catalogo

- **Arquivo**: `src/app/catalogo/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (objeto CatalogSettings):
  ```typescript
  {
    active: boolean;       // Catalogo ativo?
    slug: string;          // Link personalizado (3-30 chars, lowercase alfanumerico)
    store_name: string;    // Nome da loja exibido no catalogo (max 80 chars)
    phone: string;         // Numero / WhatsApp (max 20 chars)
    email: string;         // Email de contato
    instagram: string;     // Username Instagram
    stock_mode: "all" | "hide" | "unavailable";  // Modo de exibicao de estoque
    hero_title: string;    // Titulo do banner (max 80 chars)
    hero_subtitle: string; // Subtitulo do banner (max 80 chars)
    hero_description: string; // Descricao do banner (max 200 chars)
    hero_image: string;    // Imagem do banner (storage path ou base64)
    hero_button_text: string; // Texto do botao (max 40 chars)
    benefits: Array<{ icon: string; title: string; description: string }>; // ate 4
    colors: {              // Cores de cada elemento (hex #RRGGBB)
      page_bg, header_bg, card_bg, card_text, store_name,
      heading, body_text, button_bg, button_text, footer_bg
    };
    fonts: {               // Fonte 1, fonte 2 e onde cada uma e usada
      font_1, font_2,      // "inter" | "poppins" | "montserrat" | "roboto" | "playfair" | "lora"
      store_name_font, heading_font, card_font, body_font  // 1 | 2
    };
    dark_mode_enabled: boolean; // Exibe botao de modo escuro
    whatsapp_message: string;   // Mensagem inicial do pedido (max 300 chars)
  }
  ```
- **Retorno**: `{ ok: true, slug: string }` ou `{ error: string }`
- **Validacoes**:
  - Slug: minimo 3 caracteres se ativo
  - Imagem do banner: storage path valido ou base64 < 300KB
  - Email: formato basico de email
  - Instagram: `^[A-Za-z0-9._-]{0,60}$`
  - Cores: cada valor deve ser `#RRGGBB`
  - Fontes: valores dentro da lista permitida; slots 1 ou 2
- **Comportamento**: Upsert em `catalog_settings`

## Cadastros

### `saveProduct(formData)` - Criar/editar produto

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `id` (string, opcional): UUID para edicao. Vazio para criacao
  - `name` (string): Nome do produto (max 80 chars)
  - `price` (string): Preco (formato BR, > 0)
  - `cost` (string): Custo (formato BR, >= 0)
  - `stock` (string): Estoque
  - `min_stock` (string): Estoque minimo
  - `image` (string, opcional): Imagem base64 (max 150KB, deve comecar com `data:image/`)
  - `category_id` (string, opcional): UUID da categoria
- **Retorno**: Redirect para `/cadastros/produtos`

### `archiveProduct(id)` - Arquivar produto

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros**:
  - `id` (string): UUID do produto
- **Retorno**: Redirect para `/cadastros/produtos`
- **Comportamento**: Define `active = false` no produto

### `saveCategory(formData)` - Criar/editar categoria

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `id` (string, opcional): UUID para edicao
  - `name` (string): Nome (max 40 chars)
  - `color` (string): Cor hexadecimal (`#RRGGBB`)
- **Retorno**: Redirect para `/cadastros/categorias`
- **Erro especial**: Redirect com `?erro=nome` se nome duplicado na loja

### `deleteCategory(id)` - Excluir categoria

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros**:
  - `id` (string): UUID da categoria
- **Retorno**: Redirect para `/cadastros/categorias`
- **Comportamento**: Produtos dessa categoria ficam sem categoria (`ON DELETE SET NULL`)

### `saveCustomer(formData)` - Criar/editar cliente

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `id` (string, opcional): UUID para edicao
  - `name` (string): Nome (max 80 chars, obrigatorio para criacao)
  - `phone` (string, opcional): Telefone (max 20 chars)
  - `cpf` (string, opcional): CPF (11 digitos)
- **Retorno**: Redirect para `/cadastros/clientes`
- **Erros especiais**: Redirect com `?erro=cpf` (CPF invalido) ou `?erro=nome` (nome duplicado)
- **Nota**: Na edicao, nome nao pode ser alterado (somente telefone e CPF)

### `saveVariation(formData)` - Criar/editar grupo de variacao

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `id` (string, opcional): UUID para edicao
  - `name` (string): Nome do grupo (max 40 chars)
  - `options` (string): Opcoes separadas por quebra de linha, virgula ou ponto-e-virgula (max 30 chars cada, max 50 opcoes)
- **Retorno**: Redirect para `/cadastros/variacoes`

### `deleteVariation(id)` - Excluir grupo de variacao

- **Arquivo**: `src/app/cadastros/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros**:
  - `id` (string): UUID do grupo
- **Retorno**: Redirect para `/cadastros/variacoes`

## Ajustes

### `updateStore(formData)` - Atualizar nome da loja

- **Arquivo**: `src/app/ajustes/actions.ts`
- **Auth**: Requer autenticacao
- **Parametros** (FormData):
  - `name` (string): Novo nome da loja
- **Retorno**: Redirect para `/ajustes`

## Funcoes RPC (Banco)

Chamadas via `supabase.rpc()`:

### `apply_stock(items jsonb)`

- **Descricao**: Baixa estoque de produtos apos venda
- **Seguranca**: SECURITY INVOKER (RLS aplica)
- **Input**: Array JSON de `{ productId: UUID, qty: integer }`
- **Verificacao**: Cada produto deve pertencer a loja do usuario
- **Erro**: Exception se produto nao encontrado na loja

### `cancel_sale(p_sale uuid)`

- **Descricao**: Cancela venda e devolve estoque
- **Seguranca**: SECURITY INVOKER
- **Verificacao**: Venda deve ser da loja do usuario e estar `finalizada`
- **Efeito**: Restaura estoque e muda status para `cancelada`

### `public_catalog(p_slug text)`

- **Descricao**: Retorna dados publicos do catalogo para vitrine
- **Seguranca**: SECURITY DEFINER (acesso publico intencional)
- **Acesso**: Concedido a roles `anon` e `authenticated`
- **Retorno**: JSONB com `{ name, settings, products }` ou null
