-- ============================================
-- SISTEMA CENTRAL DE GAMIFICAÇÃO
-- Migração: Sistema unificado de XP, Níveis, Streaks e Desafios
-- Data: 2026-06-22
-- ============================================

-- 1. ADICIONAR CAMPOS À TABELA user_stats
-- Adiciona XP total e título ao sistema existente
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Discípulo',
ADD COLUMN IF NOT EXISTS streak_freeze_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_streak_freeze_used DATE;

-- Criar índice para XP (usado no ranking)
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON public.user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON public.user_stats(level DESC);

-- ============================================
-- 2. TABELA DE AÇÕES E VALORES DE XP
-- Define quanto XP cada ação ganha
-- ============================================
CREATE TABLE IF NOT EXISTS public.action_xp_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT UNIQUE NOT NULL,
  action_name TEXT NOT NULL,
  xp_value INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'devotional', 'study', 'quiz', 'social', 'daily'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir valores de XP para todas as ações
INSERT INTO public.action_xp_values (action_key, action_name, xp_value, category, description) VALUES
-- Devocional
('daily_devotional', 'Devocional Diário', 20, 'devotional', 'Completar devocional diário'),
('bible_study', 'Estudo Bíblico', 30, 'study', 'Completar um estudo bíblico'),
('bible_reading', 'Leitura Bíblica', 15, 'study', 'Ler capítulos da Bíblia'),

-- Quiz e Perguntas
('quiz_completed', 'Quiz Completado', 15, 'quiz', 'Completar um quiz'),
('quiz_perfect', 'Quiz 100%', 50, 'quiz', 'Acertar todas as questões do quiz'),
('bible_question_answered', 'Pergunta Bíblica', 10, 'quiz', 'Responder pergunta bíblica'),

-- Social
('testimony_shared', 'Testemunho Publicado', 25, 'social', 'Compartilhar testemunho'),
('prayer_created', 'Oração Criada', 15, 'social', 'Criar pedido de oração'),
('prayer_interceded', 'Intercessão', 10, 'social', 'Interceder por alguém'),
('gratitude_post', 'Mural de Gratidão', 15, 'social', 'Publicar no mural de gratidão'),
('comment_posted', 'Comentário', 5, 'social', 'Comentar em postagem'),

-- Louvores
('worship_favorited', 'Louvor Favoritado', 5, 'social', 'Adicionar louvor aos favoritos'),
('worship_shared', 'Louvor Compartilhado', 10, 'social', 'Compartilhar louvor'),

-- Diário
('daily_login', 'Login Diário', 5, 'daily', 'Fazer login no dia'),
('streak_milestone_7', 'Sequência 7 Dias', 50, 'daily', 'Manter sequência de 7 dias'),
('streak_milestone_30', 'Sequência 30 Dias', 200, 'daily', 'Manter sequência de 30 dias'),
('streak_milestone_100', 'Sequência 100 Dias', 1000, 'daily', 'Manter sequência de 100 dias'),
('streak_milestone_365', 'Sequência 1 Ano', 5000, 'daily', 'Manter sequência de 365 dias'),

-- Desafios
('challenge_completed', 'Desafio Completado', 100, 'challenge', 'Completar desafio semanal'),
('achievement_unlocked', 'Conquista Desbloqueada', 0, 'achievement', 'Desbloquear conquista (XP varia)')
ON CONFLICT (action_key) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  xp_value = EXCLUDED.xp_value,
  description = EXCLUDED.description;

