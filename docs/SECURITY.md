# SECURITY.md

Auditoria de segurança e modelo de proteção do **Dalce Estoque**.

---

## 1. Princípios

1. **Segurança no banco, não só no código.** O RLS é a última linha de defesa.
2. **Nunca confiar no cliente.** Toda validação importante é refeita no servidor.
3. **Menor privilégio.** A `service_role` só é usada quando indispensável.
4. **Falhar fechado.** Sem sessão válida, sem acesso.

---

## 2. Multi-tenancy (prioridade máxima)

### Como o isolamento é garantido

| Camada | Mecanismo |
|---|---|
| Banco | RLS em todas as tabelas, filtrando por `current_store_id()` |
| Funções | `create_sale`, `cancel_sale`, `apply_stock`, `receive_fiado` validam `store_id` |
| Server actions | Usam `getStore()`; ignoram qualquer `store_id` do cliente |
| Storage | Política exige primeira pasta = `store_id` do usuário |
| Middleware | Bloqueia acesso de lojas suspensas |

### Vetores testados

- ✅ **IDOR por URL**: acessar `/cadastros/produtos/<id-de-outra-loja>` → RLS filtra, não aparece.
- ✅ **IDOR por API**: chamar `supabase.from('products').select()` → retorna só a própria loja.
- ✅ **Manipulação de `store_id`**: server actions não aceitam `store_id` do cliente.
- ✅ **Upload em pasta alheia**: política de Storage rejeita.
- ✅ **Cancelar venda de outra loja**: `cancel_sale` valida `store_id`.

> **Teste obrigatório antes de vender:** veja `docs/SUPABASE_SETUP.md`, seção 8.

---

## 3. Autenticação

| Item | Status |
|---|---|
| Login com e-mail/senha | ✅ Supabase Auth |
| Sessão via cookies httpOnly | ✅ `@supabase/ssr` |
| Recuperação de senha | ✅ `/recuperar-senha` + `/redefinir-senha` |
| Proteção de rotas | ✅ Middleware |
| Rate limiting no login | ✅ 10 tentativas / 5 min por IP |
| Rate limiting no cadastro | ✅ 5 cadastros / hora por IP |
| Rate limiting na recuperação | ✅ 5 pedidos / hora por IP |
| Logout | ✅ Limpa a sessão |

### Rate limiting

Implementado em `src/lib/rate-limit.ts` (em memória, por instância).

**Limitação conhecida:** na Vercel, cada instância tem seu próprio contador. Para
proteção distribuída real, troque por **Upstash Redis**:

```ts
// exemplo de migração futura
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "5 m"),
});
```

---

## 4. Autorização

| Papel | Onde | Pode |
|---|---|---|
| `owner` | `profiles.role` | Tudo na própria loja |
| `member` | `profiles.role` | Operar a loja (sem config crítica) |
| Super admin | `profiles.is_super_admin` | Gerenciar todas as lojas em `/admin` |

- O super admin é validado **no servidor** (`requireAdmin()` em `admin/actions.ts`).
- Ações administrativas usam RPCs que checam `is_super_admin()` no banco.
- O frontend esconde o menu admin, mas isso é só UX — a proteção real é no servidor.

---

## 5. Segredos

| Segredo | Onde vive | Risco se vazar |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Só no servidor (Vercel Production) | **Crítico** — acesso total ao banco |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente | Baixo (protegida por RLS) |
| Senha do banco | Só no seu gerenciador | Alto |

**Regras:**

- Nenhum segredo com prefixo `NEXT_PUBLIC_`.
- `.env.local` no `.gitignore`.
- `service_role` só em Production na Vercel.
- Se vazar: **rotacione imediatamente** no Supabase.

---

## 6. Validação e sanitização

- **Entrada**: todo dado de formulário é validado no servidor (tipo, tamanho, formato).
- **SQL injection**: impossível — todas as consultas usam o client do Supabase (parametrizado).
- **XSS**: React escapa por padrão; não há `dangerouslySetInnerHTML` no projeto.
- **Upload**: valida tipo MIME, tamanho (12 MB bruto → 2 MB após compressão), converte
  para WebP e grava em pasta isolada por loja.
- **URLs de imagem**: só aceitas se vierem do bucket `catalogo` (bloqueia `data:` e externas).
- **CSRF**: server actions do Next.js têm proteção nativa (origin check).

---

## 7. Headers de segurança

Configurados em `next.config.ts`:

| Header | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

---

## 8. Storage

- Bucket `catalogo`: **público para leitura** (necessário para o catálogo).
- Escrita/atualização/remoção: **restritas à loja** do usuário.
- Nome do arquivo: `<store_id>/<prefixo>-<timestamp>-<hash>.webp` (não adivinhável).
- Limite: 2 MB, apenas imagens.

> **Nota:** como o bucket é público, qualquer pessoa com a URL exata vê a imagem. Isso é
> aceitável para fotos de produto (que são públicas no catálogo). **Não** coloque
> documentos, notas fiscais ou dados sensíveis nesse bucket.

---

## 9. Logs e auditoria

- `audit_logs` registra ações importantes (venda, cancelamento, alteração de plano).
- Logs **não** contêm senhas, tokens ou chaves.
- Erros técnicos não são mostrados ao usuário (mensagens amigáveis).

---

## 10. Riscos conhecidos e mitigações

| Risco | Gravidade | Mitigação |
|---|---|---|
| Rate limit não distribuído | 🟡 Baixa | Migrar para Upstash Redis ao escalar |
| Bucket público | 🟡 Baixa | Aceitável para fotos de produto |
| Sem 2FA | 🟡 Baixa | Adicionar MFA do Supabase no futuro |
| Sem CSP | 🟡 Baixa | Adicionar Content-Security-Policy ao amadurecer |
| E-mail no plano Free do Supabase | 🟠 Média | Configurar SMTP próprio antes de vender |

---

## 11. Checklist de segurança

- [ ] RLS ativo em todas as tabelas.
- [ ] Teste de isolamento entre lojas executado (seção 8 do SUPABASE_SETUP).
- [ ] `service_role` só no servidor.
- [ ] Rate limiting ativo em login/cadastro/recuperação.
- [ ] Headers de segurança configurados.
- [ ] Storage com políticas corretas.
- [ ] Nenhum segredo no Git.
- [ ] SMTP próprio configurado.
- [ ] Backups funcionando.
- [ ] Monitoramento de erros ativo.
