-- ============================================================
-- REVELAÇÃO DE VERSÍCULOS — diário de bênçãos pessoal
-- Cada clique num selo pode revelar uma palavra bíblica;
-- o histórico fica guardado por usuário (colecionável).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_verse_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES public.badges(id) ON DELETE SET NULL,
  verse_reference text NOT NULL,
  verse_text text NOT NULL,
  revealed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verse_reveals_user
  ON public.user_verse_reveals (user_id, revealed_at DESC);

CREATE INDEX IF NOT EXISTS idx_verse_reveals_user_badge
  ON public.user_verse_reveals (user_id, badge_id);

ALTER TABLE public.user_verse_reveals ENABLE ROW LEVEL SECURITY;

-- Cada pessoa só vê e escreve no próprio diário
DROP POLICY IF EXISTS "verse_reveals_select_own" ON public.user_verse_reveals;
CREATE POLICY "verse_reveals_select_own"
  ON public.user_verse_reveals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "verse_reveals_insert_own" ON public.user_verse_reveals;
CREATE POLICY "verse_reveals_insert_own"
  ON public.user_verse_reveals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "verse_reveals_delete_own" ON public.user_verse_reveals;
CREATE POLICY "verse_reveals_delete_own"
  ON public.user_verse_reveals FOR DELETE
  USING (auth.uid() = user_id);

-- Acesso restrito: nada para anon, CRUD próprio para authenticated
REVOKE ALL ON public.user_verse_reveals FROM anon;
GRANT SELECT, INSERT, DELETE ON public.user_verse_reveals TO authenticated;

SELECT 'ok' AS status;
