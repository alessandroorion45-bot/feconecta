-- ============================================================
-- FIX: award_xp() retornava erro 42702 "column reference total_xp
-- is ambiguous" — a função tem RETURNS TABLE(..., total_xp, ...),
-- e esse nome de coluna do retorno virou uma variável implícita
-- dentro da função, colidindo com a coluna total_xp da tabela
-- user_stats no SELECT ... INTO. Basta qualificar com o alias "us".
-- ============================================================

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_action_key TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  xp_earned INTEGER,
  total_xp INTEGER,
  old_level INTEGER,
  new_level INTEGER,
  level_up BOOLEAN,
  old_title TEXT,
  new_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_value INTEGER;
  v_current_xp INTEGER;
  v_new_total_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_old_title TEXT;
  v_new_title TEXT;
  v_level_changed BOOLEAN;
BEGIN
  SELECT xp_value INTO v_xp_value
  FROM public.action_xp_values
  WHERE action_key = p_action_key AND is_active = TRUE;

  IF v_xp_value IS NULL THEN
    RAISE EXCEPTION 'Action key % not found or is inactive', p_action_key;
  END IF;

  SELECT us.total_xp, us.level, us.title
  INTO v_current_xp, v_old_level, v_old_title
  FROM public.user_stats us
  WHERE us.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, total_xp, level, title)
    VALUES (p_user_id, 0, 1, 'Discípulo');

    v_current_xp := 0;
    v_old_level := 1;
    v_old_title := 'Discípulo';
  END IF;

  v_new_total_xp := COALESCE(v_current_xp, 0) + v_xp_value;
  v_new_level := public.calculate_level_from_xp(v_new_total_xp);
  v_new_title := public.get_title_from_level(v_new_level);
  v_level_changed := v_new_level > COALESCE(v_old_level, 1);

  UPDATE public.user_stats
  SET
    total_xp = v_new_total_xp,
    total_points = v_new_total_xp,
    level = v_new_level,
    title = v_new_title,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.xp_history (user_id, action_key, xp_earned, metadata)
  VALUES (p_user_id, p_action_key, v_xp_value, p_metadata);

  RETURN QUERY SELECT
    v_xp_value,
    v_new_total_xp,
    COALESCE(v_old_level, 1),
    v_new_level,
    v_level_changed,
    COALESCE(v_old_title, 'Discípulo'),
    v_new_title;
END;
$$;
