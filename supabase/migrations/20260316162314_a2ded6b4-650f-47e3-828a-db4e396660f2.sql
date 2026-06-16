
-- ================================
-- IGREJAS PRÓXIMAS (Nearby Churches)
-- ================================
CREATE TABLE public.nearby_churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  denomination text,
  cover_image_url text,
  country text DEFAULT 'Brasil',
  state text,
  city text,
  neighborhood text,
  address text,
  phone text,
  whatsapp text,
  social_media text,
  worship_days text[],
  worship_times text[],
  operating_hours text,
  latitude double precision,
  longitude double precision,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nearby_churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view churches"
  ON public.nearby_churches FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create churches"
  ON public.nearby_churches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creator can update own church"
  ON public.nearby_churches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Creator can delete own church"
  ON public.nearby_churches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ================================
-- PERGUNTAS BÍBLICAS Q&A
-- ================================
CREATE TABLE public.bible_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  category text DEFAULT 'Geral',
  tags text[] DEFAULT '{}',
  likes_count int DEFAULT 0,
  answers_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bible_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view questions"
  ON public.bible_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create questions"
  ON public.bible_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author can update own questions"
  ON public.bible_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Author can delete own questions"
  ON public.bible_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.bible_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.bible_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  likes_count int DEFAULT 0,
  is_best boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bible_question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view answers"
  ON public.bible_question_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create answers"
  ON public.bible_question_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author can update own answers"
  ON public.bible_question_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Author can delete own answers"
  ON public.bible_question_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Question author can mark best answer"
  ON public.bible_question_answers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bible_questions q WHERE q.id = question_id AND q.user_id = auth.uid()));
CREATE POLICY "Question author can delete answers"
  ON public.bible_question_answers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bible_questions q WHERE q.id = question_id AND q.user_id = auth.uid()));

CREATE TABLE public.bible_question_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid REFERENCES public.bible_questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES public.bible_question_answers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id),
  UNIQUE(user_id, answer_id)
);

ALTER TABLE public.bible_question_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view likes"
  ON public.bible_question_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create likes"
  ON public.bible_question_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can delete own likes"
  ON public.bible_question_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ================================
-- LOUVORES (User worship posts)
-- ================================
CREATE TABLE public.worship_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  original_artist text,
  description text,
  category text DEFAULT 'Louvor',
  media_url text,
  media_type text,
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.worship_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view worship posts"
  ON public.worship_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create worship posts"
  ON public.worship_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author can update own worship posts"
  ON public.worship_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Author can delete own worship posts"
  ON public.worship_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.worship_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.worship_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.worship_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view worship comments"
  ON public.worship_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create worship comments"
  ON public.worship_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author can delete own worship comments"
  ON public.worship_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.worship_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.worship_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.worship_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view worship likes"
  ON public.worship_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create worship likes"
  ON public.worship_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can delete own worship likes"
  ON public.worship_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('worship-media', 'worship-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('church-images', 'church-images', true) ON CONFLICT (id) DO NOTHING;

-- Triggers for counts
CREATE OR REPLACE FUNCTION public.update_question_answer_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE bible_questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bible_questions SET answers_count = GREATEST(0, answers_count - 1) WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_question_answer_count
  AFTER INSERT OR DELETE ON public.bible_question_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_question_answer_count();

CREATE OR REPLACE FUNCTION public.update_worship_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE worship_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE worship_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_worship_likes_count
  AFTER INSERT OR DELETE ON public.worship_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_worship_likes_count();

CREATE OR REPLACE FUNCTION public.update_worship_comments_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE worship_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE worship_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_worship_comments_count
  AFTER INSERT OR DELETE ON public.worship_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_worship_comments_count();
