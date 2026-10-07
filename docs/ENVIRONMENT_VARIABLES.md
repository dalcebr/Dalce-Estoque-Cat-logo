# Variaveis de Ambiente

Referencia completa de todas as variaveis de ambiente do Dalce Estoque.

## Variaveis Obrigatorias

### `NEXT_PUBLIC_SUPABASE_URL`

- **Descricao**: URL do projeto Supabase
- **Obrigatoria**: Sim
- **Exemplo**: `https://abcdefghijkl.supabase.co`
- **Onde encontrar**: Supabase Dashboard > Settings > API > Project URL
- **Usada em**: Server e Client (prefixo `NEXT_PUBLIC_`)
- **Notas**: Nunca inclua barra final. E exposta no client, mas isso e seguro pois o acesso e controlado por RLS.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Descricao**: Chave anonima (publica) do Supabase
- **Obrigatoria**: Sim
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Supabase Dashboard > Settings > API > anon public
- **Usada em**: Server e Client (prefixo `NEXT_PUBLIC_`)
- **Notas**: Essa chave e segura para expor no client. Ela so permite operacoes autorizadas pelas RLS policies. **NAO** confunda com a `service_role` key.

## Variaveis que NAO sao usadas

O projeto **NAO** usa estas variaveis (ao contrario do que e comum em projetos Supabase):

| Variavel | Motivo |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Nao e necessaria. O app sempre opera como o usuario autenticado, via RLS. |
| `SUPABASE_DB_URL` | Nao ha conexao direta ao banco. Tudo via client SDK. |
| `DATABASE_URL` | Nao usa ORM (Prisma, Drizzle, etc.) |
| `NEXT_PUBLIC_SITE_URL` | A URL e inferida do request. |

## Onde Configurar

### Desenvolvimento Local

Crie `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite com seus valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **IMPORTANTE**: `.env.local` esta no `.gitignore` e nunca deve ser commitado.

### Vercel (Producao)

1. Va no projeto na Vercel
2. **Settings > Environment Variables**
3. Adicione cada variavel para os ambientes desejados:
   - **Production**: credenciais do Supabase de producao
   - **Preview**: credenciais do Supabase de staging (opcional)
   - **Development**: mesmas de production ou staging

### GitHub Actions (CI)

1. Va em **Settings > Secrets and variables > Actions**
2. Adicione como **Repository secrets**
3. Reference no workflow como `${{ secrets.NOME_DA_VARIAVEL }}`

## Seguranca

### O que NUNCA fazer

- Nunca commite `.env.local` ou `.env.production`
- Nunca use a `service_role` key no client
- Nunca exponha a `service_role` key em variaveis `NEXT_PUBLIC_*`
- Nunca cole credenciais em issues, PRs ou mensagens publicas

### Rotacao de chaves

Se uma chave for comprometida:

1. Va em Supabase > Settings > API
2. Clique em **Generate new JWT secret** (isso invalida ambas as chaves)
3. Copie as novas chaves
4. Atualize em todos os ambientes:
   - `.env.local`
   - Vercel Environment Variables
   - GitHub Secrets
5. Faca redeploy na Vercel

## Referencia Rapida

```bash
# .env.local (copie e preencha)
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```