-- ============================================
-- 3. TABELA DE HISTÓRICO DE XP
-- Registra todas as vezes que um usuário ganhou XP
-- ============================================
CREATE TABLE IF NOT EXISTS public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  metadata JSONB, -- dados extras (quiz_id, devotional_id, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON public.xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_action ON public.xp_history(action_key);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON public.xp_history(created_at DESC);

-- ============================================
-- 4. TABELA DE STREAK TRACKING
-- Rastreia sequência diária de cada usuário
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  last_login_date DATE,
  streak_started_at DATE,
  total_logins INTEGER NOT NULL DEFAULT 0,
  streak_protected BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON public.user_streaks(current_streak DESC);

-- ============================================
-- 5. TABELA DE DESAFIOS SEMANAIS
-- Desafios que mudam toda semana
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'devotional', 'quiz', 'study', 'social'
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'complete'
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  badge_reward TEXT,
  icon TEXT DEFAULT '🎯',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para desafios ativos
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON public.weekly_challenges(is_active, start_date, end_date);

-- ============================================
-- 6. TABELA DE PROGRESSO EM DESAFIOS
-- Rastreia o progresso do usuário nos desafios
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON public.user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_completed ON public.user_challenge_progress(completed);

-- ============================================
-- 7. FUNÇÃO: CALCULAR NÍVEL BASEADO NO XP
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  calculated_level INTEGER;
BEGIN
  -- Fórmula progressiva de XP por nível
  -- Nível 1 = 0 XP
  -- Nível 2 = 100 XP
  -- Nível 3 = 250 XP
  -- Nível 4 = 500 XP
  -- Nível 5 = 1000 XP
  -- E assim por diante, dobrando a cada 5 níveis

  CASE
    WHEN xp < 100 THEN calculated_level := 1;
    WHEN xp < 250 THEN calculated_level := 2;
    WHEN xp < 500 THEN calculated_level := 3;
    WHEN xp < 1000 THEN calculated_level := 4;
    WHEN xp < 1750 THEN calculated_level := 5;
    WHEN xp < 2750 THEN calculated_level := 6;
    WHEN xp < 4000 THEN calculated_level := 7;
    WHEN xp < 5500 THEN calculated_level := 8;
    WHEN xp < 7500 THEN calculated_level := 9;
    WHEN xp < 10000 THEN calculated_level := 10;
    WHEN xp < 13000 THEN calculated_level := 11;
    WHEN xp < 16500 THEN calculated_level := 12;
    WHEN xp < 20500 THEN calculated_level := 13;
    WHEN xp < 25000 THEN calculated_level := 14;
    WHEN xp < 30000 THEN calculated_level := 15;
    WHEN xp < 36000 THEN calculated_level := 16;
    WHEN xp < 43000 THEN calculated_level := 17;
    WHEN xp < 51000 THEN calculated_level := 18;
    WHEN xp < 60000 THEN calculated_level := 19;
    WHEN xp < 70000 THEN calculated_level := 20;
    ELSE
      -- Acima do nível 20, usa fórmula logarítmica
      calculated_level := 20 + FLOOR((xp - 70000) / 5000);
      IF calculated_level > 100 THEN calculated_level := 100; END IF;
  END CASE;

  RETURN calculated_level;
END;
$$;

-- ============================================
-- 8. FUNÇÃO: OBTER TÍTULO BASEADO NO NÍVEL
-- ============================================
CREATE OR REPLACE FUNCTION public.get_title_from_level(lvl INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE
    WHEN lvl >= 91 THEN 'Lenda da Fé'
    WHEN lvl >= 71 THEN 'Mestre da Palavra'
    WHEN lvl >= 51 THEN 'Pastor Digital'
    WHEN lvl >= 41 THEN 'Missionário'
    WHEN lvl >= 31 THEN 'Obreiro'
    WHEN lvl >= 21 THEN 'Evangelista'
    WHEN lvl >= 11 THEN 'Servo'
    ELSE 'Discípulo'
  END;
END;
$$;

-- ============================================
-- 9. FUNÇÃO CENTRAL: AWARD XP
-- Esta é a função principal que tudo chama
-- ============================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_action_key TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  xp_earned INTEGER,
  total_xp INTEGER,
  old_level INTEGER,
  new_level INTEGER,
  level_up BOOLEAN,
  old_title TEXT,
  new_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_value INTEGER;
  v_current_xp INTEGER;
  v_new_total_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_old_title TEXT;
  v_new_title TEXT;
  v_level_changed BOOLEAN;
BEGIN
  -- 1. Obter o valor de XP da ação
  SELECT xp_value INTO v_xp_value
  FROM public.action_xp_values
  WHERE action_key = p_action_key AND is_active = TRUE;

  IF v_xp_value IS NULL THEN
    RAISE EXCEPTION 'Action key % not found or is inactive', p_action_key;
  END IF;

  -- 2. Obter XP e nível atuais do usuário
  SELECT total_xp, level, title
  INTO v_current_xp, v_old_level, v_old_title
  FROM public.user_stats
  WHERE user_id = p_user_id;

  -- Se usuário não tem stats ainda, criar
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, total_xp, level, title)
    VALUES (p_user_id, 0, 1, 'Discípulo');

    v_current_xp := 0;
    v_old_level := 1;
    v_old_title := 'Discípulo';
  END IF;

  -- 3. Calcular novo total de XP
  v_new_total_xp := v_current_xp + v_xp_value;

  -- 4. Calcular novo nível
  v_new_level := public.calculate_level_from_xp(v_new_total_xp);
  v_new_title := public.get_title_from_level(v_new_level);
  v_level_changed := v_new_level > v_old_level;

  -- 5. Atualizar user_stats
  UPDATE public.user_stats
  SET
    total_xp = v_new_total_xp,
    total_points = v_new_total_xp, -- manter compatibilidade
    level = v_new_level,
    title = v_new_title,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 6. Registrar no histórico
  INSERT INTO public.xp_history (user_id, action_key, xp_earned, metadata)
  VALUES (p_user_id, p_action_key, v_xp_value, p_metadata);

  -- 7. Retornar resultados
  RETURN QUERY SELECT
    v_xp_value,
    v_new_total_xp,
    v_old_level,
    v_new_level,
    v_level_changed,
    v_old_title,
    v_new_title;
END;
$$;

-- ============================================
-- 10. FUNÇÃO: ATUALIZAR STREAK
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  streak_increased BOOLEAN,
  milestone_reached TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_last_login DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_streak_increased BOOLEAN := FALSE;
  v_milestone TEXT := NULL;
  v_freeze_available BOOLEAN;
BEGIN
  -- Obter dados de streak do usuário
  SELECT last_login_date, current_streak, longest_streak, streak_freeze_available
  INTO v_last_login, v_current_streak, v_longest_streak, v_freeze_available
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  -- Se não existe, criar registro
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, v_today, 1);

    RETURN QUERY SELECT 1, 1, TRUE, NULL::TEXT;
    RETURN;
  END IF;

  -- Já fez login hoje
  IF v_last_login = v_today THEN
    RETURN QUERY SELECT v_current_streak, v_longest_streak, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- Login consecutivo (ontem)
  IF v_last_login = v_yesterday THEN
    v_current_streak := v_current_streak + 1;
    v_streak_increased := TRUE;

    -- Atualizar longest se necessário
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    -- Verificar milestones e dar XP bônus
    IF v_current_streak = 7 THEN
      v_milestone := 'streak_milestone_7';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_7');
    ELSIF v_current_streak = 30 THEN
      v_milestone := 'streak_milestone_30';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_30');
    ELSIF v_current_streak = 100 THEN
      v_milestone := 'streak_milestone_100';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_100');
    ELSIF v_current_streak = 365 THEN
      v_milestone := 'streak_milestone_365';
      PERFORM public.award_xp(p_user_id, 'streak_milestone_365');
    END IF;

  -- Perdeu o streak (mais de 1 dia sem logar)
  ELSIF v_last_login < v_yesterday THEN
    -- Verificar se pode usar freeze
    IF v_freeze_available AND (v_today - v_last_login) = 2 THEN
      -- Usa o freeze uma vez por mês
      UPDATE public.user_stats
      SET streak_freeze_available = FALSE,
          last_streak_freeze_used = v_today
      WHERE user_id = p_user_id;

      v_streak_increased := TRUE; -- mantém streak
    ELSE
      -- Reinicia streak
      v_current_streak := 1;
    END IF;
  END IF;

  -- Atualizar registro
  UPDATE public.user_streaks
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = v_today,
    total_logins = total_logins + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Também atualizar user_stats para compatibilidade
  UPDATE public.user_stats
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_streak_increased, v_milestone;
END;
$$;

