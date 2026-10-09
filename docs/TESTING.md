# Estrategia de Testes

O Dalce Estoque atualmente nao possui testes automatizados. Este documento descreve a estrategia de testes manuais e recomendacoes para testes automatizados.

## Testes Manuais

### Pre-requisitos para Testes

1. Crie ao menos **duas lojas** com usuarios diferentes
2. Cada loja deve ter produtos, categorias e clientes cadastrados
3. Tenha o app rodando localmente (`npm run dev`)

### Checklist: Autenticacao

- [ ] Login com usuario valido redireciona para dashboard
- [ ] Login com usuario inexistente mostra erro generico
- [ ] Login com senha incorreta mostra erro generico
- [ ] Logout redireciona para /login
- [ ] Acessar pagina protegida sem login redireciona para /login
- [ ] Acessar /login estando logado redireciona para /
- [ ] Rate limiting: 11 tentativas rapidas retorna 429
- [ ] Username com caracteres invalidos (`<script>`, espacos) e rejeitado
- [ ] Catalogo publico (`/c/slug`) acessivel sem login

### Checklist: Dashboard

- [ ] Mostra data atual no fuso de Sao Paulo
- [ ] Mostra vendas do dia corretamente
- [ ] Mostra vendas do mes corretamente
- [ ] Meta mensal pode ser definida
- [ ] Meta aceita formato brasileiro (`1.000,50`)
- [ ] Meta rejeita valores negativos e zero

### Checklist: Nova Venda (PDV)

- [ ] Adicionar produto cadastrado ao carrinho
- [ ] Adicionar item avulso (venda rapida, sem produto cadastrado)
- [ ] Alterar quantidade no carrinho
- [ ] Remover item do carrinho
- [ ] Selecionar metodo de pagamento
- [ ] Pagamento com multiplos metodos (split)
- [ ] Soma dos pagamentos deve bater com total
- [ ] Venda com fiado exige nome do cliente
- [ ] Adicionar observacao a venda
- [ ] Preco de produto cadastrado vem do banco (nao do client)
- [ ] Apos venda, estoque e baixado corretamente
- [ ] Codigo da venda e exibido apos confirmacao
- [ ] Venda aparece na lista de vendas

### Checklist: Vendas

- [ ] Lista de vendas mostra vendas do dia
- [ ] Detalhe da venda mostra itens e pagamentos
- [ ] Cancelar venda muda status para "cancelada"
- [ ] Cancelar venda restaura estoque dos itens
- [ ] Venda cancelada nao pode ser cancelada novamente
- [ ] Vendas de outra loja nao aparecem na lista

### Checklist: Estoque

- [ ] Lista mostra todos os produtos ativos
- [ ] Produtos com estoque abaixo do minimo sao destacados
- [ ] Editar estoque salva corretamente
- [ ] Estoque pode ser negativo (overselling permitido)
- [ ] Editar preco e custo funciona

### Checklist: Cadastros - Produtos

- [ ] Criar produto com todos os campos
- [ ] Criar produto com descricao (aparece na vitrine)
- [ ] Descricao vazia e aceita (campo opcional)
- [ ] Descricao limitada a 600 caracteres
- [ ] Descricao com quebras de linha e paragrafos e preservada (Enter no campo)
- [ ] Criar produto com imagem (upload + resize)
- [ ] Imagem e redimensionada automaticamente
- [ ] Editar produto existente
- [ ] Arquivar produto (nao aparece mais no estoque/PDV)
- [ ] Produto pode ter categoria associada
- [ ] Remover categoria do produto funciona

### Checklist: Cadastros - Categorias

- [ ] Criar categoria com nome e cor
- [ ] Editar categoria
- [ ] Excluir categoria (produtos ficam sem categoria)
- [ ] Nome duplicado na mesma loja mostra erro
- [ ] Nome duplicado em lojas diferentes e permitido

### Checklist: Cadastros - Clientes

- [ ] Criar cliente com nome
- [ ] Criar cliente com telefone e CPF
- [ ] CPF invalido (tamanho diferente de 11) mostra erro
- [ ] Nome duplicado na mesma loja mostra erro
- [ ] Editar telefone e CPF de cliente existente
- [ ] Cliente auto-cadastrado ao vender aparece na lista

### Checklist: Cadastros - Variacoes

- [ ] Criar grupo de variacao com opcoes
- [ ] Opcoes podem ser separadas por virgula, ponto-e-virgula ou quebra de linha
- [ ] Opcoes duplicadas sao removidas automaticamente
- [ ] Editar grupo de variacao
- [ ] Excluir grupo de variacao

### Checklist: Catalogo Digital

