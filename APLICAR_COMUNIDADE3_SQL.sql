-- =============================================
-- CORREÇÃO: RLS de votações, avaliações, comentários,
-- reações, líderes e transferência de admin
-- Erro: "new row violates row-level security policy for community_votings"
-- (políticas da migração original nunca aplicadas — usa as funções
--  is_community_member/community_member_role já criadas, sem recursão)
-- =============================================

-- 1. Votações
ALTER TABLE public.community_votings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view votings" ON public.community_votings;
CREATE POLICY "Members can view votings"
ON public.community_votings FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Members can create votings" ON public.community_votings;
CREATE POLICY "Members can create votings"
ON public.community_votings FOR INSERT
WITH CHECK (auth.uid() = created_by AND public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Creators can update votings" ON public.community_votings;
CREATE POLICY "Creators can update votings"
ON public.community_votings FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid()) IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Creators can delete votings" ON public.community_votings;
CREATE POLICY "Creators can delete votings"
ON public.community_votings FOR DELETE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid()) IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

-- 2. Votos
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view public votes" ON public.community_votes;
CREATE POLICY "Members can view public votes"
ON public.community_votes FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can vote" ON public.community_votes;
CREATE POLICY "Members can vote"
ON public.community_votes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_votings v
    WHERE v.id = community_votes.voting_id
      AND v.status = 'active'
      AND public.is_community_member(v.community_id, auth.uid())
  )
);

-- 3. Comentários da comunidade
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view comments" ON public.community_comments;
CREATE POLICY "Members can view comments"
ON public.community_comments FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Members can create comments" ON public.community_comments;
CREATE POLICY "Members can create comments"
ON public.community_comments FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
CREATE POLICY "Users can delete own comments"
ON public.community_comments FOR DELETE
USING (auth.uid() = user_id);

-- 4. Reações
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view reactions" ON public.community_reactions;
CREATE POLICY "Authenticated can view reactions"
ON public.community_reactions FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can react in community" ON public.community_reactions;
CREATE POLICY "Users can react in community"
ON public.community_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own community reaction" ON public.community_reactions;
CREATE POLICY "Users can remove own community reaction"
ON public.community_reactions FOR DELETE
USING (auth.uid() = user_id);

-- 5. Líderes
ALTER TABLE public.church_leaders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view leaders" ON public.church_leaders;
CREATE POLICY "Members can view leaders"
ON public.church_leaders FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can manage leaders" ON public.church_leaders;
CREATE POLICY "Admins can manage leaders"
ON public.church_leaders FOR ALL
USING (public.community_member_role(community_id, auth.uid()) IN ('admin', 'pastor', 'pastora', 'lider_geral'));

-- 6. Avaliações de líderes
ALTER TABLE public.leader_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view evaluations" ON public.leader_evaluations;
CREATE POLICY "Members can view evaluations"
ON public.leader_evaluations FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Members can create evaluations" ON public.leader_evaluations;
CREATE POLICY "Members can create evaluations"
ON public.leader_evaluations FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update own evaluations" ON public.leader_evaluations;
CREATE POLICY "Users can update own evaluations"
ON public.leader_evaluations FOR UPDATE
USING (auth.uid() = user_id);

-- 7. Transferência de administração
ALTER TABLE public.admin_transfer_votings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view transfer votings" ON public.admin_transfer_votings;
CREATE POLICY "Members can view transfer votings"
ON public.admin_transfer_votings FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Members can start transfer votings" ON public.admin_transfer_votings;
CREATE POLICY "Members can start transfer votings"
ON public.admin_transfer_votings FOR INSERT
WITH CHECK (auth.uid() = initiated_by AND public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Members can update transfer votings" ON public.admin_transfer_votings;
CREATE POLICY "Members can update transfer votings"
ON public.admin_transfer_votings FOR UPDATE
USING (public.is_community_member(community_id, auth.uid()));

ALTER TABLE public.admin_transfer_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view transfer votes" ON public.admin_transfer_votes;
CREATE POLICY "Authenticated can view transfer votes"
ON public.admin_transfer_votes FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can cast transfer vote" ON public.admin_transfer_votes;
CREATE POLICY "Users can cast transfer vote"
ON public.admin_transfer_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. Histórico de ações
ALTER TABLE public.community_action_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view action history" ON public.community_action_history;
CREATE POLICY "Members can view action history"
ON public.community_action_history FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Members can log actions" ON public.community_action_history;
CREATE POLICY "Members can log actions"
ON public.community_action_history FOR INSERT
WITH CHECK (auth.uid() = performed_by AND public.is_community_member(community_id, auth.uid()));
