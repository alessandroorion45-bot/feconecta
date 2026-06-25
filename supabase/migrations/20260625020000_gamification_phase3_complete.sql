-- ============================================
-- FASE 3: GAMIFICAÇÃO COMPLETA
-- Badges, Desafios Diários, Leaderboards, Recompensas
-- ============================================

-- ============================================
-- 1. SISTEMA DE BADGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji ou URL de ícone
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  category VARCHAR(50) NOT NULL, -- 'devotional', 'social', 'streak', 'special'
  unlock_criteria JSONB NOT NULL, -- { type: 'xp', value: 1000 } ou { type: 'action_count', action: 'daily_devotional', value: 30 }
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON public.badges(rarity);

-- Tabela de badges desbloqueados pelos usuários
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT FALSE, -- badge principal mostrado no perfil
  UNIQUE(user_id, badge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_equipped ON public.user_badges(user_id, is_equipped);

-- RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges são públicos para leitura"
  ON public.badges FOR SELECT USING (true);

CREATE POLICY "Usuários veem badges de todos"
  ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "Usuários podem equipar seus badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. INSERIR BADGES
-- ============================================

INSERT INTO public.badges (badge_key, name, description, icon, rarity, category, unlock_criteria, xp_reward) VALUES

-- DEVOTIONAL BADGES
('first_devotional', 'Primeiro Devocional', 'Complete seu primeiro devocional diário', '📖', 'common', 'devotional',
 '{"type": "action_count", "action": "daily_devotional", "value": 1}', 50),

('devotional_streak_7', 'Semana Devocional', 'Complete devocionais por 7 dias seguidos', '📅', 'rare', 'devotional',
 '{"type": "streak_action", "action": "daily_devotional", "value": 7}', 100),

('devotional_master', 'Mestre Devocional', 'Complete 100 devocionais', '⭐', 'epic', 'devotional',
 '{"type": "action_count", "action": "daily_devotional", "value": 100}', 500),

('devotional_legend', 'Lenda Devocional', 'Complete 365 devocionais', '👑', 'legendary', 'devotional',
 '{"type": "action_count", "action": "daily_devotional", "value": 365}', 2000),

-- STUDY BADGES
('first_study', 'Estudioso Iniciante', 'Complete seu primeiro estudo bíblico', '📚', 'common', 'study',
 '{"type": "action_count", "action": "bible_study", "value": 1}', 50),

('study_enthusiast', 'Entusiasta dos Estudos', 'Complete 10 estudos bíblicos', '🎓', 'rare', 'study',
 '{"type": "action_count", "action": "bible_study", "value": 10}', 200),

('bible_scholar', 'Erudito Bíblico', 'Complete 50 estudos bíblicos', '📖✨', 'epic', 'study',
 '{"type": "action_count", "action": "bible_study", "value": 50}', 1000),

('theology_doctor', 'Doutor em Teologia', 'Complete 200 estudos bíblicos', '🎖️', 'legendary', 'study',
 '{"type": "action_count", "action": "bible_study", "value": 200}', 3000),

-- STREAK BADGES
('fire_starter', 'Iniciando a Chama', 'Mantenha sequência de 3 dias', '🔥', 'common', 'streak',
 '{"type": "streak", "value": 3}', 50),

('dedicated', 'Dedicado', 'Mantenha sequência de 7 dias', '🔥🔥', 'rare', 'streak',
 '{"type": "streak", "value": 7}', 100),

('committed', 'Comprometido', 'Mantenha sequência de 30 dias', '🔥🔥🔥', 'epic', 'streak',
 '{"type": "streak", "value": 30}', 500),

('unstoppable', 'Imparável', 'Mantenha sequência de 100 dias', '👑', 'legendary', 'streak',
 '{"type": "streak", "value": 100}', 2000),

('eternal_flame', 'Chama Eterna', 'Mantenha sequência de 365 dias', '🏆', 'mythic', 'streak',
 '{"type": "streak", "value": 365}', 10000),

-- QUIZ BADGES
('quiz_rookie', 'Novato do Quiz', 'Complete seu primeiro quiz', '❓', 'common', 'quiz',
 '{"type": "action_count", "action": "quiz_completed", "value": 1}', 50),

('quiz_expert', 'Expert do Quiz', 'Acerte 100% em 10 quizzes', '💯', 'rare', 'quiz',
 '{"type": "action_count", "action": "quiz_perfect", "value": 10}', 300),

('trivia_master', 'Mestre das Trivias', 'Complete 100 quizzes', '🎯', 'epic', 'quiz',
 '{"type": "action_count", "action": "quiz_completed", "value": 100}', 1000),

-- SOCIAL BADGES
('first_testimony', 'Primeiro Testemunho', 'Compartilhe seu primeiro testemunho', '💬', 'common', 'social',
 '{"type": "action_count", "action": "testimony_shared", "value": 1}', 50),

('prayer_warrior', 'Guerreiro de Oração', 'Interceda por 50 pessoas', '🙏', 'rare', 'social',
 '{"type": "action_count", "action": "prayer_interceded", "value": 50}', 300),

('community_builder', 'Construtor de Comunidade', 'Faça 100 comentários', '💭', 'rare', 'social',
 '{"type": "action_count", "action": "comment_posted", "value": 100}', 200),

('evangelist', 'Evangelista Digital', 'Compartilhe 50 conteúdos', '📢', 'epic', 'social',
 '{"type": "action_count", "action": "worship_shared", "value": 50}', 500),

-- XP BADGES
('xp_100', 'Iniciante', 'Alcance 100 XP', '🌱', 'common', 'level',
 '{"type": "total_xp", "value": 100}', 0),

('xp_1000', 'Crescente', 'Alcance 1.000 XP', '🌿', 'rare', 'level',
 '{"type": "total_xp", "value": 1000}', 0),

('xp_10000', 'Avançado', 'Alcance 10.000 XP', '🌳', 'epic', 'level',
 '{"type": "total_xp", "value": 10000}', 0),

('xp_50000', 'Elite', 'Alcance 50.000 XP', '🎖️', 'legendary', 'level',
 '{"type": "total_xp", "value": 50000}', 0),

('xp_100000', 'Lendário', 'Alcance 100.000 XP', '👑', 'mythic', 'level',
 '{"type": "total_xp", "value": 100000}', 0),

-- SPECIAL BADGES
('early_adopter', 'Pioneiro', 'Seja um dos primeiros 1000 usuários', '🚀', 'legendary', 'special',
 '{"type": "manual"}', 1000),

('beta_tester', 'Beta Tester', 'Participe da fase beta', '🧪', 'epic', 'special',
 '{"type": "manual"}', 500),

('perfect_week', 'Semana Perfeita', 'Complete todas atividades por 7 dias seguidos', '✨', 'epic', 'special',
 '{"type": "perfect_week"}', 1000),

('night_owl', 'Coruja Noturna', 'Complete 20 devocionais noturnos (22h-6h)', '🦉', 'rare', 'special',
 '{"type": "time_based", "action": "daily_devotional", "time_range": "22:00-06:00", "value": 20}', 300),

('early_bird', 'Madrugador', 'Complete 20 devocionais matinais (5h-8h)', '🐦', 'rare', 'special',
 '{"type": "time_based", "action": "daily_devotional", "time_range": "05:00-08:00", "value": 20}', 300);

-- ============================================
-- 3. DESAFIOS DIÁRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  challenges JSONB NOT NULL, -- array de 3 desafios do dia
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date DESC);

