-- Progresso da meta do mês (compras aprovadas + doações aprovadas do mês
-- corrente) sem expor as compras individuais de outros usuários — a RLS de
-- store_purchases só deixa cada um ver as próprias, então a soma pública
-- precisa ser um SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.get_store_monthly_progress()
RETURNS NUMERIC
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT SUM(amount) FROM public.store_purchases
    WHERE status = 'approved' AND created_at >= date_trunc('month', now())
  ), 0) + COALESCE((
    SELECT SUM(amount) FROM public.donations
    WHERE status = 'approved' AND created_at >= date_trunc('month', now())
  ), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_store_monthly_progress() TO anon, authenticated;

SELECT 'ok' as status;
