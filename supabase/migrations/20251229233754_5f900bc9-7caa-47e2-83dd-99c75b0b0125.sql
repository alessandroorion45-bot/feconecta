-- Create storage bucket for audio testimonies
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonies-audio', 'testimonies-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for audio bucket
CREATE POLICY "Users can upload their own audio testimonies"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'testimonies-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view audio testimonies"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonies-audio');

CREATE POLICY "Users can delete their own audio testimonies"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'testimonies-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add audio_url column to testimonies table
ALTER TABLE public.testimonies 
ADD COLUMN IF NOT EXISTS audio_url text;