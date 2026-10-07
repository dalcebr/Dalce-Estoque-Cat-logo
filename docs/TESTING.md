# TESTING.md

Checklist de testes do **Dalce Estoque**. Execute antes de cada entrega a cliente.

> **Regra:** não considere pronto só porque compila. Teste o comportamento real.

---

## 1. Autenticação

- [ ] Cadastro com e-mail novo cria loja + perfil + trial de 14 dias.
- [ ] Cadastro com e-mail já existente mostra erro claro.
- [ ] Cadastro com senha < 6 caracteres é rejeitado.
- [ ] Login com credenciais corretas entra no sistema.
- [ ] Login com senha errada mostra erro (sem revelar se o e-mail existe).
- [ ] 10 tentativas de login erradas em 5 min são bloqueadas (rate limit).
- [ ] Logout encerra a sessão e volta para `/login`.
- [ ] Acessar rota protegida sem sessão redireciona para `/login`.
- [ ] Usuário logado que acessa `/login` é redirecionado para a home.
- [ ] Recuperação de senha envia e-mail.
- [ ] Link de recuperação abre `/redefinir-senha` e permite trocar a senha.
- [ ] Após redefinir, login com a nova senha funciona.
- [ ] Sessão expirada redireciona para login (não trava).

---

## 2. Multi-tenant (CRÍTICO)

- [ ] Loja A e Loja B criadas com e-mails diferentes.
- [ ] Produto da Loja A **não** aparece na Loja B.
- [ ] Acessar `/cadastros/produtos/<id-da-loja-A>` logado como B → não mostra.
- [ ] Vendas da Loja A **não** aparecem na Loja B.
- [ ] Fiado da Loja A **não** aparece na Loja B.
- [ ] Catálogo da Loja A **não** aparece na Loja B.
- [ ] No console (logado como B), `supabase.from('products').select()` retorna só B.
- [ ] Tentar cancelar venda da Loja A logado como B → falha.
- [ ] Upload de imagem grava na pasta da própria loja.
- [ ] Tentar gravar na pasta de outra loja → rejeitado.
- [ ] Ajustes da Loja A não afetam a Loja B.

> Se **qualquer** item falhar, **não venda**. Revise o RLS.

---

## 3. Estoque / Produtos

- [ ] Criar produto com nome, preço, custo, estoque, categoria e imagem.
- [ ] Produto aparece na listagem e no PDV.
- [ ] Editar produto atualiza os dados.
- [ ] Arquivar produto remove do PDV mas mantém o histórico.
- [ ] Buscar produto por nome funciona.
- [ ] Filtrar por categoria funciona.
- [ ] Alerta de estoque baixo aparece quando `stock <= min_stock`.
- [ ] Ajustar estoque manualmente funciona.
- [ ] Estado vazio (sem produtos) mostra mensagem clara.
- [ ] Validação: preço ≤ 0 é rejeitado.
- [ ] Validação: nome vazio é rejeitado.

---

## 4. Imagens

- [ ] Upload de JPG/PNG funciona.
- [ ] Imagem é comprimida e convertida para WebP.
- [ ] Imagem aparece no produto e no catálogo.
- [ ] Trocar imagem remove a antiga do Storage.
- [ ] Remover imagem funciona.
- [ ] Arquivo não-imagem é rejeitado.
- [ ] Arquivo > 12 MB é rejeitado.
- [ ] Upload com internet instável mostra erro claro.
- [ ] Imagem quebrada/inexistente não quebra o layout.

---

## 5. PDV / Vendas

