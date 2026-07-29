-- ============================================================
-- FIX: RPCs de stats da leitura compartilhada não existiam
-- ============================================================
-- useSharedReading.advanceToNextChapter() chamava
-- increment_chapters_completed() e increment_sessions_hosted(),
-- mas as funções nunca foram criadas → as estatísticas de leitura
-- compartilhada (ranking) nunca eram atualizadas. Criadas agora,
-- fazendo upsert em shared_reading_stats.
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_chapters_completed(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.shared_reading_stats (user_id, total_chapters_completed, updated_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_chapters_completed = public.shared_reading_stats.total_chapters_completed + 1,
    updated_at = now();
$$;

CREATE OR REPLACE FUNCTION public.increment_sessions_hosted(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.shared_reading_stats (user_id, sessions_hosted, updated_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    sessions_hosted = public.shared_reading_stats.sessions_hosted + 1,
    updated_at = now();
$$;

GRANT EXECUTE ON FUNCTION public.increment_chapters_completed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sessions_hosted(uuid) TO authenticated;

SELECT 'ok' AS status;
