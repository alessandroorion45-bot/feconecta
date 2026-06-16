-- Create storage bucket for event media
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-media', 'event-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event media
CREATE POLICY "Anyone can view event media"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-media');

CREATE POLICY "Authenticated users can upload event media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own event media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own event media"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add video_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_url TEXT;