- [ ] Ativar catalogo com slug
- [ ] Slug minimo de 3 caracteres
- [ ] Slug duplicado entre lojas mostra erro
- [ ] Catalogo publico acessivel em `/c/slug`
- [ ] Catalogo mostra produtos ativos
- [ ] Modo `hide`: produtos sem estoque nao aparecem
- [ ] Modo `unavailable`: produtos sem estoque mostram "indisponivel"
- [ ] Modo `all`: todos os produtos aparecem
- [ ] Nome, e-mail, numero e Instagram da loja aparecem no catalogo
- [ ] Banner principal: imagem, titulo, descricao e botao
- [ ] Botao do banner se ajusta ao texto (sem quebra de linha)
- [ ] Beneficios aparecem em carrossel horizontal (deslizar)
- [ ] Cores personalizadas aplicam em cada elemento
- [ ] Personalizacao de cores separada por tema (claro e escuro)
- [ ] Secoes de cores expandem/recolhem ao clicar
- [ ] Fontes 1 e 2 aplicam nos blocos escolhidos
- [ ] Modo escuro alterna e persiste
- [ ] Carrinho persiste apos recarregar a pagina (localStorage)
- [ ] Favoritos (estrelinha) persistem apos recarregar a pagina
- [ ] Categorias aparecem e filtram os produtos
- [ ] Descricao do produto aparece na pagina de detalhe
- [ ] Descricao resumida (ate 2 linhas) aparece no card do produto
- [ ] Descricao com paragrafos mantem as quebras de linha na pagina de detalhe
- [ ] Desativar catalogo torna `/c/slug` inacessivel

### Checklist: Fiado

- [ ] Lista de devedores mostra saldo correto
- [ ] Saldo = vendas com fiado - recebimentos
- [ ] Registrar recebimento diminui saldo
- [ ] Historico por cliente mostra vendas e recebimentos
- [ ] Metodo de pagamento do recebimento e registrado

### Checklist: Relatorios

- [ ] Relatorio mostra vendas no periodo selecionado
- [ ] Filtro por data funciona corretamente
- [ ] Valores em BRL formatados corretamente

### Checklist: Ajustes

- [ ] Alterar nome da loja funciona
- [ ] Nome da loja atualizado aparece em outros lugares

## Testes de Isolamento Multi-Tenant

Este e o teste mais critico. Execute com duas lojas (Loja A e Loja B):

### Dados

1. Loja A: crie produtos, vendas, clientes, categorias
2. Loja B: crie produtos, vendas, clientes, categorias (diferentes)

### Verificacoes

- [ ] **Dashboard**: Loja A so ve vendas da Loja A
- [ ] **Estoque**: Loja A so ve produtos da Loja A
- [ ] **Vendas**: Loja A so ve vendas da Loja A
- [ ] **Clientes**: Loja A so ve clientes da Loja A
- [ ] **Categorias**: Loja A so ve categorias da Loja A
- [ ] **Fiado**: Loja A so ve fiado da Loja A
- [ ] **Catalogo**: Config do catalogo e por loja

### Teste de bypass (seguranca)

Com ferramentas de desenvolvedor do browser:

- [ ] Tentar submeter formulario com `store_id` de outra loja
- [ ] Tentar cancelar venda de outra loja (alterar UUID no request)
- [ ] Tentar editar produto de outra loja
- [ ] Todas essas tentativas devem falhar silenciosamente ou com erro

### Teste via SQL

Conecte como usuario da Loja A e execute:

```sql
-- Deve retornar apenas produtos da Loja A
SELECT * FROM products;

-- Deve falhar (RLS impede)
UPDATE products SET price = 0 WHERE store_id = 'UUID_DA_LOJA_B';

-- Deve retornar 0 linhas afetadas
DELETE FROM sales WHERE store_id = 'UUID_DA_LOJA_B';
```

## Recomendacoes para Testes Automatizados

### Ferramentas Sugeridas

| Ferramenta | Uso |
|-----------|-----|
| Playwright | Testes E2E (fluxos completos) |
| Vitest | Testes unitarios (validacao, formatacao) |

### Testes unitarios prioritarios

1. `sanitizeText()` - verificar remoção de XSS
2. `sanitizeMultiline()` - preservar `\n`/paragrafos e remover XSS
3. `isValidUUID()` - verificar UUIDs validos e invalidos
4. `isValidPaymentMethod()` - verificar metodos aceitos
5. `parseDecimal()` - formato brasileiro e internacional
6. Funcoes de formatacao BRL

### Testes E2E prioritarios

1. Fluxo completo de login -> venda -> verificar estoque
2. Isolamento multi-tenant (login como Loja A, verificar que nao ve Loja B)
3. Catalogo publico com diferentes modos de estoque
4. Rate limiting no login

### Exemplo de setup Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  use: {
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
});
```

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test('login com credenciais validas', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="usuario"]', 'admin');
  await page.fill('[name="senha"]', 'senha-teste');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
});

test('login com credenciais invalidas', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="usuario"]', 'inexistente');
  await page.fill('[name="senha"]', 'errada');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=inválidos')).toBeVisible();
});
```
