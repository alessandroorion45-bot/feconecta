-- =====================================================
-- DEPLOY MASSIVO - PAINEL ADMINISTRATIVO (VERSÃO FINAL)
-- =====================================================
-- Versão simplificada sem dependências de tabelas opcionais
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- =====================================================
-- PARTE 1: CRIAR TIPOS ENUM PRIMEIRO
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
-- PARTE 2: CRIAR TABELAS BASE
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
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
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
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent_by ON public.admin_notifications(sent_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_audience ON public.admin_notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent_at ON public.admin_notifications(sent_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  variables TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.user_punishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  punishment_type user_punishment_type NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  issued_by UUID NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_punishments_user ON public.user_punishments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_punishments_type ON public.user_punishments(punishment_type);
CREATE INDEX IF NOT EXISTS idx_user_punishments_active ON public.user_punishments(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  pattern TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  auto_action TEXT NOT NULL DEFAULT 'flag',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banned_words_active ON public.banned_words(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banned_words_severity ON public.banned_words(severity);

CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_value JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_params JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_rules_active ON public.moderation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_moderation_rules_priority ON public.moderation_rules(priority DESC);

CREATE TABLE IF NOT EXISTS public.auto_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID,
  rule_name TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  action_taken TEXT NOT NULL,
  action_result JSONB,
  trigger_reason TEXT,
  trigger_data JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_moderation_logs_target ON public.auto_moderation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_auto_moderation_logs_rule ON public.auto_moderation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_auto_moderation_logs_executed ON public.auto_moderation_logs(executed_at DESC);

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned) WHERE is_banned = true;

-- =====================================================
-- PARTE 3: INSERIR DADOS PADRÃO
-- =====================================================

INSERT INTO public.notification_templates (name, description, title, message, notification_type, variables)
VALUES
  ('welcome_vip', 'Boas-vindas para novos VIPs', '👑 Bem-vindo ao VIP!', 'Olá! Você agora é VIP!', 'success', ARRAY['user_name']),
  ('new_theme_available', 'Novo tema premium lançado', '🎨 Novo Tema Disponível!', 'Um novo tema está disponível!', 'announcement', ARRAY['theme_name']),
  ('maintenance_warning', 'Aviso de manutenção', '⚠️ Manutenção Programada', 'A plataforma passará por manutenção.', 'warning', ARRAY['date']),
  ('achievement_unlocked', 'Nova conquista desbloqueada', '🏆 Conquista Desbloqueada!', 'Parabéns! Nova conquista!', 'success', ARRAY['user_name', 'achievement_name', 'xp']),
  ('content_warning', 'Advertência de conteúdo', '⚠️ Advertência', 'Seu conteúdo violou nossas diretrizes.', 'warning', ARRAY['user_name', 'content'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.banned_words (word, severity, auto_action)
VALUES
  ('spam', 'medium', 'flag'),
  ('scam', 'high', 'hide'),
  ('hack', 'high', 'flag'),
  ('malware', 'critical', 'reject'),
  ('phishing', 'critical', 'reject')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, action_params, priority)
VALUES
  ('Auto-ban após 3 denúncias', 'Usuário banido após 3 denúncias', 'report_count', '{"threshold": 3}'::jsonb, 'ban_user', '{"reason": "Banimento automático"}'::jsonb, 100),
  ('Auto-suspender após 5 advertências', 'Usuário suspenso após 5 advertências', 'report_count', '{"threshold": 5}'::jsonb, 'suspend_user', '{"duration_days": 7}'::jsonb, 90),
  ('Ocultar palavra crítica', 'Oculta conteúdo com palavra crítica', 'banned_word', '{"severity": "critical"}'::jsonb, 'hide', '{}'::jsonb, 80)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 4: CRIAR FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_details JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;
  INSERT INTO admin_logs (admin_id, admin_email, action_type, action_description, target_type, target_id, target_details, metadata)
  VALUES (p_admin_id, COALESCE(v_admin_email, 'unknown'), p_action_type, p_action_description, p_target_type, p_target_id, p_target_details, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_mass_notification(
  p_admin_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_target_audience TEXT,
  p_target_user_ids UUID[] DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;
  INSERT INTO admin_notifications (sent_by, sent_by_email, title, message, notification_type, target_audience, target_user_ids, sent_at, total_sent)
  VALUES (p_admin_id, COALESCE(v_admin_email, 'unknown'), p_title, p_message, p_notification_type, p_target_audience, p_target_user_ids, NOW(), 0)
  RETURNING id INTO v_notification_id;
  PERFORM log_admin_action(p_admin_id, 'send_notification', 'Enviou notificação: ' || p_title, 'notification', v_notification_id);
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION warn_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  INSERT INTO user_punishments (user_id, punishment_type, reason, details, issued_by)
  VALUES (p_user_id, 'warning', p_reason, p_details, p_admin_id)
  RETURNING id INTO v_punishment_id;
  PERFORM log_admin_action(p_admin_id, 'warn_user', 'Advertiu usuário', 'user', p_user_id);
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  INSERT INTO user_punishments (user_id, punishment_type, reason, details, issued_by, expires_at)
  VALUES (p_user_id, 'suspension', p_reason, p_details, p_admin_id, v_expires_at)
  RETURNING id INTO v_punishment_id;
  PERFORM log_admin_action(p_admin_id, 'suspend_user', 'Suspendeu usuário por ' || p_duration_days || ' dias', 'user', p_user_id);
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION ban_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_punishment_id UUID;
BEGIN
  INSERT INTO user_punishments (user_id, punishment_type, reason, details, issued_by)
  VALUES (p_user_id, 'ban', p_reason, p_details, p_admin_id)
  RETURNING id INTO v_punishment_id;
  UPDATE users SET is_banned = true, banned_at = NOW(), banned_by = p_admin_id WHERE user_id = p_user_id;
  PERFORM log_admin_action(p_admin_id, 'ban_user', 'Baniu usuário', 'user', p_user_id);
  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_banned_words(p_text TEXT)
RETURNS TABLE(word TEXT, severity TEXT, auto_action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT bw.word, bw.severity, bw.auto_action
  FROM banned_words bw
  WHERE bw.is_active = true AND LOWER(p_text) LIKE '%' || LOWER(bw.word) || '%'
  ORDER BY CASE bw.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: CRIAR VIEWS (SIMPLIFICADAS)
-- =====================================================

CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 day') as users_today,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as users_month,
  COALESCE((SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true), 0) as vip_active,
  COALESCE((SELECT COUNT(*) FROM themes WHERE is_active = true), 0) as total_themes,
  COALESCE((SELECT COUNT(*) FROM posts), 0) as total_posts,
  COALESCE((SELECT COUNT(*) FROM comments), 0) as total_comments,
  COALESCE((SELECT COUNT(*) FROM reports WHERE status = 'pending'), 0) as reports_pending,
  COALESCE((SELECT COUNT(*) FROM achievements), 0) as total_achievements;

CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  n.id, n.sent_by, n.sent_by_email, n.title, n.message, n.notification_type,
  n.target_audience, n.total_sent, n.total_delivered, n.total_read, n.sent_at, n.created_at,
  CASE WHEN n.total_sent > 0 THEN ROUND((n.total_read::NUMERIC / n.total_sent) * 100, 2) ELSE 0 END as read_rate_percent
FROM admin_notifications n
ORDER BY n.created_at DESC;

CREATE OR REPLACE VIEW admin_user_profile AS
SELECT
  u.id, u.email, u.created_at as registered_at, u.last_sign_in_at,
  p.full_name, p.level, p.total_xp,
  p.is_banned, p.banned_at,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'warning') as total_warnings,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'suspension') as total_suspensions
FROM auth.users u
LEFT JOIN users p ON p.user_id = u.id;

CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
  COALESCE((SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true), 0) as vip_total,
  COALESCE((SELECT AVG(total_xp) FROM users WHERE total_xp > 0), 0) as avg_xp,
  COALESCE((SELECT AVG(level) FROM users WHERE level > 0), 0) as avg_level,
  COALESCE((SELECT COUNT(*) FROM reports WHERE status = 'pending'), 0) as pending_reports;

CREATE OR REPLACE VIEW admin_analytics_user_growth AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW admin_analytics_top_themes AS
SELECT
  t.theme_name,
  t.theme_key,
  0 as users_using
FROM themes t
WHERE t.is_active = true
LIMIT 10;

CREATE OR REPLACE VIEW admin_analytics_top_achievements AS
SELECT
  a.name,
  a.description,
  a.xp_reward,
  COALESCE(COUNT(DISTINCT ua.user_id), 0) as unlock_count
FROM achievements a
LEFT JOIN user_achievements ua ON ua.achievement_id = a.id
GROUP BY a.id, a.name, a.description, a.xp_reward
ORDER BY unlock_count DESC
LIMIT 10;

-- =====================================================
-- PARTE 6: CONFIGURAR RLS
-- =====================================================

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_punishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_moderation_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true));
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
GRANT SELECT ON admin_analytics_top_themes TO authenticated;
GRANT SELECT ON admin_analytics_top_achievements TO authenticated;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT
  '✅ DEPLOY COMPLETO!' as status,
  (SELECT COUNT(*) FROM banned_words) as palavras_proibidas,
  (SELECT COUNT(*) FROM notification_templates) as templates,
  (SELECT COUNT(*) FROM moderation_rules) as regras_moderacao;
