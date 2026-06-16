-- Create photo_comments table
CREATE TABLE IF NOT EXISTS public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.profile_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add location column to user_videos if not exists
ALTER TABLE public.user_videos 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Enable RLS on photo_comments
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for photo_comments
CREATE POLICY "Anyone can view photo comments" 
ON public.photo_comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.photo_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.photo_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON public.photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_created_at ON public.user_videos(user_id, created_at DESC);

-- Create trigger function for photo comment notifications
CREATE OR REPLACE FUNCTION public.notify_photo_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_owner_id uuid;
BEGIN
  SELECT user_id INTO photo_owner_id
  FROM profile_photos WHERE id = NEW.photo_id;
  
  IF photo_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      photo_owner_id,
      NEW.user_id,
      'photo_comment',
      'comentou na sua foto 💬',
      NEW.photo_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER notify_photo_comment_trigger
AFTER INSERT ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_photo_comment();