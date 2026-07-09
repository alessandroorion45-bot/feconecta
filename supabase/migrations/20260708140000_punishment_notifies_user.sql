-- ============================================================
-- FIX: advertir/suspender/banir gravava a punição e o log de admin,
-- mas nunca avisava a própria pessoa via notificação — ela só
-- descobria a advertência se checasse o perfil manualmente.
-- ============================================================

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

  INSERT INTO public.notifications (user_id, type, content)
  VALUES (p_user_id, 'admin_warning', 'Você recebeu uma advertência da moderação: ' || p_reason);

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

  INSERT INTO public.notifications (user_id, type, content)
  VALUES (p_user_id, 'admin_suspend', 'Sua conta foi suspensa por ' || p_duration_days || ' dias: ' || p_reason);

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

  INSERT INTO public.notifications (user_id, type, content)
  VALUES (p_user_id, 'admin_ban', 'Sua conta foi banida permanentemente: ' || p_reason);

  RETURN v_punishment_id;
END;
$function$;

SELECT 'ok' as status;
