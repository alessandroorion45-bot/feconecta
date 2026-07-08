-- ============================================================
-- FIX CRÍTICO: log_admin_action() real no banco só tinha 3 parâmetros
-- (p_admin_id uuid, p_action_type text, p_action_description text) —
-- bem mais simples que o texto de QUALQUER migration antiga sugeria
-- (algumas tinham até 6-7 parâmetros, nunca de fato aplicadas —
-- mesmo padrão de sempre neste projeto: nunca confiar no texto da
-- migration pra saber o que está de fato no banco).
--
-- Toda função administrativa criada nas Fases 1/3/3b chamava
-- log_admin_action com 5-6 argumentos posicionais (incluindo
-- target_type/target_id/jsonb de metadata) — nenhuma bate com a
-- assinatura real de 3 parâmetros. Como nenhuma dessas ações
-- (advertir/suspender/banir/ocultar foto/excluir foto/aprovar foto/
-- revisar denúncia) tinha sido clicada de verdade na UI até agora
-- (só testada via SQL Editor ou nunca exercitada), esse bug ficou
-- escondido — só apareceu quando o admin clicou em "Advertir" de
-- verdade pela primeira vez.
--
-- Correção: log_admin_action ganha target_type/target_id de verdade
-- (a tabela admin_logs já tinha essas colunas, só nunca eram
-- preenchidas), e as 7 funções que a chamam são corrigidas pra
-- passar os argumentos na ordem certa (sem o jsonb de metadata, que
-- não existe como coluna em admin_logs).
-- ============================================================

DROP FUNCTION IF EXISTS public.log_admin_action(uuid, text, text);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  INSERT INTO admin_logs (admin_id, admin_email, action_type, action_description, target_type, target_id)
  VALUES (p_admin_id, COALESCE(v_admin_email, 'unknown'), p_action_type, p_action_description, p_target_type, p_target_id)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$function$;

-- ------------------------------------------------------------
-- Corrige as 7 funções que chamavam log_admin_action errado
-- ------------------------------------------------------------

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
    p_admin_id, 'hide_photo', 'Ocultou foto ' || p_photo_type || COALESCE(': ' || p_reason, ''),
    'photo', p_photo_id
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
    p_admin_id, 'delete_photo', 'Excluiu foto ' || p_photo_type || ' permanentemente' || COALESCE(': ' || p_reason, ''),
    'photo', p_photo_id
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
    'photo', p_photo_id
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
    p_report_id
  );

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.warn_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_punishment_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  INSERT INTO public.user_punishments (user_id, punishment_type, reason, issued_by)
  VALUES (p_user_id, 'warning', p_reason, p_admin_id)
  RETURNING id INTO v_punishment_id;

  PERFORM public.log_admin_action(
    p_admin_id, 'warn_user', 'Advertiu usuário: ' || p_reason,
    'user', p_user_id
  );

  RETURN v_punishment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.suspend_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_duration_days INTEGER DEFAULT 7
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_punishment_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  INSERT INTO public.user_punishments (user_id, punishment_type, reason, issued_by, expires_at)
  VALUES (p_user_id, 'suspension', p_reason, p_admin_id, NOW() + (p_duration_days || ' days')::interval)
  RETURNING id INTO v_punishment_id;

  PERFORM public.log_admin_action(
    p_admin_id, 'suspend_user', 'Suspendeu usuário por ' || p_duration_days || ' dias: ' || p_reason,
    'user', p_user_id
  );

  RETURN v_punishment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ban_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_punishment_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  INSERT INTO public.user_punishments (user_id, punishment_type, reason, issued_by)
  VALUES (p_user_id, 'ban', p_reason, p_admin_id)
  RETURNING id INTO v_punishment_id;

  PERFORM public.log_admin_action(
    p_admin_id, 'ban_user', 'Baniu usuário permanentemente: ' || p_reason,
    'user', p_user_id
  );

  RETURN v_punishment_id;
END;
$function$;

SELECT 'ok' as status;
