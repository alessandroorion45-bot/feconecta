-- ============================================================
-- FIX: friend_requests estava com RLS ativado e ZERO políticas
-- (por isso todo pedido de amizade era bloqueado com 403 —
-- "new row violates row-level security policy for table
-- friend_requests"). Restaura as 4 políticas originais.
-- ============================================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
CREATE POLICY "Users can view their own friend requests"
ON public.friend_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friend_requests;
CREATE POLICY "Users can create friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update friend requests they received" ON public.friend_requests;
CREATE POLICY "Users can update friend requests they received"
ON public.friend_requests FOR UPDATE
USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their own friend requests" ON public.friend_requests;
CREATE POLICY "Users can delete their own friend requests"
ON public.friend_requests FOR DELETE
USING (auth.uid() = sender_id);

SELECT 'ok' as status;
