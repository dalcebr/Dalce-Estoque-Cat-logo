# PRODUCTION_CHECKLIST.md

Checklist final antes de vender o **Dalce Estoque** para clientes reais.

> Marque **todos** os itens. Se algum não puder ser marcado, documente o motivo e o risco.

---

## Código

- [ ] `npm run typecheck` passa sem erros.
- [ ] `npm run build` passa sem erros.
- [ ] Sem `console.log` de debug em produção.
- [ ] Sem código morto ou comentado.
- [ ] Tratamento de erro em todas as server actions.
- [ ] Validação no servidor em todos os formulários.
- [ ] Mensagens de erro amigáveis (sem stack trace).
- [ ] Páginas de erro, 404 e loading implementadas.

## Segurança

- [ ] RLS ativo em **todas** as tabelas.
- [ ] Teste de isolamento entre lojas executado e aprovado.
- [ ] `service_role` só no servidor (nunca no cliente).
- [ ] Nenhum segredo no Git.
- [ ] Rate limiting ativo em login/cadastro/recuperação.
- [ ] Headers de segurança configurados.
- [ ] Storage com políticas corretas.
- [ ] Upload validado (tipo, tamanho, pasta).
- [ ] CSRF protegido (nativo das server actions).
- [ ] Nenhum endpoint público expõe dados.

## Banco

- [ ] Todos os scripts SQL rodados na ordem.
- [ ] Índices criados.
- [ ] Funções transacionais funcionando.
- [ ] Backups configurados.
- [ ] Plano adequado (Pro para produção).
- [ ] Sem dados órfãos.

## Supabase

- [ ] Auth configurado (URLs, providers).
- [ ] SMTP próprio configurado.
- [ ] Confirm email ativado.
- [ ] Bucket `catalogo` criado e público.
- [ ] Políticas de Storage corretas.
- [ ] Super admin criado.
- [ ] Chaves anotadas em local seguro.

## Infraestrutura

- [ ] Repositório no GitHub (privado).
- [ ] Branch `main` protegida.
- [ ] Secret scanning ativado.
- [ ] Deploy na Vercel funcionando.
- [ ] Domínio próprio com HTTPS.
- [ ] DNS configurado.
- [ ] Redirect URLs do Supabase com o domínio final.
- [ ] Health check monitorado.
- [ ] Logs verificados.

## Produto

- [ ] UX simples e intuitiva para o dono de loja.
- [ ] Interface consistente e profissional.
- [ ] Funciona bem no celular (caso de uso principal).
- [ ] Estoque: criar, editar, arquivar, buscar, filtrar.
- [ ] Catálogo: configurar, publicar, visualizar.
- [ ] Imagens: upload, troca, remoção.
- [ ] PDV: venda, pagamento dividido, troco, fiado.
- [ ] Relatórios funcionando.
- [ ] Assinatura e bloqueio funcionando.
- [ ] Estados vazios e de carregamento claros.

## Testes

- [ ] Autenticação (login, logout, senha, sessão).
- [ ] Isolamento de lojas (teste completo).
- [ ] CRUD de produtos, categorias, clientes.
- [ ] Uploads de imagem.
- [ ] PDV e cancelamento de venda.
- [ ] Fiado (venda e recebimento).
- [ ] Catálogo público.
- [ ] Responsividade (celular, tablet, desktop).
- [ ] Tratamento de erros (offline, sessão expirada).
- [ ] Produção (domínio final, HTTPS, login, catálogo).

---

## Critério de "pronto"

O sistema está pronto quando:

> Você consegue entregar o acesso a um cliente pagante **sem acompanhar manualmente**
> e **sem medo** de que ele acesse dados de outro cliente.

Se ainda houver risco de vazamento entre lojas, **não está pronto**.

---

## Riscos residuais conhecidos

| Risco | Gravidade | Ação |
|---|---|---|
| Rate limit não distribuído | 🟡 Baixa | Migrar para Upstash Redis ao escalar |
| Bucket de imagens público | 🟡 Baixa | Aceitável para fotos de produto |
| Sem 2FA | 🟡 Baixa | Adicionar MFA do Supabase no futuro |
| Sem CSP | 🟡 Baixa | Adicionar Content-Security-Policy |
| E-mail no Free do Supabase | 🟠 Média | Configurar SMTP próprio |

---

## Pós-lançamento

- [ ] Monitorar `/api/health` diariamente.
- [ ] Revisar logs de erro semanalmente.
- [ ] Fazer backup semanal.
- [ ] Coletar feedback dos primeiros clientes.
- [ ] Priorizar correções de bugs reportados.
- [ ] Planejar próximas funcionalidades com base no uso real.
