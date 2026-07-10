-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 6: Presença nas Células
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_cell_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES public.community_cells(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'visitor', 'new_convert')),
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_cell_attendance_person_check CHECK (
    (user_id IS NOT NULL AND guest_name IS NULL) OR (user_id IS NULL AND guest_name IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_cell_attendance_member_date
ON public.community_cell_attendance (cell_id, meeting_date, user_id)
WHERE user_id IS NOT NULL;

ALTER TABLE public.community_cell_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaders and own record can view attendance" ON public.community_cell_attendance;
CREATE POLICY "Leaders and own record can view attendance"
ON public.community_cell_attendance FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = cell_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
);

DROP POLICY IF EXISTS "Leaders can record attendance" ON public.community_cell_attendance;
CREATE POLICY "Leaders can record attendance"
ON public.community_cell_attendance FOR INSERT
WITH CHECK (
  auth.uid() = recorded_by
  AND (
    EXISTS (
      SELECT 1 FROM public.community_cells c
      WHERE c.id = cell_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
    )
    OR public.community_member_role(community_id, auth.uid())
       IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
  )
);

DROP POLICY IF EXISTS "Leaders can update attendance" ON public.community_cell_attendance;
CREATE POLICY "Leaders can update attendance"
ON public.community_cell_attendance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = cell_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
);

DROP POLICY IF EXISTS "Leaders can delete attendance" ON public.community_cell_attendance;
CREATE POLICY "Leaders can delete attendance"
ON public.community_cell_attendance FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_cells c
    WHERE c.id = cell_id AND (c.leader_user_id = auth.uid() OR c.vice_leader_user_id = auth.uid() OR c.created_by = auth.uid())
  )
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_cell_attendance_cell_date ON public.community_cell_attendance (cell_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_cell_attendance_user ON public.community_cell_attendance (user_id);

SELECT 'ok' as status;
