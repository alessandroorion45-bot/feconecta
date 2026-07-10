-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 3: Módulo de Células
-- ============================================================
-- Reaproveita is_community_member/community_member_role (já criadas
-- em 20260704150000_community_features.sql) para as políticas.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  leader_name TEXT,
  vice_leader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vice_leader_name TEXT,
  supervisor_name TEXT,
  meeting_day TEXT,
  meeting_time TIME,
  country TEXT DEFAULT 'Brasil',
  state TEXT,
  city TEXT,
  zip_code TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  maps_link TEXT,
  theme TEXT,
  verse TEXT,
  weekly_objective TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_cells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view cells" ON public.community_cells;
CREATE POLICY "Members can view cells"
ON public.community_cells FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Leaders can create cells" ON public.community_cells;
CREATE POLICY "Leaders can create cells"
ON public.community_cells FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.community_member_role(community_id, auth.uid())
      IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador', 'lider_ministerio', 'evangelista', 'missionario')
);

DROP POLICY IF EXISTS "Creators and leaders can update cells" ON public.community_cells;
CREATE POLICY "Creators and leaders can update cells"
ON public.community_cells FOR UPDATE
USING (
  auth.uid() = created_by
  OR auth.uid() = leader_user_id
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Creators and leaders can delete cells" ON public.community_cells;
CREATE POLICY "Creators and leaders can delete cells"
ON public.community_cells FOR DELETE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_community_cells_community
ON public.community_cells (community_id, is_active, created_at DESC);

-- ---------------------------------------------
-- Membros da célula
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_cell_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES public.community_cells(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cell_id, user_id)
);

ALTER TABLE public.community_cell_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view cell members" ON public.community_cell_members;
CREATE POLICY "Members can view cell members"
ON public.community_cell_members FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Users can join cells" ON public.community_cell_members;
CREATE POLICY "Users can join cells"
ON public.community_cell_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = cell_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Users can leave cells" ON public.community_cell_members;
CREATE POLICY "Users can leave cells"
ON public.community_cell_members FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = cell_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_cell_members_cell ON public.community_cell_members (cell_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cell_members_user ON public.community_cell_members (user_id);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_cells;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_cell_members;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'ok' as status;
