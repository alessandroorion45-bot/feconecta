-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 5: Atividades Bíblicas (Quiz)
-- ============================================================
-- Correção é feita no cliente (mesmo padrão de confiança usado no
-- resto do app pra conteúdo da comunidade — não é uma prova
-- proctorada). RLS garante que só membros da comunidade acessam
-- perguntas/tentativas, e só líderes criam/editam atividades.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timer_minutes SMALLINT,
  passing_score SMALLINT NOT NULL DEFAULT 70,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view quizzes" ON public.community_quizzes;
CREATE POLICY "Members can view quizzes"
ON public.community_quizzes FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Leaders can create quizzes" ON public.community_quizzes;
CREATE POLICY "Leaders can create quizzes"
ON public.community_quizzes FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.community_member_role(community_id, auth.uid())
      IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador', 'lider_ministerio', 'evangelista', 'missionario', 'professor_ebd')
);

DROP POLICY IF EXISTS "Creators and leaders can update quizzes" ON public.community_quizzes;
CREATE POLICY "Creators and leaders can update quizzes"
ON public.community_quizzes FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Creators and leaders can delete quizzes" ON public.community_quizzes;
CREATE POLICY "Creators and leaders can delete quizzes"
ON public.community_quizzes FOR DELETE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_community_quizzes_community
ON public.community_quizzes (community_id, is_active, created_at DESC);

-- ---------------------------------------------
-- Perguntas
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.community_quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'complete_verse', 'chronological_order', 'association', 'discursive')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  points INTEGER NOT NULL DEFAULT 10
);

ALTER TABLE public.community_quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view quiz questions" ON public.community_quiz_questions;
CREATE POLICY "Members can view quiz questions"
ON public.community_quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_quizzes qz
    WHERE qz.id = quiz_id AND public.is_community_member(qz.community_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Leaders can manage quiz questions" ON public.community_quiz_questions;
CREATE POLICY "Leaders can manage quiz questions"
ON public.community_quiz_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.community_quizzes qz
    WHERE qz.id = quiz_id
      AND (qz.created_by = auth.uid()
           OR public.community_member_role(qz.community_id, auth.uid())
              IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador', 'lider_ministerio', 'evangelista', 'missionario', 'professor_ebd'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_quizzes qz
    WHERE qz.id = quiz_id
      AND (qz.created_by = auth.uid()
           OR public.community_member_role(qz.community_id, auth.uid())
              IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador', 'lider_ministerio', 'evangelista', 'missionario', 'professor_ebd'))
  )
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.community_quiz_questions (quiz_id, order_index);

-- ---------------------------------------------
-- Tentativas / pontuação / ranking
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.community_quizzes(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_percent SMALLINT NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_gradable INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view attempts" ON public.community_quiz_attempts;
CREATE POLICY "Members can view attempts"
ON public.community_quiz_attempts FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Users can submit their own attempts" ON public.community_quiz_attempts;
CREATE POLICY "Users can submit their own attempts"
ON public.community_quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_community_member(community_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.community_quiz_attempts (quiz_id, score_percent DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.community_quiz_attempts (user_id);

SELECT 'ok' as status;
