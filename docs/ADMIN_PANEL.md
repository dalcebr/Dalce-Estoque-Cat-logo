# Painel de Administrador

O painel de administrador permite gerenciar os acessos (lojas) do sistema:
criar, congelar, excluir e fazer backup/restauracao dos dados.

Acesse em **`/admin`**. A area e **separada do sistema de catalogo**: ao fazer
login com um usuario `role = 'admin'`, voce e redirecionado automaticamente
para o painel e nao ve o menu da loja. Usuarios comuns que tentarem abrir
`/admin` sao enviados de volta para o sistema (`/`).

## Pre-requisitos

### 1. Rodar as migracoes

No SQL Editor do Supabase, execute (nesta ordem):

1. `supabase/020_admin_panel.sql` — colunas `role`/`frozen`, RLS de admin e
   bloqueio de lojas congeladas.
2. `supabase/022_store_cascade.sql` — `ON DELETE CASCADE` em `store_id`
   (necessario para excluir a loja com todos os dados).
3. `supabase/023_admin_role_helper.sql` — funcao `current_role_name()`
   (security definer) usada no login/middleware e `store_id` nulo para admins.

### 2. Configurar a service role key

Adicione a variavel de ambiente (veja `ENVIRONMENT_VARIABLES.md`):

```
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE
```

> **Seguranca**: essa chave ignora o RLS e da acesso total ao banco e ao Auth.
> Ela e usada **somente no servidor** (Server Actions do painel). Nunca use o
> prefixo `NEXT_PUBLIC_` e nunca a exponha no client.

### 3. Promover o primeiro administrador

1. Crie um usuario normalmente (pelo app ou pelo painel do Supabase Auth).
2. Edite `supabase/021_promote_admin.sql` trocando `SEU_USUARIO` pelo username
   (sem `@dalce.app`) e rode no SQL Editor.

```sql
update profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'SEU_USUARIO@dalce.app');
```

## Funcionalidades

### Acesso separado

- **Login de admin** → redireciona direto para `/admin`.
- **Admin logado** tentando abrir qualquer rota do sistema → volta para `/admin`.
- **Usuario comum** tentando abrir `/admin` → volta para `/`.
- O painel tem layout proprio (cabecalho com titulo e botao **Sair**), sem o
  menu da loja.

### Administradores

Em **Admins** (`/admin/admins`) voce ve todos os administradores do sistema e
pode criar novos. Um administrador **nao pertence a nenhuma loja** — ele so
acessa o painel. Informe nome, usuario e senha; o login e feito com o usuario
(sem e-mail).

### Criar acesso

Em **Novo acesso**, informe:

- **Nome da loja** — exibido no sistema.
- **Nome do responsável** — nome do dono.
- **Usuário de acesso** — o login (3 a 30 caracteres: `a-z`, `0-9`, `.`, `-`, `_`).
- **Senha inicial** — minimo 6 caracteres.

O sistema cria automaticamente o usuario no Auth (`usuario@dalce.app`), a loja
e o perfil vinculado.

### Congelar / Descongelar

- **Congelar**: o usuario nao consegue mais acessar. Ao tentar entrar, e
  redirecionado para a tela **Acesso congelado**. Os dados sao preservados.
- **Descongelar**: restaura o acesso imediatamente.

O bloqueio acontece em duas camadas:

1. **Middleware** — redireciona lojas congeladas para `/congelado`.
2. **RLS** — as policies de dados exigem `store_active()`, entao mesmo que o
   middleware seja contornado, o banco nao retorna nem aceita dados.

O catalogo publico (`/c/slug`) tambem deixa de exibir lojas congeladas.

### Excluir loja

Apaga **todos os dados** da loja (produtos, vendas, clientes, catalogo,
variacoes, fiado) e o usuario de acesso. A acao e irreversivel — exporte um
backup antes, se quiser poder restaurar depois.

### Exportar JSON

Baixa um arquivo `dalce-<loja>-<data>.json` com todos os dados da loja:

```json
{
  "format": "dalce-estoque-backup",
  "version": 1,
  "exportedAt": "2025-01-01T12:00:00.000Z",
  "store": { "name": "Minha Loja", "monthly_goal": 10000, "owner_username": "maria" },
  "data": {
    "categories": [], "products": [], "product_variations": [],
    "variation_groups": [], "customers": [], "sales": [],
    "sale_items": [], "sale_payments": [], "fiado_receipts": [],
    "catalog_settings": []
  }
}
```

### Importar JSON

Em **Importar**, selecione um arquivo exportado. A importacao:

- Cria uma **nova loja** (novo `store_id`) — nada existente e sobrescrito.
- Remapeia todos os IDs internos (produtos, vendas, itens, etc.).
- Desativa o catalogo e limpa o slug (que e unico globalmente) para evitar
  conflito com a loja original.

Depois de importar, crie o acesso do dono em **Novo acesso** (ou informe o
usuario no proprio formulario de importacao).

## Fluxo de recuperacao (excluir e depois restaurar)

1. Antes de excluir, clique em **Exportar JSON** e guarde o arquivo.
2. Exclua a loja.
3. Quando o dono quiser retomar, va em **Importar**, selecione o arquivo e
   informe o nome da loja e o usuario do dono.
4. Crie o acesso (ou use o usuario informado) e entregue a senha ao dono.

## Seguranca

- Todas as Server Actions do painel chamam `requireAdmin()`, que valida
  `profiles.role = 'admin'` antes de qualquer operacao.
- A service role key nunca chega ao navegador.
- O RLS continua ativo para os usuarios comuns; o admin usa o service role
  apenas no servidor.

## Diagnostico: login de admin nao redireciona

Se ao logar com um usuario `role = 'admin'` voce nao for para `/admin`:

1. **Rode a migracao `023_admin_role_helper.sql`.** O login e o middleware
   passaram a usar a funcao `current_role_name()` (security definer), que le o
   papel sem depender de RLS. Sem essa funcao, o `rpc` falha e o usuario e
   tratado como loja comum.
2. **Confirme o papel no banco:**

   ```sql
   select p.id, p.name, p.username, p.role, u.email
     from profiles p join auth.users u on u.id = p.id
    where p.role = 'admin';
   ```

   Se nao retornar nada, promova o usuario com `021_promote_admin.sql`.
3. **Confirme que o perfil existe.** O `update` de `021` so afeta quem ja tem
   linha em `profiles`. Se o usuario foi criado direto no Auth sem perfil, crie
   a linha (com `store_id` nulo e `role = 'admin'`).
4. **Reinicie o servidor** (`npm run dev`) para o middleware recarregar.
5. **Limpe os cookies de sessao** do navegador e entre novamente.
