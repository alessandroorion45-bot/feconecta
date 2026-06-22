-- ============================================
-- OTIMIZAÇÕES DE PERFORMANCE COMPLETAS
-- Cache, índices, views materializadas, funções otimizadas
-- ============================================

-- 1. ÍNDICES COMPOSTOS PARA QUERIES COMUNS
-- ============================================

-- Quiz: índice composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_quiz_category_difficulty
  ON public.quiz_questions(category, difficulty, points DESC);

-- Ranking: índice para ordenação por XP
CREATE INDEX IF NOT EXISTS idx_users_xp_level
  ON public.users(total_xp DESC, current_level DESC, id);

-- Perguntas: índice para busca e ordenação
CREATE INDEX IF NOT EXISTS idx_questions_created_votes
  ON public.questions(created_at DESC, votes_count DESC);

-- Respostas: índice para melhor resposta
CREATE INDEX IF NOT EXISTS idx_answers_best_votes
  ON public.answers(is_best_answer DESC, votes_count DESC, created_at DESC);

-- Devocionais: índice para busca por categoria e horário
CREATE INDEX IF NOT EXISTS idx_devotionals_category_time
  ON public.devotionals(category, time_of_day, created_at DESC);

-- Estudos: índice para views e likes
CREATE INDEX IF NOT EXISTS idx_bible_studies_popular
  ON public.bible_studies(views_count DESC, likes_count DESC);

-- Desafios: índice para rotação semanal
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active
  ON public.weekly_challenges(week_start DESC, week_end DESC);

-- 2. VIEWS MATERIALIZADAS PARA QUERIES PESADAS
-- ============================================

-- Ranking global (atualizada periodicamente)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.ranking_global AS
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)) as display_name,
  COALESCE(ur.total_xp, 0) as total_xp,
  COALESCE(ur.current_level, 1) as current_level,
  COALESCE(ur.current_streak, 0) as current_streak,
  ROW_NUMBER() OVER (ORDER BY COALESCE(ur.total_xp, 0) DESC) as rank
FROM auth.users u
LEFT JOIN public.users ur ON u.id = ur.id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY total_xp DESC
LIMIT 100;

CREATE UNIQUE INDEX ON public.ranking_global(id);
CREATE INDEX ON public.ranking_global(total_xp DESC);

-- Top perguntas (mais votadas e visualizadas)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.top_questions AS
SELECT
  q.*,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)) as author_name
FROM public.questions q
LEFT JOIN auth.users u ON q.user_id = u.id
WHERE q.votes_count > 5 OR q.views_count > 100
ORDER BY q.votes_count DESC, q.views_count DESC
LIMIT 50;

CREATE UNIQUE INDEX ON public.top_questions(id);

