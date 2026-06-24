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
