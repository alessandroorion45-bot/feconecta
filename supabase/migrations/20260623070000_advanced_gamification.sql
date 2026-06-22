-- =====================================================
-- GAMIFICAÇÃO AVANÇADA + 50 NOVAS CONQUISTAS
-- =====================================================
-- Expande sistema de conquistas e adiciona eventos XP
-- =====================================================

-- =====================================================
-- INSERIR 50+ NOVAS CONQUISTAS
-- =====================================================

-- Conquistas já existentes: ~17
-- Novas: 50+ (total ~67 conquistas)

INSERT INTO public.achievements (key, name, description, icon, xp_reward, requirement, category, is_secret) VALUES

-- ===== CATEGORIA: LEITURA BÍBLICA (10 novas) =====
('bible_marathon', 'Maratona Bíblica', 'Leia 100 capítulos da Bíblia', '📖', 500, '{"bible_chapters_read": 100}', 'bible', false),
('bible_scholar', 'Erudito Bíblico', 'Leia 500 capítulos da Bíblia', '📚', 2000, '{"bible_chapters_read": 500}', 'bible', false),
('bible_master_reader', 'Mestre Leitor', 'Leia a Bíblia inteira (1.189 capítulos)', '🏆', 5000, '{"bible_chapters_read": 1189}', 'bible', false),
('old_testament_complete', 'Antigo Testamento Completo', 'Leia todo o Antigo Testamento', '📜', 3000, '{"old_testament_complete": true}', 'bible', false),
('new_testament_complete', 'Novo Testamento Completo', 'Leia todo o Novo Testamento', '✝️', 2000, '{"new_testament_complete": true}', 'bible', false),
('psalms_lover', 'Amante dos Salmos', 'Leia todos os 150 Salmos', '🎵', 500, '{"psalms_read": 150}', 'bible', false),
('proverbs_wisdom', 'Sabedoria de Provérbios', 'Leia todos os 31 capítulos de Provérbios', '💎', 300, '{"proverbs_complete": true}', 'bible', false),
('gospels_explorer', 'Explorador dos Evangelhos', 'Leia os 4 Evangelhos completos', '🕊️', 800, '{"gospels_complete": true}', 'bible', false),
('paul_letters', 'Cartas de Paulo', 'Leia todas as 13 epístolas de Paulo', '✉️', 600, '{"paul_letters_complete": true}', 'bible', false),
('pentateuch_scholar', 'Estudioso do Pentateuco', 'Leia Gênesis, Êxodo, Levítico, Números e Deuteronômio', '📖', 1000, '{"pentateuch_complete": true}', 'bible', false),

-- ===== CATEGORIA: QUIZ (10 novas) =====
('quiz_perfectionist', 'Perfeccionista', 'Acerte 100 quizzes com nota perfeita', '💯', 1000, '{"perfect_quizzes": 100}', 'quiz', false),
('quiz_legend', 'Lenda do Quiz', 'Complete 1.000 quizzes', '👑', 3000, '{"quizzes_completed": 1000}', 'quiz', false),
('quiz_speed_demon', 'Demônio da Velocidade', 'Complete um quiz em menos de 30 segundos', '⚡', 200, '{"quiz_speed_record": 30}', 'quiz', false),
('quiz_all_categories', 'Conhecedor Universal', 'Complete quizzes em todas as categorias', '🌍', 500, '{"quiz_categories_completed": 66}', 'quiz', false),
('quiz_hard_master', 'Mestre do Difícil', 'Acerte 50 quizzes profissionais', '🧠', 800, '{"hard_quizzes_completed": 50}', 'quiz', false),
('quiz_week_streak', 'Semana de Quiz', 'Complete quizzes por 7 dias consecutivos', '📅', 300, '{"quiz_streak": 7}', 'quiz', false),
('quiz_month_streak', 'Mês de Quiz', 'Complete quizzes por 30 dias consecutivos', '🗓️', 1500, '{"quiz_streak": 30}', 'quiz', false),
('quiz_10_perfect_row', '10 Perfeitos Seguidos', 'Acerte 10 quizzes perfeitos em sequência', '🔥', 600, '{"perfect_streak": 10}', 'quiz', false),
('quiz_nightowl', 'Coruja Noturna', 'Complete um quiz após meia-noite', '🦉', 100, '{"night_quiz": true}', 'quiz', false),
('quiz_early_bird', 'Madrugador', 'Complete um quiz antes das 6h', '🐓', 100, '{"early_quiz": true}', 'quiz', false),

