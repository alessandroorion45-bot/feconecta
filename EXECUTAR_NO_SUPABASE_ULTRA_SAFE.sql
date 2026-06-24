-- =====================================================
-- DEPLOY PAINEL ADMIN - VERSÃO ULTRA SEGURA
-- =====================================================
-- Apenas tabelas que COM CERTEZA existem
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

DO $$ BEGIN
    CREATE TYPE theme_unlock_type AS ENUM ('default', 'vip_only', 'achievement', 'xp_milestone', 'purchase', 'event', 'top_rank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_type AS ENUM ('spam', 'offensive_content', 'harassment', 'fake_profile', 'inappropriate_language', 'religious_attack', 'other');
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
  target_details JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL,
  sent_by_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  target_user_ids UUID[],
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent_by ON public.admin_notifications(sent_by, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
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

CREATE INDEX IF NOT EXISTS idx_user_punishments_user ON public.user_punishments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL DEFAULT 'medium',
  auto_action TEXT NOT NULL DEFAULT 'flag',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auto_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  action_taken TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- =====================================================
-- PARTE 3: DADOS INICIAIS
-- =====================================================

INSERT INTO public.notification_templates (name, title, message, notification_type)
VALUES
  ('welcome_vip', 'Bem-vindo ao VIP!', 'Você agora é VIP!', 'success'),
  ('new_theme', 'Novo Tema!', 'Novo tema disponível!', 'announcement'),
  ('maintenance', 'Manutenção', 'Manutenção programada.', 'warning')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.banned_words (word, severity, auto_action)
VALUES
  ('spam', 'medium', 'flag'),
  ('scam', 'high', 'hide'),
  ('phishing', 'critical', 'reject')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.moderation_rules (name, trigger_type, action_type, priority)
VALUES
  ('Auto-ban após denúncias', 'report_count', 'ban_user', 100),
  ('Auto-suspender advertências', 'warning_count', 'suspend_user', 90)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 4: FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;
  INSERT INTO admin_logs (admin_id, admin_email, action_type, action_description, target_type, target_id)
  VALUES (p_admin_id, COALESCE(v_admin_email, 'unknown'), p_action_type, p_action_description, p_target_type, p_target_id)
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
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;
  INSERT INTO admin_notifications (sent_by, sent_by_email, title, message, notification_type, target_audience, sent_at)
  VALUES (p_admin_id, COALESCE(v_admin_email, 'unknown'), p_title, p_message, p_notification_type, p_target_audience, NOW())
  RETURNING id INTO v_notification_id;
  PERFORM log_admin_action(p_admin_id, 'send_notification', 'Notificação: ' || p_title);
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
  PERFORM log_admin_action(p_admin_id, 'warn_user', 'Advertiu usuário', 'user', p_user_id);
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
  PERFORM log_admin_action(p_admin_id, 'suspend_user', 'Suspendeu por ' || p_duration_days || ' dias', 'user', p_user_id);
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
  UPDATE users SET is_banned = true, banned_at = NOW(), banned_by = p_admin_id WHERE user_id = p_user_id;
  PERFORM log_admin_action(p_admin_id, 'ban_user', 'Baniu usuário', 'user', p_user_id);
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_banned_words(p_text TEXT)
RETURNS TABLE(word TEXT, severity TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT bw.word, bw.severity
  FROM banned_words bw
  WHERE bw.is_active = true AND LOWER(p_text) LIKE '%' || LOWER(bw.word) || '%';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: VIEWS (APENAS auth.users e users)
-- =====================================================

CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 day') as users_today,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as users_month,
  (SELECT COUNT(*) FROM admin_logs) as total_admin_actions,
  (SELECT COUNT(*) FROM user_punishments WHERE is_active = true) as active_punishments,
  (SELECT COUNT(*) FROM banned_words WHERE is_active = true) as banned_words_count;

CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  n.id, n.sent_by_email, n.title, n.message, n.notification_type,
  n.target_audience, n.total_sent, n.sent_at, n.created_at
FROM admin_notifications n
ORDER BY n.created_at DESC;

CREATE OR REPLACE VIEW admin_user_profile AS
SELECT
  u.id, u.email, u.created_at as registered_at, u.last_sign_in_at,
  p.full_name, p.level, p.total_xp, p.is_banned, p.banned_at,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'warning') as total_warnings,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'suspension') as total_suspensions
FROM auth.users u
LEFT JOIN users p ON p.user_id = u.id;

CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
  (SELECT COUNT(*) FROM admin_logs WHERE created_at >= NOW() - INTERVAL '7 days') as admin_actions_week,
  (SELECT COUNT(*) FROM user_punishments WHERE created_at >= NOW() - INTERVAL '7 days') as punishments_week;

CREATE OR REPLACE VIEW admin_analytics_user_growth AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
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
ALTER TABLE auto_moderation_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view" ON admin_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator')));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
  (SELECT COUNT(*) FROM notification_templates) as templates,
  (SELECT COUNT(*) FROM moderation_rules) as regras;
