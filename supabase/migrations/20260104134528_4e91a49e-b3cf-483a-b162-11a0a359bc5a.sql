-- Add location column to profile_photos table
ALTER TABLE public.profile_photos 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add index for chronological queries
CREATE INDEX IF NOT EXISTS idx_profile_photos_created_at ON public.profile_photos(user_id, created_at DESC);