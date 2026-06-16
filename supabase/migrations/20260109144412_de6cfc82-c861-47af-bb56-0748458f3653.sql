-- Drop the restrictive policy
DROP POLICY IF EXISTS "Service role only - friendships" ON public.friendships;

-- Create a new policy that allows users to create friendships when accepting friend requests
CREATE POLICY "Users can create friendships from accepted requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (
  -- User must be one of the participants
  (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  AND
  -- There must be an accepted friend request between these users
  EXISTS (
    SELECT 1 FROM public.friend_requests fr
    WHERE (
      (fr.sender_id = user_id_1 AND fr.receiver_id = user_id_2) OR
      (fr.sender_id = user_id_2 AND fr.receiver_id = user_id_1)
    )
    AND fr.receiver_id = auth.uid()
    AND fr.status = 'accepted'
  )
);