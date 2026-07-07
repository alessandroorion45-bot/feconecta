-- =====================================================
-- CORREÇÃO: Sistema central de gamificação nunca aplicado
-- =====================================================
-- O erro "relation action_xp_values does not exist" ao rodar o SQL do
-- Palavra Viva revelou que a migração 20260622000000_gamification_system
-- NUNCA foi aplicada no remoto — mesmo padrão recorrente do projeto.
-- Isso significa que award_xp() (chamada por TODAS as ações que dão XP
-- no app: devocional, estudo, quiz, testemunho, oração, comentário,
-- streak, desafios) provavelmente falha silenciosamente em produção.
-- Reaplicando tudo de forma defensiva.
-- =====================================================

-- ---------------------------------------------
-- 1. user_stats (garante que a tabela existe) + colunas de XP/streak
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY,
  total_xp INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  title TEXT DEFAULT 'Discípulo',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_available BOOLEAN DEFAULT TRUE,
  last_streak_freeze_used DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User stats são visíveis para todos" ON public.user_stats;
CREATE POLICY "User stats são visíveis para todos"
ON public.user_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sistema pode gerenciar user_stats" ON public.user_stats;
CREATE POLICY "Sistema pode gerenciar user_stats"
ON public.user_stats FOR ALL USING (true);

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Discípulo',
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS streak_freeze_available BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_streak_freeze_used DATE;

CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON public.user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON public.user_stats(level DESC);

-- ---------------------------------------------
-- 2. Catálogo de ações e valores de XP
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.action_xp_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT UNIQUE NOT NULL,
  action_name TEXT NOT NULL,
  xp_value INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.action_xp_values
  ADD COLUMN IF NOT EXISTS action_key TEXT,
  ADD COLUMN IF NOT EXISTS action_name TEXT,
  ADD COLUMN IF NOT EXISTS xp_value INTEGER,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_xp_values_action_key_key') THEN
    ALTER TABLE public.action_xp_values ADD CONSTRAINT action_xp_values_action_key_key UNIQUE (action_key);
  END IF;
END $$;

INSERT INTO public.action_xp_values (action_key, action_name, xp_value, category, description) VALUES
('daily_devotional', 'Devocional Diário', 20, 'devotional', 'Completar devocional diário'),
('bible_study', 'Estudo Bíblico', 30, 'study', 'Completar um estudo bíblico'),
('bible_reading', 'Leitura Bíblica', 15, 'study', 'Ler capítulos da Bíblia'),
('quiz_completed', 'Quiz Completado', 15, 'quiz', 'Completar um quiz'),
('quiz_perfect', 'Quiz 100%', 50, 'quiz', 'Acertar todas as questões do quiz'),
('bible_question_answered', 'Pergunta Bíblica', 10, 'quiz', 'Responder pergunta bíblica'),
('testimony_shared', 'Testemunho Publicado', 25, 'social', 'Compartilhar testemunho'),
('prayer_created', 'Oração Criada', 15, 'social', 'Criar pedido de oração'),
('prayer_interceded', 'Intercessão', 10, 'social', 'Interceder por alguém'),
('gratitude_post', 'Mural de Gratidão', 15, 'social', 'Publicar no mural de gratidão'),
('comment_posted', 'Comentário', 5, 'social', 'Comentar em postagem'),
('worship_favorited', 'Louvor Favoritado', 5, 'social', 'Adicionar louvor aos favoritos'),
('worship_shared', 'Louvor Compartilhado', 10, 'social', 'Compartilhar louvor'),
('daily_login', 'Login Diário', 5, 'daily', 'Fazer login no dia'),
('streak_milestone_7', 'Sequência 7 Dias', 50, 'daily', 'Manter sequência de 7 dias'),
('streak_milestone_30', 'Sequência 30 Dias', 200, 'daily', 'Manter sequência de 30 dias'),
('streak_milestone_100', 'Sequência 100 Dias', 1000, 'daily', 'Manter sequência de 100 dias'),
('streak_milestone_365', 'Sequência 1 Ano', 5000, 'daily', 'Manter sequência de 365 dias'),
('challenge_completed', 'Desafio Completado', 100, 'challenge', 'Completar desafio semanal'),
('achievement_unlocked', 'Conquista Desbloqueada', 0, 'achievement', 'Desbloquear conquista (XP varia)'),
('word_search_completed', 'Caça-Palavras Concluído', 25, 'game', 'Completar um nível do Palavra Viva')
ON CONFLICT (action_key) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  xp_value = EXCLUDED.xp_value,
  description = EXCLUDED.description;

-- ---------------------------------------------
-- 3. Histórico de XP
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.xp_history
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS action_key TEXT,
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON public.xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_action ON public.xp_history(action_key);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON public.xp_history(created_at DESC);

-- ---------------------------------------------
-- 4. Streak diário
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  last_login_date DATE,
  streak_started_at DATE,
  total_logins INTEGER NOT NULL DEFAULT 0,
  streak_protected BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_streaks
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS last_login_date DATE,
  ADD COLUMN IF NOT EXISTS streak_started_at DATE,
  ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_protected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON public.user_streaks(current_streak DESC);

