-- =====================================================
-- SUPABASE STORAGE - CRIAR BUCKET "COVERS"
-- =====================================================
-- Execute este SQL no painel do Supabase:
-- https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/sql/new
-- =====================================================

-- 1️⃣ CRIAR BUCKET: covers (capas de perfil)
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- 2️⃣ POLÍTICAS RLS - BUCKET: covers
-- =====================================================

-- Política: Qualquer um pode VER capas de perfil (público)
CREATE POLICY "Capas de perfil são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Política: Usuários autenticados podem FAZER UPLOAD da própria capa
CREATE POLICY "Usuários podem fazer upload da própria capa"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem ATUALIZAR a própria capa
CREATE POLICY "Usuários podem atualizar a própria capa"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem DELETAR a própria capa
CREATE POLICY "Usuários podem deletar a própria capa"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- =====================================================
-- ✅ VERIFICAÇÃO
-- =====================================================

-- Execute esta query para confirmar que o bucket foi criado:
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'covers';

-- Execute esta query para confirmar que as políticas foram criadas:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%capa%'
ORDER BY policyname;
