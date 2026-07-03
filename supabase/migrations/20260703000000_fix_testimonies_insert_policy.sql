-- =============================================
-- CORREÇÃO CRÍTICA: Recriar policies de INSERT/UPDATE/DELETE para testimonies
-- Bug: A migration 20251230004607 deletou as policies mas só recriou SELECT
-- =============================================

-- Deletar se existirem (para garantir idempotência)
DROP POLICY IF EXISTS "Users can insert their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Users can update their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Users can delete their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem criar seus depoimentos" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem atualizar seus depoimentos" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem deletar seus depoimentos" ON public.testimonies;

-- Recriar políticas de INSERT/UPDATE/DELETE
CREATE POLICY "Users can insert their own testimonies"
ON public.testimonies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own testimonies"
ON public.testimonies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own testimonies"
ON public.testimonies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
