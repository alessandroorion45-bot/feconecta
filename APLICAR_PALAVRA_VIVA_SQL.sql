-- =====================================================
-- PALAVRA VIVA PREMIUM — sessões, ranking, conquistas
-- =====================================================

-- ---------------------------------------------
-- 1. XP da ação "word_search_completed"
-- ---------------------------------------------
INSERT INTO public.action_xp_values (action_key, action_name, xp_value, category, description) VALUES
  ('word_search_completed', 'Caça-Palavras Concluído', 25, 'game', 'Completar um nível do Palavra Viva')
ON CONFLICT (action_key) DO UPDATE SET
  action_name = EXCLUDED.action_name,
  xp_value = EXCLUDED.xp_value,
  description = EXCLUDED.description;

-- ---------------------------------------------
-- 2. Sessão salva (retomar exatamente de onde parou)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_key TEXT NOT NULL DEFAULT 'word_search',
  level INTEGER NOT NULL,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS game_key TEXT DEFAULT 'word_search',
  ADD COLUMN IF NOT EXISTS level INTEGER,
  ADD COLUMN IF NOT EXISTS state JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_sessions_user_game_unique') THEN
    ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_user_game_unique UNIQUE (user_id, game_key);
  END IF;
END $$;

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own game sessions" ON public.game_sessions;
CREATE POLICY "Users manage their own game sessions"
ON public.game_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- 3. Histórico de níveis concluídos (ranking + trilha espiritual)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.word_search_level_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level INTEGER NOT NULL,
  theme_key TEXT,
  theme_label TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 1,
  max_combo INTEGER NOT NULL DEFAULT 1,
  words_found_count INTEGER NOT NULL DEFAULT 0,
  chest_tier TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.word_search_level_completions
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS level INTEGER,
  ADD COLUMN IF NOT EXISTS theme_key TEXT,
  ADD COLUMN IF NOT EXISTS theme_label TEXT,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_combo INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS words_found_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chest_tier TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_wslc_user ON public.word_search_level_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_wslc_completed_at ON public.word_search_level_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_wslc_score ON public.word_search_level_completions(score DESC);

ALTER TABLE public.word_search_level_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Level completions are visible to everyone" ON public.word_search_level_completions;
CREATE POLICY "Level completions are visible to everyone"
ON public.word_search_level_completions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert their own completions" ON public.word_search_level_completions;
CREATE POLICY "Users insert their own completions"
ON public.word_search_level_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- 4. Conquistas do Palavra Viva
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.word_search_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.word_search_achievements
  ADD COLUMN IF NOT EXISTS achievement_key TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'word_search_achievements_key_unique') THEN
    ALTER TABLE public.word_search_achievements ADD CONSTRAINT word_search_achievements_key_unique UNIQUE (achievement_key);
  END IF;
END $$;

ALTER TABLE public.word_search_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements catalog is public" ON public.word_search_achievements;
CREATE POLICY "Achievements catalog is public"
ON public.word_search_achievements FOR SELECT USING (true);

INSERT INTO public.word_search_achievements (achievement_key, name, description, icon, xp_reward) VALUES
  ('first_word', 'Primeiro Acerto', 'Encontre sua primeira palavra bíblica', '🏆', 10),
  ('first_level', 'Explorador da Palavra', 'Complete seu primeiro nível', '📖', 20),
  ('combo_5', 'Sequência de Fé', 'Alcance um combo x5', '🔥', 30),
  ('combo_10', 'Chama Ardente', 'Alcance um combo x10', '🔥', 60),
  ('level_10', 'Caçador Bíblico', 'Alcance o nível 10', '👑', 100),
  ('level_25', 'Guardião das Escrituras', 'Alcance o nível 25', '📜', 250),
  ('words_100', 'Semeador', 'Encontre 100 palavras no total', '🌿', 80),
  ('words_500', 'Mestre do Êxodo', 'Encontre 500 palavras no total', '🌾', 300),
  ('themes_10', 'Peregrino Fiel', 'Complete níveis em 10 temas diferentes', '🗺️', 120),
  ('diamond_chest', 'Tesouro Revelado', 'Abra um baú de diamante', '💎', 150),
  ('covenant_chest', 'Guardião da Aliança', 'Abra um baú da Aliança', '👑', 300)
ON CONFLICT (achievement_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_word_search_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL REFERENCES public.word_search_achievements(achievement_key) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_word_search_achievements
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS achievement_key TEXT,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_wsa_unique') THEN
    ALTER TABLE public.user_word_search_achievements ADD CONSTRAINT user_wsa_unique UNIQUE (user_id, achievement_key);
  END IF;
END $$;

ALTER TABLE public.user_word_search_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view all unlocked achievements" ON public.user_word_search_achievements;
CREATE POLICY "Users view all unlocked achievements"
ON public.user_word_search_achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users unlock their own achievements" ON public.user_word_search_achievements;
CREATE POLICY "Users unlock their own achievements"
ON public.user_word_search_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
