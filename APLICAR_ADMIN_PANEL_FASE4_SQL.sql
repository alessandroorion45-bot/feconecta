-- ============================================================
-- PAINEL ADMIN — FASE 4: ficha completa do usuário (Etapa 7) +
-- contexto de histórico nas denúncias (Etapa 5, Central de Moderação)
-- ============================================================
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_full_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  SELECT jsonb_build_object(
    'profile', (
      SELECT to_jsonb(p) FROM public.admin_user_profile p WHERE p.id = p_user_id
    ),
    'punishment_history', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', up.id,
        'punishment_type', up.punishment_type,
        'reason', up.reason,
        'issued_at', up.issued_at,
        'expires_at', up.expires_at,
        'is_active', up.is_active,
        'issued_by_email', au.email
      ) ORDER BY up.issued_at DESC), '[]'::jsonb)
      FROM public.user_punishments up
      LEFT JOIN auth.users au ON au.id = up.issued_by
      WHERE up.user_id = p_user_id
    ),
    'reports_received', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ur.id,
        'reason', ur.reason,
        'description', ur.description,
        'status', ur.status,
        'resolution', ur.resolution,
        'content_type', ur.content_type,
        'created_at', ur.created_at,
        'reporter_email', au.email
      ) ORDER BY ur.created_at DESC), '[]'::jsonb)
      FROM public.user_reports ur
      LEFT JOIN auth.users au ON au.id = ur.reporter_id
      WHERE ur.reported_user_id = p_user_id
      LIMIT 20
    ),
    'reports_made_count', (
      SELECT COUNT(*) FROM public.user_reports WHERE reporter_id = p_user_id
    ),
    'recent_posts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'content', LEFT(p.content, 140),
        'created_at', p.created_at,
        'likes_count', p.likes_count
      ) ORDER BY p.created_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM public.posts WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 5) p
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_full_profile(UUID) TO authenticated;

-- ============================================================
-- Denúncias com nome/risco do usuário denunciado embutido
-- (Central de Moderação: dá pra ver o contexto sem abrir outra tela)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_reports_detailed AS
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
ORDER BY ur.created_at DESC;

SELECT 'ok' as status;
