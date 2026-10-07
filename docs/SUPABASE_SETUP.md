# SUPABASE_SETUP.md

Guia completo para configurar o Supabase do **Dalce Estoque** do zero até produção.

> Tempo estimado: 30–40 minutos.
> Você vai precisar de: conta no Supabase, acesso ao SQL Editor e ao painel do projeto.

---

## 1. Criar o projeto

1. Acesse <https://supabase.com> e faça login.
2. Clique em **New project**.
3. Preencha:
   - **Organization**: a sua (crie uma se não tiver).
   - **Name**: `dalce-estoque` (ou o nome do seu produto).
   - **Database Password**: clique em **Generate a password** e **guarde em local seguro** (gerenciador de senhas). Você não vai precisar dela no dia a dia, mas ela é a chave do banco.
   - **Region**: escolha a mais próxima dos seus clientes. Para o Brasil, `South America (São Paulo)` — `sa-east-1`.
   - **Pricing Plan**: `Free` serve para desenvolvimento. Para vender, use `Pro` (ver seção 10).
4. Clique em **Create new project** e aguarde ~2 minutos até o provisionamento terminar.

**Resultado esperado:** o projeto abre no dashboard com o status verde.

---

## 2. Rodar os scripts SQL (na ordem exata)

Menu lateral → **SQL Editor** → **New query**. Cole o conteúdo de **um arquivo por vez**, clique em **Run** e confirme que apareceu `Success. No rows returned`.

Ordem obrigatória:

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `supabase/schema.sql` | Tabelas base, `profiles`, `stores`, RLS inicial |
| 2 | `supabase/002_payment_method.sql` | Formas de pagamento |
| 3 | `supabase/003_vendas_detalhe.sql` | Itens e pagamentos da venda |
| 4 | `supabase/004_pdv.sql` | Funções do PDV |
| 5 | `supabase/005_estoque_fiado.sql` | Estoque e fiado |
| 6 | `supabase/006_catalogo.sql` | Catálogo público |
| 7 | `supabase/007_cadastros.sql` | Categorias, clientes, variações |
| 8 | `supabase/008_saas.sql` | Planos, assinatura, super admin |
| 9 | `supabase/009_seguranca_integridade.sql` | **Segurança, transações e Storage** |

> ⚠️ O `009` é obrigatório. Ele cria o bucket de imagens, as funções transacionais
> (`create_sale`, `cancel_sale`, `receive_fiado`) e os índices de performance.

**Verificação** — rode no SQL Editor:

```sql
select proname from pg_proc
 where proname in ('apply_stock','cancel_sale','create_sale','receive_fiado','admin_set_active','is_super_admin')
 order by proname;

select id, public, file_size_limit from storage.buckets where id = 'catalogo';
```

**Resultado esperado:** 6 funções listadas e 1 bucket `catalogo` com `public = true` e limite `2097152`.

---

## 3. Authentication

Menu lateral → **Authentication**.

### 3.1 URL Configuration

**Authentication → URL Configuration**:

- **Site URL**: `https://app.seudominio.com` (em desenvolvimento: `http://localhost:3000`).
- **Redirect URLs** — clique em **Add URL** para cada uma:
  - `http://localhost:3000/**`
  - `https://app.seudominio.com/**`
  - `https://*-seu-projeto.vercel.app/**` (para os previews da Vercel)

> Sem isso, o link de recuperação de senha e a confirmação de e-mail não funcionam.

### 3.2 Providers

**Authentication → Providers**:

- **Email**: deixe **habilitado**.
  - **Confirm email**: para produção, **ative** (evita cadastro com e-mail falso). Para testar rápido, pode desativar.
  - **Secure email change**: ative.
- **Google / outros**: opcional. Se ativar, configure Client ID/Secret no Google Cloud Console e adicione a URL de callback que o Supabase mostra.

### 3.3 Política de senha

**Authentication → Policies** (ou **Settings → Auth**):

- **Minimum password length**: `6` (o código valida 6 no cadastro).
- **Password strength**: `Lower, upper and special characters` é o ideal; se for muito rígido para o seu público, use `Lower, upper and numbers`.

### 3.4 Templates de e-mail (opcional, recomendado)

**Authentication → Email Templates**. Personalize com a sua marca:

- **Confirm signup**: assunto `Confirme seu e-mail · Dalce Estoque`.
- **Reset password**: assunto `Redefinir sua senha · Dalce Estoque`.

> No plano Free o Supabase envia e-mails por um servidor compartilhado (limite baixo, ~4/hora).
> Para vender, configure **SMTP próprio** em **Project Settings → Auth → SMTP Settings**
> (Resend, SendGrid, Amazon SES). Sem isso, clientes podem não receber o e-mail de recuperação.

---

## 4. Storage (imagens de produto e logo)

O script `009` já cria o bucket e as políticas. Confirme em **Storage**:

- Bucket **`catalogo`** existe, marcado como **Public**.
- **File size limit**: `2 MB`.
- **Allowed MIME types**: `image/webp, image/jpeg, image/png, image/gif`.

### Como funciona o isolamento

Cada arquivo é gravado em `<store_id>/<arquivo>.webp`. As políticas exigem que a
**primeira pasta seja o `store_id` do usuário logado**:

```sql
(storage.foldername(name))[1] = current_store_id()::text
```

Ou seja: a loja A **não consegue** gravar na pasta da loja B, mesmo chamando a API
diretamente. A leitura é pública (necessário para o catálogo), mas o nome do arquivo
tem timestamp + hash aleatório, então não é adivinhável.

