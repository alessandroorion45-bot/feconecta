-- =====================================================
-- CHAT PREMIUM — reforço completo do sistema de mensagens
-- =====================================================
-- A migração 20260626100000_fix_messages_system.sql já continha quase
-- tudo que é preciso (reações, bloqueios, colunas de mídia), mas os bugs
-- observados em produção (reações não aparecem, bloquear é decorativo)
-- confirmam que nunca foi aplicada no remoto. Reaplicada aqui de forma
-- totalmente defensiva (ALTER ADD COLUMN IF NOT EXISTS em vez de confiar
-- em CREATE TABLE IF NOT EXISTS) + as tabelas novas desta rodada.

-- ---------------------------------------------
-- 1. Colunas novas em messages
-- ---------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS shared_content JSONB;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_status_check') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_status_check
      CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_media_type_check') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_media_type_check
      CHECK (media_type IS NULL OR media_type IN ('image', 'audio', 'video', 'document'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_message_type_check') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
      CHECK (message_type IN ('text', 'verse', 'devotional', 'study', 'challenge', 'community', 'campaign', 'prayer'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_reply_to_id_fkey'
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_id_fkey
      FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_deleted ON public.messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);

-- ---------------------------------------------
-- 2. Reações de mensagens
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.message_reactions
  ADD COLUMN IF NOT EXISTS message_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS reaction TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_reactions_unique') THEN
    ALTER TABLE public.message_reactions
      ADD CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id, reaction);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reactions on their messages" ON public.message_reactions;
CREATE POLICY "Users can view reactions on their messages"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_reactions.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can add reactions to messages they can see" ON public.message_reactions;
CREATE POLICY "Users can add reactions to messages they can see"
ON public.message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_reactions.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 3. Usuários bloqueados
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.blocked_users
  ADD COLUMN IF NOT EXISTS blocker_id UUID,
  ADD COLUMN IF NOT EXISTS blocked_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocked_users_unique') THEN
    ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_unique UNIQUE (blocker_id, blocked_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their blocks" ON public.blocked_users;
CREATE POLICY "Users can view their blocks"
ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock"
ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- ---------------------------------------------
-- 4. Policy de INSERT de messages considerando bloqueios
-- ---------------------------------------------
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

-- ---------------------------------------------
-- 5. Denúncias de usuário
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT
);

ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS reporter_id UUID,
  ADD COLUMN IF NOT EXISTS reported_user_id UUID,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.user_reports;
CREATE POLICY "Users can create reports"
ON public.user_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.user_reports;
CREATE POLICY "Users can view their own reports"
ON public.user_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

-- ---------------------------------------------
-- 6. Preferências de chat (som/tema/estilo de bolha)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_preferences (
  user_id UUID PRIMARY KEY,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  send_sound TEXT NOT NULL DEFAULT 'classic',
  receive_sound TEXT NOT NULL DEFAULT 'classic',
  theme TEXT NOT NULL DEFAULT 'auto',
  bubble_style TEXT NOT NULL DEFAULT 'modern',
  show_read_receipts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_preferences
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS send_sound TEXT DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS receive_sound TEXT DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS bubble_style TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS show_read_receipts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.chat_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own chat preferences" ON public.chat_preferences;
CREATE POLICY "Users manage their own chat preferences"
ON public.chat_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- 7. Configurações por conversa (fixar/silenciar/limpar)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  cleared_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversation_settings
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS friend_id UUID,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversation_settings_unique') THEN
    ALTER TABLE public.chat_conversation_settings
      ADD CONSTRAINT chat_conversation_settings_unique UNIQUE (user_id, friend_id);
  END IF;
END $$;

ALTER TABLE public.chat_conversation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own conversation settings" ON public.chat_conversation_settings;
CREATE POLICY "Users manage their own conversation settings"
ON public.chat_conversation_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- 8. Exclusão suave de mensagem (apagar só para si/todos, dono apenas)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.soft_delete_message(message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET deleted_at = now()
  WHERE id = message_id AND sender_id = auth.uid() AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

NOTIFY pgrst, 'reload schema';
