# Guia de Deploy em Producao

Passo a passo completo para colocar o Dalce Estoque em producao, partindo do zero.

## Pre-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com)
- Conta no [Cloudflare](https://cloudflare.com) (opcional mas recomendado)
- Dominio registrado (ex: `dalce.com.br`)

## Passo 1: Repositorio GitHub

1. Crie um repositorio privado no GitHub
2. Faca push do codigo:

```bash
git remote add origin git@github.com:seu-usuario/dalce-estoque.git
git push -u origin main
```

3. Configure branch protection (veja [GITHUB_SETUP.md](./GITHUB_SETUP.md))

## Passo 2: Projeto Supabase

### 2.1 Criar projeto

1. Acesse [app.supabase.com](https://app.supabase.com)
2. **New Project** com regiao **South America (Sao Paulo)**
3. Anote a senha do banco

### 2.2 Executar migrations

No **SQL Editor**, execute os arquivos na ordem:

1. `supabase/schema.sql`
2. `supabase/003_vendas_detalhe.sql`
3. `supabase/004_pdv.sql`
4. `supabase/005_estoque_fiado.sql`
5. `supabase/006_catalogo.sql`
6. `supabase/007_cadastros.sql`
7. `supabase/008_security_hardening.sql`
8. `supabase/009_storage_setup.sql`
9. `supabase/010_catalog_enhancements.sql`
10. `supabase/011_catalog_customization.sql`
11. `supabase/012_catalog_simplify.sql`
12. `supabase/013_catalog_enhancements.sql`

### 2.3 Configurar autenticacao

1. **Authentication > Providers > Email**: desative "Confirm email"
2. **Authentication > URL Configuration**:
   - Site URL: `https://app.dalce.com.br` (seu dominio)
   - Redirect URLs: adicione `https://app.dalce.com.br/**`

### 2.4 Criar usuario inicial

1. **Authentication > Add user**: `admin@dalce.app` com senha forte
2. No SQL Editor:

```sql
WITH s AS (
  INSERT INTO stores (name) VALUES ('Loja Inicial')
  RETURNING id
)
INSERT INTO profiles (id, store_id, name)
SELECT
  (SELECT id FROM auth.users WHERE email = 'admin@dalce.app'),
  s.id,
  'Administrador'
FROM s;
```

### 2.5 Anotar credenciais

Va em **Settings > API** e copie:
- **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
- **anon public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Passo 3: Deploy na Vercel

### 3.1 Importar projeto

1. Acesse [vercel.com](https://vercel.com)
2. **Add New > Project**
3. Conecte o repositorio GitHub
4. Configure as variaveis de ambiente:

| Variavel | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon |

5. Clique em **Deploy**

### 3.2 Verificar o deploy

1. Acesse a URL gerada pela Vercel (`projeto.vercel.app`)
2. Faca login com o usuario criado no passo 2.4
3. Verifique que o dashboard carrega corretamente

## Passo 4: Dominio Personalizado

### 4.1 Adicionar na Vercel

1. **Settings > Domains** na Vercel
2. Adicione `app.dalce.com.br`
3. A Vercel mostrara o registro DNS necessario

### 4.2 Configurar DNS no Cloudflare

1. Adicione o dominio no Cloudflare
2. Atualize nameservers no registrador
3. Crie registro CNAME:
   - Tipo: `CNAME`
   - Nome: `app`
   - Destino: `cname.vercel-dns.com`
   - Proxy: Ativado

### 4.3 Configurar SSL

No Cloudflare:
1. **SSL/TLS > Overview**: Selecione **Full (strict)**
2. **SSL/TLS > Edge Certificates**: Ative **Always Use HTTPS**

### 4.4 Atualizar Supabase

Atualize as URLs de redirecionamento no Supabase:
1. **Authentication > URL Configuration > Site URL**: `https://app.dalce.com.br`

## Passo 5: Cloudflare (Seguranca e Performance)

Veja [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) para configuracao detalhada:

1. Cache rules para `/c/*` (catalogo publico)
2. Cache rules para `/_next/static/*` (assets)
3. Bot Fight Mode ativado
4. Rate limiting para `/login`

## Passo 6: Verificacoes Pos-Deploy

### 6.1 Funcionalidade

- [ ] Login funciona com usuario criado
- [ ] Dashboard mostra data correta (fuso Sao Paulo)
- [ ] Criar uma venda de teste
- [ ] Verificar estoque apos venda
- [ ] Criar produto com imagem
- [ ] Ativar e testar catalogo publico

### 6.2 Seguranca

- [ ] HTTPS funcionando (cadeado verde)
- [ ] Headers de seguranca presentes:
  ```bash
  curl -I https://app.dalce.com.br
  # Verificar: X-Frame-Options, CSP, HSTS, X-Content-Type-Options
  ```
- [ ] Rate limiting de login funcionando (testar 11 tentativas rapidas)
- [ ] Catalogo publico nao expoe dados sensiveis

### 6.3 Performance

- [ ] Paginas carregam em < 3 segundos
- [ ] Imagens estao otimizadas (WebP)
- [ ] Cache do Cloudflare ativo para assets estaticos

## Passo 7: Onboarding de Lojas

Para cada nova loja, execute no SQL Editor do Supabase:

### 7.1 Criar usuario no Auth

1. **Authentication > Add user**
2. Email: `nomeloja@dalce.app`
3. Senha forte
4. Auto Confirm: Sim

### 7.2 Criar loja e vincular

```sql
WITH s AS (
  INSERT INTO stores (name) VALUES ('Nome da Loja')
  RETURNING id
)
INSERT INTO profiles (id, store_id, name)
SELECT
  (SELECT id FROM auth.users WHERE email = 'nomeloja@dalce.app'),
  s.id,
  'Nome do Responsavel'
FROM s;
```

### 7.3 Informar credenciais ao lojista

- URL: `https://app.dalce.com.br`
- Usuario: `nomeloja`
- Senha: a senha definida

## Rollback

### Rollback do deploy

Na Vercel, promova um deploy anterior:
1. **Deployments**
2. Encontre o deploy anterior
3. **Promote to Production**

### Rollback do banco

O Supabase nao tem rollback automatico de migrations. Para reverter:
1. Identifique as alteracoes feitas
2. Escreva SQL reverso manualmente
3. Execute no SQL Editor
4. **Recomendacao**: Sempre faca backup antes de migrations

## Monitoramento em Producao

### Vercel

- **Logs**: Dashboard > Logs (tempo real)
- **Analytics**: Dashboard > Analytics (Web Vitals)
- **Alerts**: Settings > Notifications

### Supabase

- **Logs**: Logs Explorer (queries, auth, realtime)
- **Metrics**: Dashboard (conexoes, storage, bandwidth)
- **Alerts**: Configure em Settings > Integrations

### Cloudflare

- **Analytics**: Overview (requests, bandwidth, ameacas)
- **Security**: Security > Events (ataques bloqueados)
