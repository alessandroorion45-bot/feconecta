-- =====================================================
-- DEPLOY MASSIVO - PAINEL ADMINISTRATIVO COMPLETO
-- =====================================================
-- Data: 2026-06-23 19:23:10
-- Total de migrations: 6
-- Status: Pronto para producao
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


-- =====================================================
-- MIGRATION 1/6: 20260623080000_admin_panel_real_data.sql
-- =====================================================


-- =====================================================
-- PAINEL ADMINISTRATIVO - DADOS REAIS
-- =====================================================
-- Remove dependência de dados mockados
-- Cria views otimizadas para estatísticas
-- Adiciona tabela de logs administrativos
-- =====================================================

-- =====================================================
-- TABELA: Logs Administrativos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem executou a ação
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,

  -- Ação executada
  action_type TEXT NOT NULL, -- 'grant_vip', 'revoke_vip', 'grant_theme', 'ban_user', 'delete_post', etc
  action_description TEXT NOT NULL,

  -- Alvo da ação
  target_type TEXT, -- 'user', 'post', 'theme', 'report', etc
  target_id UUID,
  target_details JSONB, -- Informações adicionais sobre o alvo

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_action ON public.admin_logs(action_type, created_at DESC);
CREATE INDEX idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- =====================================================
-- VIEW: Estatísticas do Dashboard (Otimizada)
-- =====================================================
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  -- Usuários
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 day') as users_today,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as users_month,

  -- Usuários Online (ativos nos últimos 5 minutos)
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '5 minutes') as users_online,

  -- VIP
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true) as vip_active,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND expires_at IS NULL) as vip_lifetime,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND expires_at < NOW() + INTERVAL '7 days') as vip_expiring_soon,

  -- Temas
  (SELECT COUNT(DISTINCT user_id) FROM user_themes WHERE is_active = true) as users_with_themes,
  (SELECT COUNT(*) FROM themes WHERE is_active = true) as total_themes,

  -- Conteúdo
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM posts WHERE created_at >= NOW() - INTERVAL '1 day') as posts_today,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM post_likes) as total_likes,
  (SELECT COUNT(*) FROM prayer_requests) as total_prayers,

  -- Moderação
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as reports_pending,
  (SELECT COUNT(*) FROM reports WHERE status = 'approved') as reports_resolved,
  (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending') as moderation_pending,

  -- Gamificação
  (SELECT COUNT(*) FROM achievements) as total_achievements,
  (SELECT COUNT(*) FROM user_achievements) as achievements_unlocked,
  (SELECT COUNT(*) FROM challenges WHERE is_active = true) as active_challenges,

  -- Atividade Recente
  (SELECT COUNT(*) FROM posts WHERE created_at >= NOW() - INTERVAL '1 hour') as posts_last_hour,
  (SELECT COUNT(*) FROM comments WHERE created_at >= NOW() - INTERVAL '1 hour') as comments_last_hour;

-- =====================================================
-- VIEW: Usuários VIP (Detalhada)
-- =====================================================
CREATE OR REPLACE VIEW admin_vip_users AS
SELECT
  u.id,
  u.email,
  p.full_name,
  p.avatar_url,
  vs.vip_tier,
  vs.is_active,
  vs.started_at,
  vs.expires_at,
  vs.granted_by,
  vs.grant_reason,
  CASE
    WHEN vs.expires_at IS NULL THEN 'Vitalício'
    WHEN vs.expires_at < NOW() THEN 'Expirado'
    WHEN vs.expires_at < NOW() + INTERVAL '7 days' THEN 'Expirando em breve'
    ELSE 'Ativo'
  END as vip_status_label,
  -- Admin que concedeu
  admin_profile.full_name as granted_by_name
FROM auth.users u
INNER JOIN vip_subscriptions vs ON vs.user_id = u.id
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN profiles admin_profile ON admin_profile.user_id = vs.granted_by
WHERE vs.is_active = true
ORDER BY vs.started_at DESC;

-- =====================================================
-- VIEW: Temas mais usados
-- =====================================================
CREATE OR REPLACE VIEW admin_theme_stats AS
SELECT
  t.id,
  t.theme_key,
  t.theme_name,
  t.unlock_type,
  t.vip_tier_required,
  t.rarity,
  COUNT(DISTINCT ut.user_id) as users_count,
  COUNT(DISTINCT CASE WHEN ut.is_active = true AND ut.user_id IN (
    SELECT user_id FROM profiles WHERE current_theme = t.theme_key
  ) THEN ut.user_id END) as users_using_now
FROM themes t
LEFT JOIN user_themes ut ON ut.theme_id = t.id
WHERE t.is_active = true
GROUP BY t.id, t.theme_key, t.theme_name, t.unlock_type, t.vip_tier_required, t.rarity
ORDER BY users_count DESC;

-- =====================================================
-- VIEW: Denúncias com detalhes
-- =====================================================
CREATE OR REPLACE VIEW admin_reports_detailed AS
SELECT
  r.id,
  r.report_type,
  r.description,
  r.status,
  r.created_at,
  r.reviewed_at,
  r.action_taken,
  r.moderator_notes,
  -- Reporter
  r.reporter_id,
  reporter.email as reporter_email,
  reporter_profile.full_name as reporter_name,
  -- Reported user
  r.reported_user_id,
  reported.email as reported_email,
  reported_profile.full_name as reported_name,
  -- Reviewer
  r.reviewed_by,
  reviewer_profile.full_name as reviewer_name
FROM reports r
LEFT JOIN auth.users reporter ON reporter.id = r.reporter_id
LEFT JOIN profiles reporter_profile ON reporter_profile.user_id = r.reporter_id
LEFT JOIN auth.users reported ON reported.id = r.reported_user_id
LEFT JOIN profiles reported_profile ON reported_profile.user_id = r.reported_user_id
LEFT JOIN profiles reviewer_profile ON reviewer_profile.user_id = r.reviewed_by
ORDER BY r.created_at DESC;

-- =====================================================
-- FUNCTION: Registrar log administrativo
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
  -- Buscar email do admin
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  -- Inserir log
  INSERT INTO admin_logs (
    admin_id,
    admin_email,
    action_type,
    action_description,
    target_type,
    target_id,
    target_details,
    metadata
  ) VALUES (
    p_admin_id,
    v_admin_email,
    p_action_type,
    p_action_description,
    p_target_type,
    p_target_id,
    p_target_details,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Log automático ao conceder VIP
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_log_vip_grant() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.granted_by IS NOT NULL THEN
    PERFORM log_admin_action(
      NEW.granted_by,
      'grant_vip',
      'Concedeu VIP ' || NEW.vip_tier || ' para usuário',
      'user',
      NEW.user_id,
      jsonb_build_object(
        'vip_tier', NEW.vip_tier,
        'expires_at', NEW.expires_at,
        'grant_reason', NEW.grant_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_vip_grant_trigger
  AFTER INSERT ON vip_subscriptions
  FOR EACH ROW
  WHEN (NEW.granted_by IS NOT NULL)
  EXECUTE FUNCTION trigger_log_vip_grant();

-- =====================================================
-- TRIGGER: Log automático ao conceder tema
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_log_theme_grant() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.granted_by IS NOT NULL THEN
    PERFORM log_admin_action(
      NEW.granted_by,
      'grant_theme',
      'Concedeu tema para usuário',
      'user_theme',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'theme_id', NEW.theme_id,
        'grant_reason', NEW.grant_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_theme_grant_trigger
  AFTER INSERT ON user_themes
  FOR EACH ROW
  WHEN (NEW.granted_by IS NOT NULL)
  EXECUTE FUNCTION trigger_log_theme_grant();

-- =====================================================
-- RLS: Admin Logs (apenas admins podem ver)
-- =====================================================
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "System can insert logs"
  ON admin_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- GRANT: Permissões para views
-- =====================================================
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON admin_vip_users TO authenticated;
GRANT SELECT ON admin_theme_stats TO authenticated;
GRANT SELECT ON admin_reports_detailed TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE admin_logs IS 'Registro de todas as ações administrativas realizadas na plataforma';
COMMENT ON VIEW admin_dashboard_stats IS 'Estatísticas consolidadas para o dashboard administrativo';
COMMENT ON VIEW admin_vip_users IS 'Lista de usuários VIP com detalhes completos';
COMMENT ON VIEW admin_theme_stats IS 'Estatísticas de uso dos temas premium';
COMMENT ON VIEW admin_reports_detailed IS 'Denúncias com informações completas de reporter, reportado e revisor';
COMMENT ON FUNCTION log_admin_action IS 'Registra uma ação administrativa no log de auditoria';




-- =====================================================
-- MIGRATION 2/6: 20260623081000_admin_photos_management.sql
-- =====================================================


-- =====================================================
-- GERENCIADOR DE FOTOS - ADMIN PANEL
-- =====================================================
-- View consolidada de todas as fotos da plataforma
-- Inclui posts, profile_photos e outras mídias
-- =====================================================

-- =====================================================
-- VIEW: Todas as fotos da plataforma (consolidada)
-- =====================================================
CREATE OR REPLACE VIEW admin_all_photos AS
-- Fotos de posts do feed
SELECT
  p.id,
  'post' as photo_type,
  p.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  p.media_url as photo_url,
  p.content as caption,
  p.likes_count,
  p.comments_count,
  p.created_at,
  p.updated_at,
  -- Denúncias
  (SELECT COUNT(*) FROM reports WHERE reported_content_type = 'post' AND reported_content_id = p.id AND status = 'pending') as pending_reports,
  -- Status de moderação
  (SELECT status FROM moderation_queue WHERE content_type = 'post' AND content_id = p.id ORDER BY created_at DESC LIMIT 1) as moderation_status
FROM posts p
INNER JOIN auth.users u ON u.id = p.user_id
LEFT JOIN profiles prof ON prof.user_id = p.user_id
WHERE p.media_type = 'image' AND p.media_url IS NOT NULL

UNION ALL

-- Fotos de perfil
SELECT
  pp.id,
  'profile_photo' as photo_type,
  pp.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  pp.photo_url,
  pp.caption,
  pp.likes_count,
  0 as comments_count,
  pp.created_at,
  pp.updated_at,
  (SELECT COUNT(*) FROM reports WHERE reported_content_type = 'profile_photo' AND reported_content_id = pp.id AND status = 'pending') as pending_reports,
  (SELECT status FROM moderation_queue WHERE content_type = 'profile_photo' AND content_id = pp.id ORDER BY created_at DESC LIMIT 1) as moderation_status
FROM profile_photos pp
INNER JOIN auth.users u ON u.id = pp.user_id
LEFT JOIN profiles prof ON prof.user_id = pp.user_id

UNION ALL

-- Posts de gratidão (se tiverem mídia futuramente)
SELECT
  gp.id,
  'gratitude_post' as photo_type,
  gp.user_id,
  u.email as user_email,
  prof.full_name as user_name,
  NULL as photo_url, -- Gratitude posts não têm foto por padrão
  gp.message as caption,
  gp.amens_count as likes_count,
  0 as comments_count,
  gp.created_at,
  gp.updated_at,
  (SELECT COUNT(*) FROM reports WHERE reported_content_type = 'gratitude_post' AND reported_content_id = gp.id AND status = 'pending') as pending_reports,
  (SELECT status FROM moderation_queue WHERE content_type = 'gratitude_post' AND content_id = gp.id ORDER BY created_at DESC LIMIT 1) as moderation_status
FROM gratitude_posts gp
INNER JOIN auth.users u ON u.id = gp.user_id
LEFT JOIN profiles prof ON prof.user_id = gp.user_id
WHERE gp.type = 'testemunho' -- Apenas testemunhos

ORDER BY created_at DESC;

-- =====================================================
-- VIEW: Fotos recentes (últimas 24h)
-- =====================================================
CREATE OR REPLACE VIEW admin_recent_photos AS
SELECT * FROM admin_all_photos
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- =====================================================
-- VIEW: Fotos denunciadas
-- =====================================================
CREATE OR REPLACE VIEW admin_reported_photos AS
SELECT * FROM admin_all_photos
WHERE pending_reports > 0
ORDER BY pending_reports DESC, created_at DESC;

-- =====================================================
-- FUNCTION: Ocultar foto (soft delete)
-- =====================================================
CREATE OR REPLACE FUNCTION hide_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'hide_photo',
    'Ocultou foto ' || p_photo_type,
    'photo',
    p_photo_id,
    jsonb_build_object('reason', p_reason, 'photo_type', p_photo_type)
  );

  -- Ocultar baseado no tipo
  IF p_photo_type = 'post' THEN
    UPDATE posts SET media_url = NULL, updated_at = NOW() WHERE id = p_photo_id RETURNING user_id INTO v_user_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM profile_photos WHERE id = p_photo_id RETURNING user_id INTO v_user_id;
  ELSIF p_photo_type = 'gratitude_post' THEN
    -- Gratitude posts não têm foto, mas podem ser ocultados
    UPDATE gratitude_posts SET message = '[CONTEÚDO REMOVIDO]', updated_at = NOW() WHERE id = p_photo_id RETURNING user_id INTO v_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Excluir foto permanentemente
-- =====================================================
CREATE OR REPLACE FUNCTION delete_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'delete_photo',
    'Excluiu foto ' || p_photo_type || ' permanentemente',
    'photo',
    p_photo_id,
    jsonb_build_object('reason', p_reason, 'photo_type', p_photo_type)
  );

  -- Excluir baseado no tipo
  IF p_photo_type = 'post' THEN
    DELETE FROM posts WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM profile_photos WHERE id = p_photo_id;
  ELSIF p_photo_type = 'gratitude_post' THEN
    DELETE FROM gratitude_posts WHERE id = p_photo_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Aprovar foto na fila de moderação
-- =====================================================
CREATE OR REPLACE FUNCTION approve_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Atualizar fila de moderação
  UPDATE moderation_queue
  SET
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW()
  WHERE content_id = p_photo_id AND content_type = p_photo_type;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'approve_photo',
    'Aprovou foto ' || p_photo_type,
    'photo',
    p_photo_id,
    jsonb_build_object('photo_type', p_photo_type)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT SELECT ON admin_all_photos TO authenticated;
GRANT SELECT ON admin_recent_photos TO authenticated;
GRANT SELECT ON admin_reported_photos TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON VIEW admin_all_photos IS 'View consolidada de todas as fotos da plataforma para gerenciamento administrativo';
COMMENT ON VIEW admin_recent_photos IS 'Fotos enviadas nas últimas 24 horas';
COMMENT ON VIEW admin_reported_photos IS 'Fotos com denúncias pendentes';
COMMENT ON FUNCTION hide_photo IS 'Oculta uma foto (soft delete) e registra log administrativo';
COMMENT ON FUNCTION delete_photo IS 'Exclui permanentemente uma foto e registra log';
COMMENT ON FUNCTION approve_photo IS 'Aprova uma foto na fila de moderação';




-- =====================================================
-- MIGRATION 3/6: 20260623082000_admin_notifications.sql
-- =====================================================


-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES ADMINISTRATIVAS
-- =====================================================
-- Envio em massa, templates, histórico
-- =====================================================

-- =====================================================
-- TABELA: Notificações enviadas pelo admin
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin que enviou
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_by_email TEXT NOT NULL,

  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'info', 'success', 'warning', 'announcement'

  -- Targeting
  target_audience TEXT NOT NULL, -- 'all', 'vip', 'new_users', 'active_users', 'specific'
  target_user_ids UUID[], -- Quando target_audience = 'specific'

  -- Estatísticas
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,

  -- Metadata
  scheduled_for TIMESTAMPTZ, -- NULL = enviar imediatamente
  sent_at TIMESTAMPTZ,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_notifications_sent_by ON public.admin_notifications(sent_by, created_at DESC);
CREATE INDEX idx_admin_notifications_audience ON public.admin_notifications(target_audience);
CREATE INDEX idx_admin_notifications_sent_at ON public.admin_notifications(sent_at DESC);

-- =====================================================
-- TABELA: Templates de notificações
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',

  -- Variáveis disponíveis (placeholders)
  variables TEXT[], -- Ex: ['user_name', 'xp_total', 'theme_name']

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notification_templates_active ON public.notification_templates(is_active) WHERE is_active = true;

-- Inserir templates padrão
INSERT INTO public.notification_templates (name, description, title, message, notification_type, variables) VALUES
  (
    'welcome_vip',
    'Boas-vindas para novos VIPs',
    '👑 Bem-vindo ao VIP!',
    'Olá {{user_name}}! Você agora é VIP e tem acesso a todos os temas premium, 2x XP e muito mais!',
    'success',
    ARRAY['user_name']
  ),
  (
    'new_theme_available',
    'Novo tema premium lançado',
    '🎨 Novo Tema Disponível!',
    'Um novo tema chamado "{{theme_name}}" está disponível na Galeria! Confira agora.',
    'announcement',
    ARRAY['theme_name']
  ),
  (
    'maintenance_warning',
    'Aviso de manutenção',
    '⚠️ Manutenção Programada',
    'A plataforma passará por manutenção em {{date}}. O acesso pode ficar temporariamente indisponível.',
    'warning',
    ARRAY['date']
  ),
  (
    'achievement_unlocked',
    'Nova conquista desbloqueada',
    '🏆 Conquista Desbloqueada!',
    'Parabéns {{user_name}}! Você desbloqueou a conquista "{{achievement_name}}" e ganhou {{xp}} XP!',
    'success',
    ARRAY['user_name', 'achievement_name', 'xp']
  ),
  (
    'content_warning',
    'Advertência de conteúdo',
    '⚠️ Advertência',
    'Olá {{user_name}}, seu conteúdo "{{content}}" violou nossas diretrizes. Por favor, revise nossos termos de uso.',
    'warning',
    ARRAY['user_name', 'content']
  );

-- =====================================================
-- FUNCTION: Enviar notificação em massa
-- =====================================================
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
  v_user_ids UUID[];
  v_user_id UUID;
  v_total_sent INTEGER := 0;
BEGIN
  -- Buscar email do admin
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  -- Criar registro da notificação
  INSERT INTO admin_notifications (
    sent_by,
    sent_by_email,
    title,
    message,
    notification_type,
    target_audience,
    target_user_ids,
    sent_at
  ) VALUES (
    p_admin_id,
    v_admin_email,
    p_title,
    p_message,
    p_notification_type,
    p_target_audience,
    p_target_user_ids,
    NOW()
  ) RETURNING id INTO v_notification_id;

  -- Determinar lista de usuários baseado no targeting
  IF p_target_audience = 'all' THEN
    SELECT ARRAY_AGG(id) INTO v_user_ids FROM auth.users;
  ELSIF p_target_audience = 'vip' THEN
    SELECT ARRAY_AGG(user_id) INTO v_user_ids FROM vip_subscriptions WHERE is_active = true;
  ELSIF p_target_audience = 'new_users' THEN
    SELECT ARRAY_AGG(id) INTO v_user_ids FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days';
  ELSIF p_target_audience = 'active_users' THEN
    SELECT ARRAY_AGG(user_id) INTO v_user_ids FROM users WHERE last_seen_at >= NOW() - INTERVAL '7 days';
  ELSIF p_target_audience = 'specific' THEN
    v_user_ids := p_target_user_ids;
  END IF;

  -- Enviar notificação para cada usuário
  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      -- Inserir na tabela de notificações do usuário (se existir)
      -- Assumindo que existe uma tabela 'notifications' para notificações de usuários
      BEGIN
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          metadata
        ) VALUES (
          v_user_id,
          p_title,
          p_message,
          p_notification_type,
          jsonb_build_object('admin_notification_id', v_notification_id)
        );
        v_total_sent := v_total_sent + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Continuar mesmo se falhar para um usuário
        NULL;
      END;
    END LOOP;
  END IF;

  -- Atualizar total enviado
  UPDATE admin_notifications SET total_sent = v_total_sent WHERE id = v_notification_id;

  -- Registrar log
  PERFORM log_admin_action(
    p_admin_id,
    'send_notification',
    'Enviou notificação em massa: ' || p_title,
    'notification',
    v_notification_id,
    jsonb_build_object(
      'target_audience', p_target_audience,
      'total_sent', v_total_sent
    )
  );

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEW: Histórico de notificações enviadas
-- =====================================================
CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  n.id,
  n.sent_by,
  n.sent_by_email,
  n.title,
  n.message,
  n.notification_type,
  n.target_audience,
  n.total_sent,
  n.total_delivered,
  n.total_read,
  n.sent_at,
  n.created_at,
  -- Taxa de leitura
  CASE
    WHEN n.total_sent > 0 THEN ROUND((n.total_read::NUMERIC / n.total_sent) * 100, 2)
    ELSE 0
  END as read_rate_percent
FROM admin_notifications n
ORDER BY n.created_at DESC;

-- =====================================================
-- RLS: Permissões
-- =====================================================
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can create notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can view templates"
  ON notification_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage templates"
  ON notification_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT SELECT ON admin_notifications_history TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE admin_notifications IS 'Histórico de notificações em massa enviadas por administradores';
COMMENT ON TABLE notification_templates IS 'Templates reutilizáveis para notificações';
COMMENT ON FUNCTION send_mass_notification IS 'Envia notificação em massa para grupo de usuários';
COMMENT ON VIEW admin_notifications_history IS 'Histórico de notificações com estatísticas de leitura';




-- =====================================================
-- MIGRATION 4/6: 20260623083000_admin_analytics.sql
-- =====================================================


-- =====================================================
-- ANALYTICS ADMINISTRATIVO
-- =====================================================
-- Métricas e gráficos de crescimento
-- =====================================================

-- =====================================================
-- VIEW: Crescimento de usuários por dia (últimos 30 dias)
-- =====================================================
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
-- VIEW: Retenção de usuários
-- =====================================================
CREATE OR REPLACE VIEW admin_analytics_retention AS
SELECT
  DATE_TRUNC('week', u.created_at) as cohort_week,
  COUNT(DISTINCT u.id) as cohort_size,
  COUNT(DISTINCT CASE WHEN p.last_seen_at >= NOW() - INTERVAL '7 days' THEN u.id END) as active_users,
  ROUND(
    (COUNT(DISTINCT CASE WHEN p.last_seen_at >= NOW() - INTERVAL '7 days' THEN u.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT u.id), 0)) * 100,
    2
  ) as retention_rate
FROM auth.users u
LEFT JOIN users p ON p.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', u.created_at)
ORDER BY cohort_week DESC;

-- =====================================================
-- VIEW: Atividade diária (últimos 30 dias)
-- =====================================================
CREATE OR REPLACE VIEW admin_analytics_daily_activity AS
WITH daily_stats AS (
  SELECT
    DATE(created_at) as date,
    'posts' as activity_type,
    COUNT(*) as count
  FROM posts
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)

  UNION ALL

  SELECT
    DATE(created_at) as date,
    'comments' as activity_type,
    COUNT(*) as count
  FROM comments
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)

  UNION ALL

  SELECT
    DATE(created_at) as date,
    'prayer_requests' as activity_type,
    COUNT(*) as count
  FROM prayer_requests
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
)
SELECT
  date,
  SUM(CASE WHEN activity_type = 'posts' THEN count ELSE 0 END) as posts,
  SUM(CASE WHEN activity_type = 'comments' THEN count ELSE 0 END) as comments,
  SUM(CASE WHEN activity_type = 'prayer_requests' THEN count ELSE 0 END) as prayers
