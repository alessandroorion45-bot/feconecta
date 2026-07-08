-- ============================================================
-- FIX: update_user_streak() — mesmo bug de "coluna ambígua" já visto
-- em award_xp() (RETURNS TABLE(current_streak, longest_streak, ...)
-- cria variáveis implícitas que colidem com as colunas reais de
-- user_streaks no SELECT ... INTO). Dispara em TODO login de TODO
-- usuário do app (AuthContext -> useGamification -> updateStreak),
-- não só no admin — achado testando o login com Playwright.
-- ============================================================

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
  SELECT us.last_login_date, us.current_streak, us.longest_streak
  INTO v_last_login, v_current_streak, v_longest_streak
  FROM public.user_streaks us
  WHERE us.user_id = p_user_id;

  SELECT stats.streak_freeze_available INTO v_freeze_available
  FROM public.user_stats stats WHERE stats.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, v_today, 1);

    RETURN QUERY SELECT 1, 1, TRUE, NULL::TEXT;
    RETURN;
  END IF;

  IF v_last_login = v_today THEN
    RETURN QUERY SELECT v_current_streak, v_longest_streak, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  IF v_last_login = v_yesterday THEN
    v_current_streak := v_current_streak + 1;
    v_streak_increased := TRUE;

    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    IF v_current_streak = 7 THEN
      v_milestone := 'streak_milestone_7';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_7');
    ELSIF v_current_streak = 30 THEN
      v_milestone := 'streak_milestone_30';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_30');
    ELSIF v_current_streak = 100 THEN
      v_milestone := 'streak_milestone_100';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_100');
    ELSIF v_current_streak = 365 THEN
      v_milestone := 'streak_milestone_365';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_365');
    END IF;

  ELSIF v_last_login < v_yesterday THEN
    IF COALESCE(v_freeze_available, TRUE) AND (v_today - v_last_login) = 2 THEN
      UPDATE public.user_stats
      SET streak_freeze_available = FALSE,
          last_streak_freeze_used = v_today
      WHERE user_id = p_user_id;

      v_streak_increased := TRUE;
    ELSE
      v_current_streak := 1;
    END IF;
  END IF;

  UPDATE public.user_streaks
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = v_today,
    total_logins = total_logins + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.user_stats
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_streak_increased, v_milestone;
END;
$$;

SELECT 'ok' as status;
