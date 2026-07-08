-- ============================================================
-- FIX COMPLETO DO PAINEL ADMINISTRATIVO
-- ============================================================
-- Auditoria encontrou: metade das views/funções do painel admin
-- (escritas em 23/06) nunca chegaram a existir de fato no banco —
-- os arquivos de migração referenciam uma tabela "users" com
-- colunas que não existem (last_seen_at, is_banned) e uma tabela
-- "reports"/"moderation_queue" que nunca foi criada. As views que
-- SIM existem (admin_dashboard_stats, admin_user_profile) foram
-- reescritas manualmente por uma versão simplificada, diferente
-- do que está no repositório.
--
-- Este script:
-- 1. Estende user_reports (tabela REAL já em uso) com content_type/
--    content_id/resolution, em vez de criar uma tabela "reports"
--    paralela que nunca existiu.
-- 2. Corrige e cria as views/funções que dependiam da tabela
--    "reports"/"moderation_queue" fantasma ou de profiles.user_id
--    (bug: a PK de profiles é "id", não "user_id").
-- 3. Preserva os campos que o Dashboard.tsx já consome hoje
--    (total_users, users_today, users_week, total_logs,
--    active_punishments) e só ADICIONA pending_reports.
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

-- ============================================================
-- 0. ESTENDER user_themes PARA SUPORTAR CONCESSÃO TEMPORÁRIA
--    COM MOTIVO (Themes.tsx grava expires_at/grant_reason, que
--    não existiam na tabela real)
-- ============================================================
ALTER TABLE public.user_themes
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grant_reason TEXT;

-- ============================================================
-- 1. ESTENDER user_reports PARA SUPORTAR DENÚNCIA DE CONTEÚDO
-- ============================================================
ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS content_type TEXT,   -- 'post','profile_photo','comment', etc. NULL = denúncia de usuário
  ADD COLUMN IF NOT EXISTS content_id UUID,     -- id do conteúdo denunciado. NULL = denúncia de usuário
  ADD COLUMN IF NOT EXISTS resolution TEXT;     -- 'approved' | 'rejected', preenchido ao revisar

CREATE INDEX IF NOT EXISTS idx_user_reports_content ON public.user_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);

-- ============================================================
-- 2. FUNÇÃO: revisar denúncia (usada por Reports.tsx)
-- ============================================================
CREATE OR REPLACE FUNCTION public.review_report(
  p_report_id UUID,
  p_reviewer_id UUID,
  p_status TEXT,              -- 'approved' | 'rejected'
  p_action_taken TEXT,
  p_moderator_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_reports
  SET
    status = 'reviewed',
    resolution = p_status,
    resolved_by = p_reviewer_id,
    resolved_at = NOW(),
    resolution_notes = COALESCE(p_moderator_notes, resolution_notes)
  WHERE id = p_report_id;

  PERFORM public.log_admin_action(
    p_reviewer_id,
    'review_report',
    'Revisou denúncia (' || p_status || '): ' || p_action_taken,
    'report',
    p_report_id,
    jsonb_build_object('status', p_status, 'action', p_action_taken)
  );

  RETURN FOUND;
END;
$$;

-- ============================================================
-- 3. admin_dashboard_stats — preserva colunas existentes, soma pending_reports
--    (DROP defensivo: evita erro 42P16 caso a ordem real das colunas
--    ao vivo seja sutilmente diferente do que foi lido via pg_get_viewdef)
-- ============================================================
DROP VIEW IF EXISTS public.admin_dashboard_stats;
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT count(*) FROM auth.users) AS total_users,
  (SELECT count(*) FROM auth.users WHERE users.created_at >= (now() - '1 day'::interval)) AS users_today,
  (SELECT count(*) FROM auth.users WHERE users.created_at >= (now() - '7 days'::interval)) AS users_week,
  (SELECT count(*) FROM public.admin_logs) AS total_logs,
  (SELECT count(*) FROM public.user_punishments WHERE user_punishments.is_active = true) AS active_punishments,
  (SELECT count(*) FROM public.user_reports WHERE user_reports.status = 'pending') AS pending_reports;

