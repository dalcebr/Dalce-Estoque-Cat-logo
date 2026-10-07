# Dalce Estoque · checklist de lançamento

Use este roteiro antes de vender o primeiro acesso.

## Banco de dados
- [ ] Rodei `supabase/008_saas.sql` no SQL Editor (depois dos SQLs anteriores).
- [ ] Confirmei que a tabela `stores` tem as colunas `plan`, `active`, `trial_ends_at`, `plan_ends_at`.
- [ ] Confirmei que a tabela `profiles` tem `is_super_admin` e `role`.
- [ ] A função `create_store_for_user` existe (Database → Functions).

## Autenticação
- [ ] "Confirm email" está ativado no Supabase (produção).
- [ ] Testei criar uma loja em `/cadastro` e entrar em `/login`.
- [ ] Promovi meu usuário a `is_super_admin` e o menu mostra "Painel do dono".

## Variáveis de ambiente
- [ ] `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (necessária para redefinir senha de clientes).
- [ ] `NEXT_PUBLIC_APP_URL` aponta para o domínio final.
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL` é um e-mail que você realmente lê.

## Testes funcionais (fazer em uma loja de teste)
- [ ] Cadastrar produto, categoria e cliente.
- [ ] Fazer uma venda com pagamento dividido (ex.: Pix + dinheiro com troco).
- [ ] Conferir baixa de estoque e cancelamento devolvendo estoque.
- [ ] Registrar fiado e depois um recebimento.
- [ ] Publicar o catálogo e abrir `/c/seu-link` em uma aba anônima.
- [ ] Conferir relatórios (período, pagamentos, mais vendidos).
- [ ] Ver o histórico em Ajustes → Geral → Histórico de ações.

## Ciclo de assinatura
- [ ] No `/admin`, alterar plano de uma loja de teste para Pro (30 dias).
- [ ] Suspender a loja e confirmar que ela cai em `/bloqueado`.
- [ ] Reativar e confirmar que o acesso volta.
- [ ] Redefinir a senha do dono da loja de teste e entrar com ela.

## Comercial
- [ ] Definir preços finais em `src/lib/plans.ts`.
- [ ] Definir forma de cobrança (Pix, cartão, boleto) e prazo de liberação.
- [ ] Preparar mensagem de boas-vindas e tutorial curto para o cliente.
- [ ] Definir política de reembolso e suporte (horário de atendimento).
