-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view their own blocks" 
ON public.blocked_users 
FOR SELECT 
USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Users can block others" 
ON public.blocked_users 
FOR INSERT 
WITH CHECK (auth.uid() = blocker_id AND auth.uid() != blocked_id);

-- Users can unblock
CREATE POLICY "Users can unblock" 
ON public.blocked_users 
FOR DELETE 
USING (auth.uid() = blocker_id);

-- Create index for performance
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  )
$$;

-- Trigger to remove friendship when blocking
CREATE OR REPLACE FUNCTION public.remove_friendship_on_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove friendship
  DELETE FROM friendships 
  WHERE (user_id_1 = LEAST(NEW.blocker_id, NEW.blocked_id) 
    AND user_id_2 = GREATEST(NEW.blocker_id, NEW.blocked_id));
  
  -- Remove pending friend requests
  DELETE FROM friend_requests 
  WHERE (sender_id = NEW.blocker_id AND receiver_id = NEW.blocked_id)
     OR (sender_id = NEW.blocked_id AND receiver_id = NEW.blocker_id);
  
  -- Remove from followers
  DELETE FROM followers 
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_blocked
AFTER INSERT ON public.blocked_users
FOR EACH ROW
EXECUTE FUNCTION public.remove_friendship_on_block();