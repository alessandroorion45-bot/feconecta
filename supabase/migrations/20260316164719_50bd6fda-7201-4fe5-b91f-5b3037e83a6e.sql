
-- Fix notifications INSERT policy: enforce actor_id = auth.uid()
DROP POLICY IF EXISTS "Users receive their own notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications as themselves"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND actor_id = auth.uid()
);
