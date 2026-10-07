# Checklist de Producao

Itens a verificar antes de colocar o Dalce Estoque em producao.

## Seguranca

### Obrigatorio

- [ ] **RLS ativo em todas as tabelas**: Executar query de verificacao:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
  ```
  Resultado deve ser vazio.

- [ ] **Migration 008 executada**: Correcoes de seguranca em `apply_stock()` e `cancel_sale()`

- [ ] **"Confirm email" desativado** no Supabase Auth (emails sinteticos nao recebem confirmacao)

- [ ] **Chave service_role NAO exposta**: Verificar que nenhum codigo usa `SUPABASE_SERVICE_ROLE_KEY` no client

- [ ] **Variaveis de ambiente configuradas** na Vercel (nao commitadas no repositorio)

- [ ] **HTTPS forcado**: HSTS configurado, Cloudflare com "Always Use HTTPS"

- [ ] **Security headers presentes**: Verificar com `curl -I https://app.dalce.com.br`:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security
  - Referrer-Policy
  - Permissions-Policy

- [ ] **Rate limiting ativo** no login (middleware)

- [ ] **poweredByHeader desativado** no `next.config.ts`

### Recomendado

- [ ] Rate limiting no Cloudflare como camada adicional
- [ ] Bot Fight Mode ativo no Cloudflare
- [ ] WAF basico do Cloudflare ativo
- [ ] Monitoramento de tentativas de login suspeitas

## Banco de Dados

### Obrigatorio

- [ ] **Migrations na ordem correta**: schema.sql -> 003 -> 004 -> 005 -> 006 -> 007 -> 008
- [ ] **Indices criados**: Verificar que indices de performance existem:
  ```sql
  SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
  ```
- [ ] **Constraints de validacao**: Verificar nomes nao-vazios e limites de imagem
- [ ] **Funcoes atualizadas**: `apply_stock()` e `cancel_sale()` com verificacao de `store_id`
- [ ] **Usuario inicial criado** e testado
- [ ] **Regiao correta**: Projeto Supabase em South America (Sao Paulo)

### Recomendado

- [ ] Plano Supabase Pro para producao (backups PITR, melhor performance)
- [ ] Monitoramento de queries lentas habilitado
- [ ] Alertas de uso de disco e conexoes configurados

## Performance

### Obrigatorio

- [ ] **Build sem erros** (`npm run build` local)
- [ ] **TypeScript sem erros** (`npx tsc --noEmit`)
- [ ] **Imagens otimizadas**: Formato WebP, resize client-side, constraint de tamanho no banco

### Recomendado

- [ ] Cache do Cloudflare configurado para `/c/*` (catalogo publico)
- [ ] Cache longo para `/_next/static/*`
- [ ] Brotli compression ativo no Cloudflare
- [ ] Core Web Vitals aceitaveis (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Vercel Analytics habilitado

## Infraestrutura

### Obrigatorio

- [ ] **Dominio configurado** e acessivel
- [ ] **SSL funcionando** (certificado valido)
- [ ] **DNS propagado** (dominio resolve corretamente)
- [ ] **Vercel configurada** com variaveis de ambiente corretas
- [ ] **Supabase Auth URLs** configuradas para o dominio de producao

### Recomendado

- [ ] Cloudflare configurado (DNS + CDN + seguranca)
- [ ] GitHub Actions CI configurado
- [ ] Branch protection no `main`
- [ ] Dependabot configurado para updates de seguranca
- [ ] Plano de rollback documentado

## Funcionalidade

### Obrigatorio (testar em producao)

- [ ] Login/logout funciona
- [ ] Criar venda completa (com estoque, pagamento, cliente)
- [ ] Cancelar venda (verifica restauracao de estoque)
- [ ] CRUD de produtos, categorias, clientes
- [ ] Catalogo publico funciona e nao expoe dados sensiveis
- [ ] Fiado: registrar venda e recebimento
- [ ] Formatacao BRL correta em todos os valores
- [ ] Data/hora no fuso de Sao Paulo

### Recomendado

- [ ] Testar em dispositivo movel (layout responsivo)
- [ ] Testar com conexao lenta (3G simulado)
- [ ] Testar isolamento multi-tenant (2 lojas)

## Backup e Recuperacao

### Obrigatorio

- [ ] **Backup do banco habilitado**: Supabase free tier faz backup diario (7 dias)
- [ ] **Codigo no GitHub**: Repositorio atualizado com tag de versao

### Recomendado

- [ ] Script de backup manual documentado
- [ ] Procedimento de rollback testado
- [ ] Plano Supabase Pro para PITR (point-in-time recovery)

## Monitoramento

### Obrigatorio

- [ ] **Logs acessiveis**: Vercel Logs e Supabase Logs
- [ ] **Alertas de build**: Notificacoes de falha na Vercel

### Recomendado

- [ ] Uptime monitoring (ex: UptimeRobot, Better Stack)
- [ ] Alertas de erro em producao
- [ ] Dashboard de metricas (Vercel Analytics)

## LGPD (Lei Geral de Protecao de Dados)

O sistema armazena dados pessoais de clientes (nome, telefone, CPF). Considerar:

### Obrigatorio

- [ ] **Politica de Privacidade** acessivel no site/catalogo
- [ ] **Base legal para tratamento**: Consentimento ou execucao de contrato
- [ ] **Seguranca dos dados**: RLS, HTTPS, headers de seguranca (ja implementados)
- [ ] **Acesso restrito**: Somente usuarios autorizados da loja acessam dados de clientes

### Recomendado

- [ ] **Direito de acesso**: Mecanismo para cliente solicitar seus dados
- [ ] **Direito de exclusao**: Mecanismo para excluir dados de cliente a pedido
- [ ] **Registro de atividades de tratamento**: Log de quem acessou dados
- [ ] **Encarregado de dados (DPO)**: Designar responsavel
- [ ] **Termo de uso** para lojistas que usam o SaaS
- [ ] **Contrato de processamento de dados** entre operador (Dalce) e controlador (lojista)

### Dados pessoais armazenados

| Dado | Tabela | Campo | Base legal sugerida |
|------|--------|-------|---------------------|
| Nome do cliente | customers | name | Execucao de contrato |
| Telefone do cliente | customers | phone | Consentimento |
| CPF do cliente | customers | cpf | Obrigacao legal (NF) |
| Nome em vendas | sales | customer_name | Execucao de contrato |
| Nome em fiado | fiado_receipts | customer_name | Execucao de contrato |
| Email do catalogo | catalog_settings | email | Legitimo interesse |

### Retencao de dados

Definir e documentar prazos de retencao:
- Vendas: minimo 5 anos (obrigacao fiscal)
- Clientes: enquanto a relacao comercial existir
- Clientes inativos: excluir apos periodo definido (ex: 2 anos)

## Lancamento

### Dia do lancamento

1. [ ] Executar todos os itens obrigatorios acima
2. [ ] Criar loja(s) de producao
3. [ ] Criar usuarios para cada lojista
4. [ ] Testar login de cada usuario
5. [ ] Verificar que catalogo publico funciona
6. [ ] Monitorar logs nas primeiras horas

### Primeira semana

1. [ ] Monitorar erros nos logs
2. [ ] Coletar feedback dos lojistas
3. [ ] Verificar performance (tempos de resposta)
4. [ ] Verificar uso de recursos (Supabase, Vercel)
5. [ ] Ajustar rate limiting se necessario
