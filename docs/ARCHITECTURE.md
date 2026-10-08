# Arquitetura do Sistema

## Visao Geral

O Dalce Estoque segue o padrao do Next.js 15 App Router com Server Components e Server Actions. Nao existe API REST separada: todas as mutacoes sao feitas via Server Actions e todas as leituras sao feitas em Server Components diretamente no banco via Supabase client.

```
Browser (React 19)
    |
    v
Next.js App Router (Vercel Edge/Node)
    |
    +-- Server Components (leitura de dados)
    +-- Server Actions (mutacoes)
    |
    v
Supabase (PostgreSQL + Auth + RLS)
```

## Estrutura de Pastas

```
dalce-estoque/
├── src/
│   ├── app/                      # App Router (paginas e actions)
│   │   ├── page.tsx              # Dashboard principal (vendas do dia/mes, meta)
│   │   ├── actions.ts            # Action: setGoal
│   │   ├── layout.tsx            # Layout raiz com menu lateral
│   │   ├── login/                # Tela de login
│   │   │   ├── page.tsx
│   │   │   ├── actions.ts        # signIn, signOut
│   │   │   └── LoginForm.tsx     # Formulario client-side
│   │   ├── vendas/               # Modulo de vendas
│   │   │   ├── page.tsx          # Lista de vendas
│   │   │   ├── actions.ts        # cancelSale
│   │   │   ├── nova/
│   │   │   │   ├── page.tsx      # PDV (nova venda)
│   │   │   │   └── actions.ts    # createSale
│   │   │   └── [id]/page.tsx     # Detalhe da venda
│   │   ├── estoque/              # Controle de estoque
│   │   │   ├── page.tsx          # Lista de produtos com estoque
│   │   │   ├── actions.ts        # updateProduct
│   │   │   └── [id]/page.tsx     # Edicao de produto (estoque)
│   │   ├── cadastros/            # CRUD de cadastros
│   │   │   ├── page.tsx          # Menu de cadastros
│   │   │   ├── actions.ts        # saveProduct, saveCategory, saveCustomer, etc.
│   │   │   ├── produtos/         # Produtos
│   │   │   ├── categorias/       # Categorias
│   │   │   ├── clientes/         # Clientes
│   │   │   └── variacoes/        # Grupos de variacao
│   │   ├── catalogo/             # Configuracao do catalogo digital
│   │   │   ├── page.tsx
│   │   │   └── actions.ts        # saveCatalog
│   │   ├── c/[slug]/page.tsx     # Catalogo publico (vitrine)
│   │   ├── fiado/                # Controle de fiado
│   │   │   ├── page.tsx          # Lista de devedores
│   │   │   ├── actions.ts        # receiveFiado
│   │   │   └── [name]/page.tsx   # Historico por cliente
│   │   ├── relatorios/           # Relatorios
│   │   │   ├── page.tsx
│   │   │   └── filtros/page.tsx
│   │   └── ajustes/              # Configuracoes
│   │       ├── page.tsx
│   │       ├── actions.ts        # updateStore
│   │       ├── loja/page.tsx
│   │       └── geral/page.tsx
│   ├── components/               # Componentes reutilizaveis
│   │   ├── AppMenu.tsx           # Menu lateral do app
│   │   ├── Pdv.tsx               # Componente PDV (ponto de venda)
│   │   ├── CatalogForm.tsx       # Formulario do catalogo
│   │   ├── ProductForm.tsx       # Formulario de produto
│   │   ├── StockList.tsx         # Lista de estoque
│   │   ├── SalesList.tsx         # Lista de vendas
│   │   ├── GoalCard.tsx          # Card de meta mensal
│   │   ├── LineChart.tsx         # Grafico de linhas
│   │   └── ...
│   ├── lib/                      # Utilitarios e configuracao
│   │   ├── supabase/
│   │   │   ├── server.ts         # Supabase client (server-side)
│   │   │   ├── client.ts         # Supabase client (client-side)
│   │   │   └── middleware.ts     # Gerenciamento de sessao
│   │   ├── store.ts              # Helper getStore() para obter store_id
│   │   ├── validation.ts         # Validacao e sanitizacao de entrada
│   │   ├── format.ts             # Formatacao BRL, datas, fuso horario
│   │   ├── catalog.ts            # Tipos, cores, fontes e defaults do catalogo
│   │   ├── image.ts              # Resize de imagem client-side
│   │   ├── rate-limit.ts         # Rate limiter in-memory
│   │   ├── fiado.ts              # Logica de calculo de fiado
│   │   └── range.ts              # Ranges de data para relatorios
│   └── middleware.ts             # Middleware principal (auth + rate limit)
├── supabase/                     # Migrations SQL
│   ├── schema.sql                # Schema base
│   ├── 002_payment_method.sql    # Migracao: coluna payment_method
│   ├── 003_vendas_detalhe.sql    # Detalhes de venda, sale_items
│   ├── 004_pdv.sql               # Categorias, produtos, sale_payments
│   ├── 005_estoque_fiado.sql     # Estoque, fiado_receipts, RPCs
│   ├── 006_catalogo.sql          # catalog_settings, public_catalog()
│   ├── 007_cadastros.sql         # Clientes, variacoes, imagens
│   └── 008_security_hardening.sql # Correcoes de seguranca RLS
├── next.config.ts                # Config Next.js com CSP e security headers
├── package.json
├── tsconfig.json
└── .env.example
```