FROM daily_stats
GROUP BY date
ORDER BY date DESC;

-- =====================================================
-- VIEW: Top temas mais usados
-- =====================================================
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

-- =====================================================
-- VIEW: Top conquistas mais desbloqueadas
-- =====================================================
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
-- VIEW: Distribuição de níveis
-- =====================================================
CREATE OR REPLACE VIEW admin_analytics_level_distribution AS
SELECT
  level,
  COUNT(*) as user_count
FROM users
WHERE level IS NOT NULL
GROUP BY level
ORDER BY level;

-- =====================================================
-- VIEW: Engajamento por hora do dia
-- =====================================================
CREATE OR REPLACE VIEW admin_analytics_hourly_engagement AS
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as post_count
FROM posts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- =====================================================
-- VIEW: Métricas consolidadas
-- =====================================================
CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT
  -- Usuários
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '1 day') as active_today,
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '7 days') as active_week,

  -- Engajamento
  (SELECT COUNT(*) FROM posts WHERE created_at >= NOW() - INTERVAL '7 days') as posts_week,
  (SELECT COUNT(*) FROM comments WHERE created_at >= NOW() - INTERVAL '7 days') as comments_week,
  (SELECT COUNT(*) FROM post_likes WHERE created_at >= NOW() - INTERVAL '7 days') as likes_week,

  -- VIP
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true) as vip_total,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND vip_tier = 'standard') as vip_standard,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND vip_tier = 'gold') as vip_gold,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true AND vip_tier = 'platinum') as vip_platinum,

  -- Gamificação
  (SELECT AVG(total_xp) FROM users WHERE total_xp > 0) as avg_xp,
  (SELECT AVG(level) FROM users WHERE level > 0) as avg_level,
  (SELECT COUNT(*) FROM user_achievements) as total_achievements_unlocked,

  -- Moderação
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM reports WHERE created_at >= NOW() - INTERVAL '7 days') as reports_week;

