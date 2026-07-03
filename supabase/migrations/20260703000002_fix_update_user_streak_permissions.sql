-- =============================================
-- CORREÇÃO: Garantir que update_user_streak está acessível
-- Problema: RPC retorna 404 para update_user_streak
-- =============================================

-- 1. Garantir que a função existe (recriar se necessário)
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  streak_increased BOOLEAN,
  milestone_reached TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_login DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_streak_increased BOOLEAN := FALSE;
  v_milestone TEXT := NULL;
  v_freeze_available BOOLEAN;
BEGIN
  -- Obter dados de streak do usuário
  SELECT last_login_date, current_streak, longest_streak, streak_freeze_available
  INTO v_last_login, v_current_streak, v_longest_streak, v_freeze_available
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  -- Se não existe, criar registro
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, v_today, 1);

    -- Atualizar user_stats também
    UPDATE public.user_stats
    SET current_streak = 1, longest_streak = 1, last_activity_date = v_today
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT 1, 1, TRUE, NULL::TEXT;
    RETURN;
  END IF;

  -- Já fez login hoje
  IF v_last_login = v_today THEN
    RETURN QUERY SELECT v_current_streak, v_longest_streak, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- Login consecutivo (ontem)
  IF v_last_login = v_yesterday THEN
    v_current_streak := v_current_streak + 1;
    v_streak_increased := TRUE;

    -- Atualizar longest se necessário
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    -- Verificar milestones e dar XP bônus
    IF v_current_streak = 7 THEN
      v_milestone := 'streak_milestone_7';
      -- Usar PERFORM para chamar award_xp sem retornar valor
      PERFORM public.award_xp(p_user_id, 'streak_milestone_7', NULL::JSONB);
    ELSIF v_current_streak = 30 THEN
      v_milestone := 'streak_milestone_30';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_30', NULL::JSONB);
    ELSIF v_current_streak = 100 THEN
      v_milestone := 'streak_milestone_100';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_100', NULL::JSONB);
    ELSIF v_current_streak = 365 THEN
      v_milestone := 'streak_milestone_365';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_365', NULL::JSONB);
    END IF;

  -- Perdeu o streak (mais de 1 dia sem logar)
  ELSIF v_last_login < v_yesterday THEN
    -- Verificar se pode usar freeze
    IF v_freeze_available AND (v_today - v_last_login) = 2 THEN
      -- Usa o freeze uma vez por mês
      UPDATE public.user_stats
      SET streak_freeze_available = FALSE,
          last_streak_freeze_used = v_today
      WHERE user_id = p_user_id;

      v_streak_increased := TRUE; -- mantém streak
    ELSE
      -- Reinicia streak
      v_current_streak := 1;
    END IF;
  END IF;

  -- Atualizar registro
  UPDATE public.user_streaks
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = v_today,
    total_logins = total_logins + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Também atualizar user_stats para compatibilidade
  UPDATE public.user_stats
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_streak_increased, v_milestone;
END;
$$;

-- 2. Garantir permissões públicas para a função
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO anon;

-- 3. Comentário
COMMENT ON FUNCTION public.update_user_streak(UUID) IS
'Atualiza o streak diário do usuário e retorna informações sobre milestones';
