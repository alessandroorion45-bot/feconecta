-- ============================================================
-- PAINEL ADMIN — FASE 5: sistema antifraude
-- ============================================================
-- Sem rastreamento de IP/dispositivo no app (não existe em lugar
-- nenhum hoje), então os sinais aqui são baseados em padrões reais
-- já disponíveis: picos de cadastro (comportamento típico de bot/
-- cadastro em massa) e contas novas que já nascem com risco alto
-- (denúncias/punições nas primeiras horas de vida).
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_admin_fraud_signals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  SELECT jsonb_build_object(
    -- Picos de cadastro: horas (últimos 7 dias) com 5+ contas novas
    'signup_bursts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'hour', hour_bucket,
        'count', signup_count
      ) ORDER BY hour_bucket DESC), '[]'::jsonb)
      FROM (
        SELECT date_trunc('hour', created_at) AS hour_bucket, COUNT(*) AS signup_count
        FROM auth.users
        WHERE created_at >= now() - interval '7 days'
        GROUP BY 1
        HAVING COUNT(*) >= 5
      ) bursts
    ),
    -- Contas com menos de 48h que já têm denúncia aprovada ou punição
    'young_risky_accounts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', pu.full_name,
        'created_at', u.created_at,
        'hours_old', ROUND(EXTRACT(EPOCH FROM (now() - u.created_at)) / 3600),
        'reports_count', (SELECT COUNT(*) FROM public.user_reports ur WHERE ur.reported_user_id = u.id),
        'punishments_count', (SELECT COUNT(*) FROM public.user_punishments up WHERE up.user_id = u.id)
      ) ORDER BY u.created_at DESC), '[]'::jsonb)
      FROM auth.users u
      LEFT JOIN public.users pu ON pu.id = u.id
      WHERE u.created_at >= now() - interval '48 hours'
        AND (
          EXISTS (SELECT 1 FROM public.user_reports ur WHERE ur.reported_user_id = u.id)
          OR EXISTS (SELECT 1 FROM public.user_punishments up WHERE up.user_id = u.id)
        )
      LIMIT 20
    ),
    -- Contas com mesmo nome completo (indício de cadastro duplicado/bot)
    'duplicate_names', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'full_name', full_name,
        'count', name_count
      ) ORDER BY name_count DESC), '[]'::jsonb)
      FROM (
        SELECT full_name, COUNT(*) AS name_count
        FROM public.users
        WHERE full_name IS NOT NULL AND full_name != ''
        GROUP BY full_name
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) dups
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_fraud_signals() TO authenticated;

SELECT 'ok' as status;