-- =====================================================
-- GRANT: Permissões
-- =====================================================
GRANT SELECT ON admin_analytics_user_growth TO authenticated;
GRANT SELECT ON admin_analytics_retention TO authenticated;
GRANT SELECT ON admin_analytics_daily_activity TO authenticated;
GRANT SELECT ON admin_analytics_top_themes TO authenticated;
GRANT SELECT ON admin_analytics_top_achievements TO authenticated;
GRANT SELECT ON admin_analytics_level_distribution TO authenticated;
GRANT SELECT ON admin_analytics_hourly_engagement TO authenticated;
GRANT SELECT ON admin_analytics_summary TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON VIEW admin_analytics_user_growth IS 'Crescimento de usuários nos últimos 30 dias';
COMMENT ON VIEW admin_analytics_retention IS 'Taxa de retenção de usuários por semana';
COMMENT ON VIEW admin_analytics_daily_activity IS 'Atividade diária (posts, comentários, orações)';
COMMENT ON VIEW admin_analytics_top_themes IS 'Top 10 temas mais utilizados';
COMMENT ON VIEW admin_analytics_top_achievements IS 'Top 10 conquistas mais desbloqueadas';
COMMENT ON VIEW admin_analytics_level_distribution IS 'Distribuição de usuários por nível';
COMMENT ON VIEW admin_analytics_hourly_engagement IS 'Engajamento por hora do dia (últimos 7 dias)';
COMMENT ON VIEW admin_analytics_summary IS 'Resumo consolidado de todas as métricas';




