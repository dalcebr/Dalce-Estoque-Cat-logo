# Documentação · Dalce Estoque

Índice da documentação técnica e operacional do produto.

## Comece por aqui

1. **[../README.md](../README.md)** — visão geral, instalação e uso.
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** — como o sistema é construído.
3. **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** — configurar o banco e a autenticação.
4. **[DEPLOYMENT.md](DEPLOYMENT.md)** — colocar em produção.

## Infraestrutura

| Documento | Quando usar |
|---|---|
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Criar projeto, rodar SQL, configurar auth e storage |
| [VERCEL_SETUP.md](VERCEL_SETUP.md) | Deploy, domínio, variáveis de ambiente |
| [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) | DNS, SSL, cache e proteção |
| [GITHUB_SETUP.md](GITHUB_SETUP.md) | Repositório, branches, CI e segurança |
| [MONGODB_SETUP.md](MONGODB_SETUP.md) | Por que **não** usar MongoDB neste projeto |
| [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) | Inventário de variáveis |

## Técnico

| Documento | Conteúdo |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitetura, stack, multi-tenancy, escalabilidade |
| [SECURITY.md](SECURITY.md) | Auditoria de segurança e riscos residuais |
| [API.md](API.md) | Server actions, RPCs e endpoints |
| [DATABASE.md](DATABASE.md) | Tabelas, índices, RLS e performance |

## Operação

| Documento | Conteúdo |
|---|---|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Processo de deploy e rollback |
| [TESTING.md](TESTING.md) | Checklist de testes |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problemas comuns e soluções |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Checklist final antes de vender |
| [CHECKLIST-LANCAMENTO.md](CHECKLIST-LANCAMENTO.md) | Roteiro comercial de lançamento |

---

## Ordem recomendada de leitura

**Se você vai colocar em produção pela primeira vez:**

```
README → ARCHITECTURE → SUPABASE_SETUP → GITHUB_SETUP → VERCEL_SETUP
→ CLOUDFLARE_SETUP → TESTING → PRODUCTION_CHECKLIST
```

**Se algo quebrou:**

```
TROUBLESHOOTING → (se for segurança) SECURITY → (se for banco) DATABASE
```

**Se você vai vender para um cliente:**

```
PRODUCTION_CHECKLIST → TESTING → CHECKLIST-LANCAMENTO
```
