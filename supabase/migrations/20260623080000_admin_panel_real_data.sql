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
