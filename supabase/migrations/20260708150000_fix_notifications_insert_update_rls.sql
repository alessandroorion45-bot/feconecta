-- ============================================================
-- FIX: a tabela public.notifications só tinha a policy de SELECT
-- (recriada na migration 20260708110000). Confirmado via pg_policies
-- que INSERT e UPDATE não tinham NENHUMA policy — RLS nega tudo por
-- padrão quando não existe policy pro comando, então:
--   - Todo insert direto do frontend (seguir alguém, convite de
--     comunidade, remoção de membro, comunidade excluída, tema VIP
--     concedido) estava sendo bloqueado silenciosamente.
--   - "Marcar como lida"/"marcar todas como lidas" (UPDATE) também.
-- As notificações de advertir/suspender/banir só funcionaram porque
-- passam por função SECURITY DEFINER, que ignora RLS.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert notifications as themselves" ON public.notifications;
CREATE POLICY "Users can insert notifications as themselves"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND actor_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

SELECT 'ok' as status;
