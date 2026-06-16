-- Create video_likes table
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create video_comments table
CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_likes
CREATE POLICY "Anyone can view video likes" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like videos" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike videos" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for video_comments
CREATE POLICY "Anyone can view video comments" ON public.video_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment on videos" ON public.video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.video_comments FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON public.video_comments(video_id);

-- Trigger function for video like notifications
CREATE OR REPLACE FUNCTION public.notify_video_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  SELECT user_id INTO video_owner_id FROM user_videos WHERE id = NEW.video_id;
  
  IF video_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (video_owner_id, NEW.user_id, 'video_like', 'curtiu seu vídeo ❤️', NEW.video_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for video comment notifications
CREATE OR REPLACE FUNCTION public.notify_video_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  SELECT user_id INTO video_owner_id FROM user_videos WHERE id = NEW.video_id;
  
  IF video_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (video_owner_id, NEW.user_id, 'video_comment', 'comentou no seu vídeo 💬', NEW.video_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER notify_video_like_trigger
AFTER INSERT ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_video_like();

CREATE TRIGGER notify_video_comment_trigger
AFTER INSERT ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_video_comment();

-- Function to update video likes_count
CREATE OR REPLACE FUNCTION public.update_video_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_video_likes_count_trigger
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();