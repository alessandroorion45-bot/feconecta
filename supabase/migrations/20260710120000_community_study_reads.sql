-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 14 (Extras): Controle de leitura dos estudos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_study_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.community_study_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view study reads" ON public.community_study_reads;
CREATE POLICY "Members can view study reads"
ON public.community_study_reads FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can mark their own read" ON public.community_study_reads;
CREATE POLICY "Users can mark their own read"
ON public.community_study_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_reads_post ON public.community_study_reads (post_id);

SELECT 'ok' as status;