## Multi-Tenancy

### Estrategia: Row-Level Security (RLS) por Loja

Cada tabela de dados tem uma coluna `store_id` que referencia a tabela `stores`. O PostgreSQL usa RLS para garantir que cada usuario so acessa dados da sua propria loja.

### Funcao `current_store_id()`

```sql
CREATE OR REPLACE FUNCTION current_store_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT store_id FROM profiles WHERE id = auth.uid() $$;
```

Esta funcao:
1. Usa `auth.uid()` para pegar o ID do usuario autenticado
2. Consulta a tabela `profiles` para obter o `store_id` do usuario
3. Retorna o UUID da loja
4. E `SECURITY DEFINER` para poder ler `profiles` mesmo com RLS ativo
5. E `STABLE` para otimizacao de performance (cache por transacao)

### Policies RLS

Todas as tabelas de dados seguem o mesmo padrao:

```sql
CREATE POLICY "nome_da_policy" ON tabela
  FOR ALL
  USING (store_id = current_store_id())
  WITH CHECK (store_id = current_store_id());
```

Isso garante:
- **SELECT**: So retorna linhas onde `store_id` = loja do usuario
- **INSERT**: So permite inserir com `store_id` = loja do usuario
- **UPDATE**: So permite editar linhas da loja do usuario
- **DELETE**: So permite excluir linhas da loja do usuario

### Hierarquia de Dados

```
stores (loja)
  ├── profiles (usuarios vinculados)
  ├── categories (categorias de produto)
  ├── products (produtos)
  ├── sales (vendas)
  │   ├── sale_items (itens da venda)
  │   └── sale_payments (pagamentos da venda)
  ├── customers (clientes)
  ├── fiado_receipts (recebimentos de fiado)
  ├── catalog_settings (config do catalogo)
  └── variation_groups (grupos de variacao)
```

## Fluxo de Autenticacao

### Login Sintetico

O sistema usa email sintetico para simplificar o login:

1. Usuario digita apenas `meunome` e senha
2. O sistema constroi o email: `meunome@dalce.app`
3. Autentica via `supabase.auth.signInWithPassword()`
4. O middleware redireciona para `/` se autenticado ou `/login` se nao

```
Usuario: "joao"
    |
    v
Email construido: "joao@dalce.app"
    |
    v
Supabase Auth (signInWithPassword)
    |
    v
Cookie de sessao (via @supabase/ssr)
    |
    v
Middleware valida sessao em cada request
```

### Validacao de Username

O username e validado com regex `^[a-z0-9._-]+$` para evitar injecao no email construido.

## Fluxo de Dados (Exemplo: Criar Venda)

```
1. PDV (client) monta carrinho e pagamentos
    |
2. Chama Server Action createSale()
    |
3. Valida sessao (getUser)
    |
4. Busca profile (store_id)
    |
5. Valida todos os inputs (UUID, numeros, texto)
    |
6. Busca produtos do banco (verifica store_id)
    |
7. Recalcula precos a partir do banco (evita manipulacao client-side)
    |
8. Insere: sales -> sale_items -> sale_payments
    |
9. Auto-cadastra cliente se nao existir
    |
10. Baixa estoque via RPC apply_stock()
    |
11. Revalida cache e retorna codigo da venda
```

## Catalogo Publico

O catalogo digital e acessivel em `/c/[slug]` sem autenticacao.

### Como Funciona

1. A rota `/c/*` e marcada como publica no middleware (sem auth)
2. A pagina chama a RPC `public_catalog(slug)` com `SECURITY DEFINER`
3. A funcao retorna apenas dados necessarios (sem dados sensiveis)
4. O slug e validado (3-30 caracteres, lowercase alfanumerico)
5. So retorna dados se `catalog_settings.active = true`

### Seguranca do Catalogo Publico

- A funcao e `SECURITY DEFINER` (ignora RLS intencionalmente)
- Nao expoe estoque exato (apenas `available: true/false`)
- Remove campos internos (`store_id`, `slug`, `active`, `updated_at`)
- Valida tamanho do slug de entrada

## Imagens

Imagens de produto sao armazenadas como base64 no banco (campo `image` em `products`):

1. Usuario seleciona imagem no formulario
2. `resizeImage()` redimensiona client-side (Canvas API)
3. Converte para WebP com qualidade 0.85
4. Envia como data URI no FormData
5. Server Action valida tamanho (<150KB encoded)
6. DB constraint adicional: `length(image) < 512000`

## Locale e Fuso Horario

- Moeda: BRL (`R$ 1.234,56`)
- Fuso: `America/Sao_Paulo` (UTC-3)
- Formato de data: `dd/mm/aaaa HH:mm`
- Formato numerico brasileiro: `1.234,56` (ponto como separador de milhar, virgula decimal)
