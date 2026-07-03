-- =============================================
-- DIAGNÓSTICO: Testemunhos não aparecem na listagem
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Verificar policies RLS da tabela testimonies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'testimonies'
ORDER BY cmd, policyname;

-- 2. Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'testimonies';

-- 3. Contar total de testemunhos na tabela
SELECT COUNT(*) as total_testimonies FROM public.testimonies;

-- 4. Listar os últimos 5 testemunhos (verificar se estão sendo gravados)
SELECT
  id,
  user_id,
  title,
  content,
  created_at,
  audio_url
FROM public.testimonies
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar se há filtros/colunas que podem estar bloqueando
-- (ex: is_approved, is_public, status, etc)
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'testimonies'
ORDER BY ordinal_position;

-- 6. Testar SELECT como authenticated user (simular o que o frontend faz)
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário logado
SET LOCAL "request.jwt.claims" = '{"sub": "6644c5e3-4886-4181-967f-b519cfed8538"}';
SELECT
  id,
  title,
  user_id,
  created_at
FROM public.testimonies
ORDER BY created_at DESC
LIMIT 3;
RESET "request.jwt.claims";

-- 7. Verificar se existe Realtime habilitado
SELECT * FROM pg_publication_tables WHERE tablename = 'testimonies';
