-- Add new profile fields for church role and ministries
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS church_role TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ministries TEXT[] DEFAULT '{}';

-- Create chat_media table for storing media in chat messages
CREATE TABLE public.chat_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video')),
  media_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_media ENABLE ROW LEVEL SECURITY;

-- Policies for chat_media
CREATE POLICY "Users can view media in their conversations"
ON public.chat_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id = chat_media.message_id 
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can upload media"
ON public.chat_media FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
ON public.chat_media FOR DELETE
USING (auth.uid() = user_id);

-- Create profile_photos table for user photo posts
CREATE TABLE public.profile_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends', 'custom')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Policies for profile_photos
CREATE POLICY "Public photos are visible to all"
ON public.profile_photos FOR SELECT
USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Friends can see friends-only photos"
ON public.profile_photos FOR SELECT
USING (
  visibility = 'friends' AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE (user_id_1 = auth.uid() AND user_id_2 = profile_photos.user_id)
         OR (user_id_2 = auth.uid() AND user_id_1 = profile_photos.user_id)
    )
  )
);

CREATE POLICY "Users can create their own photos"
ON public.profile_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
ON public.profile_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
ON public.profile_photos FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-media bucket
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);