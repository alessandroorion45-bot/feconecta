-- ============================================
-- TESTES DE FUNCIONALIDADE - REDE DA FÉ
-- ============================================
-- Execute este script para testar as principais funcionalidades

-- ============================================
-- IMPORTANTE: CRIAR USUÁRIO DE TESTE PRIMEIRO
-- ============================================
-- Você precisa fazer signup no app para ter um usuário no auth.users
-- Depois pegue o ID do usuário com:
-- SELECT id, email FROM auth.users LIMIT 1;

-- Para este exemplo, vamos usar uma variável
-- SUBSTITUA 'SEU-USER-ID-AQUI' pelo ID real do usuário

-- ============================================
-- 1. TESTE: CRIAR PERFIL
-- ============================================

-- Verificar se perfil foi criado automaticamente após signup
SELECT * FROM profiles LIMIT 1;

-- Se não existir, criar manualmente (SUBSTITUA O ID)
-- INSERT INTO profiles (id, username, full_name)
-- VALUES ('SEU-USER-ID-AQUI', 'usuario_teste', 'Usuário Teste');

-- ============================================
-- 2. TESTE: CRIAR POST
-- ============================================

-- Criar um post de teste
-- INSERT INTO posts (user_id, content, media_type)
-- VALUES ('SEU-USER-ID-AQUI', 'Meu primeiro post de teste! 🙏', NULL);

-- Verificar posts criados
SELECT
  p.id,
  p.content,
  p.likes_count,
  p.created_at,
  pr.full_name as author
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- 3. TESTE: SISTEMA DE LIKES
-- ============================================

-- Curtir um post (SUBSTITUA OS IDs)
-- INSERT INTO post_likes (post_id, user_id)
-- VALUES ('POST-ID-AQUI', 'SEU-USER-ID-AQUI');

-- Verificar likes
SELECT
  pl.id,
  p.content,
  pr.full_name as liked_by,
  pl.created_at
FROM post_likes pl
JOIN posts p ON pl.post_id = p.id
JOIN profiles pr ON pl.user_id = pr.id
LIMIT 5;

-- ============================================
-- 4. TESTE: CRIAR TESTEMUNHO
-- ============================================

-- Criar testemunho
-- INSERT INTO testimonies (user_id, title, content)
-- VALUES ('SEU-USER-ID-AQUI', 'Deus é Fiel!', 'Quero compartilhar como Deus me abençoou...');

-- Listar testemunhos
SELECT
  t.id,
  t.title,
  t.content,
  t.likes_count,
  t.glory_count,
  pr.full_name as author,
  t.created_at
FROM testimonies t
JOIN profiles pr ON t.user_id = pr.id
ORDER BY t.created_at DESC
LIMIT 5;

-- ============================================
-- 5. TESTE: CRIAR PEDIDO DE ORAÇÃO
-- ============================================

-- Criar oração
-- INSERT INTO prayers (user_id, title, description, category)
-- VALUES ('SEU-USER-ID-AQUI', 'Oração pela Família', 'Peço oração pela saúde da minha família', 'familia');

-- Listar orações
SELECT
  p.id,
  p.title,
  p.description,
  p.category,
  p.is_answered,
  p.intercessor_count,
  pr.full_name as author,
  p.created_at
FROM prayers p
JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- 6. TESTE: INTERCEDER POR ORAÇÃO
-- ============================================

-- Interceder (SUBSTITUA OS IDs)
-- INSERT INTO prayer_intercessors (prayer_id, user_id)
-- VALUES ('PRAYER-ID-AQUI', 'SEU-USER-ID-AQUI');

-- Ver quem está intercedendo
SELECT
  p.title as prayer_title,
  pr.full_name as intercessor,
  pi.created_at
FROM prayer_intercessors pi
JOIN prayers p ON pi.prayer_id = p.id
JOIN profiles pr ON pi.user_id = pr.id
LIMIT 5;

-- ============================================
-- 7. TESTE: CRIAR EVENTO
-- ============================================

-- Criar evento
-- INSERT INTO events (user_id, title, description, location, city, country, event_date)
-- VALUES (
--   'SEU-USER-ID-AQUI',
--   'Culto de Ação de Graças',
--   'Culto especial de agradecimento',
--   'Igreja Central',
--   'São Paulo',
--   'Brasil',
--   NOW() + INTERVAL '7 days'
-- );

-- Listar eventos
SELECT
  e.id,
  e.title,
  e.description,
  e.location,
  e.city,
  e.event_date,
  e.participant_count,
  pr.full_name as organizer
FROM events e
JOIN profiles pr ON e.user_id = pr.id
ORDER BY e.event_date
LIMIT 5;

-- ============================================
-- 8. TESTE: ENVIAR MENSAGEM
-- ============================================

-- Enviar mensagem (precisa de 2 usuários)
-- INSERT INTO messages (sender_id, receiver_id, content)
-- VALUES ('SEU-USER-ID-AQUI', 'OUTRO-USER-ID', 'Olá, paz do Senhor!');

-- Ver mensagens
SELECT
  m.id,
  sender.full_name as from_user,
  receiver.full_name as to_user,
  m.content,
  m.is_read,
  m.created_at
FROM messages m
JOIN profiles sender ON m.sender_id = sender.id
JOIN profiles receiver ON m.receiver_id = receiver.id
ORDER BY m.created_at DESC
LIMIT 5;

-- ============================================
-- 9. TESTE: ADICIONAR VERSÍCULO FAVORITO
-- ============================================

