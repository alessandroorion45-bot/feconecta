-- =====================================================
-- PARTE 1: CRIAR OS 4 BUCKETS
-- =====================================================
-- Execute este SQL PRIMEIRO
-- =====================================================

-- Criar bucket: avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket: photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket: videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket: worship-media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'worship-media',
  'worship-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se os buckets foram criados
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('avatars', 'photos', 'videos', 'worship-media');
