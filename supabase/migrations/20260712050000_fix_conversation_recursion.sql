-- ============================================================
-- FIX: envio de mensagem no chat falhava com 42P17
-- "infinite recursion detected in policy for relation
--  conversation_participants"
-- ============================================================
-- Causa: as políticas de conversation_participants consultam a
-- própria tabela (recursão infinita), e os triggers de bookkeeping
-- em messages (trigger_increment_unread/trigger_update_last_message)
-- rodavam SEM SECURITY DEFINER — então cada INSERT em messages
-- avaliava essas políticas recursivas e morria com 500.
--
-- Correção no mesmo padrão já usado na Comunidade da Igreja
-- (is_community_member): helper SECURITY DEFINER quebra a recursão,
-- e os triggers de bookkeeping passam a ignorar RLS.
-- ============================================================

-- 1. Helper sem recursão
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id AND left_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID, UUID) TO authenticated;

-- 2. Políticas de conversation_participants sem auto-referência
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_conversation_participant(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Admins can add participants" ON public.conversation_participants;
CREATE POLICY "Admins can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')
      AND cp.permissions->>'can_add_members' = 'true'
  )
);

-- 3. Política de conversations usando o helper (evita cadeia recursiva)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  (type = 'private' AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid()))
  OR public.is_conversation_participant(id, auth.uid())
);

-- 4. Triggers de bookkeeping em messages passam a ignorar RLS
CREATE OR REPLACE FUNCTION public.increment_unread_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversation_participants SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id AND left_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

SELECT 'ok' as status;
