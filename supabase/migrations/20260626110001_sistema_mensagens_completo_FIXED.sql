-- =====================================================
-- SISTEMA DE MENSAGENS PROPRIETÁRIO DA REDE DA FÉ (FIXED)
-- =====================================================
-- Versão corrigida - compatível com PostgreSQL 13+
-- =====================================================

-- Deletar tipos se já existirem (para evitar erro)
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS conversation_type CASCADE;
DROP TYPE IF EXISTS participant_role CASCADE;
DROP TYPE IF EXISTS presence_status CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE message_type AS ENUM (
  'text', 'audio', 'image', 'video', 'document',
  'verse', 'prayer', 'testimony', 'event', 'poll',
  'location', 'contact', 'sticker'
);

CREATE TYPE message_status AS ENUM (
  'sending', 'sent', 'delivered', 'read', 'failed'
);

CREATE TYPE conversation_type AS ENUM (
  'private',
  'group',
  'community',
  'channel'
);

CREATE TYPE participant_role AS ENUM (
  'owner',
  'admin',
  'moderator',
  'member',
  'visitor'
);

CREATE TYPE presence_status AS ENUM (
  'online', 'away', 'busy', 'praying', 'offline', 'invisible'
);

-- =====================================================
-- 1. CONVERSAS
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type conversation_type NOT NULL,

  -- Metadata
  name TEXT,
  description TEXT,
  avatar_url TEXT,

  -- Para conversas privadas (1-a-1)
  participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configurações
  settings JSONB DEFAULT '{"is_muted": false, "notifications": "all", "theme": "default"}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,

  -- Soft delete
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Índice único para conversas privadas (evita duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_private_conversation
  ON conversations (LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id))
  WHERE type = 'private' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id) WHERE type = 'private';

-- =====================================================
-- 2. PARTICIPANTES
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  role participant_role NOT NULL DEFAULT 'member',

  -- Permissões específicas
  permissions JSONB DEFAULT '{"can_send_messages": true, "can_send_media": true, "can_add_members": false, "can_pin_messages": false, "can_delete_messages": false}'::jsonb,

  -- Tracking
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,

  -- Status
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0 AND left_at IS NULL;

-- =====================================================
-- 3. MENSAGENS (Atualizar tabela existente)
-- =====================================================

-- Adicionar novos campos se ainda não existem
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type message_type DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_duration INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_thumbnail TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS waveform JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mentions UUID[];
ALTER TABLE messages ADD COLUMN IF NOT EXISTS hashtags TEXT[];
ALTER TABLE messages ADD COLUMN IF NOT EXISTS link_preview JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tsv tsvector;

-- Criar trigger para atualizar tsvector automaticamente
CREATE OR REPLACE FUNCTION messages_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('portuguese', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_tsv_update ON messages;
CREATE TRIGGER messages_tsv_update
  BEFORE INSERT OR UPDATE OF content ON messages
  FOR EACH ROW EXECUTE FUNCTION messages_search_trigger();

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_fulltext ON messages USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_messages_hashtags ON messages USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(conversation_id, is_pinned) WHERE is_pinned = true;

-- =====================================================
-- 4. STATUS DE ENTREGA
-- =====================================================

CREATE TABLE IF NOT EXISTS message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_message ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON message_receipts(user_id);

-- =====================================================
-- 5. PRESENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status presence_status NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_info JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_status ON user_presence(status) WHERE status != 'offline';
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence(last_seen DESC);

-- =====================================================
-- 6. TYPING INDICATORS
-- =====================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  is_recording BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 seconds'),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id, expires_at);

CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. STICKERS
-- =====================================================

CREATE TABLE IF NOT EXISTS stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_animated BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT true,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  UNIQUE(category, name)
);

CREATE INDEX IF NOT EXISTS idx_stickers_category ON stickers(category);
CREATE INDEX IF NOT EXISTS idx_stickers_popular ON stickers(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_stickers_official ON stickers(is_official) WHERE is_official = true;

-- =====================================================
-- 8. STICKERS FAVORITOS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_favorite_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sticker_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_stickers_user ON user_favorite_stickers(user_id);

-- =====================================================
-- 9. ENQUETES
-- =====================================================

CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  allows_multiple BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polls_message ON polls(message_id);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);

-- =====================================================
-- 10. DENÚNCIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON message_reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_message ON message_reports(message_id);

-- =====================================================
-- 11. MENSAGENS SALVAS
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'Favoritos',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id, collection_name)
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_user ON saved_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_collection ON saved_messages(user_id, collection_name);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT
USING (
  type = 'private' AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id AND user_id = auth.uid() AND left_at IS NULL
  )
);

DROP POLICY IF EXISTS "Users can create private conversations" ON conversations;
CREATE POLICY "Users can create private conversations" ON conversations FOR INSERT
WITH CHECK (type = 'private' AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create groups/communities" ON conversations;
CREATE POLICY "Users can create groups/communities" ON conversations FOR INSERT
WITH CHECK (type IN ('group', 'community', 'channel'));

-- PARTICIPANTS
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid() AND cp.left_at IS NULL
  )
);

DROP POLICY IF EXISTS "Admins can add participants" ON conversation_participants;
CREATE POLICY "Admins can add participants" ON conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')
    AND cp.permissions->>'can_add_members' = 'true'
  )
);

