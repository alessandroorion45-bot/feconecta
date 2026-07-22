-- Presentear vários destinatários numa única compra/pagamento.
-- Mantém 1 linha de store_purchases por destinatário (preserva 100% do
-- fluxo existente de abertura/agradecimento/notificação por presente),
-- agrupando todas as linhas de uma mesma compra via gift_batch_id.
-- Compras avulsas (sem presente) ou pra 1 só destinatário continuam
-- funcionando exatamente como antes: gift_batch_id = id da própria linha.

alter table public.store_purchases
  add column if not exists gift_batch_id uuid;

create index if not exists idx_store_purchases_gift_batch_id
  on public.store_purchases (gift_batch_id);
