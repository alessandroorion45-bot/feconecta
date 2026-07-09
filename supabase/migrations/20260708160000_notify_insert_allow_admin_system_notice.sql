-- ============================================================
-- FIX: a policy de INSERT em notifications criada em 20260708150000
-- exige actor_id = auth.uid() — certo pra ações sociais (seguir,
-- convite, remoção de membro), mas quebra avisos "oficiais" onde o
-- admin não quer aparecer com o próprio perfil pessoal (ex: tema VIP
-- concedido deve aparecer como "Equipe Aliança", não com o nome/foto
-- de qual admin especificamente clicou em conceder).
-- Permite actor_id NULL quando quem está inserindo é admin.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert notifications as themselves" ON public.notifications;
CREATE POLICY "Users can insert notifications as themselves"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    actor_id = auth.uid()
    OR (actor_id IS NULL AND public.is_admin(auth.uid()))
  )
);

SELECT 'ok' as status;
