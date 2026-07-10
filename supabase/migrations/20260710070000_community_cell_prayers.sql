-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 7: Pedidos de Oração da Célula
-- ============================================================
-- Mural privado, visível só para quem é da célula (membro ativo,
-- líder/vice-líder da célula, ou liderança da comunidade).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_cell_prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES public.community_cells(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'request' CHECK (type IN ('request', 'testimony', 'thanks', 'answered')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_cell_prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cell members can view prayer requests" ON public.community_cell_prayer_requests;
CREATE POLICY "Cell members can view prayer requests"
ON public.community_cell_prayer_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_cell_members cm
    WHERE cm.cell_id = community_cell_prayer_requests.cell_id AND cm.user_id = auth.uid() AND cm.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = community_cell_prayer_requests.cell_id
      AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
);

DROP POLICY IF EXISTS "Cell members can post prayer requests" ON public.community_cell_prayer_requests;
CREATE POLICY "Cell members can post prayer requests"
ON public.community_cell_prayer_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.community_cell_members cm
      WHERE cm.cell_id = community_cell_prayer_requests.cell_id AND cm.user_id = auth.uid() AND cm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.community_cells c
      WHERE c.id = community_cell_prayer_requests.cell_id
        AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Authors and cell leaders can delete prayer requests" ON public.community_cell_prayer_requests;
CREATE POLICY "Authors and cell leaders can delete prayer requests"
ON public.community_cell_prayer_requests FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = community_cell_prayer_requests.cell_id
      AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_cell_prayers_cell ON public.community_cell_prayer_requests (cell_id, created_at DESC);

-- ---------------------------------------------
-- Quem orou (intercessão)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_cell_prayer_intercessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.community_cell_prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, user_id)
);

ALTER TABLE public.community_cell_prayer_intercessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cell members can view intercessions" ON public.community_cell_prayer_intercessions;
CREATE POLICY "Cell members can view intercessions"
ON public.community_cell_prayer_intercessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_cell_prayer_requests r
    JOIN public.community_cell_members cm ON cm.cell_id = r.cell_id AND cm.user_id = auth.uid() AND cm.is_active = true
    WHERE r.id = request_id
  )
  OR EXISTS (
    SELECT 1 FROM public.community_cell_prayer_requests r
    JOIN public.community_cells c ON c.id = r.cell_id
    WHERE r.id = request_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can mark that they prayed" ON public.community_cell_prayer_intercessions;
CREATE POLICY "Users can mark that they prayed"
ON public.community_cell_prayer_intercessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own intercession" ON public.community_cell_prayer_intercessions;
CREATE POLICY "Users can remove their own intercession"
ON public.community_cell_prayer_intercessions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cell_prayer_intercessions_request ON public.community_cell_prayer_intercessions (request_id);

SELECT 'ok' as status;
