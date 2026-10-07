# Seguranca

Documentacao da arquitetura de seguranca do Dalce Estoque, incluindo correcoes aplicadas e medidas de protecao.

## 1. Row-Level Security (RLS)

### Principio

Toda tabela com dados de loja tem RLS ativo. A funcao `current_store_id()` e usada em todas as policies para garantir isolamento entre lojas.

### Tabelas e Policies

| Tabela | Policy | Operacoes | Condicao |
|--------|--------|-----------|----------|
| `stores` | loja propria (ler) | SELECT | `id = current_store_id()` |
| `stores` | loja propria (editar) | UPDATE | `id = current_store_id()` |
| `profiles` | perfil proprio | SELECT | `id = auth.uid()` |
| `sales` | vendas da loja | ALL | `store_id = current_store_id()` |
| `sale_items` | itens da loja | ALL | `store_id = current_store_id()` |
| `sale_payments` | pagamentos da loja | ALL | `store_id = current_store_id()` |
| `categories` | categorias da loja | ALL | `store_id = current_store_id()` |
| `products` | produtos da loja | ALL | `store_id = current_store_id()` |
| `customers` | clientes da loja | ALL | `store_id = current_store_id()` |
| `fiado_receipts` | recebimentos da loja | ALL | `store_id = current_store_id()` |
| `catalog_settings` | catalogo da loja | ALL | `store_id = current_store_id()` |
| `variation_groups` | variacoes da loja | ALL | `store_id = current_store_id()` |

### Protecoes na tabela profiles

A tabela `profiles` so tem policy de SELECT (`id = auth.uid()`). Nao existem policies de INSERT, UPDATE ou DELETE, o que significa que essas operacoes sao **negadas pelo RLS** para qualquer usuario. Somente o service role (administrador do Supabase) pode gerenciar profiles.

## 2. Correcoes de Seguranca (008_security_hardening.sql)

### 2.1 Funcao `apply_stock()` - Correcao de bypass de RLS

**Vulnerabilidade**: A versao original era uma funcao SQL simples que atualizava produtos por ID sem verificar `store_id`. Um usuario poderia manipular estoque de produtos de outra loja.

**Correcao**: Reescrita como `plpgsql` com `SECURITY INVOKER` e verificacao explicita de `store_id`:

```sql
-- Verifica que o usuario esta autenticado
IF _store IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

-- So atualiza produtos da loja do usuario
UPDATE products SET stock = stock - _qty
WHERE id = _pid AND store_id = _store;

-- Falha se o produto nao for encontrado na loja
IF NOT FOUND THEN RAISE EXCEPTION 'product not found in your store'; END IF;
```

### 2.2 Funcao `cancel_sale()` - Correcao de bypass de RLS

**Vulnerabilidade**: Verificava status da venda mas nao verificava `store_id`. Um usuario poderia cancelar vendas de outra loja.

**Correcao**: Adicionado filtro `store_id = current_store_id()` em todas as queries:

```sql
-- So cancela vendas da loja do usuario
IF EXISTS (
  SELECT 1 FROM sales
  WHERE id = p_sale AND store_id = _store AND status = 'finalizada'
) THEN ...
```

### 2.3 Funcao `public_catalog()` - Validacao de entrada

**Correcao**: Adicionada validacao do slug de entrada:

```sql
WHEN p_slug IS NULL OR length(p_slug) < 3 OR length(p_slug) > 30 THEN NULL
```

E removidos campos internos da resposta (`store_id`, `slug`, `active`, `updated_at`).

### 2.4 Indices de performance

Adicionados indices para prevenir queries lentas que poderiam ser usadas para DoS:

```sql
CREATE INDEX products_store_active_idx ON products (store_id) WHERE active;
CREATE INDEX customers_store_idx ON customers (store_id);
CREATE INDEX sale_items_sale_idx ON sale_items (sale_id);
CREATE INDEX sale_payments_sale_idx ON sale_payments (sale_id);
CREATE INDEX fiado_receipts_store_customer_idx ON fiado_receipts (store_id, customer_name);
```

### 2.5 Constraints de integridade

Prevencao de dados invalidos no banco:

```sql
-- Nomes nao podem ser vazios
ALTER TABLE stores ADD CONSTRAINT stores_name_not_empty CHECK (trim(name) <> '');
ALTER TABLE categories ADD CONSTRAINT categories_name_not_empty CHECK (trim(name) <> '');
ALTER TABLE products ADD CONSTRAINT products_name_not_empty CHECK (trim(name) <> '');
ALTER TABLE customers ADD CONSTRAINT customers_name_not_empty CHECK (trim(name) <> '');

-- Limite de tamanho de imagem (500KB) para prevenir DoS
ALTER TABLE products ADD CONSTRAINT products_image_size CHECK (image IS NULL OR length(image) < 512000);
ALTER TABLE catalog_settings ADD CONSTRAINT catalog_logo_size CHECK (logo IS NULL OR length(logo) < 512000);
```

## 3. Security Headers

Configurados em `next.config.ts` e aplicados a todas as respostas:

### Content-Security-Policy (CSP)

