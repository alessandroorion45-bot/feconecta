-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 10: Desafios Semanais
-- ============================================================
-- Mesmo padrão de "fixar/desfixar" já usado na Palavra da Semana
-- (community_posts.word_of_week): só um desafio fica em destaque
-- por vez.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_weekly_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view challenges" ON public.community_weekly_challenges;
CREATE POLICY "Members can view challenges"
ON public.community_weekly_challenges FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Leaders can create challenges" ON public.community_weekly_challenges;
CREATE POLICY "Leaders can create challenges"
ON public.community_weekly_challenges FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.community_member_role(community_id, auth.uid())
      IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador', 'lider_ministerio', 'evangelista', 'missionario')
);

DROP POLICY IF EXISTS "Leaders can update challenges" ON public.community_weekly_challenges;
CREATE POLICY "Leaders can update challenges"
ON public.community_weekly_challenges FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Leaders can delete challenges" ON public.community_weekly_challenges;
CREATE POLICY "Leaders can delete challenges"
ON public.community_weekly_challenges FOR DELETE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_community
ON public.community_weekly_challenges (community_id, is_pinned, created_at DESC);

-- ---------------------------------------------
-- Conclusões
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.community_weekly_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, user_id)
);

ALTER TABLE public.community_challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view completions" ON public.community_challenge_completions;
CREATE POLICY "Members can view completions"
ON public.community_challenge_completions FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can mark their own completion" ON public.community_challenge_completions;
CREATE POLICY "Users can mark their own completion"
ON public.community_challenge_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own completion" ON public.community_challenge_completions;
CREATE POLICY "Users can remove their own completion"
ON public.community_challenge_completions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge ON public.community_challenge_completions (challenge_id);

SELECT 'ok' as status;
