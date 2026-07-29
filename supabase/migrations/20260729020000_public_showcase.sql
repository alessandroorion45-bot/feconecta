-- ============================================================
-- VITRINE PÚBLICA (marketing) — sem dados sensíveis
-- ============================================================
-- Como profiles ficou privado (só logados) para proteger PII, criamos
-- views que expõem APENAS dados públicos e não-sensíveis (nome, @, avatar
-- e stats de gamificação) para visitantes deslogados verem o ranking e a
-- comunidade viva. NUNCA inclui birth_date, referred_by, email, etc.
-- ============================================================

-- Perfil público enxuto (id, @, nome, avatar) — nada sensível
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
  SELECT id AS user_id, username, full_name, avatar_url
  FROM public.profiles;

-- Ranking/vitrine: perfil público + stats de gamificação (não-sensíveis)
CREATE OR REPLACE VIEW public.public_leaderboard
WITH (security_invoker = false) AS
  SELECT
    p.id AS user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    COALESCE(s.total_points, 0)        AS total_points,
    COALESCE(s.level, 1)               AS level,
    COALESCE(s.current_streak, 0)      AS current_streak,
    COALESCE(s.bible_chapters_read, 0) AS bible_chapters_read,
    COALESCE(s.testimonies_shared, 0)  AS testimonies_shared,
    COALESCE(s.prayers_created, 0)     AS prayers_created
  FROM public.profiles p
  LEFT JOIN public.user_stats s ON s.user_id = p.id;

GRANT SELECT ON public.public_profiles   TO anon, authenticated;
GRANT SELECT ON public.public_leaderboard TO anon, authenticated;

SELECT 'ok' AS status;
