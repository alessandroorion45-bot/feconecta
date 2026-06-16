-- Messages indexes for chat performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created 
  ON public.messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read 
  ON public.messages (receiver_id, is_read) WHERE is_read = false;

-- Friendships indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON public.friendships (user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON public.friendships (user_id_2);

-- Friend requests indexes  
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status 
  ON public.friend_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status 
  ON public.friend_requests (sender_id, status);

-- Followers indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers (follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers (following_id);

-- Notifications index
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications (user_id, is_read, created_at DESC);

-- Blocked users indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users (blocked_id);