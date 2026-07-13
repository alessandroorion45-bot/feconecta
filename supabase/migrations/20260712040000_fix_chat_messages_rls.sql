-- ============================================================
-- FIX: chat quebrado (500 em messages, 400 em chat_conversation_settings)
-- ============================================================
-- A política de SELECT de "messages" foi reescrita numa migration
-- (sistema_mensagens_completo) pra depender de conversations/
-- conversation_participants — um modelo de "conversas" que a tela de
-- Chat em produção (src/pages/Chat.tsx) nunca usa (ela sempre
-- consulta direto por sender_id/receiver_id). Isso quebra toda
-- consulta a messages com erro 500. Revertendo pro modelo simples
-- que é o que realmente está em uso, e adicionando a coluna
-- pinned_message_id que faltava em chat_conversation_settings
-- (causava 400 ao carregar configurações de conversa).
-- ============================================================

-- 1. chat_conversation_settings.pinned_message_id
ALTER TABLE public.chat_conversation_settings
  ADD COLUMN IF NOT EXISTS pinned_message_id UUID;

-- 2. messages: SELECT simples (sender/receiver), sem depender de conversations
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 3. messages: INSERT (amigos, não bloqueados) — reafirma a versão mais recente
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to friends" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to non-blocked friends" ON public.messages;
CREATE POLICY "Users can send messages to non-blocked friends"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id_1 = auth.uid() AND user_id_2 = receiver_id)
       OR (user_id_2 = auth.uid() AND user_id_1 = receiver_id)
  ) AND
  NOT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = receiver_id AND blocked_id = auth.uid())
       OR (blocker_id = auth.uid() AND blocked_id = receiver_id)
  )
);

-- 4. messages: UPDATE (marcar como lida — só quem recebeu)
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

NOTIFY pgrst, 'reload schema';

SELECT 'ok' as status;
