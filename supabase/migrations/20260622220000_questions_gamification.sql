-- ============================================
-- GAMIFICAÇÃO COMPLETA PARA PERGUNTAS BÍBLICAS
-- Sistema de votos, melhor resposta, reputação e badges
-- ============================================

-- Adicionar campos de gamificação à tabela de perguntas
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS answers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_best_answer BOOLEAN DEFAULT false;

-- Adicionar campos de gamificação às respostas
ALTER TABLE public.answers
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_best_answer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS best_answer_at TIMESTAMPTZ;

-- Criar tabela de votos em perguntas
CREATE TABLE IF NOT EXISTS public.question_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Criar tabela de votos em respostas
CREATE TABLE IF NOT EXISTS public.answer_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, user_id)
);

-- Criar tabela de reputação dos usuários
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reputation_points INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  answers_given INTEGER DEFAULT 0,
  best_answers INTEGER DEFAULT 0,
  upvotes_received INTEGER DEFAULT 0,
  downvotes_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de badges (medalhas)
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de badges conquistados
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_question_votes_question ON public.question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_user ON public.question_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_answer ON public.answer_votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_user ON public.answer_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputation_user ON public.user_reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputation_points ON public.user_reputation(reputation_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- RLS
ALTER TABLE public.question_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Votos são públicos" ON public.question_votes FOR SELECT USING (true);
CREATE POLICY "Usuários podem votar" ON public.question_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem mudar voto" ON public.question_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover voto" ON public.question_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Votos em respostas são públicos" ON public.answer_votes FOR SELECT USING (true);
CREATE POLICY "Usuários podem votar respostas" ON public.answer_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem mudar voto resposta" ON public.answer_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover voto resposta" ON public.answer_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reputação é pública" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Badges são públicos" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Badges de usuários são públicos" ON public.user_badges FOR SELECT USING (true);

-- Função para atualizar contador de votos em perguntas
CREATE OR REPLACE FUNCTION update_question_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  vote_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    vote_change := CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END;
    UPDATE public.questions
    SET votes_count = votes_count + vote_change
    WHERE id = NEW.question_id;

  ELSIF TG_OP = 'UPDATE' THEN
    vote_change := CASE WHEN NEW.vote_type = 'up' THEN 2 ELSE -2 END;
    UPDATE public.questions
    SET votes_count = votes_count + vote_change
    WHERE id = NEW.question_id;

  ELSIF TG_OP = 'DELETE' THEN
    vote_change := CASE WHEN OLD.vote_type = 'up' THEN -1 ELSE 1 END;
    UPDATE public.questions
    SET votes_count = votes_count + vote_change
    WHERE id = OLD.question_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger para votos em perguntas
CREATE TRIGGER trigger_update_question_votes
AFTER INSERT OR UPDATE OR DELETE ON public.question_votes
FOR EACH ROW
EXECUTE FUNCTION update_question_votes_count();

-- Função para atualizar contador de votos em respostas
CREATE OR REPLACE FUNCTION update_answer_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  vote_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    vote_change := CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END;
    UPDATE public.answers
    SET votes_count = votes_count + vote_change
    WHERE id = NEW.answer_id;

  ELSIF TG_OP = 'UPDATE' THEN
    vote_change := CASE WHEN NEW.vote_type = 'up' THEN 2 ELSE -2 END;
    UPDATE public.answers
    SET votes_count = votes_count + vote_change
    WHERE id = NEW.answer_id;

  ELSIF TG_OP = 'DELETE' THEN
    vote_change := CASE WHEN OLD.vote_type = 'up' THEN -1 ELSE 1 END;
    UPDATE public.answers
    SET votes_count = votes_count + vote_change
    WHERE id = OLD.answer_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger para votos em respostas
CREATE TRIGGER trigger_update_answer_votes
AFTER INSERT OR UPDATE OR DELETE ON public.answer_votes
FOR EACH ROW
EXECUTE FUNCTION update_answer_votes_count();

-- Função para marcar melhor resposta
CREATE OR REPLACE FUNCTION mark_best_answer(p_answer_id UUID, p_question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remover best answer anterior
  UPDATE public.answers
  SET is_best_answer = false,
      best_answer_at = NULL
  WHERE question_id = p_question_id AND is_best_answer = true;

  -- Marcar nova best answer
  UPDATE public.answers
  SET is_best_answer = true,
      best_answer_at = NOW()
  WHERE id = p_answer_id;

  -- Atualizar pergunta
  UPDATE public.questions
  SET has_best_answer = true
  WHERE id = p_question_id;

  -- Atualizar reputação do usuário que respondeu
  UPDATE public.user_reputation
  SET best_answers = best_answers + 1,
      reputation_points = reputation_points + 30
  WHERE user_id = (SELECT user_id FROM public.answers WHERE id = p_answer_id);
END;
$$;

-- Inserir badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
('Primeiro Passo', 'Fez sua primeira pergunta', '🥇', 'perguntas', 'questions_asked', 1, 10),
('Curioso', 'Fez 10 perguntas', '🤔', 'perguntas', 'questions_asked', 10, 50),
('Sábio', 'Fez 50 perguntas', '🦉', 'perguntas', 'questions_asked', 50, 200),

('Primeira Resposta', 'Respondeu sua primeira pergunta', '💬', 'respostas', 'answers_given', 1, 10),
('Colaborador', 'Deu 10 respostas', '🤝', 'respostas', 'answers_given', 10, 50),
('Mestre', 'Deu 50 respostas', '👨‍🏫', 'respostas', 'answers_given', 50, 200),

('Primeira Estrela', 'Recebeu primeira melhor resposta', '⭐', 'qualidade', 'best_answers', 1, 25),
('Especialista', 'Recebeu 5 melhores respostas', '🌟', 'qualidade', 'best_answers', 5, 100),
('Guru Bíblico', 'Recebeu 20 melhores respostas', '✨', 'qualidade', 'best_answers', 20, 300),

('Apoiador', 'Deu 10 votos positivos', '👍', 'comunidade', 'upvotes_given', 10, 20),
('Avaliador', 'Deu 50 votos', '⚖️', 'comunidade', 'votes_given', 50, 50),
('Crítico', 'Deu 100 votos', '🎯', 'comunidade', 'votes_given', 100, 100),

('Popular', 'Recebeu 10 votos positivos', '🔥', 'reconhecimento', 'upvotes_received', 10, 50),
('Influente', 'Recebeu 50 votos positivos', '💎', 'reconhecimento', 'upvotes_received', 50, 150),
('Estrela', 'Recebeu 100 votos positivos', '🏆', 'reconhecimento', 'upvotes_received', 100, 300),

('Reputação Bronze', 'Alcançou 100 pontos de reputação', '🥉', 'reputacao', 'reputation_points', 100, 50),
('Reputação Prata', 'Alcançou 500 pontos de reputação', '🥈', 'reputacao', 'reputation_points', 500, 150),
('Reputação Ouro', 'Alcançou 1000 pontos de reputação', '🥇', 'reputacao', 'reputation_points', 1000, 300),
('Lenda', 'Alcançou 5000 pontos de reputação', '👑', 'reputacao', 'reputation_points', 5000, 1000);

-- Função para verificar e conceder badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  badge_record RECORD;
  user_stats RECORD;
BEGIN
  -- Buscar estatísticas do usuário
  SELECT * INTO user_stats
  FROM public.user_reputation
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Verificar cada badge
  FOR badge_record IN
    SELECT * FROM public.badges
  LOOP
    -- Verificar se já tem o badge
    IF NOT EXISTS (
      SELECT 1 FROM public.user_badges
      WHERE user_id = p_user_id AND badge_id = badge_record.id
    ) THEN
      -- Verificar requisito
      CASE badge_record.requirement_type
        WHEN 'questions_asked' THEN
          IF user_stats.questions_asked >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
          END IF;

        WHEN 'answers_given' THEN
          IF user_stats.answers_given >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
          END IF;

        WHEN 'best_answers' THEN
          IF user_stats.best_answers >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
          END IF;

        WHEN 'upvotes_received' THEN
          IF user_stats.upvotes_received >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
          END IF;

        WHEN 'reputation_points' THEN
          IF user_stats.reputation_points >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
          END IF;
      END CASE;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON TABLE public.user_reputation IS 'Sistema completo de gamificação para Perguntas Bíblicas';
