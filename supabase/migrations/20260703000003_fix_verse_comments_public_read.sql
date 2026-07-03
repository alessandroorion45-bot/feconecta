-- =============================================
-- CORREÇÃO: Permitir leitura pública de comentários não-ocultos
-- Problema: 400 error ao carregar comentários (RLS bloqueia usuários não autenticados)
-- =============================================

-- Dropar política antiga que só permitia autenticados
DROP POLICY IF EXISTS "Users can view non-hidden comments" ON public.verse_comments;

-- Criar nova política que permite TODOS (autenticados E anônimos) verem comentários não-ocultos
CREATE POLICY "Anyone can view non-hidden comments"
ON public.verse_comments
FOR SELECT
USING (
  is_hidden = false
  OR
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Comentário
COMMENT ON POLICY "Anyone can view non-hidden comments" ON public.verse_comments IS
'Permite que qualquer pessoa (autenticada ou não) veja comentários não-ocultos. Usuários autenticados podem ver seus próprios comentários mesmo se ocultos.';
