-- =====================================================
-- AÇÕES ADMINISTRATIVAS DE USUÁRIOS
-- =====================================================
-- Banir, suspender, advertir usuários
-- =====================================================

-- =====================================================
-- ENUM: Tipos de punição
-- =====================================================
CREATE TYPE user_punishment_type AS ENUM (
  'warning',     -- Advertência
  'mute',        -- Silenciado (não pode postar)
  'suspension',  -- Suspensão temporária
  'ban'          -- Banimento permanente
);

-- =====================================================
-- TABELA: Histórico de punições
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_punishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuário punido
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo e detalhes
  punishment_type user_punishment_type NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,

  -- Admin responsável
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Duração (para suspensões temporárias)
  expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_punishments_user ON public.user_punishments(user_id, created_at DESC);
CREATE INDEX idx_user_punishments_type ON public.user_punishments(punishment_type);
CREATE INDEX idx_user_punishments_active ON public.user_punishments(is_active) WHERE is_active = true;

-- =====================================================
-- FUNCTION: Advertir usuário
-- =====================================================
CREATE OR REPLACE FUNCTION warn_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  -- Inserir advertência
  INSERT INTO user_punishments (
    user_id,
    punishment_type,
    reason,
    details,
    issued_by
  ) VALUES (
    p_user_id,
    'warning',
    p_reason,
    p_details,
    p_admin_id
  ) RETURNING id INTO v_punishment_id;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'warn_user',
    'Advertiu usuário',
    'user',
    p_user_id,
    jsonb_build_object('reason', p_reason, 'punishment_id', v_punishment_id)
  );

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Suspender usuário
-- =====================================================
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_duration_days INTEGER DEFAULT 7,
  p_details TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calcular expiração
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;

  -- Inserir suspensão
  INSERT INTO user_punishments (
    user_id,
    punishment_type,
    reason,
    details,
    issued_by,
    expires_at
  ) VALUES (
    p_user_id,
    'suspension',
    p_reason,
    p_details,
    p_admin_id,
    v_expires_at
  ) RETURNING id INTO v_punishment_id;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'suspend_user',
    'Suspendeu usuário por ' || p_duration_days || ' dias',
    'user',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'duration_days', p_duration_days,
      'expires_at', v_expires_at,
      'punishment_id', v_punishment_id
    )
  );

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Banir usuário permanentemente
-- =====================================================
CREATE OR REPLACE FUNCTION ban_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  -- Inserir banimento
  INSERT INTO user_punishments (
    user_id,
    punishment_type,
    reason,
    details,
    issued_by
  ) VALUES (
    p_user_id,
    'ban',
    p_reason,
    p_details,
    p_admin_id
  ) RETURNING id INTO v_punishment_id;

  -- Desativar usuário (marcar como banido)
  UPDATE users
  SET
    is_banned = true,
    banned_at = NOW(),
    banned_by = p_admin_id
  WHERE user_id = p_user_id;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'ban_user',
    'Baniu usuário permanentemente',
    'user',
    p_user_id,
    jsonb_build_object('reason', p_reason, 'punishment_id', v_punishment_id)
  );

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Revogar punição
-- =====================================================
CREATE OR REPLACE FUNCTION revoke_punishment(
  p_punishment_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Revogado por administrador'
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_punishment_type user_punishment_type;
BEGIN
  -- Buscar punição
  SELECT user_id, punishment_type
  INTO v_user_id, v_punishment_type
  FROM user_punishments
  WHERE id = p_punishment_id;

  -- Revogar punição
  UPDATE user_punishments
  SET
    is_active = false,
    revoked_at = NOW(),
    revoked_by = p_admin_id,
    revoke_reason = p_reason
  WHERE id = p_punishment_id;

  -- Se for banimento, desbanir usuário
  IF v_punishment_type = 'ban' THEN
    UPDATE users
    SET
      is_banned = false,
      banned_at = NULL,
      banned_by = NULL
    WHERE user_id = v_user_id;
  END IF;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'revoke_punishment',
    'Revogou punição de usuário',
    'user',
    v_user_id,
    jsonb_build_object('punishment_id', p_punishment_id, 'reason', p_reason)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEW: Perfil completo de usuário (admin)
-- =====================================================
CREATE OR REPLACE VIEW admin_user_profile AS
SELECT
  u.id,
  u.email,
  u.created_at as registered_at,
  u.last_sign_in_at,

  -- Perfil
  p.full_name,
  p.avatar_url,
  p.bio,
  p.current_theme,
  p.level,
  p.total_xp,
  p.last_seen_at,

  -- VIP
  vs.vip_tier,
  vs.is_active as is_vip,
  vs.expires_at as vip_expires_at,

  -- Punições
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'warning') as total_warnings,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'suspension') as total_suspensions,
  (SELECT punishment_type FROM user_punishments WHERE user_id = u.id AND is_active = true ORDER BY created_at DESC LIMIT 1) as current_punishment,

  -- Status
  p.is_banned,
  p.banned_at,

  -- Estatísticas
  (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as total_posts,
  (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as total_comments,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as total_achievements,
  (SELECT COUNT(*) FROM user_themes WHERE user_id = u.id AND is_active = true) as total_themes

FROM auth.users u
LEFT JOIN users p ON p.user_id = u.id
LEFT JOIN vip_subscriptions vs ON vs.user_id = u.id AND vs.is_active = true;

-- =====================================================
-- VIEW: Histórico de punições
-- =====================================================
CREATE OR REPLACE VIEW admin_user_punishments_history AS
SELECT
  up.id,
  up.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  up.punishment_type,
  up.reason,
  up.details,
  up.issued_at,
  up.expires_at,
  up.is_active,
  up.revoked_at,
  admin_prof.full_name as issued_by_name,
  admin_u.email as issued_by_email
FROM user_punishments up
INNER JOIN auth.users u ON u.id = up.user_id
LEFT JOIN profiles prof ON prof.user_id = up.user_id
INNER JOIN auth.users admin_u ON admin_u.id = up.issued_by
LEFT JOIN profiles admin_prof ON admin_prof.user_id = up.issued_by
ORDER BY up.created_at DESC;

-- =====================================================
-- RLS: Permissões
-- =====================================================
ALTER TABLE user_punishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view punishments"
  ON user_punishments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can create punishments"
  ON user_punishments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT SELECT ON admin_user_profile TO authenticated;
GRANT SELECT ON admin_user_punishments_history TO authenticated;

-- =====================================================
-- ADICIONAR COLUNAS NA TABELA USERS (se não existirem)
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned) WHERE is_banned = true;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE user_punishments IS 'Histórico de advertências, suspensões e banimentos de usuários';
COMMENT ON FUNCTION warn_user IS 'Aplica advertência a um usuário';
COMMENT ON FUNCTION suspend_user IS 'Suspende temporariamente um usuário';
COMMENT ON FUNCTION ban_user IS 'Bane permanentemente um usuário';
COMMENT ON FUNCTION revoke_punishment IS 'Revoga uma punição ativa';
COMMENT ON VIEW admin_user_profile IS 'Perfil completo de usuário para visualização administrativa';
COMMENT ON VIEW admin_user_punishments_history IS 'Histórico completo de punições aplicadas';
