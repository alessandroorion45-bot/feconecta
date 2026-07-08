-- ============================================================
-- PAINEL ADMIN — FASE 9 (CRÍTICO): trava leitura de TODAS as views
-- e tabelas admin_* para admins apenas.
-- ============================================================
-- Achado: TODA view/tabela admin_* tinha SELECT/INSERT/UPDATE/DELETE
-- liberado até para o role "anon" (visitante não autenticado!) — é o
-- privilégio padrão do Supabase para objetos novos no schema public,
-- que ninguém nunca revogou. Isso expunha e-mail, pontuação de risco,
-- denúncias, banimentos e todo o histórico administrativo de QUALQUER
-- usuário pra qualquer um que soubesse o nome da view, direto pela
-- API REST (/rest/v1/admin_user_profile etc.), sem passar pelo painel.
--
-- Fix: cada view passa a filtrar por "WHERE public.is_admin(auth.uid())"
-- — não-admins recebem 0 linhas (sem erro, só vazio). As tabelas reais
-- (admin_logs, admin_notifications) ganham RLS com a mesma regra.
-- Revoga os privilégios perigosos (INSERT/UPDATE/DELETE/TRUNCATE) de
-- anon/authenticated nas views — elas são só leitura via o painel;
-- toda escrita já passa pelas funções SECURITY DEFINER com is_admin().
--
-- NOTA: as tabelas admin_transfer_votes/admin_transfer_votings têm o
-- mesmo problema mas são de uma funcionalidade diferente (fora do
-- painel administrativo) — não mexi nelas, avaliar separadamente.
--
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

