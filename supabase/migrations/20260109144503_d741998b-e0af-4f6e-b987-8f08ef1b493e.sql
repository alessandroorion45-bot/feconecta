-- Enable realtime for friendships table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- Enable realtime for friend_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;