```
default-src 'self';
script-src 'self' www.googletagmanager.com www.google-analytics.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: *.supabase.co;
font-src 'self';
connect-src 'self' *.supabase.co www.google-analytics.com;
worker-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Destaque:
- `frame-ancestors 'none'` - previne clickjacking (equivalente a X-Frame-Options: DENY)
- `form-action 'self'` - formularios so podem submeter para o proprio dominio
- `base-uri 'self'` - previne ataques de base tag injection
- `img-src data:` - necessario para imagens base64

### Outros Headers

| Header | Valor | Protecao |
|--------|-------|----------|
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita informacoes no referer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Desabilita APIs desnecessarias |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forca HTTPS por 2 anos |

### Aplicacao dupla

Os headers sao aplicados em dois pontos:
1. `next.config.ts` - via `async headers()` (todas as rotas)
2. `src/lib/supabase/middleware.ts` - via `applySecurityHeaders()` (respostas do middleware)

Isso garante cobertura tanto para paginas estaticas quanto dinamicas.

## 4. Rate Limiting

### Implementacao

`src/lib/rate-limit.ts` implementa um rate limiter in-memory:

- **Alvo**: POST em `/login`
- **Limite**: 10 requests por minuto por IP
- **Resposta**: HTTP 429 com header `Retry-After: 60`

### Limitacoes

- In-memory: Limpa-se no restart da funcao serverless
- Por instancia: Cada worker Vercel tem seu proprio contador
- **Recomendacao para producao**: Complementar com rate limiting no Cloudflare

### Extracao de IP

O middleware usa, em ordem de prioridade:
1. `x-forwarded-for` (primeiro IP da lista)
2. `x-real-ip`
3. `req.ip` (IP do Next.js)
4. `"unknown"` (fallback)

## 5. Validacao de Entrada

### Server Actions

Toda Server Action valida inputs antes de qualquer operacao no banco:

| Validacao | Funcao | Onde |
|-----------|--------|------|
| UUID | `isValidUUID()` | IDs de produto, venda, categoria |
| Texto | `sanitizeText()` | Nomes, notas, observacoes |
| Numeros | `parseDecimal()`, `parsePosInt()` | Precos, quantidades |
| Slug | `sanitizeSlug()` | Slug do catalogo |
| Metodo pagamento | `isValidPaymentMethod()` | Metodos de pagamento |
| Email | Regex | Email do catalogo |
| Telefone | Strip caracteres invalidos | Telefone do catalogo |
| Imagem | Prefixo `data:image/` + tamanho | Imagens de produto e logo |

### `sanitizeText()` - Detalhes

```typescript
export function sanitizeText(s: string, maxLen: number): string {
  return s
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .replace(/[<>&]/g, "")                                // prevent XSS
    .replace(/\s+/g, " ")                                 // collapse whitespace
    .slice(0, maxLen);
}
```

### Login - Protecoes especificas

- Username validado com `^[a-z0-9._-]+$` (previne injecao no email sintetico)
- Senha limitada a 128 caracteres
- Mensagem de erro generica ("Usuario ou senha invalidos") - nao revela se usuario existe

## 6. Protecao contra CSRF

Server Actions do Next.js tem protecao CSRF built-in:
- Verificacao automatica de `Origin` header
- Apenas requests POST sao aceitos
- Tokens CSRF automaticos via framework

## 7. Isolamento Multi-Tenant

### Camadas de protecao

1. **Banco (RLS)**: Cada query e filtrada por `store_id` no PostgreSQL
2. **Server Action**: `getStore()` obtem o `store_id` do usuario autenticado
3. **Queries adicionais**: Server Actions adicionam `.eq("store_id", s.storeId)` como seguranca extra
4. **RPCs (pos-hardening)**: `apply_stock()` e `cancel_sale()` verificam `store_id` explicitamente

### Exemplo de defesa em profundidade

Na `createSale()`:
1. Autentica usuario
2. Obtem `store_id` via profile
3. Valida todos os inputs
4. Busca produtos filtrando por `store_id` (Server Action)
5. RLS filtra novamente no banco
6. Insere sale/items/payments com `store_id` explicito
7. RPC `apply_stock()` verifica `store_id` novamente

## 8. Catalogo Publico - Seguranca

O catalogo em `/c/[slug]` e a unica rota publica:

- Middleware pula autenticacao para `/c/*`
- A RPC `public_catalog()` e `SECURITY DEFINER` (acesso total ao banco)
- Protecoes:
  - Validacao do slug (3-30 caracteres)
  - So retorna dados de catalogos com `active = true`
  - Nao expoe estoque exato (apenas boolean `available`)
  - Remove campos internos da resposta
  - Sem possibilidade de escrita

## 9. Header `X-Powered-By`

Removido via `poweredByHeader: false` no `next.config.ts`. Isso evita fingerprinting do framework.

## 10. Recomendacoes Adicionais para Producao

### Prioridade Alta

- [ ] Implementar rate limiting no Cloudflare (complementar ao in-memory)
- [ ] Migrar imagens de base64 para Supabase Storage (reduz tamanho do banco)
- [ ] Adicionar logging de acoes criticas (vendas, cancelamentos)

### Prioridade Media

- [ ] Implementar audit log no banco (trigger que registra alteracoes)
- [ ] Adicionar 2FA para contas de administrador
- [ ] Implementar session timeout configuravel
- [ ] Monitorar queries lentas no Supabase

### Prioridade Baixa

- [ ] Implementar CSP report-uri para monitorar violacoes
- [ ] Adicionar Subresource Integrity (SRI) para scripts externos
- [ ] Avaliar WAF dedicado (Cloudflare Pro)
