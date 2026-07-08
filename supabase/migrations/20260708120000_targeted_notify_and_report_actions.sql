-- ============================================================
-- FASE 11: notificação pra um usuário específico + tipo de aviso
-- visível no sino (info/sucesso/aviso/anúncio, cada um com sua cor).
-- ============================================================

-- 1. admin_notifications ganha campos pra identificar notificação de
--    usuário único (ficam NULL em broadcasts de massa).
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS target_user_id UUID,
  ADD COLUMN IF NOT EXISTS target_user_email TEXT;

-- 2. send_mass_notification: agora grava o tipo escolhido pelo admin
--    (admin_info/admin_success/admin_warning/admin_announcement) em
--    vez de sempre 'admin_notice' fixo — o sino do usuário usa isso
--    pra mostrar ícone/cor diferente por gravidade.
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
  v_total_sent INTEGER;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  INSERT INTO public.admin_notifications (sent_by, sent_by_email, title, message, notification_type, target_audience, sent_at)
  VALUES (p_admin_id, COALESCE(v_admin_email, ''), p_title, p_message, p_notification_type, p_target_audience, NOW())
  RETURNING id INTO v_notification_id;

  WITH targets AS (
    SELECT u.id
    FROM public.users u
    WHERE
      CASE p_target_audience
        WHEN 'active' THEN u.last_active_date >= (NOW() - INTERVAL '30 days')
        WHEN 'new' THEN u.created_at >= (NOW() - INTERVAL '7 days')
        ELSE TRUE
      END
  ),
  inserted AS (
    INSERT INTO public.notifications (user_id, type, content)
    SELECT id, 'admin_' || p_notification_type, p_title || ': ' || p_message
    FROM targets
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_total_sent FROM inserted;

  UPDATE public.admin_notifications SET total_sent = v_total_sent WHERE id = v_notification_id;

  RETURN v_notification_id;
END;
$function$;

-- 3. send_user_notification: manda só pra UMA pessoa (busca no painel).
CREATE OR REPLACE FUNCTION public.send_user_notification(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_id UUID;
  v_admin_email TEXT;
  v_target_email TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;
  SELECT email INTO v_target_email FROM public.users WHERE id = p_target_user_id;

  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Usuário-alvo não encontrado';
  END IF;

  INSERT INTO public.admin_notifications
    (sent_by, sent_by_email, title, message, notification_type, target_audience, target_user_id, target_user_email, total_sent, sent_at)
  VALUES
    (p_admin_id, COALESCE(v_admin_email, ''), p_title, p_message, p_notification_type, 'user', p_target_user_id, v_target_email, 1, NOW())
  RETURNING id INTO v_notification_id;

  INSERT INTO public.notifications (user_id, type, content)
  VALUES (p_target_user_id, 'admin_' || p_notification_type, p_title || ': ' || p_message);

  RETURN v_notification_id;
END;
$function$;

-- 4. admin_notifications_history passa a expor pra quem foi (quando
--    for notificação de usuário único).
DROP VIEW IF EXISTS public.admin_notifications_history;
CREATE VIEW public.admin_notifications_history AS
SELECT * FROM (
  SELECT id, title, message, notification_type, target_audience, total_sent, sent_at, created_at, target_user_email
  FROM public.admin_notifications n
  ORDER BY created_at DESC
) sub
WHERE public.is_admin(auth.uid());

REVOKE ALL ON public.admin_notifications_history FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.admin_notifications_history TO authenticated;

SELECT 'ok' as status;
