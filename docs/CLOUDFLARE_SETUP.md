# Configuracao do Cloudflare

Guia para configurar Cloudflare como DNS e CDN para o Dalce Estoque na Vercel.

## 1. Adicionar Dominio no Cloudflare

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Clique em **Add a Site**
3. Digite seu dominio (ex: `dalce.com.br`)
4. Selecione o plano (Free funciona bem)
5. O Cloudflare escaneia os registros DNS existentes
6. Atualize os nameservers no seu registrador de dominio para os do Cloudflare

## 2. Configurar DNS

### Para o app principal (Vercel)

Adicione os seguintes registros DNS:

| Tipo | Nome | Destino | Proxy |
|------|------|---------|-------|
| CNAME | `app` (ou `@`) | `cname.vercel-dns.com` | Proxy ativado (nuvem laranja) |

> **Nota**: Se usar o dominio raiz (`dalce.com.br` sem subdominio), o Cloudflare faz "CNAME flattening" automaticamente.

### Exemplo com subdominio

```
app.dalce.com.br  ->  CNAME  ->  cname.vercel-dns.com  (Proxied)
```

### Verificar no Vercel

Apos configurar o DNS:
1. Va em **Settings > Domains** no projeto Vercel
2. Adicione `app.dalce.com.br`
3. Aguarde a verificacao (pode levar alguns minutos)

## 3. Configurar SSL

### No Cloudflare

1. Va em **SSL/TLS > Overview**
2. Selecione **Full (strict)**

Isso garante:
- Conexao criptografada entre visitante e Cloudflare
- Conexao criptografada entre Cloudflare e Vercel
- Validacao do certificado da Vercel

> **IMPORTANTE**: Nao use "Flexible" - isso causaria mixed content e loops de redirecionamento.

### Always Use HTTPS

1. Va em **SSL/TLS > Edge Certificates**
2. Ative **Always Use HTTPS**

### HSTS

O app ja envia header HSTS via `next.config.ts`:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Para habilitar tambem no Cloudflare (redundancia):
1. Va em **SSL/TLS > Edge Certificates**
2. Ative **HTTP Strict Transport Security (HSTS)**
3. Configure: Max-Age 2 anos, incluir subdomains, preload

## 4. Regras de Cache

### Cache padrao

O Cloudflare ja faz cache automatico de assets estaticos (JS, CSS, imagens, fontes).

### Page Rules recomendadas

Crie as seguintes Page Rules em **Rules > Page Rules**:

#### Regra 1: Catalogo publico (cache agressivo)

- URL: `*app.dalce.com.br/c/*`
- **Cache Level**: Standard
- **Edge Cache TTL**: 5 minutos
- **Browser Cache TTL**: 2 minutos

Isso melhora a performance do catalogo publico sem afetar atualizacoes.

#### Regra 2: Assets estaticos (cache longo)

- URL: `*app.dalce.com.br/_next/static/*`
- **Cache Level**: Cache Everything
- **Edge Cache TTL**: 1 mes
- **Browser Cache TTL**: 1 ano

A Vercel ja usa hashes nos nomes dos assets, entao cache longo e seguro.

#### Regra 3: Area logada (sem cache)

- URL: `*app.dalce.com.br/*`
- **Cache Level**: Bypass
- **Disable Performance** (opcional)

> **Nota**: Coloque esta regra por ultimo (menor prioridade). As regras mais especificas acima terao precedencia.

### Cache Rules (alternativa moderna)

Em vez de Page Rules, use **Rules > Cache Rules** para maior flexibilidade:

```
Se: URI Path comeca com "/c/"
Entao: Cache eligible, Edge TTL 300s, Browser TTL 120s

Se: URI Path comeca com "/_next/static/"
Entao: Cache eligible, Edge TTL 2592000s

Se: URI Path nao comeca com "/c/" E nao comeca com "/_next/"
Entao: Bypass cache
```

## 5. Configuracoes de Seguranca

### WAF (Web Application Firewall)

O plano Free inclui regras OWASP basicas. Para habilitar:

1. Va em **Security > WAF**
2. Ative as regras gerenciadas do Cloudflare
3. Monitore os logs para falsos positivos

### Bot Management

1. Va em **Security > Bots**
2. Ative **Bot Fight Mode** (Free)
3. Isso bloqueia bots maliciosos mas permite bots legitimos (Google, etc.)

### Rate Limiting

O app ja implementa rate limiting no middleware (10 requests/minuto para login). O Cloudflare adiciona uma camada extra:

1. Va em **Security > WAF > Rate limiting rules**
2. Crie uma regra para `/login`:
   - Se: URI Path = `/login` E Method = `POST`
   - Taxa: 10 requests por minuto por IP
   - Acao: Block por 60 segundos

## 6. Performance

### Speed

1. Va em **Speed > Optimization**
2. Ative **Auto Minify** (HTML, CSS, JS)
3. Ative **Brotli** compression

> **Nota**: A Vercel ja minifica e comprime. O Cloudflare serve como fallback/camada extra.

### Early Hints

1. Em **Speed > Optimization > Protocol Optimization**
2. Ative **Early Hints** - pre-carrega assets com 103 hints

### HTTP/3

1. Em **Network**
2. Ative **HTTP/3 (with QUIC)** - melhora latencia

## 7. Workers (Futuro)

O projeto esta preparado para migrar para Cloudflare Workers (`@opennextjs/cloudflare`), se necessario no futuro. Nenhuma alteracao no codigo atual impede essa migracao.

## 8. Troubleshooting

### Error 522 (Connection timed out)

- Vercel esta fora do ar ou o DNS esta incorreto
- Verifique se o CNAME aponta para `cname.vercel-dns.com`

### Error 526 (Invalid SSL certificate)

- SSL esta configurado como "Full (strict)" mas o certificado da Vercel nao esta pronto
- Temporariamente mude para "Full" e depois volte para "Full (strict)"

### Loop de redirecionamento (ERR_TOO_MANY_REDIRECTS)

- SSL esta como "Flexible" - mude para "Full (strict)"
- Ou desative "Always Use HTTPS" no Cloudflare se a Vercel ja faz o redirect

### Cache desatualizado

- Purge cache em **Caching > Configuration > Purge Everything**
- Ou purge por URL especifica
