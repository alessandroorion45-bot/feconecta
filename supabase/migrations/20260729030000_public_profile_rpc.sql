-- ============================================================
-- VITRINE DE PERFIL (links compartilhados) — segura
-- ============================================================
-- RPC pública que devolve SÓ campos não-sensíveis de um perfil, para
-- visitantes deslogados verem uma prévia (nome, @, avatar, bio, nível) e
-- serem convidados a criar conta. Respeita is_private (esconde bio/capa).
-- NUNCA expõe birth_date, email, referred_by, cidade, etc.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  cover_image_url text,
  bio text,
  is_private boolean,
  level integer,
  total_points integer,
  current_streak integer,
  member_since timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    CASE WHEN COALESCE(p.is_private, false) THEN NULL ELSE p.cover_image_url END,
    CASE WHEN COALESCE(p.is_private, false) THEN NULL ELSE p.bio END,
    COALESCE(p.is_private, false),
    COALESCE(s.level, 1),
    COALESCE(s.total_points, 0),
    COALESCE(s.current_streak, 0),
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_stats s ON s.user_id = p.id
  WHERE p.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

SELECT 'ok' AS status;
