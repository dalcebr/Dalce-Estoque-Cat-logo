# GITHUB_SETUP.md

Boas práticas de repositório, segurança e CI para o **Dalce Estoque**.

---

## 1. Estrutura do repositório

```text
Dalce-Estoque-Cat-logo/
├── docs/                     # documentação (este diretório)
├── src/
│   ├── app/                  # rotas (App Router), server actions e API
│   ├── components/           # componentes React
│   ├── lib/                  # utilitários, Supabase, regras de negócio
│   └── middleware.ts         # proteção de rotas e sessão
├── supabase/                 # scripts SQL (rodar em ordem)
├── .env.example              # modelo de variáveis (SEM segredos)
├── .gitignore
├── next.config.ts
├── package.json
└── README.md
```

---

## 2. Branches

| Branch | Papel |
|---|---|
| `main` | Produção. Só recebe código testado. Deploy automático na Vercel. |
| `feat/*` | Novas funcionalidades. |
| `fix/*` | Correções. |
| `chore/*` | Manutenção, dependências, docs. |

**Fluxo recomendado:**

```bash
git checkout -b feat/nova-funcionalidade
# ... trabalhe ...
git add .
git commit -m "feat: adiciona exportação de relatório em CSV"
git push origin feat/nova-funcionalidade
# abra um Pull Request → a Vercel gera uma URL de preview → teste → merge na main
```

---

## 3. Proteção da branch `main`

Em **Settings → Branches → Add branch protection rule**:

- **Branch name pattern**: `main`.
- ✅ **Require a pull request before merging**.
- ✅ **Require status checks to pass** (se você configurar CI — seção 7).
- ✅ **Require conversation resolution before merging**.
- ✅ **Do not allow bypassing the above settings**.

> Mesmo trabalhando sozinho, isso evita push acidental direto na produção.

---

## 4. `.gitignore`

O projeto já tem um `.gitignore` sensato. Confirme que ele contém:

```gitignore
node_modules/
.next/
out/
build/
.env
.env.local
.env*.local
*.log
.DS_Store
.vercel
*.tsbuildinfo
next-env.d.ts
```

> **Nunca** commite `.env`, `.env.local` ou qualquer arquivo com chaves reais.
> Se commitar por acidente, **rotacione a chave imediatamente** no Supabase — remover
> do Git não apaga o histórico.

---

## 5. `.env` e `.env.example`

- `.env.local` → seus valores reais, **nunca** commitado.
- `.env.example` → modelo com placeholders, **sempre** commitado.

O `.env.example` do projeto lista todas as variáveis necessárias. Mantenha-o atualizado
sempre que adicionar uma variável nova.

---

## 6. Secrets e variables

**Para a Vercel:** as variáveis são configuradas no painel da Vercel
(**Settings → Environment Variables**), **não** no GitHub. Veja `docs/VERCEL_SETUP.md`.

**Para GitHub Actions (se usar CI):** em **Settings → Secrets and variables → Actions**:

- **Secrets** (valores sensíveis): `SUPABASE_SERVICE_ROLE_KEY`, tokens de deploy.
- **Variables** (valores não sensíveis): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`.

> Secrets do GitHub **não** são expostos em logs. Variables são visíveis.

---

## 7. GitHub Actions (CI opcional)

Crie `.github/workflows/ci.yml` para validar cada PR antes do merge:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ vars.NEXT_PUBLIC_APP_URL }}
```

> O build precisa das variáveis públicas. Use **variables** para as públicas e
> **secrets** para qualquer coisa sensível. A `service_role` **não** é necessária no CI.

---

## 8. Deploy

O deploy é feito pela **Vercel**, não pelo GitHub Actions:

- Push na `main` → deploy de produção automático.
- Push em outra branch → deploy de preview.

Veja `docs/VERCEL_SETUP.md`.

---

## 9. Segurança do repositório

- [ ] Repositório **privado** (recomendado enquanto o produto não for open source).
- [ ] **Secret scanning** ativado (Settings → Code security).
- [ ] **Dependabot alerts** ativado.
- [ ] **Dependabot security updates** ativado.
- [ ] Nenhuma chave real no histórico (`git log -p | grep -i "service_role"`).
- [ ] `.env` no `.gitignore`.
- [ ] Branch `main` protegida.

---

## 10. Boas práticas de commit

Use mensagens claras no padrão **Conventional Commits**:

```text
feat: adiciona filtro por categoria no estoque
fix: corrige cálculo de troco no PDV
docs: atualiza guia de deploy
chore: atualiza dependências
refactor: extrai validação de imagem para lib/image.ts
```

Isso facilita entender o histórico e gerar changelog no futuro.

---

## 11. Checklist

- [ ] Repositório criado e conectado à Vercel.
- [ ] `.gitignore` correto.
- [ ] `.env.example` atualizado.
- [ ] Branch `main` protegida.
- [ ] Secret scanning e Dependabot ativados.
- [ ] CI configurado (opcional).
- [ ] Nenhum segredo no histórico.