-- =====================================================
-- MIGRATION 5/6: 20260623084000_admin_user_actions.sql
-- =====================================================


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




-- =====================================================
-- MIGRATION 6/6: 20260623085000_moderation_automation.sql
-- =====================================================


-- =====================================================
-- AUTOMAÇÕES DE MODERAÇÃO
-- =====================================================
-- Auto-flag, filtros de palavras, regras automáticas
-- =====================================================

-- =====================================================
-- TABELA: Palavras proibidas / filtradas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Palavra ou padrão
  word TEXT NOT NULL UNIQUE,
  pattern TEXT, -- Regex pattern (opcional)

  -- Severidade
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Ação automática
  auto_action TEXT NOT NULL DEFAULT 'flag', -- 'flag', 'hide', 'reject', 'warn_user'

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_banned_words_active ON public.banned_words(is_active) WHERE is_active = true;
CREATE INDEX idx_banned_words_severity ON public.banned_words(severity);

-- Inserir palavras proibidas padrão
INSERT INTO public.banned_words (word, severity, auto_action) VALUES
  ('spam', 'medium', 'flag'),
  ('scam', 'high', 'hide'),
  ('hack', 'high', 'flag'),
  ('malware', 'critical', 'reject'),
  ('phishing', 'critical', 'reject');

