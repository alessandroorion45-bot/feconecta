-- ============================================================
-- PAINEL ADMIN — FASE 3: segurança server-side + saúde do sistema
-- ============================================================
-- As funções administrativas rodavam como SECURITY DEFINER mas
-- NENHUMA verificava se quem chamou é de fato admin — a única
-- proteção era o hasPermission() do React (client-side, contornável
-- pelo console do navegador chamando supabase.rpc(...) direto).
-- Este script adiciona a checagem is_admin(auth.uid()) dentro de
-- cada função que eu mesmo criei na Fase 1 (hide_photo, delete_photo,
-- approve_photo, review_report).
-- Idempotente: seguro rodar mais de uma vez.
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

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

CREATE OR REPLACE FUNCTION public.review_report(
  p_report_id UUID,
  p_reviewer_id UUID,
  p_status TEXT,
  p_action_taken TEXT,
  p_moderator_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

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
-- Saúde do sistema — função (não view solta) com checagem de admin
-- embutida, para não expor tamanho do banco/contagens a qualquer
-- usuário autenticado.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_system_health()
RETURNS TABLE(
  total_users BIGINT,
  total_posts BIGINT,
  total_photos BIGINT,
  total_reports BIGINT,
  total_admin_logs BIGINT,
  total_activity_logs BIGINT,
  total_comments BIGINT,
  total_prayers BIGINT,
  database_size_bytes BIGINT,
  active_connections INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  RETURN QUERY SELECT
    (SELECT count(*) FROM auth.users),
    (SELECT count(*) FROM public.posts),
    (SELECT count(*) FROM public.profile_photos),
    (SELECT count(*) FROM public.user_reports),
    (SELECT count(*) FROM public.admin_logs),
    (SELECT count(*) FROM public.user_activity_log),
    (SELECT count(*) FROM public.comments),
    (SELECT count(*) FROM public.prayers),
    pg_database_size(current_database()),
    (SELECT count(*)::INTEGER FROM pg_stat_activity WHERE datname = current_database());
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_system_health() TO authenticated;

SELECT 'ok' as status;
