-- =====================================================
-- DEPLOY MASSIVO - PAINEL ADMINISTRATIVO (CORRIGIDO)
-- =====================================================
-- Versão corrigida sem erros de dependência
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- =====================================================
-- PARTE 1: CRIAR TIPOS ENUM PRIMEIRO
-- =====================================================

-- Tipo de punição
DO $$ BEGIN
    CREATE TYPE user_punishment_type AS ENUM ('warning', 'mute', 'suspension', 'ban');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de desbloqueio de tema
DO $$ BEGIN
    CREATE TYPE theme_unlock_type AS ENUM ('default', 'vip_only', 'achievement', 'xp_milestone', 'purchase', 'event', 'top_rank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de status de moderação
DO $$ BEGIN
    CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de report
DO $$ BEGIN
    CREATE TYPE report_type AS ENUM ('spam', 'offensive_content', 'harassment', 'fake_profile', 'inappropriate_language', 'religious_attack', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PARTE 2: CRIAR TABELAS BASE
-- =====================================================

-- Tabela: admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Tabela: admin_notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Tabela: notification_templates
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

-- Tabela: user_punishments
CREATE TABLE IF NOT EXISTS public.user_punishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  punishment_type user_punishment_type NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_punishments_user ON public.user_punishments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_punishments_type ON public.user_punishments(punishment_type);
CREATE INDEX IF NOT EXISTS idx_user_punishments_active ON public.user_punishments(is_active) WHERE is_active = true;

-- Tabela: banned_words
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  pattern TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  auto_action TEXT NOT NULL DEFAULT 'flag',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banned_words_active ON public.banned_words(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banned_words_severity ON public.banned_words(severity);

-- Tabela: moderation_rules
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

-- Tabela: auto_moderation_logs
CREATE TABLE IF NOT EXISTS public.auto_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.moderation_rules(id),
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

-- Adicionar colunas em users (se não existirem)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned) WHERE is_banned = true;

-- =====================================================
-- PARTE 3: INSERIR DADOS PADRÃO
-- =====================================================

-- Templates de notificação
INSERT INTO public.notification_templates (name, description, title, message, notification_type, variables)
VALUES
  ('welcome_vip', 'Boas-vindas para novos VIPs', '👑 Bem-vindo ao VIP!', 'Olá {{user_name}}! Você agora é VIP e tem acesso a todos os temas premium, 2x XP e muito mais!', 'success', ARRAY['user_name']),
  ('new_theme_available', 'Novo tema premium lançado', '🎨 Novo Tema Disponível!', 'Um novo tema chamado "{{theme_name}}" está disponível na Galeria! Confira agora.', 'announcement', ARRAY['theme_name']),
  ('maintenance_warning', 'Aviso de manutenção', '⚠️ Manutenção Programada', 'A plataforma passará por manutenção em {{date}}. O acesso pode ficar temporariamente indisponível.', 'warning', ARRAY['date']),
  ('achievement_unlocked', 'Nova conquista desbloqueada', '🏆 Conquista Desbloqueada!', 'Parabéns {{user_name}}! Você desbloqueou a conquista "{{achievement_name}}" e ganhou {{xp}} XP!', 'success', ARRAY['user_name', 'achievement_name', 'xp']),
  ('content_warning', 'Advertência de conteúdo', '⚠️ Advertência', 'Olá {{user_name}}, seu conteúdo "{{content}}" violou nossas diretrizes. Por favor, revise nossos termos de uso.', 'warning', ARRAY['user_name', 'content'])
ON CONFLICT (name) DO NOTHING;

-- Palavras proibidas padrão
INSERT INTO public.banned_words (word, severity, auto_action)
VALUES
  ('spam', 'medium', 'flag'),
  ('scam', 'high', 'hide'),
  ('hack', 'high', 'flag'),
  ('malware', 'critical', 'reject'),
  ('phishing', 'critical', 'reject')
ON CONFLICT (word) DO NOTHING;

-- Regras de moderação
INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, action_params, priority)
VALUES
  ('Auto-ban após 3 denúncias', 'Usuário é automaticamente banido após receber 3 denúncias aprovadas', 'report_count', '{"threshold": 3, "status": "approved"}'::jsonb, 'ban_user', '{"reason": "Banimento automático: 3 denúncias aprovadas"}'::jsonb, 100),
  ('Auto-suspender após 5 advertências', 'Usuário é suspenso por 7 dias após 5 advertências', 'report_count', '{"threshold": 5, "punishment_type": "warning"}'::jsonb, 'suspend_user', '{"duration_days": 7, "reason": "Suspensão automática: 5 advertências"}'::jsonb, 90),
  ('Ocultar conteúdo com palavra proibida crítica', 'Oculta automaticamente conteúdo com palavras de severidade crítica', 'banned_word', '{"severity": "critical"}'::jsonb, 'hide', '{}'::jsonb, 80)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 4: CRIAR FUNCTIONS
-- =====================================================

-- Function: log_admin_action
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

  INSERT INTO admin_logs (
    admin_id, admin_email, action_type, action_description,
    target_type, target_id, target_details, metadata
  ) VALUES (
    p_admin_id, v_admin_email, p_action_type, p_action_description,
    p_target_type, p_target_id, p_target_details, p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: send_mass_notification
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
  v_total_sent INTEGER := 0;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  INSERT INTO admin_notifications (
    sent_by, sent_by_email, title, message, notification_type,
    target_audience, target_user_ids, sent_at, total_sent
  ) VALUES (
    p_admin_id, v_admin_email, p_title, p_message, p_notification_type,
    p_target_audience, p_target_user_ids, NOW(), 0
  ) RETURNING id INTO v_notification_id;

  PERFORM log_admin_action(
    p_admin_id, 'send_notification', 'Enviou notificação em massa: ' || p_title,
    'notification', v_notification_id,
    jsonb_build_object('target_audience', p_target_audience, 'total_sent', v_total_sent)
  );

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: warn_user
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

  PERFORM log_admin_action(p_admin_id, 'warn_user', 'Advertiu usuário', 'user', p_user_id,
    jsonb_build_object('reason', p_reason, 'punishment_id', v_punishment_id));

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: suspend_user
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

  PERFORM log_admin_action(p_admin_id, 'suspend_user', 'Suspendeu usuário por ' || p_duration_days || ' dias',
    'user', p_user_id, jsonb_build_object('reason', p_reason, 'duration_days', p_duration_days, 'expires_at', v_expires_at, 'punishment_id', v_punishment_id));

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: ban_user
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

  PERFORM log_admin_action(p_admin_id, 'ban_user', 'Baniu usuário permanentemente', 'user', p_user_id,
    jsonb_build_object('reason', p_reason, 'punishment_id', v_punishment_id));

  RETURN v_punishment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: check_banned_words
CREATE OR REPLACE FUNCTION check_banned_words(p_text TEXT)
RETURNS TABLE(word TEXT, severity TEXT, auto_action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT bw.word, bw.severity, bw.auto_action
  FROM banned_words bw
  WHERE bw.is_active = true
  AND LOWER(p_text) LIKE '%' || LOWER(bw.word) || '%'
  ORDER BY CASE bw.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: CRIAR VIEWS
-- =====================================================

-- View: admin_dashboard_stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 day') as users_today,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as users_month,
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '5 minutes') as users_online,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true) as vip_active,
  (SELECT COUNT(DISTINCT user_id) FROM user_themes WHERE is_active = true) as users_with_themes,
  (SELECT COUNT(*) FROM themes WHERE is_active = true) as total_themes,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM post_likes) as total_likes,
  (SELECT COUNT(*) FROM prayer_requests) as total_prayers,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as reports_pending,
  (SELECT COUNT(*) FROM achievements) as total_achievements;

