-- Create photo albums table
CREATE TABLE public.photo_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID REFERENCES public.profile_photos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add album_id to profile_photos
ALTER TABLE public.profile_photos ADD COLUMN album_id UUID REFERENCES public.photo_albums(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_albums
CREATE POLICY "Users can view their own albums" 
ON public.photo_albums 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends albums" 
ON public.photo_albums 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE (user_id_1 = auth.uid() AND user_id_2 = photo_albums.user_id)
    OR (user_id_2 = auth.uid() AND user_id_1 = photo_albums.user_id)
  )
);

CREATE POLICY "Users can create their own albums" 
ON public.photo_albums 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" 
ON public.photo_albums 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" 
ON public.photo_albums 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_photo_albums_user_id ON public.photo_albums(user_id);
CREATE INDEX idx_profile_photos_album_id ON public.profile_photos(album_id);

-- Trigger for updated_at
CREATE TRIGGER update_photo_albums_updated_at
BEFORE UPDATE ON public.photo_albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();