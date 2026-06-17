-- =====================================================
-- PARTE 2: CRIAR POLÍTICAS RLS
-- =====================================================
-- Execute este SQL DEPOIS da PARTE 1
-- =====================================================

-- POLÍTICAS PARA: avatars
CREATE POLICY "Avatars públicos para leitura" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Upload próprio avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Atualizar próprio avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Deletar próprio avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- POLÍTICAS PARA: photos
CREATE POLICY "Photos públicas para leitura" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos');
CREATE POLICY "Upload próprias photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Atualizar próprias photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Deletar próprias photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- POLÍTICAS PARA: videos
CREATE POLICY "Videos públicos para leitura" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos');
CREATE POLICY "Upload próprios videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Atualizar próprios videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Deletar próprios videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- POLÍTICAS PARA: worship-media
CREATE POLICY "Worship-media público para leitura" ON storage.objects FOR SELECT TO public USING (bucket_id = 'worship-media');
CREATE POLICY "Upload worship-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'worship-media');
CREATE POLICY "Atualizar próprio worship-media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'worship-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Deletar próprio worship-media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'worship-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verificar políticas criadas
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%' OR policyname LIKE '%photo%' OR policyname LIKE '%video%' OR policyname LIKE '%worship%';
