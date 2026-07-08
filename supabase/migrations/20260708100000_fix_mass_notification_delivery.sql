-- ============================================================
-- FIX: send_mass_notification() nunca entregava nada de verdade.
-- Só gravava um registro de histórico em admin_notifications (o que
-- aparece na tela "Central de Notificações" do admin) mas nunca
-- inseria nada em public.notifications, que é a tabela que o sino de
-- notificações do usuário final realmente lê (useNotifications.ts).
-- Resultado: toda notificação em massa enviada ficava só visível pro
-- admin, nunca chegava em nenhum usuário.
-- ============================================================

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

  -- Entrega de verdade: insere em public.notifications pra cada usuário
  -- do público-alvo. 'all' = todo mundo; 'active' = mexeu no app nos
  -- últimos 30 dias; 'new' = conta criada nos últimos 7 dias.
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
    SELECT id, 'admin_notice', p_title || ': ' || p_message
    FROM targets
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_total_sent FROM inserted;

  UPDATE public.admin_notifications
  SET total_sent = v_total_sent
  WHERE id = v_notification_id;

  RETURN v_notification_id;
END;
$function$;

SELECT 'ok' as status;