-- MESSAGES
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id AND c.type = 'private'
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid() AND cp.left_at IS NULL
  )
  OR (sender_id = auth.uid() OR receiver_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can send messages to non-blocked friends" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.type = 'private' AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid() AND cp.left_at IS NULL AND cp.permissions->>'can_send_messages' = 'true')
    OR EXISTS (SELECT 1 FROM friendships WHERE (user_id_1 = auth.uid() AND user_id_2 = receiver_id) OR (user_id_2 = auth.uid() AND user_id_1 = receiver_id))
  )
  AND NOT EXISTS (SELECT 1 FROM blocked_users WHERE (blocker_id = receiver_id AND blocked_id = auth.uid()) OR (blocker_id = auth.uid() AND blocked_id = receiver_id))
);

-- MESSAGE RECEIPTS
DROP POLICY IF EXISTS "Users can view receipts of their messages" ON message_receipts;
CREATE POLICY "Users can view receipts of their messages" ON message_receipts FOR SELECT
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM messages WHERE messages.id = message_receipts.message_id AND messages.sender_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create their own receipts" ON message_receipts;
CREATE POLICY "Users can create their own receipts" ON message_receipts FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own receipts" ON message_receipts;
CREATE POLICY "Users can update their own receipts" ON message_receipts FOR UPDATE USING (user_id = auth.uid());

-- PRESENCE
DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;
CREATE POLICY "Anyone can view presence" ON user_presence FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
CREATE POLICY "Users can update their own presence" ON user_presence FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own presence status" ON user_presence;
CREATE POLICY "Users can update their own presence status" ON user_presence FOR UPDATE USING (user_id = auth.uid());

-- TYPING
DROP POLICY IF EXISTS "Users can view typing in their conversations" ON typing_indicators;
CREATE POLICY "Users can view typing in their conversations" ON typing_indicators FOR SELECT
USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = typing_indicators.conversation_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can set their own typing status" ON typing_indicators;
CREATE POLICY "Users can set their own typing status" ON typing_indicators FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status" ON typing_indicators FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own typing status" ON typing_indicators;
CREATE POLICY "Users can delete their own typing status" ON typing_indicators FOR DELETE USING (user_id = auth.uid());

-- STICKERS
DROP POLICY IF EXISTS "Anyone can view official stickers" ON stickers;
CREATE POLICY "Anyone can view official stickers" ON stickers FOR SELECT USING (is_official = true OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create stickers" ON stickers;
CREATE POLICY "Users can create stickers" ON stickers FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- FAVORITE STICKERS
DROP POLICY IF EXISTS "Users can view their favorite stickers" ON user_favorite_stickers;
CREATE POLICY "Users can view their favorite stickers" ON user_favorite_stickers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add favorite stickers" ON user_favorite_stickers;
CREATE POLICY "Users can add favorite stickers" ON user_favorite_stickers FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove favorite stickers" ON user_favorite_stickers;
CREATE POLICY "Users can remove favorite stickers" ON user_favorite_stickers FOR DELETE USING (user_id = auth.uid());

-- POLLS
DROP POLICY IF EXISTS "Users can view polls in their conversations" ON polls;
CREATE POLICY "Users can view polls in their conversations" ON polls FOR SELECT
USING (EXISTS (SELECT 1 FROM messages m JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id WHERE m.id = polls.message_id AND cp.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create polls" ON polls;
CREATE POLICY "Users can create polls" ON polls FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM messages WHERE messages.id = polls.message_id AND messages.sender_id = auth.uid()));

-- POLL VOTES
DROP POLICY IF EXISTS "Users can view votes" ON poll_votes;
CREATE POLICY "Users can view votes" ON poll_votes FOR SELECT
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_votes.poll_id AND p.is_anonymous = false));

DROP POLICY IF EXISTS "Users can vote" ON poll_votes;
CREATE POLICY "Users can vote" ON poll_votes FOR INSERT WITH CHECK (user_id = auth.uid());

-- SAVED MESSAGES
DROP POLICY IF EXISTS "Users can view their saved messages" ON saved_messages;
CREATE POLICY "Users can view their saved messages" ON saved_messages FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can save messages" ON saved_messages;
CREATE POLICY "Users can save messages" ON saved_messages FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete saved messages" ON saved_messages;
CREATE POLICY "Users can delete saved messages" ON saved_messages FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_or_create_private_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  SELECT id INTO conv_id FROM conversations
  WHERE type = 'private'
  AND ((participant_1_id = current_user_id AND participant_2_id = other_user_id) OR (participant_1_id = other_user_id AND participant_2_id = current_user_id))
  AND deleted_at IS NULL LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, participant_1_id, participant_2_id)
    VALUES ('private', LEAST(current_user_id, other_user_id), GREATEST(current_user_id, other_user_id))
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL AND NEW.sender_id != NEW.receiver_id THEN
    UPDATE conversation_participants SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id AND user_id = NEW.receiver_id;
  END IF;

  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversation_participants SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id AND left_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_unread ON messages;
CREATE TRIGGER trigger_increment_unread AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION increment_unread_count();

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

CREATE OR REPLACE FUNCTION mark_messages_as_read(conv_id UUID, up_to_message_id UUID)
RETURNS void AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  UPDATE conversation_participants SET last_read_message_id = up_to_message_id, last_read_at = now(), unread_count = 0
  WHERE conversation_id = conv_id AND user_id = current_user_id;

  INSERT INTO message_receipts (message_id, user_id, read_at)
  SELECT m.id, current_user_id, now() FROM messages m
  WHERE m.conversation_id = conv_id AND m.sender_id != current_user_id
  AND m.created_at <= (SELECT created_at FROM messages WHERE id = up_to_message_id)
  ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE message_receipts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- SUCCESS
-- =====================================================

SELECT '✅ Sistema de Mensagens Proprietário da Rede da Fé criado com sucesso!' as message;
