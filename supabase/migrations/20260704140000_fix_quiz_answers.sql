-- =============================================
-- QUIZ DA LEITURA COMPARTILHADA — Respostas
-- 1) Constraint UNIQUE que o upsert (ON CONFLICT) das respostas exige
-- 2) Políticas RLS das respostas e reações (idempotentes, sem recursão)
-- =============================================

-- 1. Índice único para ON CONFLICT (room_id, user_id, chapter, question_index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_answers_unique
ON public.shared_reading_quiz_answers (room_id, user_id, chapter, question_index);

-- 2. Políticas de shared_reading_quiz_answers
ALTER TABLE public.shared_reading_quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz answers visible to room members" ON public.shared_reading_quiz_answers;
CREATE POLICY "Quiz answers visible to room members"
ON public.shared_reading_quiz_answers FOR SELECT
USING (public.is_reading_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can submit answers" ON public.shared_reading_quiz_answers;
CREATE POLICY "Users can submit answers"
ON public.shared_reading_quiz_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Upsert também faz UPDATE quando a resposta já existe
DROP POLICY IF EXISTS "Users can update own answers" ON public.shared_reading_quiz_answers;
CREATE POLICY "Users can update own answers"
ON public.shared_reading_quiz_answers FOR UPDATE
USING (auth.uid() = user_id);

-- Host limpa respostas ao reiniciar o capítulo
DROP POLICY IF EXISTS "Users can delete own answers" ON public.shared_reading_quiz_answers;
CREATE POLICY "Users can delete own answers"
ON public.shared_reading_quiz_answers FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.shared_reading_rooms r
    WHERE r.id = shared_reading_quiz_answers.room_id AND r.host_id = auth.uid()
  )
);

-- 3. Políticas de shared_reading_reactions
ALTER TABLE public.shared_reading_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reactions visible to room members" ON public.shared_reading_reactions;
CREATE POLICY "Reactions visible to room members"
ON public.shared_reading_reactions FOR SELECT
USING (public.is_reading_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can add reactions" ON public.shared_reading_reactions;
CREATE POLICY "Users can add reactions"
ON public.shared_reading_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
