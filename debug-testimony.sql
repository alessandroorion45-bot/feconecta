-- Script para debugar problemas com testemunhos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela testimonies existe e suas colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'testimonies'
ORDER BY ordinal_position;

-- 2. Verificar as políticas RLS ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'testimonies';

-- 3. Verificar se o RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'testimonies';

-- 4. Verificar perfil do usuário atual (substitua pelo email do usuário)
SELECT p.id, p.username, p.full_name, p.avatar_url, a.email
FROM profiles p
JOIN auth.users a ON a.id = p.id
WHERE a.email = 'alessandroibama40@gmail.com';

-- 5. Verificar últimos testemunhos criados
SELECT id, user_id, title, content, created_at
FROM testimonies
ORDER BY created_at DESC
LIMIT 5;

-- 6. Testar inserção manual (ATENÇÃO: Substitua USER_ID_AQUI pelo ID do usuário)
-- INSERT INTO testimonies (user_id, title, content)
-- VALUES ('USER_ID_AQUI', 'Teste de inserção', 'Testando se consigo inserir');

-- 7. Verificar se há triggers que podem estar bloqueando
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'testimonies';
