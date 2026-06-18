-- =============================================
-- FIX: Restaurar políticas RLS para tabela prayers
-- =============================================
-- Problema: A migração de segurança anterior removeu as políticas
-- de INSERT, UPDATE e DELETE, causando erro ao criar orações.
-- Esta migração restaura todas as políticas necessárias.

-- DROP das policies existentes para recriar do zero
DROP POLICY IF EXISTS "Prayers viewable by authenticated community members" ON public.prayers;
DROP POLICY IF EXISTS "Usuários podem criar suas orações" ON public.prayers;
DROP POLICY IF EXISTS "Usuários podem atualizar suas orações" ON public.prayers;
DROP POLICY IF EXISTS "Usuários podem deletar suas orações" ON public.prayers;

-- SELECT: Orações visíveis para usuários autenticados
CREATE POLICY "Prayers viewable by authenticated users"
ON public.prayers
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Usuários podem criar suas próprias orações
CREATE POLICY "Users can create prayers"
ON public.prayers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários podem atualizar apenas suas próprias orações
CREATE POLICY "Users can update own prayers"
ON public.prayers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar apenas suas próprias orações
CREATE POLICY "Users can delete own prayers"
ON public.prayers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
