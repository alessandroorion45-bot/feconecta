-- Create table for photo likes
CREATE TABLE IF NOT EXISTS public.photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.profile_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable RLS
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view photo likes"
ON public.photo_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like photos"
ON public.photo_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.photo_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update likes count on profile_photos
CREATE OR REPLACE FUNCTION public.update_photo_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profile_photos SET likes_count = likes_count + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profile_photos SET likes_count = likes_count - 1 WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER update_photo_likes_count_trigger
AFTER INSERT OR DELETE ON public.photo_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_photo_likes_count();