-- View: admin_notifications_history
CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  n.id, n.sent_by, n.sent_by_email, n.title, n.message, n.notification_type,
  n.target_audience, n.total_sent, n.total_delivered, n.total_read, n.sent_at, n.created_at,
  CASE WHEN n.total_sent > 0 THEN ROUND((n.total_read::NUMERIC / n.total_sent) * 100, 2) ELSE 0 END as read_rate_percent
FROM admin_notifications n
ORDER BY n.created_at DESC;

-- View: admin_user_profile
CREATE OR REPLACE VIEW admin_user_profile AS
SELECT
  u.id, u.email, u.created_at as registered_at, u.last_sign_in_at,
  p.full_name, p.avatar_url, p.bio, p.current_theme, p.level, p.total_xp, p.last_seen_at,
  vs.vip_tier, vs.is_active as is_vip, vs.expires_at as vip_expires_at,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'warning') as total_warnings,
  (SELECT COUNT(*) FROM user_punishments WHERE user_id = u.id AND punishment_type = 'suspension') as total_suspensions,
  p.is_banned, p.banned_at,
  (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as total_posts,
  (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as total_comments,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as total_achievements,
  (SELECT COUNT(*) FROM user_themes WHERE user_id = u.id AND is_active = true) as total_themes
FROM auth.users u
LEFT JOIN users p ON p.user_id = u.id
LEFT JOIN vip_subscriptions vs ON vs.user_id = u.id AND vs.is_active = true;

-- View: admin_analytics_summary
CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '1 day') as active_today,
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '7 days') as active_week,
  (SELECT COUNT(*) FROM posts WHERE created_at >= NOW() - INTERVAL '7 days') as posts_week,
  (SELECT COUNT(*) FROM comments WHERE created_at >= NOW() - INTERVAL '7 days') as comments_week,
  (SELECT COUNT(*) FROM post_likes WHERE created_at >= NOW() - INTERVAL '7 days') as likes_week,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true) as vip_total,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND vip_tier = 'standard') as vip_standard,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND vip_tier = 'gold') as vip_gold,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND vip_tier = 'platinum') as vip_platinum,
  (SELECT AVG(total_xp) FROM users WHERE total_xp > 0) as avg_xp,
  (SELECT AVG(level) FROM users WHERE level > 0) as avg_level,
  (SELECT COUNT(*) FROM user_achievements) as total_achievements_unlocked,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM reports WHERE created_at >= NOW() - INTERVAL '7 days') as reports_week;

-- View: admin_analytics_user_growth
CREATE OR REPLACE VIEW admin_analytics_user_growth AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: admin_analytics_top_themes
CREATE OR REPLACE VIEW admin_analytics_top_themes AS
SELECT
  t.theme_name,
  t.theme_key,
  COUNT(DISTINCT p.user_id) as users_using
FROM themes t
LEFT JOIN profiles p ON p.current_theme = t.theme_key
WHERE t.is_active = true
GROUP BY t.id, t.theme_name, t.theme_key
ORDER BY users_using DESC
LIMIT 10;

-- View: admin_analytics_top_achievements
CREATE OR REPLACE VIEW admin_analytics_top_achievements AS
SELECT
  a.name,
  a.description,
  a.xp_reward,
  COUNT(DISTINCT ua.user_id) as unlock_count
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

-- Policies básicas (admins podem ver tudo)
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
-- FIM DO DEPLOY
-- =====================================================