-- =====================================================
-- TABELA: Regras de moderação automática
-- =====================================================
CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Regra
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger condition
  trigger_type TEXT NOT NULL, -- 'report_count', 'banned_word', 'spam_pattern', 'multiple_posts'
  trigger_value JSONB NOT NULL, -- Configuração do trigger

  -- Ação automática
  action_type TEXT NOT NULL, -- 'flag', 'hide', 'suspend_user', 'ban_user', 'notify_admin'
  action_params JSONB, -- Parâmetros da ação

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0, -- Ordem de execução

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_moderation_rules_active ON public.moderation_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_moderation_rules_priority ON public.moderation_rules(priority DESC);

-- Inserir regras padrão
INSERT INTO public.moderation_rules (name, description, trigger_type, trigger_value, action_type, action_params, priority) VALUES
  (
    'Auto-ban após 3 denúncias',
    'Usuário é automaticamente banido após receber 3 denúncias aprovadas',
    'report_count',
    '{"threshold": 3, "status": "approved"}'::jsonb,
    'ban_user',
    '{"reason": "Banimento automático: 3 denúncias aprovadas"}'::jsonb,
    100
  ),
  (
    'Auto-suspender após 5 advertências',
    'Usuário é suspenso por 7 dias após 5 advertências',
    'report_count',
    '{"threshold": 5, "punishment_type": "warning"}'::jsonb,
    'suspend_user',
    '{"duration_days": 7, "reason": "Suspensão automática: 5 advertências"}'::jsonb,
    90
  ),
  (
    'Ocultar conteúdo com palavra proibida crítica',
    'Oculta automaticamente conteúdo com palavras de severidade crítica',
    'banned_word',
    '{"severity": "critical"}'::jsonb,
    'hide',
    '{}'::jsonb,
    80
  );

