-- CORRIGIR FUNÇÃO get_available_themes
CREATE OR REPLACE FUNCTION public.get_available_themes(p_user_id uuid)
RETURNS TABLE (
  theme_key text,
  theme_name text,
  description text,
  colors jsonb,
  rarity integer,
  tier text,
  is_unlocked boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.theme_key,
    t.theme_name,
    t.description,
    t.colors,
    t.rarity,
    t.tier,
    -- CORRIGIDO: usar CASE ao invés de COALESCE
    CASE
      WHEN t.theme_key = 'default' THEN true
      ELSE COALESCE((SELECT ut.is_unlocked FROM public.user_themes ut WHERE ut.user_id = p_user_id AND ut.theme_key = t.theme_key), false)
    END as is_unlocked,
    COALESCE((SELECT ut.is_active FROM public.user_themes ut WHERE ut.user_id = p_user_id AND ut.theme_key = t.theme_key), false) as is_active
  FROM public.themes t
  ORDER BY CASE WHEN t.theme_key = 'default' THEN 0 ELSE 1 END, t.rarity DESC;
END;
$$;