- [ ] Adicionar produto ao carrinho.
- [ ] Aumentar/diminuir quantidade.
- [ ] Remover item / limpar carrinho.
- [ ] Venda rápida (valor livre) funciona.
- [ ] Pagamento único (dinheiro, pix, débito, crédito).
- [ ] Pagamento dividido (ex.: metade pix, metade dinheiro).
- [ ] Cálculo de troco em dinheiro.
- [ ] Venda no fiado exige cliente identificado.
- [ ] Finalizar venda baixa o estoque.
- [ ] Venda aparece na listagem e nos relatórios.
- [ ] Cancelar venda devolve o estoque.
- [ ] Cancelar venda duas vezes não devolve estoque duas vezes.
- [ ] Se a venda falhar no meio, nada é gravado (atomicidade).
- [ ] Recibo pode ser compartilhado.

---

## 6. Fiado

- [ ] Venda no fiado cria dívida para o cliente.
- [ ] Extrato do cliente mostra compras e recebimentos.
- [ ] Saldo é calculado corretamente.
- [ ] Registrar recebimento reduz o saldo.
- [ ] Recebimento com valor inválido é rejeitado.
- [ ] Cliente sem movimentação mostra estado vazio.

---

## 7. Catálogo

- [ ] Configurar nome, logo, tema, contatos e redes sociais.
- [ ] Salvar mantém os dados.
- [ ] Publicar torna o catálogo acessível em `/c/<slug>`.
- [ ] Slug duplicado mostra erro.
- [ ] Slug com menos de 3 caracteres é rejeitado.
- [ ] Catálogo público abre sem login.
- [ ] Produtos aparecem com imagem e preço.
- [ ] Modo de estoque (mostrar/ocultar/indisponível) funciona.
- [ ] WhatsApp e redes sociais abrem corretamente.
- [ ] Despublicar torna o catálogo inacessível.
- [ ] Catálogo aparece no sitemap.

---

## 8. Assinatura / Bloqueio

- [ ] Trial de 14 dias é criado no cadastro.
- [ ] Loja vencida é redirecionada para `/bloqueado`.
- [ ] Loja bloqueada só acessa `/bloqueado`, `/assinatura` e `/c/`.
- [ ] Super admin ativa a loja e o acesso volta.
- [ ] Reativar loja **não** sobrescreve o plano do cliente.
- [ ] Super admin altera plano e validade.

---

## 9. Responsividade

- [ ] Celular pequeno (360px): tudo legível e clicável.
- [ ] Celular grande (430px): layout correto.
- [ ] Tablet (768px): layout correto.
- [ ] Desktop (1280px+): layout correto.
- [ ] PDV usável no celular (é o caso de uso principal).
- [ ] Nenhuma funcionalidade depende só de desktop.

---

## 10. Tratamento de erros

- [ ] Internet offline mostra mensagem clara.
- [ ] API indisponível não trava a tela.
- [ ] Sessão expirada redireciona para login.
- [ ] Upload falhando mostra erro e permite tentar de novo.
- [ ] Dados inválidos mostram mensagem amigável (sem stack trace).
- [ ] Página inexistente mostra 404 amigável.
- [ ] Erro interno mostra página de erro amigável.

---

## 11. Infraestrutura

- [ ] Deploy na Vercel conclui sem erro.
- [ ] Domínio próprio abre com HTTPS.
- [ ] `/api/health` retorna 200.
- [ ] Variáveis de ambiente corretas em produção.
- [ ] Login funciona no domínio final.
- [ ] Catálogo público funciona no domínio final.
- [ ] Redirect URLs do Supabase incluem o domínio final.
- [ ] Backups configurados.

---

## 12. Performance

- [ ] Primeira carga da home < 3s em 4G.
- [ ] Catálogo público carrega rápido.
- [ ] Imagens otimizadas (WebP, tamanho adequado).
- [ ] PDV responde rápido ao adicionar itens.
- [ ] Sem erros no console do navegador.

---

## Como registrar os testes

Mantenha um arquivo de evidências (fora do repositório) com:

- Data do teste.
- Ambiente (local / preview / produção).
- Resultado de cada item.
- Bugs encontrados e correções.

> Repita o checklist completo antes de cada entrega importante.
