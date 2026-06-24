-- =====================================================
-- PARTE 3: SISTEMA DE PUNIÇÕES
-- =====================================================
-- Execute DEPOIS da Parte 2
-- Tempo estimado: ~15 segundos
-- =====================================================

-- Criar ENUM de punição
DO $$ BEGIN
    CREATE TYPE user_punishment_type AS ENUM ('warning', 'suspension', 'ban');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela: user_punishments
CREATE TABLE IF NOT EXISTS public.user_punishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  punishment_type user_punishment_type NOT NULL,
  reason TEXT NOT NULL,
  issued_by UUID NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_punishments_user ON public.user_punishments(user_id);

-- Adicionar colunas em users (se não existirem)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Function: warn_user
CREATE OR REPLACE FUNCTION warn_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  INSERT INTO user_punishments (user_id, punishment_type, reason, issued_by)
  VALUES (p_user_id, 'warning', p_reason, p_admin_id)
  RETURNING id INTO v_punishment_id;

  PERFORM log_admin_action(p_admin_id, 'warn_user', 'Advertiu usuário', 'user', p_user_id);

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: ban_user
CREATE OR REPLACE FUNCTION ban_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  INSERT INTO user_punishments (user_id, punishment_type, reason, issued_by)
  VALUES (p_user_id, 'ban', p_reason, p_admin_id)
  RETURNING id INTO v_punishment_id;

  UPDATE users SET is_banned = true, banned_at = NOW() WHERE user_id = p_user_id;

  PERFORM log_admin_action(p_admin_id, 'ban_user', 'Baniu usuário', 'user', p_user_id);

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: admin_user_profile
CREATE OR REPLACE VIEW admin_user_profile AS
SELECT
  u.id, u.email, u.created_at as registered_at,
  p.full_name, p.level, p.total_xp, p.is_banned,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'warning') as total_warnings,
  (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as total_posts
FROM auth.users u
LEFT JOIN users p ON p.user_id = u.id;

GRANT SELECT ON admin_user_profile TO authenticated;

-- Verificar criação
SELECT
  'Sistema de punições criado!' as status,
  (SELECT COUNT(*) FROM user_punishments) as punishments_count;
