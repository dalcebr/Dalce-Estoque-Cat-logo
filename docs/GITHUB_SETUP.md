# Configuracao do GitHub

Guia para configurar o repositorio, protecao de branches e CI/CD.

## 1. Criar Repositorio

```bash
# Inicializar repositorio (se ainda nao feito)
cd dalce-estoque
git init
git add .
git commit -m "feat: setup inicial do Dalce Estoque"

# Criar repositorio no GitHub e fazer push
gh repo create dalce-estoque --private --push
# ou manualmente:
git remote add origin git@github.com:seu-usuario/dalce-estoque.git
git push -u origin main
```

## 2. Protecao de Branch

### Configurar branch principal

1. Va em **Settings > Branches**
2. Clique em **Add branch protection rule**
3. Branch name pattern: `main`
4. Marque:
   - **Require a pull request before merging**
   - **Require approvals** (1 approval minimo)
   - **Require status checks to pass before merging**
     - Adicione o check `build` (apos configurar CI)
   - **Require branches to be up to date before merging**
   - **Do not allow bypassing the above settings**

### Fluxo de branches recomendado

```
main (producao)
  |
  +-- develop (desenvolvimento)
       |
       +-- feature/nome-da-feature
       +-- fix/descricao-do-bug
       +-- hotfix/correcao-urgente
```

## 3. CI/CD com GitHub Actions

### Workflow basico de build e lint

Crie o arquivo `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Audit dependencies
        run: npm audit --audit-level=high
        continue-on-error: true
```

### Workflow de deploy (opcional, se nao usar integracao Vercel)

Se preferir controlar o deploy via GitHub Actions em vez da integracao nativa Vercel:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

> **Nota**: A integracao nativa Vercel + GitHub e mais simples e recomendada. O workflow acima e apenas para cenarios especificos.

## 4. Secrets (Segredos)

### Configurar secrets no GitHub

Va em **Settings > Secrets and variables > Actions** e adicione:

| Secret | Descricao | Onde encontrar |
|--------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase | Supabase > Settings > API |
| `VERCEL_TOKEN` | Token pessoal Vercel (se usar deploy via Actions) | Vercel > Settings > Tokens |
| `VERCEL_ORG_ID` | ID da org Vercel | `.vercel/project.json` apos `vercel link` |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel | `.vercel/project.json` apos `vercel link` |

### Variaveis de ambiente vs Secrets

- **Secrets**: Valores sensiveis (chaves, tokens). Mascarados nos logs.
- **Variables**: Valores nao-sensiveis (nomes de projeto, flags). Visiveis nos logs.

Para o Dalce Estoque, use secrets para todas as variaveis porque mesmo as `NEXT_PUBLIC_*` contem chaves.

## 5. .gitignore

Verifique que o `.gitignore` inclui:

```gitignore
# dependencies
node_modules/
.pnp
.pnp.js

# next.js
.next/
out/

# env files
.env
.env.local
.env.production.local
.env.development.local

# vercel
.vercel

# misc
.DS_Store
*.tsbuildinfo
next-env.d.ts
```

> **NUNCA** commite arquivos `.env.local` ou `.env.production`. Use `.env.example` como template.

## 6. Templates de PR e Issues

### Pull Request Template

Crie `.github/pull_request_template.md`:

```markdown
## Descricao

Descreva brevemente o que foi alterado.

## Tipo de mudanca

- [ ] Bug fix
- [ ] Nova feature
- [ ] Refatoracao
- [ ] Atualizacao de dependencias
- [ ] Documentacao

## Checklist

- [ ] Testei localmente
- [ ] Verifiquei que nao quebra RLS
- [ ] Validacao de input esta adequada
- [ ] Nao exponho dados sensiveis
```

### Issue Templates

Crie `.github/ISSUE_TEMPLATE/bug.md`:

```markdown
---
name: Bug Report
about: Reportar um bug
---

## Descricao do Bug

## Passos para Reproduzir

1.
2.
3.

## Comportamento Esperado

## Screenshots (se aplicavel)

## Ambiente
- Browser:
- Device:
```

## 7. Dependabot

Crie `.github/dependabot.yml` para manter dependencias atualizadas:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
```

## 8. Boas Praticas

### Commits

Use Conventional Commits:

```
feat: adicionar filtro por categoria no estoque
fix: corrigir calculo de troco no PDV
docs: atualizar guia de deploy
refactor: extrair validacao para lib/validation
```

### Code Review

Antes de aprovar um PR, verifique:

1. **Seguranca**: Toda query usa RLS? Inputs validados?
2. **Multi-tenancy**: `store_id` e usado corretamente? Sem vazamento de dados?
3. **Performance**: Indices existem para queries frequentes?
4. **Tipagem**: TypeScript sem `any` desnecessario?