-- ---------------------------------------------
-- 5. Desafios semanais
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  badge_reward TEXT,
  icon TEXT DEFAULT '🎯',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON public.weekly_challenges(is_active, start_date, end_date);

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_challenge_progress
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS current_progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_challenge_progress_unique') THEN
    ALTER TABLE public.user_challenge_progress ADD CONSTRAINT user_challenge_progress_unique UNIQUE (user_id, challenge_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON public.user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_completed ON public.user_challenge_progress(completed);

-- ---------------------------------------------
-- 6. Funções: nível, título, award_xp, streak
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  calculated_level INTEGER;
BEGIN
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
      calculated_level := 20 + FLOOR((xp - 70000) / 5000);
      IF calculated_level > 100 THEN calculated_level := 100; END IF;
  END CASE;
  RETURN calculated_level;
END;
$$;

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
  SELECT xp_value INTO v_xp_value
  FROM public.action_xp_values
  WHERE action_key = p_action_key AND is_active = TRUE;

  IF v_xp_value IS NULL THEN
    RAISE EXCEPTION 'Action key % not found or is inactive', p_action_key;
  END IF;

  SELECT total_xp, level, title
  INTO v_current_xp, v_old_level, v_old_title
  FROM public.user_stats
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, total_xp, level, title)
    VALUES (p_user_id, 0, 1, 'Discípulo');

    v_current_xp := 0;
    v_old_level := 1;
    v_old_title := 'Discípulo';
  END IF;

  v_new_total_xp := COALESCE(v_current_xp, 0) + v_xp_value;
  v_new_level := public.calculate_level_from_xp(v_new_total_xp);
  v_new_title := public.get_title_from_level(v_new_level);
  v_level_changed := v_new_level > COALESCE(v_old_level, 1);

  UPDATE public.user_stats
  SET
    total_xp = v_new_total_xp,
    total_points = v_new_total_xp,
    level = v_new_level,
    title = v_new_title,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.xp_history (user_id, action_key, xp_earned, metadata)
  VALUES (p_user_id, p_action_key, v_xp_value, p_metadata);

  RETURN QUERY SELECT
    v_xp_value,
    v_new_total_xp,
    COALESCE(v_old_level, 1),
    v_new_level,
    v_level_changed,
    COALESCE(v_old_title, 'Discípulo'),
    v_new_title;
END;
$$;

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
  SELECT last_login_date, current_streak, longest_streak
  INTO v_last_login, v_current_streak, v_longest_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  SELECT streak_freeze_available INTO v_freeze_available
  FROM public.user_stats WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, v_today, 1);

    RETURN QUERY SELECT 1, 1, TRUE, NULL::TEXT;
    RETURN;
  END IF;

  IF v_last_login = v_today THEN
    RETURN QUERY SELECT v_current_streak, v_longest_streak, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  IF v_last_login = v_yesterday THEN
    v_current_streak := v_current_streak + 1;
    v_streak_increased := TRUE;

    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

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

  ELSIF v_last_login < v_yesterday THEN
    IF COALESCE(v_freeze_available, TRUE) AND (v_today - v_last_login) = 2 THEN
      UPDATE public.user_stats
      SET streak_freeze_available = FALSE,
          last_streak_freeze_used = v_today
      WHERE user_id = p_user_id;

      v_streak_increased := TRUE;
    ELSE
      v_current_streak := 1;
    END IF;
  END IF;

  UPDATE public.user_streaks
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = v_today,
    total_logins = total_logins + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.user_stats
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_streak_increased, v_milestone;
END;
$$;

-- ---------------------------------------------
-- 7. RLS
-- ---------------------------------------------
ALTER TABLE public.action_xp_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Valores de XP são visíveis para todos" ON public.action_xp_values;
CREATE POLICY "Valores de XP são visíveis para todos"
ON public.action_xp_values FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários veem seu próprio histórico de XP" ON public.xp_history;
CREATE POLICY "Usuários veem seu próprio histórico de XP"
ON public.xp_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode inserir histórico de XP" ON public.xp_history;
CREATE POLICY "Sistema pode inserir histórico de XP"
ON public.xp_history FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Streaks são visíveis para todos" ON public.user_streaks;
CREATE POLICY "Streaks são visíveis para todos"
ON public.user_streaks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio streak" ON public.user_streaks;
CREATE POLICY "Usuários podem atualizar seu próprio streak"
ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode inserir streaks" ON public.user_streaks;
CREATE POLICY "Sistema pode inserir streaks"
ON public.user_streaks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Desafios são visíveis para todos" ON public.weekly_challenges;
CREATE POLICY "Desafios são visíveis para todos"
ON public.weekly_challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários veem seu próprio progresso" ON public.user_challenge_progress;
CREATE POLICY "Usuários veem seu próprio progresso"
ON public.user_challenge_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema pode gerenciar progresso de desafios" ON public.user_challenge_progress;
CREATE POLICY "Sistema pode gerenciar progresso de desafios"
ON public.user_challenge_progress FOR ALL USING (true);

-- ---------------------------------------------
-- 8. Desafios semanais iniciais (se ainda não existir nenhum)
-- ---------------------------------------------
INSERT INTO public.weekly_challenges (title, description, challenge_type, requirement_type, requirement_value, xp_reward, icon, start_date, end_date)
SELECT 'Leia 3 Capítulos', 'Leia 3 capítulos da Bíblia esta semana', 'study', 'count', 3, 50, '📖', NOW(), NOW() + INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.weekly_challenges);

NOTIFY pgrst, 'reload schema';
