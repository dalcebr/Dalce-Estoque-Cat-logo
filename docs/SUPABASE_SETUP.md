# Configuracao do Supabase

Guia completo para configurar o Supabase como backend do Dalce Estoque.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha a organizacao
4. Preencha:
   - **Name**: `dalce-estoque` (ou o nome desejado)
   - **Database Password**: Gere uma senha forte e guarde-a
   - **Region**: `South America (Sao Paulo)` - essencial para latencia
   - **Pricing Plan**: Free tier funciona para desenvolvimento
5. Aguarde a criacao (1-2 minutos)

## 2. Obter Credenciais

Apos a criacao, va em **Settings > API**:

- **Project URL**: `https://xxxxx.supabase.co` -> `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key**: chave longa que comeca com `eyJ...` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> A chave `anon` e segura para expor no client. Ela so permite operacoes permitidas pelas RLS policies.

## 3. Configurar Autenticacao

### 3.1 Desativar confirmacao de email

1. Va em **Authentication > Providers > Email**
2. Desative **"Confirm email"**
3. Salve

Isso e necessario porque o sistema usa emails sinteticos (`usuario@dalce.app`) que nao recebem emails reais.

### 3.2 Configurar URLs de redirecionamento

1. Va em **Authentication > URL Configuration**
2. **Site URL**: `https://seu-dominio.com` (ou `http://localhost:3000` para dev)
3. Em **Redirect URLs**, adicione:
   - `http://localhost:3000/**` (desenvolvimento)
   - `https://seu-dominio.com/**` (producao)
   - `https://*.vercel.app/**` (preview deploys)

## 4. Executar Migrations (SQL)

### Ordem Obrigatoria

Execute cada arquivo no **SQL Editor** do Supabase, um por vez, na ordem:

| # | Arquivo | Descricao |
|---|---------|-----------|
| 1 | `schema.sql` | Tabelas base (stores, profiles, sales), funcao current_store_id(), RLS |
| 2 | `003_vendas_detalhe.sql` | Colunas extras em sales, sale_items, trigger set_sale_number |
| 3 | `004_pdv.sql` | Tabelas categories, products, sale_payments |
| 4 | `005_estoque_fiado.sql` | Colunas stock/min_stock, fiado_receipts, RPCs apply_stock/cancel_sale |
| 5 | `006_catalogo.sql` | Tabela catalog_settings, funcao public_catalog() |
| 6 | `007_cadastros.sql` | Tabela customers, variation_groups, coluna image em products |
| 7 | `008_security_hardening.sql` | Correcoes de seguranca em RPCs, indices, constraints |

> **IMPORTANTE**: O `002_payment_method.sql` so e necessario se voce rodou o `schema.sql` em uma versao antiga que nao tinha `payment_method` na tabela `sales`.

### Como Executar

1. Abra o **SQL Editor** no painel do Supabase
2. Cole o conteudo do primeiro arquivo
3. Clique em **Run**
4. Verifique que nao houve erros
5. Repita para o proximo arquivo

## 5. Criar Primeiro Usuario

### 5.1 Criar usuario no Auth

1. Va em **Authentication > Users > Add user**
2. Email: `admin@dalce.app` (o "admin" sera o username de login)
3. Senha: escolha uma senha forte
4. Marque **Auto Confirm User**
5. Clique em **Create user**

### 5.2 Vincular a uma loja

No SQL Editor:

```sql
-- Cria loja e vincula o usuario
WITH s AS (
  INSERT INTO stores (name) VALUES ('Minha Loja')
  RETURNING id
)
INSERT INTO profiles (id, store_id, name)
SELECT
  (SELECT id FROM auth.users WHERE email = 'admin@dalce.app'),
  s.id,
  'Administrador'
FROM s;
```

### 5.3 Testar login

Acesse o app e faca login com:
- Usuario: `admin`
- Senha: a senha que voce definiu

## 6. Adicionar Mais Usuarios na Mesma Loja

```sql
-- Primeiro, crie o usuario no painel Authentication > Add user
-- Depois vincule no SQL:
INSERT INTO profiles (id, store_id, name)
SELECT
  (SELECT id FROM auth.users WHERE email = 'vendedor@dalce.app'),
  (SELECT store_id FROM profiles LIMIT 1),  -- usa a mesma loja
  'Nome do Vendedor';
```

## 7. Criar Nova Loja (Multi-Tenant)

```sql
-- Crie a loja
INSERT INTO stores (name) VALUES ('Loja Nova') RETURNING id;

-- Crie o usuario no painel Auth, depois vincule:
INSERT INTO profiles (id, store_id, name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dono@dalce.app'),
  'UUID-DA-LOJA-RETORNADO-ACIMA',
  'Dono da Loja Nova'
);
```

## 8. Verificar RLS

Apos as migrations, verifique que o RLS esta funcionando corretamente.

### 8.1 Verificar que RLS esta ativo

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas as tabelas devem ter `rowsecurity = true`.

### 8.2 Verificar policies existentes

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Resultado esperado (policies):

| Tabela | Policy |
|--------|--------|
| stores | loja propria (ler), loja propria (editar) |
| profiles | perfil proprio |
| sales | vendas da loja |
| sale_items | itens da loja |
| sale_payments | pagamentos da loja |
| categories | categorias da loja |
| products | produtos da loja |
| customers | clientes da loja |
| fiado_receipts | recebimentos da loja |
| catalog_settings | catalogo da loja |
| variation_groups | variacoes da loja |

### 8.3 Testar isolamento

Crie duas lojas com usuarios diferentes e verifique que um nao ve dados do outro:

```sql
-- Como usuario A, insira um produto
-- Faca login como usuario B e tente listar produtos
-- Deve retornar vazio
```

## 9. Funcoes RPC

O sistema usa as seguintes funcoes no banco:

| Funcao | Tipo | Descricao |
|--------|------|-----------|
| `current_store_id()` | SECURITY DEFINER | Retorna store_id do usuario logado |
| `set_sale_number()` | Trigger (SECURITY DEFINER) | Auto-incremento do numero da venda por loja |
| `apply_stock(items jsonb)` | SECURITY INVOKER | Baixa estoque ao vender |
| `cancel_sale(p_sale uuid)` | SECURITY INVOKER | Cancela venda e devolve estoque |
| `public_catalog(p_slug text)` | SECURITY DEFINER | Retorna dados publicos do catalogo |

## 10. Backup

### Free Tier

O Supabase free tier faz backup automatico diario com retencao de 7 dias. Para backup manual:

```sql
-- Exporte dados criticos via SQL Editor
SELECT * FROM stores;
SELECT * FROM products WHERE store_id = 'UUID';
-- etc.
```

### Pro Tier

- Backups point-in-time recovery (PITR)
- Retencao de 7 dias
- Restauracao para qualquer ponto no tempo

## Troubleshooting Supabase

### "permission denied for table"

RLS esta ativo mas o usuario nao tem policy. Verifique se a migration `008_security_hardening.sql` foi executada.

### "relation does not exist"

Migrations executadas fora de ordem. Execute na sequencia correta comecando do `schema.sql`.

### "duplicate key value violates unique constraint"

- `customers_store_name_idx`: Cliente com mesmo nome ja existe nessa loja
- `sales_store_number_idx`: Conflito de numero de venda (raro, resolver re-executando trigger)
- `categories (store_id, name)`: Categoria com mesmo nome ja existe

### Login nao funciona

1. Verifique se "Confirm email" esta desativado
2. Verifique se o usuario existe em Authentication > Users
3. Verifique se existe um registro em `profiles` para esse usuario
