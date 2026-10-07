# Troubleshooting

Problemas comuns e suas solucoes no Dalce Estoque.

## Autenticacao

### "Usuario ou senha invalidos" mas as credenciais estao corretas

**Causas possiveis**:

1. **"Confirm email" esta ativo no Supabase**
   - Solucao: Va em Authentication > Providers > Email e desative "Confirm email"
   - Depois confirme manualmente o usuario existente no SQL:
   ```sql
   UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'usuario@dalce.app';
   ```

2. **Profile nao existe para o usuario**
   - Verifique: `SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@dalce.app');`
   - Se vazio, crie o profile vinculando a uma loja

3. **Username com maiusculas ou caracteres especiais**
   - O login converte para lowercase automaticamente
   - Verifique se o email no Supabase esta em lowercase

### Redirecionamento infinito apos login

**Causa**: Cookie de sessao nao esta sendo setado corretamente.

**Solucoes**:
1. Limpe cookies do browser
2. Verifique que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estao corretos
3. Verifique que a URL do site no Supabase Auth corresponde ao dominio

### "Too many login attempts" (HTTP 429)

**Causa**: Rate limiting ativo (10 tentativas/minuto).

**Solucao**: Aguarde 60 segundos. O header `Retry-After: 60` indica o tempo de espera.

**Para desenvolvimento**: Reinicie o servidor (`npm run dev`) para limpar o rate limiter in-memory.

### Login funciona local mas nao em producao

1. Verifique variaveis de ambiente na Vercel
2. Verifique que a URL do site no Supabase Auth inclui o dominio de producao
3. Verifique que os Redirect URLs incluem o dominio de producao

## RLS e Banco de Dados

### "permission denied for table X"

**Causa**: RLS esta ativo mas faltam policies, ou o usuario nao esta autenticado.

**Solucoes**:
1. Verifique se todas as migrations foram executadas na ordem correta
2. Verifique se o usuario tem um profile vinculado a uma loja:
   ```sql
   SELECT p.*, s.name as store_name
   FROM profiles p JOIN stores s ON s.id = p.store_id
   WHERE p.id = auth.uid();
   ```
3. Re-execute `008_security_hardening.sql` se necessario

### "relation does not exist"

**Causa**: Migrations executadas fora de ordem.

**Solucao**: Execute na ordem correta. Se necessario, comece do zero:
1. Exporte dados existentes (se houver)
2. Delete tabelas na ordem inversa
3. Re-execute migrations na ordem

### Dados de outra loja aparecendo

**CRITICO**: Isso nao deveria acontecer com RLS ativo.

**Verificacoes**:
1. Confirme que RLS esta ativo: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Verifique policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Verifique se `008_security_hardening.sql` foi executado (corrige bypass em RPCs)
4. Verifique que nenhuma query usa a `service_role` key no client

### Numero da venda duplicado

**Causa**: Conflito raro no trigger `set_sale_number()` com vendas simultaneas.

**Solucao**:
```sql
-- Recalcular numeros de venda para a loja
WITH n AS (
  SELECT id, row_number() OVER (PARTITION BY store_id ORDER BY created_at) rn
  FROM sales
  WHERE store_id = 'UUID_DA_LOJA'
)
UPDATE sales s SET number = n.rn FROM n WHERE s.id = n.id;
```

### "product not found in your store" ao vender

**Causa**: O produto referenciado nao pertence a loja do usuario (protecao da `apply_stock()`).

**Solucao**: Verifique que o `product_id` sendo enviado existe e pertence a loja correta.

## Imagens

### Imagem nao carrega no formulario

**Causa**: Arquivo muito grande ou formato nao suportado.

**Solucoes**:
1. Verifique que o arquivo e uma imagem (JPEG, PNG, WebP)
2. O resize automatico converte para WebP e limita o tamanho
3. Se persistir, tente com uma imagem menor

### "Logo invalido ou grande demais"

**Causa**: Logo excede 300KB encoded ou nao e uma imagem valida.

**Solucao**: Use uma imagem menor. O ideal e um logo de ate 500x500 pixels.

### Imagem aparece corrompida

