-- Rode apenas se você JÁ executou o schema.sql antes desta versão:
alter table sales add column if not exists payment_method text;

-- Exemplo para testar (troque o store_id pelo id da sua loja):
-- insert into sales (store_id, total, cost, payment_method)
-- select id, 20, 0, 'dinheiro' from stores limit 1;
