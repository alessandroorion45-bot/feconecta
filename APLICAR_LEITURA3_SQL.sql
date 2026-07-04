-- =============================================
-- COMPREENSÕES NO RANKING
-- 1) Coluna book_abbrev nas reflexões (mostrar "ÊX 3" no ranking)
-- 2) Compreensões visíveis para toda a comunidade autenticada
--    (necessário para a seção "Compreensões da Comunidade" no ranking)
-- =============================================

ALTER TABLE public.shared_reading_reflections
  ADD COLUMN IF NOT EXISTS book_abbrev TEXT;

DROP POLICY IF EXISTS "Members can view room reflections" ON public.shared_reading_reflections;
DROP POLICY IF EXISTS "Community can view reflections" ON public.shared_reading_reflections;
CREATE POLICY "Community can view reflections"
ON public.shared_reading_reflections FOR SELECT
USING (auth.uid() IS NOT NULL);