-- ============================================================
-- 4. admin_analytics_summary — reconstruída com todos os campos reais
--    (DROP antes: a ordem/nome das colunas mudou, e CREATE OR REPLACE
--    VIEW não permite renomear/reordenar colunas existentes)
-- ============================================================
DROP VIEW IF EXISTS public.admin_analytics_summary;
CREATE OR REPLACE VIEW public.admin_analytics_summary AS
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
  (SELECT count(*) FROM public.user_reports WHERE created_at >= now() - interval '7 days') AS reports_week;

-- ============================================================
-- 5. admin_analytics_top_themes / admin_analytics_top_achievements — novas
-- ============================================================
CREATE OR REPLACE VIEW public.admin_analytics_top_themes AS
SELECT t.theme_name, COUNT(DISTINCT ut.user_id) AS users_using
FROM public.user_themes ut
JOIN public.themes t ON t.theme_key = ut.theme_key
WHERE ut.is_unlocked = true
GROUP BY t.theme_name
ORDER BY users_using DESC;

CREATE OR REPLACE VIEW public.admin_analytics_top_achievements AS
SELECT a.name, COUNT(ua.id) AS unlock_count
FROM public.user_achievements ua
JOIN public.achievements a ON a.id = ua.achievement_id
GROUP BY a.name
ORDER BY unlock_count DESC;

-- ============================================================
-- 6. admin_theme_stats — nova (a original referenciava colunas
--    unlock_type/vip_tier_required que não existem em "themes";
--    o schema real usa "tier")
-- ============================================================
CREATE OR REPLACE VIEW public.admin_theme_stats AS
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
GROUP BY t.id, t.theme_key, t.theme_name, t.description, t.tier, t.rarity, t.is_active;

-- ============================================================
-- 7. Views de fotos — corrige bug profiles.user_id (PK real é "id")
--    e troca reports/moderation_queue (não existem) por user_reports
-- ============================================================
CREATE OR REPLACE VIEW public.admin_all_photos AS
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
JOIN public.users u ON u.id = pp.user_id;

CREATE OR REPLACE VIEW public.admin_recent_photos AS
SELECT * FROM public.admin_all_photos
ORDER BY created_at DESC
LIMIT 100;

CREATE OR REPLACE VIEW public.admin_reported_photos AS
SELECT * FROM public.admin_all_photos
WHERE pending_reports > 0
ORDER BY pending_reports DESC, created_at DESC;

-- ============================================================
-- 7b. admin_user_profile — a view ao vivo só tinha 5 campos
--    (id, email, registered_at, last_sign_in_at, total_warnings);
--    UsersEnhanced.tsx espera nome/avatar/nível/XP/VIP/tema/banido
--    etc. Reconstrói preservando os campos já usados e adiciona
--    o resto a partir de tabelas reais (users, vip_subscriptions,
--    user_themes, posts, user_achievements, user_punishments).
--    DROP antes: a ordem das colunas mudou.
-- ============================================================
DROP VIEW IF EXISTS public.admin_user_profile;
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
  ) AS is_banned
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id;

