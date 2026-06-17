-- =====================================================
-- SUPABASE STORAGE - CRIAR BUCKETS E POLÍTICAS RLS
-- =====================================================
-- Execute este SQL no painel do Supabase:
-- https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/sql/new
-- =====================================================

-- 1️⃣ CRIAR BUCKETS
-- =====================================================

-- Bucket: avatars (fotos de perfil)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: photos (fotos de perfil dos usuários)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: videos (vídeos dos usuários)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: worship-media (mídia de louvor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'worship-media',
  'worship-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;


-- 2️⃣ POLÍTICAS RLS - BUCKET: avatars
-- =====================================================

-- Política: Qualquer um pode VER avatares (público)
CREATE POLICY "Avatars são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política: Usuários autenticados podem FAZER UPLOAD do próprio avatar
CREATE POLICY "Usuários podem fazer upload do próprio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem ATUALIZAR o próprio avatar
CREATE POLICY "Usuários podem atualizar o próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem DELETAR o próprio avatar
CREATE POLICY "Usuários podem deletar o próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- 3️⃣ POLÍTICAS RLS - BUCKET: photos
-- =====================================================

-- Política: Qualquer um pode VER fotos públicas
CREATE POLICY "Fotos são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Política: Usuários autenticados podem FAZER UPLOAD das próprias fotos
CREATE POLICY "Usuários podem fazer upload das próprias fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem ATUALIZAR as próprias fotos
CREATE POLICY "Usuários podem atualizar as próprias fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem DELETAR as próprias fotos
CREATE POLICY "Usuários podem deletar as próprias fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- 4️⃣ POLÍTICAS RLS - BUCKET: videos
-- =====================================================

-- Política: Qualquer um pode VER vídeos públicos
CREATE POLICY "Vídeos são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Política: Usuários autenticados podem FAZER UPLOAD dos próprios vídeos
CREATE POLICY "Usuários podem fazer upload dos próprios vídeos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem ATUALIZAR os próprios vídeos
CREATE POLICY "Usuários podem atualizar os próprios vídeos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem DELETAR os próprios vídeos
CREATE POLICY "Usuários podem deletar os próprios vídeos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- 5️⃣ POLÍTICAS RLS - BUCKET: worship-media
-- =====================================================

-- Política: Qualquer um pode VER mídia de louvor
CREATE POLICY "Mídia de louvor é pública para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'worship-media');

-- Política: Usuários autenticados podem FAZER UPLOAD de mídia de louvor
CREATE POLICY "Usuários podem fazer upload de mídia de louvor"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'worship-media');

-- Política: Usuários podem ATUALIZAR a própria mídia de louvor
CREATE POLICY "Usuários podem atualizar a própria mídia de louvor"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'worship-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem DELETAR a própria mídia de louvor
CREATE POLICY "Usuários podem deletar a própria mídia de louvor"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'worship-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- =====================================================
-- ✅ VERIFICAÇÃO
-- =====================================================

-- Execute esta query para confirmar que os buckets foram criados:
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('avatars', 'photos', 'videos', 'worship-media');

-- Execute esta query para confirmar que as políticas foram criadas:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%avatar%'
   OR policyname LIKE '%foto%'
   OR policyname LIKE '%video%'
   OR policyname LIKE '%louvor%'
   OR policyname LIKE '%worship%'
ORDER BY policyname;