-- Tabela de progresso dos usuários nos desafios diários
CREATE TABLE IF NOT EXISTS public.user_daily_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  challenge_index INTEGER NOT NULL, -- 0, 1 ou 2 (índice no array de challenges)
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_date, challenge_index)
);

CREATE INDEX IF NOT EXISTS idx_daily_challenge_progress_user ON public.user_daily_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_progress_date ON public.user_daily_challenge_progress(challenge_date);

-- RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Desafios diários são públicos"
  ON public.daily_challenges FOR SELECT USING (true);

CREATE POLICY "Usuários veem seu próprio progresso"
  ON public.user_daily_challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu progresso"
  ON public.user_daily_challenge_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. LEADERBOARDS
-- ============================================

-- Tabela de snapshots do leaderboard (salvo diariamente)
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  leaderboard_type VARCHAR(50) NOT NULL, -- 'xp', 'streak', 'weekly', 'monthly'
  rankings JSONB NOT NULL, -- array de { user_id, rank, score, username, avatar }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date, leaderboard_type)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date ON public.leaderboard_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_type ON public.leaderboard_snapshots(leaderboard_type);

-- RLS
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboards são públicos"
  ON public.leaderboard_snapshots FOR SELECT USING (true);

-- ============================================
-- 5. SISTEMA DE RECOMPENSAS AUTOMÁTICAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reward_type VARCHAR(50) NOT NULL, -- 'xp_boost', 'badge', 'title', 'theme', 'special'
  reward_value JSONB NOT NULL, -- depende do tipo
  trigger_type VARCHAR(50) NOT NULL, -- 'level_up', 'streak_milestone', 'achievement', 'manual'
  trigger_condition JSONB, -- condições específicas
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de recompensas recebidas
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- algumas recompensas expiram
  UNIQUE(user_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_claimed ON public.user_rewards(claimed);

-- RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recompensas são públicas"
  ON public.rewards FOR SELECT USING (true);

CREATE POLICY "Usuários veem suas recompensas"
  ON public.user_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem claim recompensas"
  ON public.user_rewards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. INSERIR RECOMPENSAS AUTOMÁTICAS
-- ============================================

INSERT INTO public.rewards (reward_key, name, description, reward_type, reward_value, trigger_type, trigger_condition) VALUES

-- Recompensas por Level Up
('level_5_reward', 'Recompensa Nível 5', 'Parabéns por alcançar o nível 5!', 'xp_boost',
 '{"multiplier": 1.2, "duration_hours": 24}', 'level_up', '{"level": 5}'),

('level_10_reward', 'Recompensa Nível 10', 'Você é agora um Servo! Bônus de XP por 48h', 'xp_boost',
 '{"multiplier": 1.5, "duration_hours": 48}', 'level_up', '{"level": 10}'),

('level_20_reward', 'Recompensa Nível 20', 'Evangelista! Badge especial + XP boost', 'badge',
 '{"badge_key": "level_20_master"}', 'level_up', '{"level": 20}'),

('level_50_reward', 'Recompensa Nível 50', 'Pastor Digital! Título especial + tema exclusivo', 'theme',
 '{"theme_key": "divine_gold"}', 'level_up', '{"level": 50}'),

-- Recompensas por Streak
('streak_30_reward', 'Mês Completo!', '30 dias de sequência! XP boost por uma semana', 'xp_boost',
 '{"multiplier": 2.0, "duration_hours": 168}', 'streak_milestone', '{"streak": 30}'),

('streak_100_reward', 'Centenário!', '100 dias! Badge lendário + tema especial', 'badge',
 '{"badge_key": "unstoppable"}', 'streak_milestone', '{"streak": 100}'),

('streak_365_reward', 'Um Ano!', '365 dias! Título exclusivo "Fiel" + badge mítico', 'title',
 '{"title": "Fiel 🏆", "badge_key": "eternal_flame"}', 'streak_milestone', '{"streak": 365}');

-- ============================================
-- 7. FUNÇÕES HELPER
-- ============================================

-- Função para verificar e desbloquear badges automaticamente
CREATE OR REPLACE FUNCTION check_and_unlock_badges(p_user_id UUID)
RETURNS TABLE(new_badges_count INTEGER) AS $$
DECLARE
  v_total_xp INTEGER;
  v_current_streak INTEGER;
  v_badges_unlocked INTEGER := 0;
BEGIN
  -- Buscar stats do usuário
  SELECT total_xp, current_streak INTO v_total_xp, v_current_streak
  FROM user_stats
  WHERE user_id = p_user_id;

  -- Verificar badges de XP
  INSERT INTO user_badges (user_id, badge_id)
  SELECT p_user_id, id
  FROM badges
  WHERE rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')
    AND (unlock_criteria->>'type') = 'total_xp'
    AND (unlock_criteria->>'value')::INTEGER <= v_total_xp
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = p_user_id AND ub.badge_id = badges.id
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_badges_unlocked = ROW_COUNT;

  -- Verificar badges de streak
  INSERT INTO user_badges (user_id, badge_id)
  SELECT p_user_id, id
  FROM badges
  WHERE (unlock_criteria->>'type') = 'streak'
    AND (unlock_criteria->>'value')::INTEGER <= v_current_streak
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = p_user_id AND ub.badge_id = badges.id
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_badges_unlocked = v_badges_unlocked + ROW_COUNT;

  -- Verificar badges de action_count
  INSERT INTO user_badges (user_id, badge_id)
  SELECT p_user_id, b.id
  FROM badges b
  WHERE (b.unlock_criteria->>'type') = 'action_count'
    AND (
      SELECT COUNT(*) FROM xp_history
      WHERE user_id = p_user_id
        AND action_key = (b.unlock_criteria->>'action')
    ) >= (b.unlock_criteria->>'value')::INTEGER
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_badges_unlocked = v_badges_unlocked + ROW_COUNT;

  RETURN QUERY SELECT v_badges_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar desafios diários
CREATE OR REPLACE FUNCTION generate_daily_challenges(p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_challenges JSONB;
BEGIN
  -- Template de desafios possíveis
  v_challenges := jsonb_build_array(
    jsonb_build_object(
      'title', 'Devocional Matinal',
      'description', 'Complete o devocional de hoje',
      'action', 'daily_devotional',
      'target', 1,
      'xp_reward', 50,
      'icon', '📖'
    ),
    jsonb_build_object(
      'title', 'Estudioso',
      'description', 'Complete um estudo bíblico',
      'action', 'bible_study',
      'target', 1,
      'xp_reward', 75,
      'icon', '📚'
    ),
    jsonb_build_object(
      'title', 'Mestre do Quiz',
      'description', 'Acerte 100% em um quiz',
      'action', 'quiz_perfect',
      'target', 1,
      'xp_reward', 100,
      'icon', '💯'
    )
  );

  -- Inserir desafios do dia
  INSERT INTO daily_challenges (challenge_date, challenges)
  VALUES (p_date, v_challenges)
  ON CONFLICT (challenge_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gerar desafios para hoje se não existir
SELECT generate_daily_challenges(CURRENT_DATE);

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Trigger para verificar badges após ganhar XP
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_unlock_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_xp_earned
AFTER INSERT ON xp_history
FOR EACH ROW
EXECUTE FUNCTION trigger_check_badges();

COMMENT ON TABLE public.badges IS 'Sistema de badges/conquistas com raridades';
COMMENT ON TABLE public.daily_challenges IS 'Desafios diários gerados automaticamente';
COMMENT ON TABLE public.leaderboard_snapshots IS 'Rankings salvos diariamente';
COMMENT ON TABLE public.rewards IS 'Sistema de recompensas automáticas';
