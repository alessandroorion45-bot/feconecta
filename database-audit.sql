-- ============================================
-- AUDITORIA DO BANCO DE DADOS - REDE DA FÉ
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para verificar a estrutura do banco

-- ============================================
-- 1. LISTAR TODAS AS TABELAS CRIADAS
-- ============================================

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. CONTAR TOTAL DE TABELAS
-- ============================================

SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- ============================================
-- 3. VERIFICAR FOREIGN KEYS (RELACIONAMENTOS)
-- ============================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 4. VERIFICAR ÍNDICES CRIADOS
-- ============================================

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 5. VERIFICAR POLÍTICAS RLS
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 6. VERIFICAR TRIGGERS
-- ============================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 7. VERIFICAR FUNÇÕES CRIADAS
-- ============================================

SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================
-- 8. VERIFICAR EXTENSIONS INSTALADAS
-- ============================================

SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname != 'plpgsql';

-- ============================================
-- 9. ESTRUTURA DETALHADA DAS PRINCIPAIS TABELAS
-- ============================================

-- Tabela PROFILES
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Tabela POSTS
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Tabela PRAYERS
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'prayers'
ORDER BY ordinal_position;

-- Tabela TESTIMONIES
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'testimonies'
ORDER BY ordinal_position;

-- ============================================
-- 10. VERIFICAR CONSTRAINTS (RESTRIÇÕES)
-- ============================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 11. RESUMO POR CATEGORIA
-- ============================================

-- Contagem por módulo
SELECT 'Usuários & Social' as modulo, COUNT(*) as tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'blocked_users', 'friendships', 'friend_requests',
                     'friend_testimonials', 'followers', 'posts', 'post_likes',
                     'post_comments', 'faith_posts')
UNION ALL
SELECT 'Orações', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'prayer%'
UNION ALL
SELECT 'Bíblia', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'bible%'
UNION ALL
SELECT 'Chat & Mensagens', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('messages', 'message_reactions', 'chat_rooms', 'chat_room_members',
                     'chat_room_messages', 'chat_media', 'chat_preferences')
UNION ALL
SELECT 'Comunidades', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%community%' OR table_name LIKE '%church%'
UNION ALL
SELECT 'Gamificação', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('achievements', 'user_achievements', 'challenges',
                     'daily_biblical_challenges', 'daily_challenge_completions',
                     'quiz_questions', 'quiz_user_answers', 'quiz_scores');

-- ============================================
-- 12. TESTE DE INTEGRIDADE
-- ============================================

-- Verificar se todas as tabelas principais existem
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN '✅'
    ELSE '❌'
  END as profiles,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN '✅'
    ELSE '❌'
  END as posts,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayers') THEN '✅'
    ELSE '❌'
  END as prayers,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testimonies') THEN '✅'
    ELSE '❌'
  END as testimonies,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN '✅'
    ELSE '❌'
  END as events,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN '✅'
    ELSE '❌'
  END as messages,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'church_communities') THEN '✅'
    ELSE '❌'
  END as church_communities,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bible_reading_plans') THEN '✅'
    ELSE '❌'
  END as bible_reading_plans;

-- ============================================
-- AUDITORIA COMPLETA!
-- ============================================