**Causa**: A string base64 foi truncada.

**Solucao**: Verifique a constraint do banco:
```sql
-- Verificar se a imagem foi truncada
SELECT id, name, length(image) as image_size FROM products WHERE image IS NOT NULL;
-- Limite: 512000 caracteres
```

### Imagens fazem o banco ficar lento

**Causa**: Imagens base64 armazenadas diretamente no banco aumentam o tamanho das queries.

**Recomendacao futura**: Migrar para Supabase Storage (arquivos separados do banco).

## Build e Deploy

### Build falha na Vercel

**Erros comuns**:

1. **"Module not found"**
   - Verifique imports (case-sensitive em Linux)
   - Verifique que o arquivo existe no repositorio

2. **"Type error"**
   - Execute `npx tsc --noEmit` localmente para ver erros de tipo
   - Corrija antes de fazer push

3. **Variaveis de ambiente faltando**
   - Verifique que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estao configuradas na Vercel
   - As variaveis devem estar disponiveis no ambiente de build

### Pagina mostra "500 Internal Server Error"

1. Verifique logs na Vercel: Dashboard > Logs
2. Causa mais comum: variaveis de ambiente faltando ou incorretas
3. Verifique conectividade com Supabase (pode estar fora do ar)

### Deploy funciona mas paginas nao carregam

1. Verifique se o Supabase esta acessivel (pode haver rate limiting no free tier)
2. Verifique DNS no Cloudflare
3. Verifique SSL (deve ser "Full strict" no Cloudflare)

## Cloudflare

### ERR_TOO_MANY_REDIRECTS

**Causa**: SSL configurado como "Flexible" no Cloudflare.

**Solucao**: Mude para **Full (strict)** em SSL/TLS > Overview.

### Pagina mostra versao antiga (cache)

**Solucao**: Purge cache no Cloudflare:
1. Caching > Configuration > Purge Everything
2. Ou purge URL especifica

### DNS nao resolve

1. Verifique que os nameservers do Cloudflare estao configurados no registrador
2. Aguarde propagacao (ate 48h, normalmente minutos)
3. Verifique o registro CNAME: `app` -> `cname.vercel-dns.com`

## Performance

### Paginas lentas

1. Verifique tamanho de imagens base64 no banco
2. Verifique se indices existem:
   ```sql
   SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
   ```
3. Re-execute `008_security_hardening.sql` para criar indices ausentes
4. Verifique uso de bandwidth no Supabase (free tier: 2GB)

### Catalogo publico lento

1. Ative cache no Cloudflare para `/c/*`
2. Verifique se o indice `products_store_active_idx` existe
3. Considere limitar numero de produtos exibidos

## Locale e Formatacao

### Valores em moeda errados

**Causa**: Formato numerico brasileiro nao interpretado corretamente.

**Verificacao**: A funcao `num()` em `src/lib/store.ts` converte `1.234,56` para `1234.56`.

### Data/hora incorreta

**Causa**: Fuso horario incorreto.

**Verificacao**: O sistema usa `America/Sao_Paulo` (UTC-3). Verifique:
- `src/lib/format.ts`: Todas as funcoes usam `timeZone: "America/Sao_Paulo"`
- O fuso do Supabase nao afeta, pois os timestamps sao `timestamptz`

### Vendas do dia nao aparecem

**Causa**: Calculo de inicio do dia usa fuso de Sao Paulo.

**Verificacao**: O `dayStart` em `nowParts()` calcula `T00:00:00-03:00` (meia-noite em SP).

## Erros de Validacao

### "Carrinho invalido"

- Verifique que ha entre 1 e 200 itens
- Verifique que items e um array

### "Os pagamentos nao fecham o total"

- A soma dos pagamentos deve ser exatamente igual ao total
- Diferenca maxima aceita: R$ 0,009

### "Identifique o cliente para vender no fiado"

- Vendas com metodo "fiado" exigem nome do cliente
- Preencha o campo de cliente antes de finalizar

### "Esse link ja esta em uso"

- O slug do catalogo deve ser unico entre todas as lojas
- Escolha outro slug para o catalogo
