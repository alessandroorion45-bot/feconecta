-- ============================================================
-- PAINEL ADMIN — FASE 3b: protege warn_user/suspend_user/ban_user/
-- send_mass_notification (rodavam sem checar is_admin — qualquer
-- usuário autenticado podia banir/suspender/advertir outros usuários
-- ou mandar notificação em massa, chamando a RPC direto pelo console).
-- Usa um bloco dinâmico pra derrubar a função pelo nome real
-- encontrado em pg_proc, sem depender de eu adivinhar a ordem exata
-- dos parâmetros (evita o erro 42P13 de novo).
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure::text as sig
    FROM pg_proc
    WHERE proname IN ('warn_user', 'suspend_user', 'ban_user', 'send_mass_notification')
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig;
  END LOOP;
END $$;

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
    'user', p_user_id, jsonb_build_object('reason', p_reason)
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
    'user', p_user_id, jsonb_build_object('reason', p_reason, 'duration_days', p_duration_days)
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
    'user', p_user_id, jsonb_build_object('reason', p_reason)
  );

  RETURN v_punishment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_mass_notification(
  p_admin_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_target_audience TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_id UUID;
  v_admin_email TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  INSERT INTO public.admin_notifications (sent_by, sent_by_email, title, message, notification_type, target_audience, sent_at)
  VALUES (p_admin_id, COALESCE(v_admin_email, ''), p_title, p_message, p_notification_type, p_target_audience, NOW())
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$;

SELECT 'ok' as status;
