-- ============================================================
-- SELOS KINGDOM — Experiência Premium
-- Função só de leitura (aditiva) pro card "Progresso da missão":
-- números reais agregados, nada fabricado. Mesmo padrão de
-- get_store_monthly_progress() já usado na Kingdom Store.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_kingdom_mission_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT jsonb_build_object(
    'estudos_realizados', COALESCE((SELECT SUM(bible_chapters_read) FROM public.user_stats), 0),
    'oracoes_enviadas', COALESCE((SELECT SUM(prayers_created) + SUM(prayers_interceded) FROM public.user_stats), 0),
    'presentes_compartilhados', COALESCE((SELECT COUNT(*) FROM public.store_purchases WHERE gift_to IS NOT NULL AND status = 'approved'), 0),
    'testemunhos_compartilhados', COALESCE((SELECT SUM(testimonies_shared) FROM public.user_stats), 0),
    'membros_ativos', COALESCE((SELECT COUNT(*) FROM public.profiles), 0)
  );
$function$;

GRANT EXECUTE ON FUNCTION public.get_kingdom_mission_stats() TO authenticated, anon;

SELECT public.get_kingdom_mission_stats() AS preview;