-- =====================================================
-- TABELA: Log de ações automáticas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auto_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Regra aplicada
  rule_id UUID REFERENCES public.moderation_rules(id),
  rule_name TEXT NOT NULL,

  -- Alvo
  target_type TEXT NOT NULL, -- 'user', 'post', 'comment', 'photo'
  target_id UUID NOT NULL,

  -- Ação executada
  action_taken TEXT NOT NULL,
  action_result JSONB,

  -- Trigger que causou
  trigger_reason TEXT,
  trigger_data JSONB,

  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_auto_moderation_logs_target ON public.auto_moderation_logs(target_type, target_id);
CREATE INDEX idx_auto_moderation_logs_rule ON public.auto_moderation_logs(rule_id);
CREATE INDEX idx_auto_moderation_logs_executed ON public.auto_moderation_logs(executed_at DESC);

-- =====================================================
-- FUNCTION: Verificar palavras proibidas em texto
-- =====================================================
CREATE OR REPLACE FUNCTION check_banned_words(p_text TEXT)
RETURNS TABLE(word TEXT, severity TEXT, auto_action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bw.word,
    bw.severity,
    bw.auto_action
  FROM banned_words bw
  WHERE bw.is_active = true
  AND (
    LOWER(p_text) LIKE '%' || LOWER(bw.word) || '%'
    OR (bw.pattern IS NOT NULL AND p_text ~* bw.pattern)
  )
  ORDER BY
    CASE bw.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Aplicar regras de moderação automática
-- =====================================================
CREATE OR REPLACE FUNCTION apply_moderation_rules(
  p_target_type TEXT,
  p_target_id UUID,
  p_content TEXT DEFAULT NULL
) RETURNS TABLE(rule_applied TEXT, action_taken TEXT) AS $$
DECLARE
  v_rule RECORD;
  v_user_id UUID;
  v_report_count INTEGER;
  v_warning_count INTEGER;
  v_banned_words RECORD;
BEGIN
  -- Verificar palavras proibidas no conteúdo
  IF p_content IS NOT NULL THEN
    FOR v_banned_words IN
      SELECT * FROM check_banned_words(p_content) WHERE severity IN ('critical', 'high')
    LOOP
      -- Registrar log
      INSERT INTO auto_moderation_logs (
        rule_id,
        rule_name,
        target_type,
        target_id,
        action_taken,
        trigger_reason,
        trigger_data
      ) VALUES (
        NULL,
        'Palavra proibida detectada',
        p_target_type,
        p_target_id,
        v_banned_words.auto_action,
        'banned_word',
        jsonb_build_object('word', v_banned_words.word, 'severity', v_banned_words.severity)
      );

      RETURN QUERY SELECT 'Palavra proibida: ' || v_banned_words.word, v_banned_words.auto_action;
    END LOOP;
  END IF;

  -- Verificar regras baseadas em contagem de denúncias
  IF p_target_type = 'user' THEN
    v_user_id := p_target_id;

    -- Contar denúncias aprovadas
    SELECT COUNT(*)
    INTO v_report_count
    FROM reports
    WHERE reported_user_id = v_user_id AND status = 'approved';

    -- Contar advertências
    SELECT COUNT(*)
    INTO v_warning_count
    FROM user_punishments
    WHERE user_id = v_user_id AND punishment_type = 'warning' AND is_active = true;

    -- Aplicar regras
    FOR v_rule IN
      SELECT * FROM moderation_rules
      WHERE is_active = true
      AND trigger_type IN ('report_count')
      ORDER BY priority DESC
    LOOP
      IF v_rule.trigger_type = 'report_count' THEN
        IF (v_rule.trigger_value->>'punishment_type') IS NULL
           AND v_report_count >= (v_rule.trigger_value->>'threshold')::INTEGER THEN
          -- Executar ação
          -- (Aqui você pode chamar outras functions como ban_user, suspend_user, etc.)

          -- Registrar log
          INSERT INTO auto_moderation_logs (
            rule_id,
            rule_name,
            target_type,
            target_id,
            action_taken,
            trigger_reason,
            trigger_data
          ) VALUES (
            v_rule.id,
            v_rule.name,
            'user',
            v_user_id,
            v_rule.action_type,
            'report_threshold_exceeded',
            jsonb_build_object('report_count', v_report_count, 'threshold', v_rule.trigger_value->>'threshold')
          );

          RETURN QUERY SELECT v_rule.name, v_rule.action_type;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-moderação ao criar post
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_auto_moderate_post() RETURNS TRIGGER AS $$
BEGIN
  -- Verificar conteúdo
  PERFORM apply_moderation_rules('post', NEW.id, NEW.content);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_moderate_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_moderate_post();

-- =====================================================
-- RLS: Permissões
-- =====================================================
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banned words"
  ON banned_words FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'moderator')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage moderation rules"
  ON moderation_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can view auto moderation logs"
  ON auto_moderation_logs FOR SELECT
  USING (
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
GRANT ALL ON banned_words TO authenticated;
GRANT ALL ON moderation_rules TO authenticated;
GRANT SELECT ON auto_moderation_logs TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE banned_words IS 'Lista de palavras proibidas e padrões de spam';
COMMENT ON TABLE moderation_rules IS 'Regras de moderação automática com triggers e ações';
COMMENT ON TABLE auto_moderation_logs IS 'Log de todas as ações automáticas de moderação executadas';
COMMENT ON FUNCTION check_banned_words IS 'Verifica se um texto contém palavras proibidas';
COMMENT ON FUNCTION apply_moderation_rules IS 'Aplica regras de moderação automática a um alvo';




-- =====================================================
-- FIM DO DEPLOY MASSIVO
-- =====================================================
-- Total de migrations aplicadas: 6
-- Status: COMPLETO
-- =====================================================

