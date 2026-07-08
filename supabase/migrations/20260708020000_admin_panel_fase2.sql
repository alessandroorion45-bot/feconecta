-- ============================================================
-- PAINEL ADMIN — FASE 2: tempo real, IA de moderação (risco),
-- logs de login/logout
-- ============================================================
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

-- ============================================================
-- 1. Log de atividade do usuário (login/logout) — tabela já
--    existia (user_activity_log) mas nunca era escrita.
-- ============================================================
DROP FUNCTION IF EXISTS public.log_user_activity(uuid, text, jsonb);
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_details JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, action_type, details)
  VALUES (p_user_id, p_action_type, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_user_activity(UUID, TEXT, JSONB) TO authenticated;

-- ============================================================
-- 2. IA de moderação — pontuação de risco baseada em regras
--    reais (não é um modelo de ML, é um sistema de regras
--    transparente e explicável, como pedido: "explicar por que
--    a IA classificou o usuário dessa forma. A decisão final
--    sempre pertence ao administrador.")
--    Adiciona risk_score/risk_level ao FINAL de admin_user_profile
--    (sem DROP: só adiciona colunas novas no fim, não reordena).
-- ============================================================
CREATE OR REPLACE VIEW public.admin_user_profile AS
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
  -- ===== IA de moderação: pontuação de risco (0-100), regras
  -- transparentes e explicáveis. A decisão final é sempre do admin.
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
) risk ON true;

-- ============================================================
-- 3. Feed de atividade recente (para dashboard em tempo real)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_recent_activity AS
SELECT
  al.id,
  al.admin_email AS actor,
  al.action_type,
  al.action_description AS description,
  al.target_type,
  al.created_at
FROM public.admin_logs al
ORDER BY al.created_at DESC
LIMIT 50;

-- ============================================================
-- 4. Habilitar Realtime nas tabelas que o dashboard vai escutar
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;

SELECT 'ok' as status;
