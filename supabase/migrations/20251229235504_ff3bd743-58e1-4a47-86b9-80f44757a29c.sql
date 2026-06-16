-- Create table for verse comments
CREATE TABLE public.verse_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_abbrev TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verse_comments ENABLE ROW LEVEL SECURITY;

-- Public read access for all comments
CREATE POLICY "Verse comments are visible to everyone"
ON public.verse_comments
FOR SELECT
USING (true);

-- Users can create their own comments
CREATE POLICY "Users can create verse comments"
ON public.verse_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own verse comments"
ON public.verse_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own verse comments"
ON public.verse_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Create storage bucket for verse images
INSERT INTO storage.buckets (id, name, public)
VALUES ('verse-images', 'verse-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verse images
CREATE POLICY "Verse images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'verse-images');

CREATE POLICY "Authenticated users can upload verse images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verse-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own verse images"
ON storage.objects FOR DELETE
USING (bucket_id = 'verse-images' AND auth.uid()::text = (storage.foldername(name))[1]);