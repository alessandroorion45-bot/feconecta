-- =====================================================
-- CORREÇÃO CRÍTICA - SISTEMA DE MENSAGENS
-- =====================================================
-- Corrige problemas críticos identificados na auditoria
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS FALTANTES NA TABELA MESSAGES
-- =====================================================

-- Adicionar campo status (sent, delivered, read)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'));

-- Adicionar campos de mídia
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'audio', 'video', 'document'));

-- Adicionar campo para responder mensagens
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Adicionar campos de edição e exclusão
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Adicionar campo para mensagens encaminhadas
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CRIAR TABELA DE REAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

-- RLS para reações
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their messages"
ON message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_reactions.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to messages they can see"
ON message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM messages
    WHERE messages.id = message_reactions.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can remove their own reactions"
ON message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 3. CRIAR TABELA DE USUÁRIOS BLOQUEADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- RLS para bloqueios
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks"
ON blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

CREATE POLICY "Users can unblock"
ON blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- =====================================================
-- 4. ATUALIZAR RLS DE MESSAGES COM BLOQUEIOS
-- =====================================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Users can send messages to friends" ON messages;

-- Nova policy que impede mensagens de/para usuários bloqueados
CREATE POLICY "Users can send messages to non-blocked friends"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  -- Verificar amizade
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = auth.uid() AND user_id_2 = receiver_id)
       OR (user_id_2 = auth.uid() AND user_id_1 = receiver_id)
  ) AND
  -- Verificar se não está bloqueado
  NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = receiver_id AND blocked_id = auth.uid())
       OR (blocker_id = auth.uid() AND blocked_id = receiver_id)
  )
);

-- =====================================================
-- 5. CRIAR VIEW OTIMIZADA PARA CONVERSAS
-- =====================================================

CREATE OR REPLACE VIEW conversation_list AS
WITH latest_messages AS (
  SELECT DISTINCT ON (
    CASE
      WHEN sender_id < receiver_id THEN sender_id || receiver_id
      ELSE receiver_id || sender_id
    END
  )
    id,
    sender_id,
    receiver_id,
    content,
    created_at,
    CASE
      WHEN sender_id < receiver_id THEN sender_id || receiver_id
      ELSE receiver_id || sender_id
    END as conversation_key
  FROM messages
  WHERE deleted_at IS NULL
  ORDER BY conversation_key, created_at DESC
),
unread_counts AS (
  SELECT
    sender_id,
    receiver_id,
    COUNT(*) as unread_count
  FROM messages
  WHERE is_read = false AND deleted_at IS NULL
  GROUP BY sender_id, receiver_id
)
SELECT
  lm.conversation_key as id,
  lm.sender_id,
  lm.receiver_id,
  lm.content as last_message,
  lm.created_at as last_message_time,
  COALESCE(uc.unread_count, 0) as unread_count
FROM latest_messages lm
LEFT JOIN unread_counts uc ON lm.sender_id = uc.sender_id AND lm.receiver_id = uc.receiver_id;

-- =====================================================
-- 6. ADICIONAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);

-- Índice composto para queries de conversas
CREATE INDEX IF NOT EXISTS idx_messages_user_pair ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
) WHERE deleted_at IS NULL;

-- =====================================================
-- 7. CRIAR TRIGGER PARA ATUALIZAR STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando mensagem é lida, atualizar status
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.status = 'read';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_message_status ON messages;
CREATE TRIGGER trigger_update_message_status
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_status();

-- =====================================================
-- 8. FUNÇÃO PARA SOFT DELETE DE MENSAGENS
-- =====================================================

CREATE OR REPLACE FUNCTION soft_delete_message(message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE messages
  SET deleted_at = now()
  WHERE id = message_id
  AND sender_id = auth.uid()
  AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. VALIDAÇÃO DE CONTEÚDO E RATE LIMITING
-- =====================================================

CREATE TABLE IF NOT EXISTS message_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Buscar contador do usuário
  SELECT message_count, window_start INTO v_count, v_window_start
  FROM message_rate_limit
  WHERE user_id = NEW.sender_id;

  -- Se não existe ou janela expirou (5 minutos), criar novo
  IF v_window_start IS NULL OR (now() - v_window_start) > INTERVAL '5 minutes' THEN
    INSERT INTO message_rate_limit (user_id, message_count, window_start)
    VALUES (NEW.sender_id, 1, now())
    ON CONFLICT (user_id)
    DO UPDATE SET message_count = 1, window_start = now();
  ELSE
    -- Verificar se excedeu limite (100 mensagens em 5 minutos)
    IF v_count >= 100 THEN
      RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending more messages.';
    END IF;

    -- Incrementar contador
    UPDATE message_rate_limit
    SET message_count = message_count + 1
    WHERE user_id = NEW.sender_id;
  END IF;

  -- Validar tamanho do conteúdo (max 10000 caracteres)
  IF LENGTH(NEW.content) > 10000 THEN
    RAISE EXCEPTION 'Message content too long. Maximum 10000 characters.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_rate_limit ON messages;
CREATE TRIGGER trigger_check_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_rate_limit();

-- =====================================================
-- 10. LIMPAR RATE LIMIT ANTIGA (JOB)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM message_rate_limit
  WHERE (now() - window_start) > INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS
-- =====================================================

SELECT 'Sistema de mensagens corrigido com sucesso! ✅' as message;
