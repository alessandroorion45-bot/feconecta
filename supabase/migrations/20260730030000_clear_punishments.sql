-- ============================================================
-- Moderação: revogar/perdoar punições de um usuário (admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.clear_user_punishments(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_admin'; END IF;

  UPDATE public.user_punishments
    SET is_active = false
    WHERE user_id = p_user_id AND is_active;

  INSERT INTO public.notifications (user_id, type, content)
  VALUES (p_user_id, 'moderation',
    '🕊️ Suas restrições foram revogadas por um moderador. Bem-vindo(a) de volta — caminhe em paz.');

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.clear_user_punishments(uuid) TO authenticated;

-- Status de punição ativa de vários usuários (pro painel mostrar a tag)
CREATE OR REPLACE FUNCTION public.get_users_punishment_status(p_ids uuid[])
RETURNS TABLE (user_id uuid, punishment_type text, expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT DISTINCT ON (up.user_id) up.user_id, up.punishment_type::text, up.expires_at
  FROM public.user_punishments up
  WHERE up.user_id = ANY(p_ids)
    AND up.is_active
    AND up.punishment_type IN ('ban','suspension')
    AND (up.expires_at IS NULL OR up.expires_at > now())
  ORDER BY up.user_id, (up.punishment_type = 'ban') DESC, up.expires_at DESC NULLS FIRST;
$$;
GRANT EXECUTE ON FUNCTION public.get_users_punishment_status(uuid[]) TO authenticated;

SELECT 'ok' AS status;
