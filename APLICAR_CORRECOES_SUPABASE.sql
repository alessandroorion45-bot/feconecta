-- =============================================
-- SCRIPT DE CORREÇÕES CONSOLIDADO
-- Execute este script no SQL Editor do Supabase
-- Data: 2026-07-03
-- =============================================
-- CORREÇÕES:
-- 1. RLS policies para testimonies (INSERT/UPDATE/DELETE)
-- 2. Auto-criar user_stats quando profile é criado
-- 3. Corrigir função update_user_streak
-- 4. Permitir leitura pública de verse_comments
-- =============================================

-- =============================================
-- 1. TESTIMONIES: Recriar policies de INSERT/UPDATE/DELETE
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Users can update their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Users can delete their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem criar seus depoimentos" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem atualizar seus depoimentos" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem deletar seus depoimentos" ON public.testimonies;

CREATE POLICY "Users can insert their own testimonies"
ON public.testimonies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own testimonies"
ON public.testimonies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own testimonies"
ON public.testimonies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- 2. USER_STATS: Auto-criar para usuários existentes e novos
-- =============================================

-- Criar user_stats para usuários que não têm
INSERT INTO public.user_stats (user_id, total_xp, level, title, current_streak, longest_streak)
SELECT
  p.id as user_id,
  0 as total_xp,
  1 as level,
  'Discípulo' as title,
  0 as current_streak,
  0 as longest_streak
FROM public.profiles p
LEFT JOIN public.user_stats us ON us.user_id = p.id
WHERE us.user_id IS NULL;

-- Criar função trigger para auto-criar user_stats
CREATE OR REPLACE FUNCTION public.create_user_stats_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_xp, level, title, current_streak, longest_streak)
  VALUES (NEW.id, 0, 1, 'Discípulo', 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
  VALUES (NEW.id, 0, 0, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_create_user_stats ON public.profiles;
CREATE TRIGGER trigger_create_user_stats
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_stats_on_profile_creation();

-- =============================================
-- 3. UPDATE_USER_STREAK: Garantir que existe e está acessível
-- =============================================

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
  SELECT last_login_date, current_streak, longest_streak, streak_freeze_available
  INTO v_last_login, v_current_streak, v_longest_streak, v_freeze_available
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, v_today, 1);

    UPDATE public.user_stats
    SET current_streak = 1, longest_streak = 1, last_activity_date = v_today
    WHERE user_id = p_user_id;

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

  ELSIF v_last_login < v_yesterday THEN
    IF v_freeze_available AND (v_today - v_last_login) = 2 THEN
      UPDATE public.user_stats
      SET streak_freeze_available = FALSE, last_streak_freeze_used = v_today
      WHERE user_id = p_user_id;
      v_streak_increased := TRUE;
    ELSE
      v_current_streak := 1;
    END IF;
  END IF;

  UPDATE public.user_streaks
  SET current_streak = v_current_streak, longest_streak = v_longest_streak,
      last_login_date = v_today, total_logins = total_logins + 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.user_stats
  SET current_streak = v_current_streak, longest_streak = v_longest_streak, last_activity_date = v_today
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_streak_increased, v_milestone;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO anon;

-- =============================================
-- 4. VERSE_COMMENTS: Permitir leitura pública
-- =============================================

DROP POLICY IF EXISTS "Users can view non-hidden comments" ON public.verse_comments;

CREATE POLICY "Anyone can view non-hidden comments"
ON public.verse_comments
FOR SELECT
USING (is_hidden = false OR (auth.uid() IS NOT NULL AND user_id = auth.uid()));

-- =============================================
-- FIM - Todas as correções aplicadas!
-- =============================================