-- ===== CATEGORIA: ORAÇÃO (8 novas) =====
('prayer_warrior', 'Guerreiro de Oração', 'Publique 500 pedidos de oração', '⚔️', 1500, '{"prayers_posted": 500}', 'prayer', false),
('intercessor', 'Intercessor', 'Ore por 1.000 pedidos de outros', '🙏', 2000, '{"prayers_for_others": 1000}', 'prayer', false),
('prayer_chain', 'Corrente de Oração', 'Participe de 50 correntes de oração', '🔗', 400, '{"prayer_chains": 50}', 'prayer', false),
('prayer_answered', 'Oração Atendida', 'Marque 100 orações como atendidas', '✅', 800, '{"answered_prayers": 100}', 'prayer', false),
('midnight_prayer', 'Oração da Meia-Noite', 'Ore à meia-noite por 7 dias', '🌙', 500, '{"midnight_prayers": 7}', 'prayer', false),
('fasting_prayer', 'Jejum e Oração', 'Complete um jejum de oração de 3 dias', '🕊️', 1000, '{"fasting_days": 3}', 'prayer', false),
('prayer_partner', 'Parceiro de Oração', 'Ore com outro usuário 50 vezes', '👥', 600, '{"prayer_partnerships": 50}', 'prayer', false),
('prayer_yearlong', 'Ano de Oração', 'Ore por 365 dias consecutivos', '📿', 5000, '{"prayer_streak": 365}', 'prayer', true),

-- ===== CATEGORIA: COMUNIDADE (8 novas) =====
('helper', 'Ajudador', 'Responda 100 perguntas de outros usuários', '🤝', 500, '{"questions_answered": 100}', 'community', false),
('mentor', 'Mentor Espiritual', 'Mentor 10 novos usuários', '👨‍🏫', 1000, '{"mentored_users": 10}', 'community', false),
('friend_maker', 'Fazedor de Amigos', 'Tenha 100 amigos na plataforma', '👫', 400, '{"friends_count": 100}', 'community', false),
('testimony_writer', 'Testemunhador', 'Publique 50 testemunhos', '📝', 800, '{"testimonies_posted": 50}', 'community', false),
('encourager', 'Encorajador', 'Dê 1.000 "amém" em posts', '💪', 300, '{"amens_given": 1000}', 'community', false),
('discussion_leader', 'Líder de Discussão', 'Inicie 20 discussões bíblicas', '💬', 400, '{"discussions_started": 20}', 'community', false),
('event_organizer', 'Organizador de Eventos', 'Organize 10 eventos', '📅', 600, '{"events_organized": 10}', 'community', false),
('church_connector', 'Conector de Igrejas', 'Conecte 5 usuários com igrejas', '⛪', 500, '{"church_connections": 5}', 'community', false),

-- ===== CATEGORIA: STREAK (6 novas) =====
('streak_fire_100', 'Fogo de 100 Dias', 'Mantenha streak de 100 dias', '🔥', 2000, '{"streak_days": 100}', 'streak', false),
('streak_fire_200', 'Inferno de 200 Dias', 'Mantenha streak de 200 dias', '🌋', 4000, '{"streak_days": 200}', 'streak', false),
('streak_fire_365', 'Ano em Chamas', 'Mantenha streak de 365 dias', '🔥🔥', 10000, '{"streak_days": 365}', 'streak', true),
('streak_recovery', 'Recuperação Rápida', 'Recupere seu streak após perder', '💪', 100, '{"streak_recovered": true}', 'streak', false),
('streak_never_lost', 'Inabalável', 'Nunca perca um streak em 100 dias', '🛡️', 1500, '{"perfect_streak_100": true}', 'streak', false),
('streak_weekend_warrior', 'Guerreiro de Fim de Semana', 'Mantenha streak em 52 fins de semana', '🏖️', 800, '{"weekend_streaks": 52}', 'streak', false),

-- ===== CATEGORIA: XP (6 novas) =====
('xp_millionaire', 'Milionário de XP', 'Alcance 1.000.000 de XP', '💰', 5000, '{"total_xp": 1000000}', 'xp', false),
('xp_fast_leveler', 'Subida Rápida', 'Suba 10 níveis em uma semana', '🚀', 1000, '{"levels_per_week": 10}', 'xp', false),
('xp_consistent', 'Consistente', 'Ganhe XP todos os dias por 30 dias', '📈', 800, '{"daily_xp_streak": 30}', 'xp', false),
('xp_daily_cap', 'Maximizador Diário', 'Alcance o limite diário de XP 50 vezes', '🎯', 600, '{"daily_cap_reached": 50}', 'xp', false),
('xp_diversified', 'Diversificado', 'Ganhe XP em todas as 13 ações disponíveis', '🌈', 500, '{"xp_actions_completed": 13}', 'xp', false),
('xp_grinder', 'Grinder', 'Ganhe 10.000 XP em um único dia', '💪', 1500, '{"xp_in_one_day": 10000}', 'xp', true),

