-- =============================================
-- STORAGE: garantir TODOS os buckets usados pelo app
-- Erro: "Bucket not found" ao enviar foto da comunidade
-- (e previne o mesmo erro nos demais uploads)
-- =============================================

-- 1. Criar buckets que ainda não existem (não altera os existentes)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('community-photos', 'community-photos', true),
  ('posts', 'posts', true),
  ('chat-media', 'chat-media', true),
  ('worship-media', 'worship-media', true),
  ('audio', 'audio', true),
  ('photos', 'photos', true),
  ('videos', 'videos', true),
  ('verse-images', 'verse-images', true),
  ('testimonies-audio', 'testimonies-audio', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas genéricas para os buckets do app
--    (aditivas — políticas específicas existentes continuam valendo)

DROP POLICY IF EXISTS "App buckets public read" ON storage.objects;
CREATE POLICY "App buckets public read"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('community-photos', 'posts', 'chat-media', 'worship-media',
                'audio', 'photos', 'videos', 'verse-images', 'testimonies-audio')
);

DROP POLICY IF EXISTS "App buckets authenticated upload" ON storage.objects;
CREATE POLICY "App buckets authenticated upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('community-photos', 'posts', 'chat-media', 'worship-media',
                'audio', 'photos', 'videos', 'verse-images', 'testimonies-audio')
);

-- Necessário para uploads com upsert: true (ex.: foto da comunidade)
DROP POLICY IF EXISTS "App buckets authenticated update" ON storage.objects;
CREATE POLICY "App buckets authenticated update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('community-photos', 'posts', 'chat-media', 'worship-media',
                'audio', 'photos', 'videos', 'verse-images', 'testimonies-audio')
);

DROP POLICY IF EXISTS "App buckets owner delete" ON storage.objects;
CREATE POLICY "App buckets owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('community-photos', 'posts', 'chat-media', 'worship-media',
                'audio', 'photos', 'videos', 'verse-images', 'testimonies-audio')
  AND owner = auth.uid()
);
