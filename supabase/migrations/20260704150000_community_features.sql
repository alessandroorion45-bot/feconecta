-- =============================================
-- COMUNIDADE DA IGREJA — Mural, Palavra da Semana,
-- Campanhas Espirituais e Hierarquia de Papéis
-- =============================================

-- ---------------------------------------------
-- 1. Funções auxiliares (SECURITY DEFINER, sem recursão de RLS)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_community_members
    WHERE community_id = p_community_id AND user_id = p_user_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.community_member_role(p_community_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT role FROM public.church_community_members
  WHERE community_id = p_community_id AND user_id = p_user_id AND is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_community_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_member_role(UUID, UUID) TO authenticated;

-- ---------------------------------------------
-- 2. Mural da comunidade (inclui Palavra da Semana)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'announcement',
  title TEXT,
  content TEXT NOT NULL,
  verse_reference TEXT,
  verse_text TEXT,
  applications TEXT,
  reflection_questions TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view community posts" ON public.community_posts;
CREATE POLICY "Members can view community posts"
ON public.community_posts FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

-- Palavra da Semana restrita a líderes; demais tipos para qualquer membro
DROP POLICY IF EXISTS "Members can create posts" ON public.community_posts;
CREATE POLICY "Members can create posts"
ON public.community_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.is_community_member(community_id, auth.uid())
  AND (
    type <> 'word_of_week'
    OR public.community_member_role(community_id, auth.uid())
       IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
  )
);

DROP POLICY IF EXISTS "Authors and leaders can update posts" ON public.community_posts;
CREATE POLICY "Authors and leaders can update posts"
ON public.community_posts FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Authors and leaders can delete posts" ON public.community_posts;
CREATE POLICY "Authors and leaders can delete posts"
ON public.community_posts FOR DELETE
USING (
  auth.uid() = user_id
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_community_posts_community
ON public.community_posts (community_id, is_pinned DESC, created_at DESC);

-- Améns do mural
CREATE TABLE IF NOT EXISTS public.community_post_amens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.community_post_amens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view amens" ON public.community_post_amens;
CREATE POLICY "Members can view amens"
ON public.community_post_amens FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can amen" ON public.community_post_amens;
CREATE POLICY "Users can amen"
ON public.community_post_amens FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own amen" ON public.community_post_amens;
CREATE POLICY "Users can remove own amen"
ON public.community_post_amens FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_amens_post ON public.community_post_amens (post_id);

-- Comentários do mural
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view post comments" ON public.community_post_comments;
CREATE POLICY "Members can view post comments"
ON public.community_post_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can comment on posts" ON public.community_post_comments;
CREATE POLICY "Users can comment on posts"
ON public.community_post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own post comments" ON public.community_post_comments;
CREATE POLICY "Users can delete own post comments"
ON public.community_post_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_c ON public.community_post_comments (post_id, created_at);

-- ---------------------------------------------
-- 3. Campanhas espirituais da comunidade
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'oracao',
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view campaigns" ON public.community_campaigns;
CREATE POLICY "Members can view campaigns"
ON public.community_campaigns FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Leaders can create campaigns" ON public.community_campaigns;
CREATE POLICY "Leaders can create campaigns"
ON public.community_campaigns FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.community_member_role(community_id, auth.uid())
      IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador', 'lider_ministerio', 'evangelista', 'missionario')
);

DROP POLICY IF EXISTS "Creators and leaders can update campaigns" ON public.community_campaigns;
CREATE POLICY "Creators and leaders can update campaigns"
ON public.community_campaigns FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_community_campaigns
ON public.community_campaigns (community_id, is_active, start_date DESC);

-- Participantes
CREATE TABLE IF NOT EXISTS public.community_campaign_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.community_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id)
);

ALTER TABLE public.community_campaign_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view participants" ON public.community_campaign_participants;
CREATE POLICY "Members can view participants"
ON public.community_campaign_participants FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can join campaigns" ON public.community_campaign_participants;
CREATE POLICY "Users can join campaigns"
ON public.community_campaign_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave campaigns" ON public.community_campaign_participants;
CREATE POLICY "Users can leave campaigns"
ON public.community_campaign_participants FOR DELETE
USING (auth.uid() = user_id);

-- Check-ins diários
CREATE TABLE IF NOT EXISTS public.community_campaign_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.community_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id, day_number)
);

ALTER TABLE public.community_campaign_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view checkins" ON public.community_campaign_checkins;
CREATE POLICY "Members can view checkins"
ON public.community_campaign_checkins FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can check in" ON public.community_campaign_checkins;
CREATE POLICY "Users can check in"
ON public.community_campaign_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_checkins
ON public.community_campaign_checkins (campaign_id, user_id);

-- ---------------------------------------------
-- 4. Hierarquia: líderes podem gerenciar papéis dos membros
-- ---------------------------------------------
DROP POLICY IF EXISTS "Leaders can manage member roles" ON public.church_community_members;
CREATE POLICY "Leaders can manage member roles"
ON public.church_community_members FOR UPDATE
USING (
  public.community_member_role(community_id, auth.uid())
  IN ('admin', 'pastor', 'pastora', 'lider_geral', 'secretario')
);

-- ---------------------------------------------
-- 5. Realtime do mural
-- ---------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
