# MONGODB_SETUP.md

## ⚠️ Leia isto primeiro: o Dalce Estoque **não usa MongoDB**

Este documento existe porque foi solicitado, mas a resposta honesta é: **não adicione
MongoDB a este projeto.**

### Por que não

O Dalce Estoque é um SaaS **multi-tenant** onde o requisito mais crítico é o
**isolamento de dados entre lojas**. Hoje isso é garantido pelo **PostgreSQL do Supabase
com Row Level Security (RLS)**: mesmo que o código da aplicação tenha um bug, o banco
recusa qualquer consulta que tente ler dados de outra loja.

O MongoDB **não tem RLS nativo**. O isolamento teria que ser feito manualmente em cada
consulta (`{ store_id: ... }`), o que significa:

- Um único `find()` sem o filtro de `store_id` vaza dados de todos os clientes.
- Não há rede de segurança no banco — a proteção depende 100% do código estar correto.
- Você passaria a ter **dois bancos** para manter, sincronizar, fazer backup e monitorar.

Isso **aumenta** o risco de vazamento entre lojas, que é exatamente o que você pediu
para priorizar. Adicionar MongoDB aqui seria trocar uma proteção forte por uma promessa.

### O que o Supabase já resolve

| Necessidade | Solução atual (Supabase/Postgres) |
|---|---|
| Dados relacionais (lojas, produtos, vendas) | ✅ Postgres com RLS |
| Isolamento multi-tenant | ✅ RLS + `current_store_id()` |
| Transações atômicas (venda completa) | ✅ Funções PL/pgSQL (`create_sale`) |
| Arquivos/imagens | ✅ Supabase Storage |
| Autenticação | ✅ Supabase Auth |
| Busca textual | ✅ `ilike` + índices (suficiente nesta escala) |
| Dados flexíveis (JSON) | ✅ Colunas `jsonb` |

### Quando faria sentido reconsiderar

Só se o produto mudasse de natureza, por exemplo:

- **Logs/eventos em altíssimo volume** (milhões/dia) que não precisam de relação com o
  resto — aí um banco de séries temporais ou o próprio Postgres com particionamento resolve.
- **Cache de sessão distribuído** — aí o certo é **Redis** (Upstash), não MongoDB.
- **Busca avançada com relevância** — aí o certo é **Postgres full-text** ou **Meilisearch**.

Em nenhum desses casos MongoDB é a melhor escolha para *este* produto.

---

## Se ainda assim você quiser usar MongoDB

Documentado abaixo, mas **não recomendado** para o núcleo do sistema. Use no máximo
para dados auxiliares que não contenham informação de clientes.

### 1. Criar o cluster

1. Acesse <https://cloud.mongodb.com> e crie uma conta.
2. **Build a Database → M0 (Free)** para começar.
3. **Provider**: AWS. **Region**: `São Paulo (sa-east-1)`.
4. **Cluster Name**: `dalce-aux`.
5. Clique em **Create**.

### 2. Usuário e permissões

**Database Access → Add New Database User**:

- **Authentication**: Password.
- **Username**: `dalce_app`.
- **Password**: gere uma forte e guarde.
- **Database User Privileges**: **Read and write to any database** (ou restrinja a um
  database específico — melhor).

### 3. Network Access

**Network Access → Add IP Address**:

- Para desenvolvimento: **Add Current IP Address**.
- Para produção na Vercel: a Vercel **não tem IP fixo** no plano Free. Use `0.0.0.0/0`
  (libera todos) **apenas** se o usuário tiver permissão mínima e a connection string
  for tratada como segredo absoluto. O ideal é usar **Vercel Secure Compute** (pago) ou
  um proxy com IP fixo.

> ⚠️ `0.0.0.0/0` significa que qualquer IP pode tentar conectar. A única proteção passa
> a ser a senha. Trate a connection string como o segredo mais crítico do sistema.

### 4. Connection string

**Database → Connect → Drivers**:

```text
mongodb+srv://dalce_app:<SENHA>@dalce-aux.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Adicione como variável de ambiente (veja `docs/ENVIRONMENT_VARIABLES.md`):

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=dalce_aux
```

### 5. Índices

Se criar coleções, **sempre** indexe por `store_id` e crie índices compostos:

```js
db.eventos.createIndex({ store_id: 1, created_at: -1 });
```

### 6. Backup

- **M0 (Free)**: sem backup automático. Faça `mongodump` manual.
- **M10+**: backup contínuo disponível.

### 7. Monitoramento

**Atlas → Metrics** mostra conexões, operações e latência. Configure **Alerts** para
uso de CPU, memória e conexões.

---

## Conclusão

**Recomendação final: não use MongoDB neste projeto.** O Supabase/Postgres com RLS é
mais seguro, mais simples de manter e já cobre todas as necessidades do Dalce Estoque.
Se surgir uma necessidade específica no futuro, avalie a ferramenta certa para o caso
(Redis para cache, Meilisearch para busca) em vez de adicionar um segundo banco genérico.