-- ===== CATEGORIA: ESPECIAL/SECRETA (4 novas) =====
('founder', 'Fundador', 'Esteja entre os primeiros 100 usuários', '👑', 5000, '{"user_id_number": 100}', 'special', true),
('easter_egg', 'Caçador de Ovos', 'Encontre 10 easter eggs escondidos', '🥚', 1000, '{"easter_eggs_found": 10}', 'special', true),
('midnight_visitor', 'Visitante da Meia-Noite', 'Acesse à meia-noite por 7 dias', '👻', 500, '{"midnight_visits": 7}', 'special', true),
('anniversary', 'Aniversário de 1 Ano', 'Use a plataforma por 1 ano completo', '🎂', 3000, '{"account_age_days": 365}', 'special', true)

ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- TABELA: Eventos de XP (Boost temporário)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Evento
  event_name TEXT NOT NULL,
  description TEXT,

  -- Multiplicador
  xp_multiplier NUMERIC NOT NULL DEFAULT 2, -- 2x, 3x, etc

  -- Ações afetadas (NULL = todas)
  affected_actions TEXT[], -- ['quiz_completed', 'devotional_read']

  -- Período
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_xp_events_active ON public.xp_events(is_active, starts_at, ends_at) WHERE is_active = true;

-- Inserir eventos exemplo
INSERT INTO public.xp_events (event_name, description, xp_multiplier, affected_actions, starts_at, ends_at, is_active) VALUES
('Fim de Semana 2x XP', 'XP em dobro nos finais de semana!', 2, NULL, NOW(), NOW() + INTERVAL '2 days', true),
('Semana da Bíblia 3x XP', 'Triplo de XP para leitura bíblica', 3, ARRAY['bible_read', 'bible_study_completed'], NOW(), NOW() + INTERVAL '7 days', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÃO: Verificar Eventos XP Ativos
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_xp_events()
RETURNS TABLE(
  event_name TEXT,
  description TEXT,
  xp_multiplier NUMERIC,
  affected_actions TEXT[],
  ends_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    event_name,
    description,
    xp_multiplier,
    affected_actions,
    ends_at
  FROM public.xp_events
  WHERE is_active = true
    AND starts_at <= NOW()
    AND ends_at >= NOW()
  ORDER BY xp_multiplier DESC;
$$;

-- =====================================================
-- FUNÇÃO: Calcular XP com Eventos
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_xp_with_events(
  p_base_xp INTEGER,
  p_action TEXT,
  p_vip_multiplier NUMERIC DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_event_multiplier NUMERIC DEFAULT 1;
  v_final_xp INTEGER;
BEGIN
  -- Buscar evento ativo que afeta esta ação
  SELECT xp_multiplier INTO v_event_multiplier
  FROM public.xp_events
  WHERE is_active = true
    AND starts_at <= NOW()
    AND ends_at >= NOW()
    AND (affected_actions IS NULL OR p_action = ANY(affected_actions))
  ORDER BY xp_multiplier DESC
  LIMIT 1;

  -- Se não houver evento, usar 1
  v_event_multiplier := COALESCE(v_event_multiplier, 1);

  -- Calcular XP final: base × VIP × evento
  v_final_xp := FLOOR(p_base_xp * p_vip_multiplier * v_event_multiplier);

  RETURN v_final_xp;
END;
$$;

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active XP events"
  ON public.xp_events
  FOR SELECT
  USING (is_active = true AND starts_at <= NOW() AND ends_at >= NOW());

CREATE POLICY "Only admins can manage XP events"
  ON public.xp_events
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT ON public.xp_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_xp_events() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_xp_with_events(INTEGER, TEXT, NUMERIC) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.xp_events IS 'Eventos temporários de boost de XP (finais de semana, feriados, etc)';
COMMENT ON FUNCTION get_active_xp_events IS 'Retorna eventos de XP ativos no momento';
COMMENT ON FUNCTION calculate_xp_with_events IS 'Calcula XP considerando VIP + eventos ativos';
