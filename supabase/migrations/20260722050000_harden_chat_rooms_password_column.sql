-- =====================================================
-- HARDENING (parte 4, achado numa segunda varredura):
-- chat_rooms.password_hash era legível por QUALQUER
-- pessoa (inclusive anônima, sem login) via a política
-- "Users can view all rooms for discovery" (SELECT,
-- qual=true) — RLS é por LINHA, não por coluna, então
-- permitir ver a linha da sala also expunha o hash da
-- senha da sala.
--
-- Confirmado por grep: a tabela chat_rooms não é usada em
-- NENHUM lugar do código hoje (nem client nem edge
-- function) — funcionalidade de salas de chat com senha
-- nunca foi implementada na prática (o chat atual é
-- 1-a-1 via a tabela messages). Revogar a coluna
-- especificamente (não a linha toda) preserva 100% do que
-- já existe e fecha a exposição pra quando/se essa feature
-- for implementada de verdade.
-- =====================================================

revoke select (password_hash) on public.chat_rooms from anon, authenticated;
