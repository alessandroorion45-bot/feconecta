-- Add audio_url to prayers table for audio prayers
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add is_featured column to highlight popular prayers
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_prayers_intercessor_count ON public.prayers(intercessor_count DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON public.prayers(created_at DESC);