-- ============================================
-- 11. ENABLE RLS
-- ============================================
ALTER TABLE public.action_xp_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. RLS POLICIES
-- ============================================

-- action_xp_values - todos podem ler
CREATE POLICY "Valores de XP são visíveis para todos"
ON public.action_xp_values FOR SELECT
USING (true);

-- xp_history - usuário vê apenas seu histórico
CREATE POLICY "Usuários veem seu próprio histórico de XP"
ON public.xp_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir histórico de XP"
ON public.xp_history FOR INSERT
WITH CHECK (true); -- função SECURITY DEFINER já controla

-- user_streaks - todos podem ver, apenas dono atualiza
CREATE POLICY "Streaks são visíveis para todos"
ON public.user_streaks FOR SELECT
USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio streak"
ON public.user_streaks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir streaks"
ON public.user_streaks FOR INSERT
WITH CHECK (true);

-- weekly_challenges - todos podem ler
CREATE POLICY "Desafios são visíveis para todos"
ON public.weekly_challenges FOR SELECT
USING (true);

-- user_challenge_progress - usuário vê apenas seu progresso
CREATE POLICY "Usuários veem seu próprio progresso"
ON public.user_challenge_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode gerenciar progresso de desafios"
ON public.user_challenge_progress FOR ALL
USING (true);