-- ============================================================
-- 1. admin_dashboard_stats
-- ============================================================
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT * FROM (
  SELECT
    (SELECT count(*) FROM auth.users) AS total_users,
    (SELECT count(*) FROM auth.users WHERE users.created_at >= (now() - '1 day'::interval)) AS users_today,
    (SELECT count(*) FROM auth.users WHERE users.created_at >= (now() - '7 days'::interval)) AS users_week,
    (SELECT count(*) FROM public.admin_logs) AS total_logs,
    (SELECT count(*) FROM public.user_punishments WHERE user_punishments.is_active = true) AS active_punishments,
    (SELECT count(*) FROM public.user_reports WHERE user_reports.status = 'pending') AS pending_reports
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 2. admin_analytics_summary
-- ============================================================
CREATE OR REPLACE VIEW public.admin_analytics_summary AS
SELECT * FROM (
  SELECT
    (SELECT count(*) FROM auth.users) AS total_users,
    (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '7 days') AS new_users_week,
    (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '30 days') AS new_users_month,
    (SELECT count(*) FROM public.users WHERE last_active_date = CURRENT_DATE) AS active_today,
    (SELECT count(*) FROM public.users WHERE last_active_date >= CURRENT_DATE - INTERVAL '7 days') AS active_week,
    (SELECT count(*) FROM public.posts WHERE created_at >= now() - interval '7 days') AS posts_week,
    (SELECT count(*) FROM public.comments WHERE created_at >= now() - interval '7 days') AS comments_week,
    (SELECT count(*) FROM public.post_likes WHERE created_at >= now() - interval '7 days') AS likes_week,
    (SELECT count(*) FROM public.vip_subscriptions WHERE is_active = true) AS vip_total,
    (SELECT count(*) FROM public.vip_subscriptions WHERE is_active = true AND vip_tier = 'standard') AS vip_standard,
    (SELECT count(*) FROM public.vip_subscriptions WHERE is_active = true AND vip_tier = 'gold') AS vip_gold,
    (SELECT count(*) FROM public.vip_subscriptions WHERE is_active = true AND vip_tier = 'platinum') AS vip_platinum,
    (SELECT COALESCE(AVG(total_xp), 0)::numeric(10,1) FROM public.users) AS avg_xp,
    (SELECT COALESCE(AVG(current_level), 0)::numeric(10,1) FROM public.users) AS avg_level,
    (SELECT count(*) FROM public.user_achievements) AS total_achievements_unlocked,
    (SELECT count(*) FROM public.user_reports WHERE status = 'pending') AS pending_reports,
    (SELECT count(*) FROM public.user_reports WHERE created_at >= now() - interval '7 days') AS reports_week
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 3. admin_analytics_top_themes / admin_analytics_top_achievements
-- ============================================================
CREATE OR REPLACE VIEW public.admin_analytics_top_themes AS
SELECT * FROM (
  SELECT t.theme_name, COUNT(DISTINCT ut.user_id) AS users_using
  FROM public.user_themes ut
  JOIN public.themes t ON t.theme_key = ut.theme_key
  WHERE ut.is_unlocked = true
  GROUP BY t.theme_name
  ORDER BY users_using DESC
) sub
WHERE public.is_admin(auth.uid());

CREATE OR REPLACE VIEW public.admin_analytics_top_achievements AS
SELECT * FROM (
  SELECT a.name, COUNT(ua.id) AS unlock_count
  FROM public.user_achievements ua
  JOIN public.achievements a ON a.id = ua.achievement_id
  GROUP BY a.name
  ORDER BY unlock_count DESC
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 4. admin_theme_stats
-- ============================================================
CREATE OR REPLACE VIEW public.admin_theme_stats AS
SELECT * FROM (
  SELECT
    t.id,
    t.theme_key,
    t.theme_name,
    t.description,
    CASE WHEN t.tier IS NULL OR t.tier = 'standard' THEN 'free' ELSE 'vip' END AS unlock_type,
    t.tier AS vip_tier_required,
    COALESCE(t.rarity, 1) AS rarity,
    COALESCE(t.is_active, true) AS is_active,
    COUNT(DISTINCT ut.user_id) FILTER (WHERE ut.is_unlocked = true) AS users_count,
    COUNT(DISTINCT ut.user_id) FILTER (WHERE ut.is_active = true) AS users_using_now
  FROM public.themes t
  LEFT JOIN public.user_themes ut ON ut.theme_key = t.theme_key
  GROUP BY t.id, t.theme_key, t.theme_name, t.description, t.tier, t.rarity, t.is_active
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 5. Views de fotos
-- ============================================================
CREATE OR REPLACE VIEW public.admin_all_photos AS
SELECT * FROM (
  SELECT
    p.id,
    'post'::text AS photo_type,
    p.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    p.media_url AS photo_url,
    p.content AS caption,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count,
    p.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'post' AND ur.content_id = p.id AND ur.status = 'pending') AS pending_reports,
    NULL::text AS moderation_status
  FROM public.posts p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.media_url IS NOT NULL

  UNION ALL

  SELECT
    pp.id,
    'profile_photo'::text AS photo_type,
    pp.user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    pp.photo_url,
    pp.caption,
    COALESCE(pp.likes_count, 0) AS likes_count,
    0 AS comments_count,
    pp.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.content_type = 'profile_photo' AND ur.content_id = pp.id AND ur.status = 'pending') AS pending_reports,
    NULL::text AS moderation_status
  FROM public.profile_photos pp
  JOIN public.users u ON u.id = pp.user_id
) sub
WHERE public.is_admin(auth.uid());

CREATE OR REPLACE VIEW public.admin_recent_photos AS
SELECT * FROM (
  SELECT * FROM public.admin_all_photos
  ORDER BY created_at DESC
  LIMIT 100
) sub;
-- (admin_all_photos já filtra por is_admin(); não precisa duplicar aqui)

CREATE OR REPLACE VIEW public.admin_reported_photos AS
SELECT * FROM (
  SELECT * FROM public.admin_all_photos
  WHERE pending_reports > 0
  ORDER BY pending_reports DESC, created_at DESC
) sub;
-- (idem: admin_all_photos já filtra por is_admin())

-- ============================================================
-- 6. admin_user_profile
-- ============================================================
CREATE OR REPLACE VIEW public.admin_user_profile AS
SELECT * FROM (
  SELECT
    u.id,
    u.email,
    COALESCE(pu.full_name, u.email) AS full_name,
    pu.avatar_url,
    COALESCE(pu.current_level, 1) AS level,
    COALESCE(pu.total_xp, 0) AS total_xp,
    u.created_at AS registered_at,
    u.last_sign_in_at,
    EXISTS (SELECT 1 FROM public.vip_subscriptions vs WHERE vs.user_id = u.id AND vs.is_active = true) AS is_vip,
    (SELECT vs.vip_tier FROM public.vip_subscriptions vs WHERE vs.user_id = u.id AND vs.is_active = true LIMIT 1) AS vip_tier,
    (SELECT ut.theme_key FROM public.user_themes ut WHERE ut.user_id = u.id AND ut.is_active = true LIMIT 1) AS current_theme,
    (SELECT COUNT(*) FROM public.posts p WHERE p.user_id = u.id) AS total_posts,
    (SELECT COUNT(*) FROM public.comments c WHERE c.user_id = u.id) AS total_comments,
    (SELECT COUNT(*) FROM public.user_achievements ua WHERE ua.user_id = u.id) AS total_achievements,
    (SELECT COUNT(*) FROM public.user_punishments up WHERE up.user_id = u.id AND up.punishment_type = 'warning') AS total_warnings,
    (SELECT COUNT(*) FROM public.user_punishments up WHERE up.user_id = u.id AND up.punishment_type = 'suspension') AS total_suspensions,
    EXISTS (
      SELECT 1 FROM public.user_punishments up
      WHERE up.user_id = u.id AND up.punishment_type = 'ban' AND up.is_active = true
    ) AS is_banned,
    risk.score AS risk_score,
    CASE
      WHEN risk.score >= 80 THEN 'critico'
      WHEN risk.score >= 50 THEN 'alto'
      WHEN risk.score >= 20 THEN 'medio'
      ELSE 'baixo'
    END AS risk_level
  FROM auth.users u
  LEFT JOIN public.users pu ON pu.id = u.id
  LEFT JOIN LATERAL (
    SELECT LEAST(100, GREATEST(0,
      (SELECT COUNT(*) FROM public.user_punishments up WHERE up.user_id = u.id AND up.punishment_type = 'warning') * 10
      + (SELECT COUNT(*) FROM public.user_punishments up WHERE up.user_id = u.id AND up.punishment_type = 'suspension') * 25
      + (CASE WHEN EXISTS (SELECT 1 FROM public.user_punishments up WHERE up.user_id = u.id AND up.punishment_type = 'ban' AND up.is_active = true) THEN 100 ELSE 0 END)
      + (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.reported_user_id = u.id AND ur.resolution = 'approved') * 15
      + (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.reported_user_id = u.id AND ur.status = 'pending') * 5
      + (CASE WHEN u.created_at >= now() - interval '3 days' THEN 10 ELSE 0 END)
      - (CASE WHEN u.created_at < now() - interval '90 days'
              AND NOT EXISTS (SELECT 1 FROM public.user_punishments up WHERE up.user_id = u.id)
         THEN 10 ELSE 0 END)
    )) AS score
  ) risk ON true
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 7. admin_recent_activity
-- ============================================================
CREATE OR REPLACE VIEW public.admin_recent_activity AS
SELECT * FROM (
  SELECT
    al.id,
    al.admin_email AS actor,
    al.action_type,
    al.action_description AS description,
    al.target_type,
    al.created_at
  FROM public.admin_logs al
  ORDER BY al.created_at DESC
  LIMIT 50
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 8. admin_reports_detailed
-- ============================================================
CREATE OR REPLACE VIEW public.admin_reports_detailed AS
SELECT * FROM (
  SELECT
    ur.id,
    ur.reporter_id,
    reporter.email AS reporter_email,
    ur.reported_user_id,
    reported.email AS reported_user_email,
    COALESCE(pu.full_name, reported.email) AS reported_user_name,
    ur.reason,
    ur.description,
    ur.content_type,
    ur.content_id,
    ur.status,
    ur.resolution,
    ur.resolved_by,
    ur.resolved_at,
    ur.resolution_notes,
    ur.created_at,
    (SELECT COUNT(*) FROM public.user_reports ur2 WHERE ur2.reported_user_id = ur.reported_user_id) AS reported_user_total_reports,
    (SELECT COUNT(*) FROM public.user_punishments up WHERE up.user_id = ur.reported_user_id) AS reported_user_total_punishments
  FROM public.user_reports ur
  LEFT JOIN auth.users reporter ON reporter.id = ur.reporter_id
  LEFT JOIN auth.users reported ON reported.id = ur.reported_user_id
  LEFT JOIN public.users pu ON pu.id = ur.reported_user_id
  ORDER BY ur.created_at DESC
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 9. admin_notifications_history (pré-existente, não criada por mim)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_notifications_history AS
SELECT * FROM (
  SELECT id, title, message, notification_type, target_audience, total_sent, sent_at, created_at
  FROM public.admin_notifications n
  ORDER BY created_at DESC
) sub
WHERE public.is_admin(auth.uid());

-- ============================================================
-- 10. Revoga privilégios perigosos de anon/authenticated em TODAS
--     as views (só leitura faz sentido, e já é filtrada por admin)
-- ============================================================
DO $$
DECLARE
  v_view TEXT;
BEGIN
  FOREACH v_view IN ARRAY ARRAY[
    'admin_dashboard_stats', 'admin_analytics_summary', 'admin_analytics_top_themes',
    'admin_analytics_top_achievements', 'admin_theme_stats',
    'admin_all_photos', 'admin_recent_photos', 'admin_reported_photos', 'admin_user_profile',
    'admin_recent_activity', 'admin_reports_detailed', 'admin_notifications_history'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated, PUBLIC', v_view);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_view);
  END LOOP;
END $$;

-- ============================================================
-- 11. Tabelas reais (não views): RLS de verdade
-- ============================================================
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_logs FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_logs FROM authenticated;
GRANT SELECT ON public.admin_logs TO authenticated;

DROP POLICY IF EXISTS "Apenas admins leem admin_logs" ON public.admin_logs;
CREATE POLICY "Apenas admins leem admin_logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_notifications FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_notifications FROM authenticated;
GRANT SELECT ON public.admin_notifications TO authenticated;

DROP POLICY IF EXISTS "Apenas admins leem admin_notifications" ON public.admin_notifications;
CREATE POLICY "Apenas admins leem admin_notifications"
  ON public.admin_notifications FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 12. admin_analytics_user_growth (pré-existente, não criada por mim)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_analytics_user_growth AS
SELECT * FROM (
  SELECT date(created_at) AS date, count(*) AS new_users
  FROM auth.users
  WHERE created_at >= (now() - '30 days'::interval)
  GROUP BY (date(created_at))
  ORDER BY (date(created_at)) DESC
) sub
WHERE public.is_admin(auth.uid());

REVOKE ALL ON public.admin_analytics_user_growth FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.admin_analytics_user_growth TO authenticated;

SELECT 'ok' as status;
