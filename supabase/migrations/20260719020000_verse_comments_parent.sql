-- ============================================================
-- FIX: comentários de versículos quebrados há semanas
-- O código enviava parent_comment_id (respostas em thread), mas a
-- coluna nunca existiu no remoto — todo INSERT falhava em silêncio.
-- (Já aplicado via CLI em 2026-07-19; arquivo mantido pro histórico.)
-- ============================================================

ALTER TABLE public.verse_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
  REFERENCES public.verse_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_verse_comments_parent
  ON public.verse_comments(parent_comment_id);

SELECT 'ok' AS status;
