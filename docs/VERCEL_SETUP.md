# Deploy na Vercel

Guia completo para deploy do Dalce Estoque na Vercel.

## 1. Conectar Repositorio

1. Acesse [vercel.com](https://vercel.com) e faca login
2. Clique em **Add New > Project**
3. Importe o repositorio do GitHub
4. A Vercel detecta automaticamente que e um projeto Next.js

## 2. Configurar Variaveis de Ambiente

Na tela de importacao (ou em **Settings > Environment Variables**):

| Variavel | Valor | Ambientes |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (chave anon) | Production, Preview, Development |

> **Nota**: Ambas as variaveis tem prefixo `NEXT_PUBLIC_` porque sao usadas tanto no server quanto no client.

### Variaveis Opcionais

Para ambientes de staging/preview, voce pode usar um projeto Supabase separado configurando variaveis diferentes por ambiente.

## 3. Configuracoes de Build

A Vercel detecta automaticamente:

- **Framework Preset**: Next.js
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node.js Version**: 20.x (recomendado)

Nenhuma configuracao adicional e necessaria.

### Verificar Node.js Version

Em **Settings > General > Node.js Version**, selecione `20.x`.

## 4. Deploy

Clique em **Deploy**. A Vercel fara o build e deploy automaticamente.

### Build Logs

Acompanhe o build em **Deployments > [ultimo deploy] > Building**. O build tipico leva 30-60 segundos.

## 5. Dominio Personalizado

### 5.1 Adicionar dominio

1. Va em **Settings > Domains**
2. Adicione seu dominio: `app.dalce.com.br` (exemplo)
3. A Vercel mostrara os registros DNS necessarios

### 5.2 Configurar DNS

Se usando Cloudflare (recomendado), veja [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md).

Se usando outro provedor DNS:
- Adicione um registro **CNAME** de `app` apontando para `cname.vercel-dns.com`
- Ou um registro **A** apontando para `76.76.21.21`

### 5.3 SSL

A Vercel provisiona certificado SSL automaticamente via Let's Encrypt. Se usar Cloudflare, configure SSL como "Full (strict)".

## 6. Preview Deployments

Cada push para uma branch (que nao seja `main`) gera um preview deployment automatico com URL unica.

### Configurar preview com Supabase separado

Para ambientes de preview isolados:

1. Crie um projeto Supabase separado para staging
2. Na Vercel, configure as variaveis por ambiente:
   - Selecione **Preview** ao adicionar a variavel
   - Coloque as credenciais do Supabase de staging

## 7. Limites e Performance

### Free Tier (Hobby)

- 100 GB de bandwidth/mes
- Funcoes serverless: 100 GB-hours/mes
- Builds: 6000 minutos/mes
- Sem dominio personalizado (usa `.vercel.app`)

### Pro Tier

- 1 TB de bandwidth/mes
- 1000 GB-hours/mes
- Builds ilimitados
- Dominios personalizados
- Analytics avancado

### Otimizacoes

O `next.config.ts` ja inclui:

- `reactStrictMode: true` - detecta problemas no desenvolvimento
- `poweredByHeader: false` - remove header `X-Powered-By: Next.js`
- Formatos de imagem: WebP e AVIF
- Security headers (CSP, HSTS, X-Frame-Options, etc.)

## 8. Monitoramento

### Vercel Analytics

Para habilitar analytics:

1. Va em **Analytics** no dashboard do projeto
2. Ative **Web Analytics** (gratuito)
3. Opcionalmente, ative **Speed Insights** para Core Web Vitals

### Logs

- **Runtime Logs**: em tempo real em **Logs** no dashboard
- **Build Logs**: em cada deployment

### Alertas

Configure alertas em **Settings > Notifications** para:
- Falhas de build
- Erros de funcoes serverless
- Limites de uso

## 9. Rollback

Se um deploy causar problemas:

1. Va em **Deployments**
2. Encontre o deploy anterior que funcionava
3. Clique nos tres pontos > **Promote to Production**

Isso e instantaneo e nao requer rebuild.

## 10. Variaveis de Ambiente de Referencia

Veja [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) para a lista completa de variaveis.
