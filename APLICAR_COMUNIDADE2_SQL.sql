-- =============================================
-- CORREÇÃO: RLS de church_communities e church_community_members
-- Erro: "new row violates row-level security policy" ao criar comunidade
-- (políticas da migração original nunca aplicadas no remoto)
-- =============================================

-- 1. church_communities
ALTER TABLE public.church_communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active communities" ON public.church_communities;
CREATE POLICY "Anyone can view active communities"
ON public.church_communities FOR SELECT
USING (is_active = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.church_communities;
CREATE POLICY "Authenticated users can create communities"
ON public.church_communities FOR INSERT
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update their communities" ON public.church_communities;
CREATE POLICY "Admins can update their communities"
ON public.church_communities FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.community_member_role(id, auth.uid()) IN ('admin', 'pastor', 'pastora', 'lider_geral')
);

DROP POLICY IF EXISTS "Creators can delete their communities" ON public.church_communities;
CREATE POLICY "Creators can delete their communities"
ON public.church_communities FOR DELETE
USING (auth.uid() = created_by);

-- 2. church_community_members (sem auto-referência = sem recursão)
ALTER TABLE public.church_community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view community members" ON public.church_community_members;
CREATE POLICY "Members can view community members"
ON public.church_community_members FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_community_member(community_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can join communities" ON public.church_community_members;
CREATE POLICY "Users can join communities"
ON public.church_community_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave communities" ON public.church_community_members;
CREATE POLICY "Users can leave communities"
ON public.church_community_members FOR UPDATE
USING (auth.uid() = user_id);

-- (a política "Leaders can manage member roles" do SQL anterior continua valendo)
