-- Corrige o erro "column user_badges.badge_name does not exist".
-- O remoto já está no schema NOVO (catálogo public.badges + user_badges.badge_id),
-- mas várias telas do front ainda assumem o schema ANTIGO (badge_name direto).
-- Esta migração só garante que as tabelas/colunas/seed do schema novo existem —
-- a correção de verdade é no código (ver commit desta mesma data).

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  category VARCHAR(50) NOT NULL DEFAULT 'special',
  unlock_criteria JSONB NOT NULL DEFAULT '{"type":"manual"}',
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS badge_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'special',
  ADD COLUMN IF NOT EXISTS unlock_criteria JSONB DEFAULT '{"type":"manual"}',
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'badges_badge_key_key') THEN
    ALTER TABLE public.badges ADD CONSTRAINT badges_badge_key_key UNIQUE (badge_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON public.badges(rarity);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS badge_id UUID,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_equipped BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_badges_badge_id_fkey'
  ) THEN
    ALTER TABLE public.user_badges
      ADD CONSTRAINT user_badges_badge_id_fkey
      FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_user_badge_key'
  ) THEN
    ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_badge_key UNIQUE (user_id, badge_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_equipped ON public.user_badges(user_id, is_equipped);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges são públicos para leitura" ON public.badges;
CREATE POLICY "Badges são públicos para leitura" ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários veem badges de todos" ON public.user_badges;
CREATE POLICY "Usuários veem badges de todos" ON public.user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem equipar seus badges" ON public.user_badges;
CREATE POLICY "Usuários podem equipar seus badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus badges" ON public.user_badges;
CREATE POLICY "Usuários podem inserir seus badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

INSERT INTO public.badges (badge_key, name, description, icon, rarity, category, unlock_criteria, xp_reward) VALUES
('first_devotional', 'Primeiro Devocional', 'Complete seu primeiro devocional diário', '📖', 'common', 'devotional', '{"type": "action_count", "action": "daily_devotional", "value": 1}', 50),
('devotional_streak_7', 'Semana Devocional', 'Complete devocionais por 7 dias seguidos', '📅', 'rare', 'devotional', '{"type": "streak_action", "action": "daily_devotional", "value": 7}', 100),
('devotional_master', 'Mestre Devocional', 'Complete 100 devocionais', '⭐', 'epic', 'devotional', '{"type": "action_count", "action": "daily_devotional", "value": 100}', 500),
('devotional_legend', 'Lenda Devocional', 'Complete 365 devocionais', '👑', 'legendary', 'devotional', '{"type": "action_count", "action": "daily_devotional", "value": 365}', 2000),
('first_study', 'Estudioso Iniciante', 'Complete seu primeiro estudo bíblico', '📚', 'common', 'study', '{"type": "action_count", "action": "bible_study", "value": 1}', 50),
('study_enthusiast', 'Entusiasta dos Estudos', 'Complete 10 estudos bíblicos', '🎓', 'rare', 'study', '{"type": "action_count", "action": "bible_study", "value": 10}', 200),
('bible_scholar', 'Erudito Bíblico', 'Complete 50 estudos bíblicos', '📖✨', 'epic', 'study', '{"type": "action_count", "action": "bible_study", "value": 50}', 1000),
('theology_doctor', 'Doutor em Teologia', 'Complete 200 estudos bíblicos', '🎖️', 'legendary', 'study', '{"type": "action_count", "action": "bible_study", "value": 200}', 3000),
('fire_starter', 'Iniciando a Chama', 'Mantenha sequência de 3 dias', '🔥', 'common', 'streak', '{"type": "streak", "value": 3}', 50),
('dedicated', 'Dedicado', 'Mantenha sequência de 7 dias', '🔥🔥', 'rare', 'streak', '{"type": "streak", "value": 7}', 100),
('committed', 'Comprometido', 'Mantenha sequência de 30 dias', '🔥🔥🔥', 'epic', 'streak', '{"type": "streak", "value": 30}', 500),
('unstoppable', 'Imparável', 'Mantenha sequência de 100 dias', '👑', 'legendary', 'streak', '{"type": "streak", "value": 100}', 2000),
('eternal_flame', 'Chama Eterna', 'Mantenha sequência de 365 dias', '🏆', 'mythic', 'streak', '{"type": "streak", "value": 365}', 10000),
('quiz_rookie', 'Novato do Quiz', 'Complete seu primeiro quiz', '❓', 'common', 'quiz', '{"type": "action_count", "action": "quiz_completed", "value": 1}', 50),
('quiz_expert', 'Expert do Quiz', 'Acerte 100% em 10 quizzes', '💯', 'rare', 'quiz', '{"type": "action_count", "action": "quiz_perfect", "value": 10}', 300),
('trivia_master', 'Mestre das Trivias', 'Complete 100 quizzes', '🎯', 'epic', 'quiz', '{"type": "action_count", "action": "quiz_completed", "value": 100}', 1000),
('first_testimony', 'Primeiro Testemunho', 'Compartilhe seu primeiro testemunho', '💬', 'common', 'social', '{"type": "action_count", "action": "testimony_shared", "value": 1}', 50),
('prayer_warrior', 'Guerreiro de Oração', 'Interceda por 50 pessoas', '🙏', 'rare', 'social', '{"type": "action_count", "action": "prayer_interceded", "value": 50}', 300),
('community_builder', 'Construtor de Comunidade', 'Faça 100 comentários', '💭', 'rare', 'social', '{"type": "action_count", "action": "comment_posted", "value": 100}', 200),
('evangelist', 'Evangelista Digital', 'Compartilhe 50 conteúdos', '📢', 'epic', 'social', '{"type": "action_count", "action": "worship_shared", "value": 50}', 500),
('xp_100', 'Iniciante', 'Alcance 100 XP', '🌱', 'common', 'level', '{"type": "total_xp", "value": 100}', 0),
('xp_1000', 'Crescente', 'Alcance 1.000 XP', '🌿', 'rare', 'level', '{"type": "total_xp", "value": 1000}', 0),
('xp_10000', 'Avançado', 'Alcance 10.000 XP', '🌳', 'epic', 'level', '{"type": "total_xp", "value": 10000}', 0),
('xp_50000', 'Elite', 'Alcance 50.000 XP', '🎖️', 'legendary', 'level', '{"type": "total_xp", "value": 50000}', 0),
('xp_100000', 'Lendário', 'Alcance 100.000 XP', '👑', 'mythic', 'level', '{"type": "total_xp", "value": 100000}', 0),
('early_adopter', 'Pioneiro', 'Seja um dos primeiros 1000 usuários', '🚀', 'legendary', 'special', '{"type": "manual"}', 1000),
('beta_tester', 'Beta Tester', 'Participe da fase beta', '🧪', 'epic', 'special', '{"type": "manual"}', 500),
('perfect_week', 'Semana Perfeita', 'Complete todas atividades por 7 dias seguidos', '✨', 'epic', 'special', '{"type": "perfect_week"}', 1000),
('night_owl', 'Coruja Noturna', 'Complete 20 devocionais noturnos (22h-6h)', '🦉', 'rare', 'special', '{"type": "time_based", "action": "daily_devotional", "time_range": "22:00-06:00", "value": 20}', 300),
('early_bird', 'Madrugador', 'Complete 20 devocionais matinais (5h-8h)', '🐦', 'rare', 'special', '{"type": "time_based", "action": "daily_devotional", "time_range": "05:00-08:00", "value": 20}', 300),
('daily_streak_7', 'Discípulo Fiel', 'Sequência de 7 dias no desafio bíblico diário', '🌟', 'rare', 'streak', '{"type": "streak_action", "action": "daily_biblical_challenge", "value": 7}', 100),
('daily_streak_21', 'Guerreiro da Fé', 'Sequência de 21 dias no desafio bíblico diário', '⚔️', 'epic', 'streak', '{"type": "streak_action", "action": "daily_biblical_challenge", "value": 21}', 300),
('daily_streak_40', 'Peregrino Consagrado', 'Sequência de 40 dias no desafio bíblico diário', '👑', 'legendary', 'streak', '{"type": "streak_action", "action": "daily_biblical_challenge", "value": 40}', 750)
ON CONFLICT (badge_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