-- ============================================================
-- 8. Funções de moderação de fotos (corrigidas)
-- ============================================================
CREATE OR REPLACE FUNCTION public.hide_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_admin_action(
    p_admin_id, 'hide_photo', 'Ocultou foto ' || p_photo_type,
    'photo', p_photo_id, jsonb_build_object('reason', p_reason, 'photo_type', p_photo_type)
  );

  IF p_photo_type = 'post' THEN
    UPDATE public.posts SET media_url = NULL, updated_at = NOW() WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM public.profile_photos WHERE id = p_photo_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_admin_action(
    p_admin_id, 'delete_photo', 'Excluiu foto ' || p_photo_type || ' permanentemente',
    'photo', p_photo_id, jsonb_build_object('reason', p_reason, 'photo_type', p_photo_type)
  );

  IF p_photo_type = 'post' THEN
    DELETE FROM public.posts WHERE id = p_photo_id;
  ELSIF p_photo_type = 'profile_photo' THEN
    DELETE FROM public.profile_photos WHERE id = p_photo_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_photo(
  p_photo_id UUID,
  p_photo_type TEXT,
  p_admin_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.log_admin_action(
    p_admin_id, 'approve_photo', 'Aprovou foto ' || p_photo_type,
    'photo', p_photo_id, jsonb_build_object('photo_type', p_photo_type)
  );

  UPDATE public.user_reports
  SET status = 'reviewed', resolution = 'rejected', resolved_by = p_admin_id, resolved_at = NOW(),
      resolution_notes = COALESCE(resolution_notes, 'Conteúdo aprovado pelo administrador')
  WHERE content_type = p_photo_type AND content_id = p_photo_id AND status = 'pending';

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 9. Automação de moderação — cria a tabela de log que faltava e
--    corrige as funções (referenciavam a tabela "reports" fantasma)
-- ============================================================
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

ALTER TABLE public.auto_moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view auto moderation logs" ON public.auto_moderation_logs;
CREATE POLICY "Admins can view auto moderation logs"
  ON public.auto_moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
    )
  );

GRANT SELECT ON public.auto_moderation_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.check_banned_words(p_text TEXT)
RETURNS TABLE(word TEXT, severity TEXT, auto_action TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT bw.word, bw.severity, bw.auto_action
  FROM public.banned_words bw
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
      ELSE 5
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_moderation_rules(
  p_target_type TEXT,
  p_target_id UUID,
  p_content TEXT DEFAULT NULL
) RETURNS TABLE(rule_applied TEXT, action_taken TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule RECORD;
  v_user_id UUID;
  v_report_count INTEGER;
  v_warning_count INTEGER;
  v_banned_word RECORD;
BEGIN
  IF p_content IS NOT NULL THEN
    FOR v_banned_word IN
      SELECT * FROM public.check_banned_words(p_content) WHERE severity IN ('critical', 'high')
    LOOP
      INSERT INTO public.auto_moderation_logs (
        rule_id, rule_name, target_type, target_id, action_taken, trigger_reason, trigger_data
      ) VALUES (
        NULL, 'Palavra proibida detectada', p_target_type, p_target_id,
        v_banned_word.auto_action, 'banned_word',
        jsonb_build_object('word', v_banned_word.word, 'severity', v_banned_word.severity)
      );

      RETURN QUERY SELECT 'Palavra proibida: ' || v_banned_word.word, v_banned_word.auto_action;
    END LOOP;
  END IF;

  IF p_target_type = 'user' THEN
    v_user_id := p_target_id;

    SELECT COUNT(*) INTO v_report_count
    FROM public.user_reports
    WHERE reported_user_id = v_user_id AND resolution = 'approved';

    SELECT COUNT(*) INTO v_warning_count
    FROM public.user_punishments
    WHERE user_id = v_user_id AND punishment_type = 'warning' AND is_active = true;

    FOR v_rule IN
      SELECT * FROM public.moderation_rules
      WHERE is_active = true AND trigger_type = 'report_count'
      ORDER BY priority DESC
    LOOP
      IF (v_rule.trigger_value->>'punishment_type') IS NULL
         AND v_report_count >= (v_rule.trigger_value->>'threshold')::INTEGER THEN
        INSERT INTO public.auto_moderation_logs (
          rule_id, rule_name, target_type, target_id, action_taken, trigger_reason, trigger_data
        ) VALUES (
          v_rule.id, v_rule.name, 'user', v_user_id, v_rule.action_type,
          'report_threshold_exceeded',
          jsonb_build_object('report_count', v_report_count, 'threshold', v_rule.trigger_value->>'threshold')
        );

        RETURN QUERY SELECT v_rule.name, v_rule.action_type;
      END IF;
    END LOOP;
  END IF;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_auto_moderate_post() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.apply_moderation_rules('post', NEW.id, NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_moderate_posts ON public.posts;
CREATE TRIGGER auto_moderate_posts
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_moderate_post();

-- ============================================================
-- FIM — confirme rodando: SELECT 'ok' as status;
-- ============================================================
SELECT 'ok' as status;