**Verificação** — em **Storage → Policies**, devem existir 4 políticas no bucket `catalogo`:
leitura pública, escrita, atualização e remoção (as três últimas restritas à loja).

---

## 5. Chaves de API

**Project Settings → API**:

| Campo | Onde usar | Pode ir para o frontend? |
|---|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sim |
| **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sim (protegida por RLS) |
| **service_role** | `SUPABASE_SERVICE_ROLE_KEY` | ❌ **NUNCA** |

> A `service_role` **ignora o RLS**. Ela só é usada no servidor, em
> `src/lib/supabase/admin.ts`, e apenas depois de validar que o usuário é super admin.
> Se ela vazar, qualquer pessoa lê todos os dados de todas as lojas.

**Regra de ouro:** se uma variável começa com `NEXT_PUBLIC_`, ela é pública. Nunca
coloque a `service_role` com esse prefixo.

---

## 6. Criar o primeiro super admin

O super admin é você — quem gerencia as lojas no painel `/admin`.

1. **Authentication → Users → Add user → Create new user**.
   - E-mail: o seu.
   - Password: uma senha forte.
   - Marque **Auto Confirm User**.
2. Copie o **User UID** que aparece na lista.
3. No **SQL Editor**, rode (troque o UUID):

```sql
-- 1) cria a loja do super admin (se ainda não existir)
insert into stores (name, plan, active)
values ('Administração', 'business', true)
returning id;

-- 2) vincula o usuário à loja e marca como super admin
--    (troque os dois valores abaixo)
update profiles
   set store_id = 'COLE-O-UUID-DA-LOJA-AQUI',
       is_super_admin = true,
       role = 'owner'
 where id = 'COLE-O-USER-UID-AQUI';
```

**Resultado esperado:** ao logar, você vê o menu **Admin** e consegue listar todas as lojas.

> Se o `update` não afetar nenhuma linha, o trigger de criação de perfil não rodou.
> Rode `select * from profiles where id = 'COLE-O-USER-UID';` — se não existir, insira
> manualmente com `insert into profiles (id, store_id, is_super_admin, role) values (...)`.

---

## 7. Testar o cadastro de uma loja nova

1. Saia da conta de super admin (ou use uma janela anônima).
2. Acesse `/cadastro` e crie uma conta com outro e-mail.
3. **Resultado esperado:** o sistema cria automaticamente a loja, o perfil como `owner`
   e inicia o **trial de 14 dias**.
4. Faça login e confirme que aparece o PDV, estoque e catálogo.

**Verificação no banco:**

```sql
select s.name, s.plan, s.active, s.trial_ends_at, p.role, p.is_super_admin
  from stores s join profiles p on p.store_id = s.id
 order by s.created_at desc limit 5;
```

---

## 8. Testar o isolamento entre lojas (crítico)

Este é o teste que garante que você pode vender sem medo.

1. Crie **duas** lojas (A e B) com e-mails diferentes.
2. Na loja A, cadastre um produto e anote o `id` dele:
   ```sql
   select id, name, store_id from products order by created_at desc limit 5;
   ```
3. Logue na loja B e tente acessar o produto da loja A pela URL:
   `https://app.seudominio.com/cadastros/produtos/<ID-DO-PRODUTO-DE-A>`
4. **Resultado esperado:** o produto **não** aparece (a RLS filtra por `store_id`).
5. No console do navegador (logado como B), tente:
   ```js
   const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
   const sb = createClient('SUA_URL', 'SUA_ANON_KEY');
   await sb.from('products').select('*'); // deve retornar apenas os produtos da loja B
   ```
6. **Resultado esperado:** retorna somente os dados da loja B (ou vazio, se não houver sessão).

> Se em qualquer passo você vir dados da outra loja, **pare** e revise as políticas RLS
> antes de vender. Veja `docs/SECURITY.md`.

---

## 9. Backups

**Plano Free:** backups automáticos diários com retenção de 7 dias (não restauráveis pelo painel).

**Plano Pro:** **Database → Backups** com Point-in-Time Recovery (PITR) opcional.

**Backup manual (recomendado antes de qualquer migração):**

```bash
# requer a senha do banco (a que você guardou no passo 1)
pg_dump "postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres" \
  --no-owner --no-privileges > backup-$(date +%F).sql
```

> Rode isso pelo menos 1x por semana enquanto o produto estiver crescendo.
> Guarde os arquivos fora do repositório (nunca commite `.sql` de backup).

---

## 10. Configurações de produção

Antes de vender:

- [ ] **Plano Pro** ativado (o Free pausa o projeto após 7 dias de inatividade).
- [ ] **SMTP próprio** configurado (e-mails de recuperação de senha).
- [ ] **Confirm email** ativado.
- [ ] **Site URL** e **Redirect URLs** apontando para o domínio real.
- [ ] **Leaked password protection** ativado (Auth → Settings).
- [ ] **Backups** verificados.
- [ ] **Logs** monitorados (Logs Explorer).
- [ ] Nenhuma chave `service_role` no frontend ou no Git.

---

## 11. Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `column "is_super_admin" does not exist` | `008` rodou fora de ordem | Rode `008` e depois `009` novamente |
| `new row violates row-level security policy` | Usuário sem `store_id` no perfil | Verifique o trigger de criação de perfil |
| Upload falha com `403` | Primeira pasta ≠ `store_id` | Confirme a política do bucket `catalogo` |
| Link de recuperação abre em branco | Redirect URL não cadastrada | Adicione em **URL Configuration** |
| E-mail de recuperação não chega | SMTP compartilhado / limite | Configure SMTP próprio |
| `permission denied for function create_sale` | `grant execute` não aplicado | Rode o `009` novamente |
