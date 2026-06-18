-- Migration: Add image optimization fields to profile_photos
-- Created: 2026-06-18
-- Description: Adds thumbnail_url and medium_url columns for optimized images

-- Add new columns to profile_photos table
ALTER TABLE profile_photos
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS medium_url TEXT,
ADD COLUMN IF NOT EXISTS original_size INTEGER,
ADD COLUMN IF NOT EXISTS optimized_size INTEGER,
ADD COLUMN IF NOT EXISTS compression_ratio INTEGER;

-- Add comment
COMMENT ON COLUMN profile_photos.thumbnail_url IS 'URL da versão thumbnail (300x300px WebP)';
COMMENT ON COLUMN profile_photos.medium_url IS 'URL da versão média (800x800px WebP)';
COMMENT ON COLUMN profile_photos.original_size IS 'Tamanho original em bytes';
COMMENT ON COLUMN profile_photos.optimized_size IS 'Tamanho otimizado total em bytes';
COMMENT ON COLUMN profile_photos.compression_ratio IS 'Taxa de compressão em %';

-- Update existing photos to use photo_url as fallback
UPDATE profile_photos
SET thumbnail_url = photo_url,
    medium_url = photo_url
WHERE thumbnail_url IS NULL OR medium_url IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_photos_thumbnail ON profile_photos(thumbnail_url);
CREATE INDEX IF NOT EXISTS idx_profile_photos_medium ON profile_photos(medium_url);

-- Add columns to profiles table for avatar optimization
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_medium_url TEXT,
ADD COLUMN IF NOT EXISTS cover_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS cover_medium_url TEXT;

COMMENT ON COLUMN profiles.avatar_thumbnail_url IS 'URL da versão thumbnail do avatar (150x150px WebP)';
COMMENT ON COLUMN profiles.avatar_medium_url IS 'URL da versão média do avatar (400x400px WebP)';
COMMENT ON COLUMN profiles.cover_thumbnail_url IS 'URL da versão thumbnail da capa (400x150px WebP)';
COMMENT ON COLUMN profiles.cover_medium_url IS 'URL da versão média da capa (1200x400px WebP)';

-- Add columns to user_videos for thumbnail optimization
ALTER TABLE user_videos
ADD COLUMN IF NOT EXISTS thumbnail_medium_url TEXT;

COMMENT ON COLUMN user_videos.thumbnail_medium_url IS 'URL da versão média do thumbnail (800x450px WebP)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Image optimization fields added successfully!';
  RAISE NOTICE '   - profile_photos: thumbnail_url, medium_url, compression stats';
  RAISE NOTICE '   - profiles: avatar & cover optimization fields';
  RAISE NOTICE '   - user_videos: thumbnail optimization';
END $$;
