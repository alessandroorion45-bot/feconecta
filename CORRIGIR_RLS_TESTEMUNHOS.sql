-- =============================================
-- CORREÇÃO: RLS Policies para Testimonies
-- Garante que INSERT funciona E SELECT retorna dados
-- =============================================

-- Dropar policies antigas (idempotente)
DROP POLICY IF EXISTS "Testimonies viewable by authenticated users" ON public.testimonies;
DROP POLICY IF EXISTS "Depoimentos são visíveis para todos" ON public.testimonies;
DROP POLICY IF EXISTS "Anyone can view testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Public can view testimonies" ON public.testimonies;

DROP POLICY IF EXISTS "Users can insert their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem criar seus depoimentos" ON public.testimonies;

DROP POLICY IF EXISTS "Users can update their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem atualizar seus depoimentos" ON public.testimonies;

DROP POLICY IF EXISTS "Users can delete their own testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Usuários podem deletar seus depoimentos" ON public.testimonies;

-- =============================================
-- POLICY DE SELECT: Permitir leitura para authenticated
-- (todos os usuários logados podem ver TODOS os testemunhos)
-- =============================================
CREATE POLICY "Authenticated users can view all testimonies"
ON public.testimonies
FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- POLICY DE INSERT: Usuários podem criar seus próprios testemunhos
-- =============================================
CREATE POLICY "Authenticated users can insert their own testimonies"
ON public.testimonies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- POLICY DE UPDATE: Usuários podem atualizar seus próprios testemunhos
-- =============================================
CREATE POLICY "Users can update their own testimonies"
ON public.testimonies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- POLICY DE DELETE: Usuários podem deletar seus próprios testemunhos
-- =============================================
CREATE POLICY "Users can delete their own testimonies"
ON public.testimonies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- HABILITAR REALTIME para a tabela testimonies
-- =============================================

-- Verificar se já está na publicação
DO $$
BEGIN
  -- Adicionar tabela à publicação do Realtime se não estiver
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'testimonies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonies;
    RAISE NOTICE 'Tabela testimonies adicionada ao Realtime';
  ELSE
    RAISE NOTICE 'Tabela testimonies já está no Realtime';
  END IF;
END $$;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT 'RLS Policies criadas com sucesso!' as status;

SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'testimonies'
ORDER BY cmd, policyname;
