-- =============================================
-- DEVOCIONAIS — Correção e conclusões
-- 1) Garante a coluna "date" (erro: column devotionals.date does not exist)
-- 2) Política de leitura
-- 3) Tabela de conclusões com reflexão pessoal (XP/sequência)
-- =============================================

-- 1. Coluna date (com preenchimento a partir de created_at quando existir)
ALTER TABLE public.devotionals ADD COLUMN IF NOT EXISTS date DATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'devotionals' AND column_name = 'created_at'
  ) THEN
    UPDATE public.devotionals SET date = created_at::date WHERE date IS NULL;
  END IF;
  UPDATE public.devotionals SET date = CURRENT_DATE WHERE date IS NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_devotionals_date ON public.devotionals (date DESC);

-- 2. Leitura pública dos devocionais
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view devotionals" ON public.devotionals;
CREATE POLICY "Anyone can view devotionals"
ON public.devotionals FOR SELECT USING (true);

-- 3. Conclusões (com reflexão pessoal, privada por padrão)
CREATE TABLE IF NOT EXISTS public.devotional_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  devotional_id UUID NOT NULL,
  reflection TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, devotional_id)
);

ALTER TABLE public.devotional_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own devotional completions" ON public.devotional_completions;
CREATE POLICY "Users view own devotional completions"
ON public.devotional_completions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users complete devotionals" ON public.devotional_completions;
CREATE POLICY "Users complete devotionals"
ON public.devotional_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own devotional reflections" ON public.devotional_completions;
CREATE POLICY "Users update own devotional reflections"
ON public.devotional_completions FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_devotional_completions_user
ON public.devotional_completions (user_id, completed_at DESC);
