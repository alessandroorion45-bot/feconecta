-- =============================================
-- CORREÇÃO: Auto-criar user_stats quando profile é criado
-- Problema: Usuários sem user_stats causam 404 errors
-- =============================================

-- 1. Criar user_stats para usuários que não têm
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

-- 2. Criar função trigger para auto-criar user_stats
CREATE OR REPLACE FUNCTION public.create_user_stats_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar registro em user_stats automaticamente
  INSERT INTO public.user_stats (user_id, total_xp, level, title, current_streak, longest_streak)
  VALUES (
    NEW.id,
    0,
    1,
    'Discípulo',
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Criar registro em user_streaks automaticamente
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
  VALUES (
    NEW.id,
    0,
    0,
    CURRENT_DATE,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Criar trigger que dispara após INSERT em profiles
DROP TRIGGER IF EXISTS trigger_create_user_stats ON public.profiles;

CREATE TRIGGER trigger_create_user_stats
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_stats_on_profile_creation();

-- 4. Comentário
COMMENT ON FUNCTION public.create_user_stats_on_profile_creation() IS
'Trigger function que cria automaticamente user_stats e user_streaks quando um novo perfil é criado';