-- ============================================
-- 13. TRIGGER: RESETAR FREEZE MENSAL
-- ============================================
CREATE OR REPLACE FUNCTION public.reset_monthly_streak_freeze()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Resetar freeze para usuários que usaram há mais de 30 dias
  UPDATE public.user_stats
  SET streak_freeze_available = TRUE
  WHERE streak_freeze_available = FALSE
    AND last_streak_freeze_used < CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- ============================================
-- 14. INSERIR DESAFIOS SEMANAIS INICIAIS
-- ============================================
INSERT INTO public.weekly_challenges (title, description, challenge_type, requirement_type, requirement_value, xp_reward, icon, start_date, end_date) VALUES
('Leia 3 Capítulos', 'Leia 3 capítulos da Bíblia esta semana', 'study', 'count', 3, 50, '📖', NOW(), NOW() + INTERVAL '7 days'),
('Complete 2 Quizzes', 'Complete 2 quizzes bíblicos esta semana', 'quiz', 'count', 2, 80, '🎯', NOW(), NOW() + INTERVAL '7 days'),
('Sequência de 5 Dias', 'Mantenha uma sequência de 5 dias consecutivos', 'daily', 'streak', 5, 150, '🔥', NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.action_xp_values IS 'Define quanto XP cada ação do app concede';
COMMENT ON TABLE public.xp_history IS 'Histórico completo de todos os XP ganhos por cada usuário';
COMMENT ON TABLE public.user_streaks IS 'Rastreamento de sequências diárias de atividade';
COMMENT ON TABLE public.weekly_challenges IS 'Desafios semanais disponíveis para os usuários';
COMMENT ON TABLE public.user_challenge_progress IS 'Progresso individual de cada usuário nos desafios';
COMMENT ON FUNCTION public.award_xp IS 'Função central para dar XP - chamada por todas as ações do app';
COMMENT ON FUNCTION public.update_user_streak IS 'Atualiza streak do usuário e concede XP bônus em milestones';
