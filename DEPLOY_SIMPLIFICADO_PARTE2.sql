-- =====================================================
-- PARTE 2: CRIAR VIEWS E FUNCTIONS
-- =====================================================
-- Execute DEPOIS da Parte 1
-- Tempo estimado: ~10 segundos
-- =====================================================

-- Function: log_admin_action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_id, admin_email, action_type, action_description, target_type, target_id)
  VALUES (p_admin_id, '', p_action_type, p_action_description, p_target_type, p_target_id)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: admin_dashboard_stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM vip_subscriptions WHERE is_active = true) as vip_active,
  (SELECT COUNT(*) FROM themes WHERE is_active = true) as total_themes,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as reports_pending,
  (SELECT COUNT(*) FROM achievements) as total_achievements;

-- View: admin_notifications_history
CREATE OR REPLACE VIEW admin_notifications_history AS
SELECT
  id, sent_by_email, title, message, notification_type,
  target_audience, total_sent, sent_at, created_at
FROM admin_notifications
ORDER BY created_at DESC;

-- GRANT permissões
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON admin_notifications_history TO authenticated;

-- Verificar criação
SELECT
  'Views e Functions criadas!' as status,
  (SELECT COUNT(*) FROM admin_dashboard_stats) as dashboard_ok;
