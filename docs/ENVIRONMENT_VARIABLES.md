# ENVIRONMENT_VARIABLES.md

Inventário completo das variáveis de ambiente do **Dalce Estoque**.

---

## Resumo

| Variável | Obrigatória | Pública? | Segredo? | Ambientes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ Sim | ❌ Não | Todos |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ Sim | ❌ Não | Todos |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ Não | ✅ **Sim** | Somente Production |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ Sim | ❌ Não | Todos |
| `NEXT_PUBLIC_APP_NAME` | ➖ | ✅ Sim | ❌ Não | Todos |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | ➖ | ✅ Sim | ❌ Não | Todos |

> **Regra:** toda variável com prefixo `NEXT_PUBLIC_` é embutida no bundle do navegador
> e **qualquer pessoa pode lê-la**. Nunca coloque segredos com esse prefixo.

---

## Detalhamento

### `NEXT_PUBLIC_SUPABASE_URL`

- **Finalidade**: URL do projeto Supabase. Usada pelo cliente (navegador) e pelo servidor.
- **Obrigatória**: sim.
- **Onde obter**: Supabase → **Project Settings → API → Project URL**.
- **Onde configurar**: `.env.local` (dev) e Vercel → Environment Variables (todos os ambientes).
- **Pode aparecer no frontend**: sim.
- **É segredo**: não.
- **Exemplo fictício**: `https://abcdefghijklmnop.supabase.co`

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Finalidade**: chave pública do Supabase. Todas as consultas passam por RLS.
- **Obrigatória**: sim.
- **Onde obter**: Supabase → **Project Settings → API → anon public**.
- **Onde configurar**: `.env.local` e Vercel (todos os ambientes).
- **Pode aparecer no frontend**: sim (é feita para isso).
- **É segredo**: não — mas só é segura porque o RLS está ativo. **Nunca desative o RLS.**
- **Exemplo fictício**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exemplo.exemplo`

### `SUPABASE_SERVICE_ROLE_KEY`

- **Finalidade**: permite ao painel do super admin redefinir senhas de clientes.
  **Ignora o RLS** — dá acesso total ao banco.
- **Obrigatória**: sim (para o painel admin funcionar por completo).
- **Onde obter**: Supabase → **Project Settings → API → service_role**.
- **Onde configurar**: `.env.local` (dev) e Vercel → **somente Production**.
- **Pode aparecer no frontend**: ❌ **NUNCA**.
- **É segredo**: ✅ **SIM — o mais crítico do sistema.**
- **Exemplo fictício**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.servico.servico`

> ⚠️ Se esta chave vazar, qualquer pessoa lê e altera os dados de **todas** as lojas.
> Se isso acontecer: **rotacione a chave imediatamente** no Supabase (Project Settings →
> API → Reset service_role key) e atualize na Vercel.

### `NEXT_PUBLIC_APP_URL`

- **Finalidade**: URL pública do app. Usada no sitemap, robots e links absolutos.
- **Obrigatória**: sim (em produção).
- **Onde obter**: o seu domínio.
- **Onde configurar**: `.env.local` e Vercel.
- **Pode aparecer no frontend**: sim.
- **É segredo**: não.
- **Exemplo fictício**: `https://app.seudominio.com`

### `NEXT_PUBLIC_APP_NAME`

- **Finalidade**: nome exibido na interface e nos metadados.
- **Obrigatória**: não (padrão: `Dalce Estoque`).
- **Onde configurar**: `.env.local` e Vercel.
- **Pode aparecer no frontend**: sim.
- **É segredo**: não.
- **Exemplo fictício**: `Dalce Estoque`

### `NEXT_PUBLIC_SUPPORT_EMAIL`

- **Finalidade**: e-mail de suporte mostrado ao cliente.
- **Obrigatória**: não.
- **Onde configurar**: `.env.local` e Vercel.
- **Pode aparecer no frontend**: sim.
- **É segredo**: não.
- **Exemplo fictício**: `suporte@seudominio.com`

---

## Como configurar

### Desenvolvimento local

1. Copie o modelo:
   ```bash
   cp .env.example .env.local
   ```
2. Preencha com os valores reais do seu projeto Supabase.
3. **Nunca** commite o `.env.local` (já está no `.gitignore`).

### Produção (Vercel)

1. **Settings → Environment Variables**.
2. Adicione cada variável e marque os ambientes corretos.
3. `SUPABASE_SERVICE_ROLE_KEY` → **somente Production**.
4. Após adicionar/alterar, faça **Redeploy** (variáveis só valem no próximo build).

---

## Segurança

- [ ] Nenhuma variável `NEXT_PUBLIC_*` contém segredo.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` só existe no servidor e só em Production.
- [ ] `.env.local` está no `.gitignore`.
- [ ] `.env.example` contém apenas placeholders.
- [ ] Nenhuma chave real no histórico do Git.
- [ ] Chaves rotacionadas se houver suspeita de vazamento.

---

## Variáveis futuras (não usadas hoje)

Se você adicionar integrações, documente aqui. Exemplos:

| Variável | Uso | Segredo? |
|---|---|---|
| `RESEND_API_KEY` | Envio de e-mails transacionais | ✅ Sim |
| `UPSTASH_REDIS_REST_URL` | Rate limiting distribuído | ❌ Não |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting distribuído | ✅ Sim |
| `STRIPE_SECRET_KEY` | Cobrança recorrente | ✅ Sim |
| `NEXT_PUBLIC_GA_ID` | Google Analytics global | ❌ Não |