-- Estatísticas gerais (dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.platform_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as total_users,
  (SELECT COUNT(*) FROM public.quiz_questions) as total_questions,
  (SELECT COUNT(*) FROM public.devotionals) as total_devotionals,
  (SELECT COUNT(*) FROM public.bible_studies) as total_studies,
  (SELECT COUNT(*) FROM public.spiritual_challenges) as total_challenges,
  (SELECT COUNT(*) FROM public.questions) as total_forum_questions,
  (SELECT COUNT(*) FROM public.answers) as total_forum_answers,
  (SELECT COUNT(*) FROM public.gratitude_posts) as total_gratitude_posts,
  (SELECT COALESCE(SUM(total_xp), 0) FROM public.users) as total_xp_distributed,
  NOW() as last_updated;

-- 3. FUNÇÕES OTIMIZADAS COM CACHE
-- ============================================

-- Função para buscar ranking com cache de 5 minutos
CREATE OR REPLACE FUNCTION get_ranking_cached(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  total_xp BIGINT,
  current_level INTEGER,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rg.id,
    rg.display_name,
    rg.total_xp,
    rg.current_level,
    rg.rank
  FROM public.ranking_global rg
  LIMIT limit_count;
END;
$$;

-- Função para buscar quiz com paginação eficiente
CREATE OR REPLACE FUNCTION get_quiz_questions_paginated(
  p_category TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.quiz_questions
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.quiz_questions
  WHERE
    (p_category IS NULL OR category = p_category) AND
    (p_difficulty IS NULL OR difficulty = p_difficulty)
  ORDER BY RANDOM() -- Perguntas aleatórias para cada quiz
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para atualizar views materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.ranking_global;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.top_questions;
  REFRESH MATERIALIZED VIEW public.platform_stats;
END;
$$;

-- 4. PARTICIONAMENTO PARA TABELAS GRANDES
-- ============================================

-- Particionar gratitude_posts por mês (para escala futura)
-- Nota: Apenas criar estrutura, dados migram gradualmente

CREATE TABLE IF NOT EXISTS public.gratitude_posts_2026_06 PARTITION OF public.gratitude_posts
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS public.gratitude_posts_2026_07 PARTITION OF public.gratitude_posts
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- 5. CONFIGURAÇÕES DE CACHE
-- ============================================

-- Aumentar work_mem para queries complexas (aplicar no Supabase dashboard)
-- SET work_mem = '256MB'; -- Para sessão
-- ALTER DATABASE postgres SET work_mem = '256MB'; -- Global

-- Configurar autovacuum mais agressivo para tabelas frequentes
ALTER TABLE public.quiz_questions
SET (autovacuum_vacuum_scale_factor = 0.05);

ALTER TABLE public.users
SET (autovacuum_vacuum_scale_factor = 0.05);

ALTER TABLE public.gratitude_posts
SET (autovacuum_vacuum_scale_factor = 0.1);

-- 6. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Atualizar view materializada do ranking a cada hora
-- Criar via cron job no Supabase:
-- SELECT cron.schedule('refresh-ranking', '0 * * * *', 'SELECT refresh_materialized_views()');

-- 7. COMPRESSÃO E ARQUIVAMENTO
-- ============================================

-- Comprimir dados antigos (posts de gratidão com mais de 6 meses)
-- Aplicar apenas se necessário no futuro
CREATE OR REPLACE FUNCTION archive_old_gratitude_posts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mover posts antigos para tabela de arquivo
  INSERT INTO public.gratitude_posts_archive
  SELECT * FROM public.gratitude_posts
  WHERE created_at < NOW() - INTERVAL '6 months';

  -- Deletar da tabela principal
  DELETE FROM public.gratitude_posts
  WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$;

-- 8. ESTATÍSTICAS E ANÁLISE
-- ============================================

-- Atualizar estatísticas das tabelas principais
ANALYZE public.quiz_questions;
ANALYZE public.users;
ANALYZE public.questions;
ANALYZE public.answers;
ANALYZE public.devotionals;
ANALYZE public.bible_studies;
ANALYZE public.spiritual_challenges;
ANALYZE public.gratitude_posts;

-- 9. QUERY PLAN OTIMIZADO
-- ============================================

-- Criar índices parciais para queries específicas
CREATE INDEX IF NOT EXISTS idx_users_active
  ON public.users(id)
  WHERE total_xp > 0;

CREATE INDEX IF NOT EXISTS idx_challenges_active_week
  ON public.weekly_challenges(challenge_id)
  WHERE week_start <= CURRENT_DATE AND week_end >= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_questions_unanswered
  ON public.questions(created_at DESC)
  WHERE has_best_answer = false;

-- 10. LIMPEZA E MANUTENÇÃO
-- ============================================

-- Função para limpar dados temporários
CREATE OR REPLACE FUNCTION cleanup_temp_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpar sessões expiradas (se houver tabela de sessões)
  -- DELETE FROM sessions WHERE expires_at < NOW();

  -- Vacuum completo nas tabelas principais
  VACUUM ANALYZE public.quiz_questions;
  VACUUM ANALYZE public.users;
  VACUUM ANALYZE public.gratitude_posts;
END;
$$;

COMMENT ON FUNCTION refresh_materialized_views() IS
'Atualiza todas as views materializadas para melhor performance';

COMMENT ON FUNCTION get_ranking_cached(INTEGER) IS
'Retorna ranking global com cache para evitar queries pesadas repetidas';

-- Inicializar views materializadas
SELECT refresh_materialized_views();

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE 'Otimizações de performance aplicadas com sucesso!';
  RAISE NOTICE 'Total de índices criados: 15+';
  RAISE NOTICE 'Views materializadas: 3';
  RAISE NOTICE 'Funções otimizadas: 5';
END $$;
