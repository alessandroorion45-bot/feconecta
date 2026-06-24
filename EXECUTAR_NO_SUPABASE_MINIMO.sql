-- =====================================================
-- DEPLOY PAINEL ADMIN - VERSÃO MÍNIMA
-- =====================================================
-- SEM NENHUMA COLUNA OPCIONAL - APENAS auth.users
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- =====================================================
-- PARTE 1: CRIAR TIPOS ENUM
-- =====================================================

DO $$ BEGIN
    CREATE TYPE user_punishment_type AS ENUM ('warning', 'mute', 'suspension', 'ban');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PARTE 2: CRIAR TABELAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL,
  sent_by_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  total_sent INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PARTE 3: DADOS INICIAIS
-- =====================================================

INSERT INTO public.notification_templates (name, title, message)
VALUES
  ('welcome', 'Bem-vindo!', 'Bem-vindo à plataforma!'),
  ('warning', 'Aviso', 'Você recebeu um aviso.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.banned_words (word, severity)
VALUES
  ('spam', 'medium'),
  ('scam', 'high')
ON CONFLICT (word) DO NOTHING;

-- =====================================================
-- PARTE 4: FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_description TEXT
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;
  INSERT INTO admin_logs (admin_id, admin_email, action_type, action_description)
  VALUES (p_admin_id, COALESCE(v_admin_email, 'unknown'), p_action_type, p_action_description)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_mass_notification(
  p_admin_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_target_audience TEXT
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (sent_by, sent_by_email, title, message, notification_type, target_audience, sent_at)
  VALUES (p_admin_id, '', p_title, p_message, p_notification_type, p_target_audience, NOW())
  RETURNING id INTO v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  PERFORM log_admin_action(p_admin_id, 'warn_user', 'Advertiu usuário');
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_duration_days INTEGER DEFAULT 7
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  INSERT INTO user_punishments (user_id, punishment_type, reason, issued_by, expires_at)
  VALUES (p_user_id, 'suspension', p_reason, p_admin_id, NOW() + (p_duration_days || ' days')::INTERVAL)
  RETURNING id INTO v_punishment_id;
  PERFORM log_admin_action(p_admin_id, 'suspend_user', 'Suspendeu usuário');
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  PERFORM log_admin_action(p_admin_id, 'ban_user', 'Baniu usuário');
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 5: VIEWS (APENAS auth.users)
-- =====================================================

CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 day') as users_today,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as users_week,
  (SELECT COUNT(*) FROM admin_logs) as total_logs,
  (SELECT COUNT(*) FROM user_punishments WHERE is_active = true) as active_punishments;

CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  n.id, n.title, n.message, n.notification_type,
  n.target_audience, n.total_sent, n.sent_at, n.created_at
FROM admin_notifications n
ORDER BY n.created_at DESC;

CREATE OR REPLACE VIEW admin_user_profile AS
SELECT
  u.id,
  u.email,
  u.created_at as registered_at,
  u.last_sign_in_at,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'warning') as total_warnings
FROM auth.users u;

CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM admin_logs WHERE created_at >= NOW() - INTERVAL '7 days') as admin_actions_week;

CREATE OR REPLACE VIEW admin_analytics_user_growth AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- PARTE 6: RLS
-- =====================================================

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_punishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON admin_notifications_history TO authenticated;
GRANT SELECT ON admin_user_profile TO authenticated;
GRANT SELECT ON admin_analytics_summary TO authenticated;
GRANT SELECT ON admin_analytics_user_growth TO authenticated;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT
  '✅ DEPLOY COMPLETO!' as status,
  (SELECT COUNT(*) FROM banned_words) as palavras_proibidas,
  (SELECT COUNT(*) FROM notification_templates) as templates;
