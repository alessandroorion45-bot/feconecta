-- Primeiro, remover duplicados mantendo apenas o registro mais recente de cada par de usuários
DELETE FROM friend_requests a
USING friend_requests b
WHERE a.id < b.id
  AND LEAST(a.sender_id, a.receiver_id) = LEAST(b.sender_id, b.receiver_id)
  AND GREATEST(a.sender_id, a.receiver_id) = GREATEST(b.sender_id, b.receiver_id);

-- Criar índice único para prevenir duplicados futuros (considera ambas direções)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_friend_request_pair 
ON friend_requests (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));