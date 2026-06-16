-- Fix chat_rooms RLS policy to allow users to see all rooms for discovery
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON chat_rooms;

CREATE POLICY "Users can view all rooms for discovery" 
ON public.chat_rooms 
FOR SELECT 
USING (true);

-- Create table for testimony comments
CREATE TABLE IF NOT EXISTS public.testimony_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on testimony_comments
ALTER TABLE public.testimony_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for testimony_comments
CREATE POLICY "Testimony comments are visible to everyone" 
ON public.testimony_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create testimony comments" 
ON public.testimony_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their testimony comments" 
ON public.testimony_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add likes_count column to testimonies if not exists
ALTER TABLE public.testimonies 
ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;