-- Adicionar versículo favorito
-- INSERT INTO favorite_verses (user_id, book_name, book_abbrev, chapter, verse_number, verse_text)
-- VALUES (
--   'SEU-USER-ID-AQUI',
--   'João',
--   'jo',
--   3,
--   16,
--   'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...'
-- );

-- Listar versículos favoritos
SELECT
  fv.book_name,
  fv.chapter,
  fv.verse_number,
  fv.verse_text,
  pr.full_name as saved_by,
  fv.created_at
FROM favorite_verses fv
JOIN profiles pr ON fv.user_id = pr.id
ORDER BY fv.created_at DESC
LIMIT 5;

-- ============================================
-- 10. TESTE: CRIAR GRUPO DE ORAÇÃO
-- ============================================

-- Criar grupo
-- INSERT INTO prayer_groups (name, description, category, created_by)
-- VALUES (
--   'Grupo de Oração Matinal',
--   'Orações todos os dias às 6h da manhã',
--   'diario',
--   'SEU-USER-ID-AQUI'
-- );

-- Listar grupos
SELECT
  pg.id,
  pg.name,
  pg.description,
  pg.category,
  pg.member_count,
  pr.full_name as created_by,
  pg.created_at
FROM prayer_groups pg
JOIN profiles pr ON pg.created_by = pr.id
ORDER BY pg.created_at DESC
LIMIT 5;

-- ============================================
-- 11. TESTE: CRIAR COMUNIDADE DE IGREJA
-- ============================================

-- Criar comunidade
-- INSERT INTO church_communities (name, church_name, description, created_by, city, state, country)
-- VALUES (
--   'Igreja Batista Central',
--   'Igreja Batista',
--   'Comunidade da Igreja Batista Central',
--   'SEU-USER-ID-AQUI',
--   'São Paulo',
--   'SP',
--   'Brasil'
-- );

-- Listar comunidades
SELECT
  cc.id,
  cc.name,
  cc.church_name,
  cc.city,
  cc.state,
  cc.member_count,
  pr.full_name as created_by,
  cc.created_at
FROM church_communities cc
JOIN profiles pr ON cc.created_by = pr.id
ORDER BY cc.created_at DESC
LIMIT 5;

-- ============================================
-- 12. TESTE: CRIAR PERGUNTA BÍBLICA
-- ============================================

-- Criar pergunta
-- INSERT INTO bible_questions (user_id, title, body, category, tags)
-- VALUES (
--   'SEU-USER-ID-AQUI',
--   'O que significa ser batizado?',
--   'Gostaria de entender melhor o significado do batismo nas águas.',
--   'doutrina',
--   ARRAY['batismo', 'doutrina', 'sacramento']
-- );

-- Listar perguntas
SELECT
  bq.id,
  bq.title,
  bq.body,
  bq.category,
  bq.tags,
  bq.answers_count,
  bq.likes_count,
  pr.full_name as asked_by,
  bq.created_at
FROM bible_questions bq
JOIN profiles pr ON bq.user_id = pr.id
ORDER BY bq.created_at DESC
LIMIT 5;

-- ============================================
-- 13. TESTE: CRIAR QUIZ BÍBLICO
-- ============================================

-- Adicionar questão de quiz
-- INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty)
-- VALUES (
--   'Quantos livros tem a Bíblia?',
--   '66',
--   '73',
--   '39',
--   '27',
--   'A',
--   'geral',
--   'easy'
-- );

-- Listar questões
SELECT
  id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  category,
  difficulty,
  points
FROM quiz_questions
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 14. TESTE: CRIAR SALA DE LEITURA COMPARTILHADA
-- ============================================

-- Criar sala
-- INSERT INTO shared_reading_rooms (host_id, room_name, room_code, current_book_abbrev, current_chapter)
-- VALUES (
--   'SEU-USER-ID-AQUI',
--   'Leitura de Gênesis',
--   'GEN001',
--   'gn',
--   1
-- );

-- Listar salas
SELECT
  srr.id,
  srr.room_name,
  srr.room_code,
  srr.current_book_abbrev,
  srr.current_chapter,
  srr.status,
  pr.full_name as host,
  srr.created_at
FROM shared_reading_rooms srr
JOIN profiles pr ON srr.host_id = pr.id
ORDER BY srr.created_at DESC
LIMIT 5;

-- ============================================
-- 15. TESTE: VERIFICAR NOTIFICAÇÕES
-- ============================================

-- Criar notificação
-- INSERT INTO notifications (user_id, type, content)
-- VALUES (
--   'SEU-USER-ID-AQUI',
--   'welcome',
--   'Bem-vindo à Rede da Fé! 🙏'
-- );

-- Listar notificações
SELECT
  n.id,
  n.type,
  n.content,
  n.is_read,
  pr.full_name as recipient,
  n.created_at
FROM notifications n
JOIN profiles pr ON n.user_id = pr.id
ORDER BY n.created_at DESC
LIMIT 5;

-- ============================================
-- 16. RESUMO GERAL DOS DADOS
-- ============================================

SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM prayers) as total_prayers,
  (SELECT COUNT(*) FROM testimonies) as total_testimonies,
  (SELECT COUNT(*) FROM events) as total_events,
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM church_communities) as total_communities,
  (SELECT COUNT(*) FROM prayer_groups) as total_prayer_groups,
  (SELECT COUNT(*) FROM bible_questions) as total_questions,
  (SELECT COUNT(*) FROM quiz_questions) as total_quiz_questions;

-- ============================================
-- TESTES COMPLETOS!
-- ============================================
-- Para executar os testes de inserção, descomente as linhas
-- e substitua 'SEU-USER-ID-AQUI' pelo ID real do usuário
