-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 9: Biblioteca da Célula
-- ============================================================
-- Acervo privado da célula (PDF/Slides/Vídeos/Áudios/Devocionais/
-- Estudos/Livros/Links). Visível a todos os membros da célula;
-- curadoria (adicionar/remover) fica com líderes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_cell_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES public.community_cells(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'slides', 'video', 'audio', 'devotional', 'study', 'book', 'link')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_cell_library_has_resource CHECK (file_url IS NOT NULL OR external_link IS NOT NULL)
);

ALTER TABLE public.community_cell_library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cell members can view library" ON public.community_cell_library_items;
CREATE POLICY "Cell members can view library"
ON public.community_cell_library_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_cell_members cm
    WHERE cm.cell_id = community_cell_library_items.cell_id AND cm.user_id = auth.uid() AND cm.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = community_cell_library_items.cell_id
      AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
);

DROP POLICY IF EXISTS "Cell leaders can add library items" ON public.community_cell_library_items;
CREATE POLICY "Cell leaders can add library items"
ON public.community_cell_library_items FOR INSERT
WITH CHECK (
  auth.uid() = added_by
  AND (
    EXISTS (
      SELECT 1 FROM public.community_cells c
      WHERE c.id = community_cell_library_items.cell_id
        AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
    )
    OR public.community_member_role(community_id, auth.uid())
       IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
  )
);

DROP POLICY IF EXISTS "Authors and cell leaders can delete library items" ON public.community_cell_library_items;
CREATE POLICY "Authors and cell leaders can delete library items"
ON public.community_cell_library_items FOR DELETE
USING (
  auth.uid() = added_by
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = community_cell_library_items.cell_id
      AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_cell_library_cell ON public.community_cell_library_items (cell_id, resource_type, created_at DESC);

SELECT 'ok' as status;
