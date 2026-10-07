# DEPLOYMENT.md

Processo completo para colocar o **Dalce Estoque** em produção.

---

## 1. Ordem correta

```text
1. Supabase (banco, auth, storage)   → docs/SUPABASE_SETUP.md
2. GitHub (repositório, segurança)   → docs/GITHUB_SETUP.md
3. Vercel (deploy, domínio)          → docs/VERCEL_SETUP.md
4. Cloudflare (DNS, SSL) — opcional  → docs/CLOUDFLARE_SETUP.md
5. Testes finais                     → docs/TESTING.md
6. Checklist de produção             → docs/PRODUCTION_CHECKLIST.md
```

> Não pule a ordem. A Vercel precisa das chaves do Supabase; o domínio precisa do deploy.

---

## 2. Deploy passo a passo

### Passo 1 — Supabase

1. Crie o projeto.
2. Rode os 9 scripts SQL na ordem.
3. Configure Auth (URLs, providers, SMTP).
4. Confirme o bucket `catalogo`.
5. Crie o super admin.
6. Anote: URL, anon key, service_role key.

### Passo 2 — GitHub

1. Crie o repositório (privado).
2. Confirme `.gitignore` e `.env.example`.
3. Faça o push do código.
4. Ative secret scanning e Dependabot.

### Passo 3 — Vercel

1. Importe o repositório.
2. Configure as variáveis de ambiente.
3. Faça o deploy.
4. Adicione o domínio próprio.
5. Atualize as Redirect URLs no Supabase com o domínio final.

### Passo 4 — Cloudflare (opcional)

1. Adicione o domínio.
2. Configure o DNS (`app` → `cname.vercel-dns.com`).
3. SSL em **Full (strict)** ou **DNS only**.
4. Bypass cache em `/api/*`.

### Passo 5 — Validação

Rode o checklist de `docs/TESTING.md` no domínio final.

---

## 3. Deploy de atualizações

```bash
# 1. trabalhe em uma branch
git checkout -b feat/minha-melhoria

# 2. teste localmente
npm run typecheck
npm run build

# 3. commit e push
git add .
git commit -m "feat: minha melhoria"
git push origin feat/minha-melhoria

# 4. abra um PR → a Vercel gera preview → teste → merge na main
```

O merge na `main` dispara o deploy de produção automaticamente.

---

## 4. Migrações de banco em produção

**Sempre** antes de rodar uma migração:

1. Faça um backup (`pg_dump`).
2. Teste a migração em um projeto Supabase de teste.
3. Rode em produção em horário de baixo uso.
4. Verifique os logs.

> Migrações SQL **não** são revertidas pelo rollback da Vercel. Se algo quebrar,
> restaure o backup.

---

## 5. Rollback

**Código:**
- Vercel → Deployments → último deploy bom → **Promote to Production**.

**Banco:**
- Restaure o backup mais recente.
- Ou rode uma migração corretiva.

---

## 6. Monitoramento pós-deploy

Após cada deploy, verifique:

- [ ] `/api/health` retorna 200.
- [ ] Login funciona.
- [ ] Cadastro funciona.
- [ ] PDV registra uma venda de teste.
- [ ] Catálogo público abre.
- [ ] Logs da Vercel sem erros.
- [ ] Logs do Supabase sem erros.

---

## 7. Ambientes

| Ambiente | Branch | Banco | Uso |
|---|---|---|---|
| Development | local | Supabase de teste | Desenvolvimento |
| Preview | qualquer | Supabase de teste | Validação de PR |
| Production | `main` | Supabase de produção | Clientes reais |

> **Recomendação forte:** use **dois projetos Supabase** (teste e produção). Nunca
> teste em produção com dados de clientes reais.

---

## 8. Custos estimados (referência)

| Serviço | Plano | Custo aproximado |
|---|---|---|
| Vercel | Hobby / Pro | R$ 0 / ~US$ 20/mês |
| Supabase | Free / Pro | R$ 0 / ~US$ 25/mês |
| Cloudflare | Free | R$ 0 |
| Domínio | — | ~R$ 40/ano |

Para começar a vender, o mínimo viável é **Supabase Pro** (backups + sem pausa) e
**Vercel Hobby** (se o tráfego for baixo).
