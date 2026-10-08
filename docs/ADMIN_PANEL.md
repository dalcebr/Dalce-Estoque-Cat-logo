# Painel de Administrador

O painel de administrador permite gerenciar os acessos (lojas) do sistema:
criar, congelar, excluir e fazer backup/restauracao dos dados.

Acesse em **`/admin`**. A area e **totalmente separada do sistema de catalogo**,
inclusive com **tela de login propria** em **`/admin/login`**:

- Quem nao esta logado e tenta abrir qualquer rota `/admin/*` vai para
  **`/admin/login`** (e nao para o login da loja).
- O login do painel so aceita contas com `role = 'admin'`. Se a conta for de
  loja, a sessao e encerrada e aparece a mensagem "Esta conta nao e de
  administrador".
- Ao entrar, o admin vai direto para `/admin` e **nunca ve o menu da loja**.
- Usuarios comuns que tentarem abrir `/admin` sao enviados de volta para `/`.
- O login da loja (`/login`) continua existindo para as lojas; se um admin
  entrar por ele, e redirecionado para `/admin`.

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

- **Login do painel** em `/admin/login` → redireciona direto para `/admin`.
- **Admin logado** tentando abrir qualquer rota do sistema → volta para `/admin`.
- **Usuario comum** tentando abrir `/admin` → volta para `/`.
- **Nao autenticado** tentando abrir `/admin/*` → vai para `/admin/login`.
- O painel tem layout proprio (cabecalho com titulo e botao **Sair**), sem o
  menu da loja. A tela de login do painel tem layout proprio, sem esse cabecalho.

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

O painel tem uma pagina de diagnostico em **`/admin/diagnostico`** (acessivel
logado). Ela mostra, em tempo real, o que o servidor enxerga:

- se voce esta autenticado;
- o que a funcao `current_role_name()` retorna;
- o valor de `profiles.role` lido diretamente;
- se a `SUPABASE_SERVICE_ROLE_KEY` esta configurada.

Se qualquer um dos dois primeiros nao mostrar **admin**, o redirecionamento nao
acontece. Siga os passos abaixo:

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

> **Nota tecnica:** o login **nao** usa `redirect()` dentro da Server Action.
> Em Next.js, o `redirect()` em uma Server Action pode descartar os cookies de
> sessao definidos na mesma requisicao, fazendo o middleware enxergar o usuario
> como deslogado na navegacao seguinte. Por isso a action retorna o destino e o
> cliente redireciona com `router.replace()` + `router.refresh()`.
