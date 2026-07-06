-- =============================================
-- PERGUNTAS BÍBLICAS — Fórum colaborativo
-- Garante tabelas e políticas (perguntas, respostas, curtidas)
-- =============================================

-- Perguntas
CREATE TABLE IF NOT EXISTS public.bible_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bible_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.bible_questions;
CREATE POLICY "Anyone can view questions" ON public.bible_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create questions" ON public.bible_questions;
CREATE POLICY "Users create questions" ON public.bible_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners update questions" ON public.bible_questions;
CREATE POLICY "Owners update questions" ON public.bible_questions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners delete questions" ON public.bible_questions;
CREATE POLICY "Owners delete questions" ON public.bible_questions FOR DELETE USING (auth.uid() = user_id);

-- Respostas
CREATE TABLE IF NOT EXISTS public.bible_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.bible_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_best BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bible_question_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view answers" ON public.bible_question_answers;
CREATE POLICY "Anyone can view answers" ON public.bible_question_answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create answers" ON public.bible_question_answers;
CREATE POLICY "Users create answers" ON public.bible_question_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Autor da resposta edita a sua; dono da pergunta marca melhor resposta
DROP POLICY IF EXISTS "Author or question owner update answers" ON public.bible_question_answers;
CREATE POLICY "Author or question owner update answers"
ON public.bible_question_answers FOR UPDATE
USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT q.user_id FROM public.bible_questions q WHERE q.id = question_id)
);
DROP POLICY IF EXISTS "Author or question owner delete answers" ON public.bible_question_answers;
CREATE POLICY "Author or question owner delete answers"
ON public.bible_question_answers FOR DELETE
USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT q.user_id FROM public.bible_questions q WHERE q.id = question_id)
);

-- Curtidas (em perguntas ou respostas)
CREATE TABLE IF NOT EXISTS public.bible_question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID REFERENCES public.bible_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.bible_question_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bible_question_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view question likes" ON public.bible_question_likes;
CREATE POLICY "Anyone can view question likes" ON public.bible_question_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users like" ON public.bible_question_likes;
CREATE POLICY "Users like" ON public.bible_question_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users unlike" ON public.bible_question_likes;
CREATE POLICY "Users unlike" ON public.bible_question_likes FOR DELETE USING (auth.uid() = user_id);

-- Contadores automáticos (respostas e curtidas)
CREATE OR REPLACE FUNCTION public.sync_answer_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bible_questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.bible_questions SET answers_count = GREATEST(0, answers_count - 1) WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_answer_count ON public.bible_question_answers;
CREATE TRIGGER trg_answer_count
AFTER INSERT OR DELETE ON public.bible_question_answers
FOR EACH ROW EXECUTE FUNCTION public.sync_answer_count();

CREATE OR REPLACE FUNCTION public.sync_answer_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.answer_id IS NOT NULL THEN
    UPDATE public.bible_question_answers SET likes_count = likes_count + 1 WHERE id = NEW.answer_id;
  ELSIF TG_OP = 'DELETE' AND OLD.answer_id IS NOT NULL THEN
    UPDATE public.bible_question_answers SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.answer_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_answer_likes ON public.bible_question_likes;
CREATE TRIGGER trg_answer_likes
AFTER INSERT OR DELETE ON public.bible_question_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_answer_likes();

CREATE INDEX IF NOT EXISTS idx_bible_questions_created ON public.bible_questions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bq_answers_question ON public.bible_question_answers (question_id);
