-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 8: Calendário Premium com RSVP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'culto' CHECK (event_type IN
    ('culto', 'celula', 'jejum', 'campanha', 'batismo', 'santa_ceia', 'evangelismo', 'conferencia', 'congresso', 'outro')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  maps_link TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view events" ON public.community_events;
CREATE POLICY "Members can view events"
ON public.community_events FOR SELECT
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Leaders can create events" ON public.community_events;
CREATE POLICY "Leaders can create events"
ON public.community_events FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.community_member_role(community_id, auth.uid())
      IN ('admin', 'pastor', 'pastora', 'lider_geral', 'presbitero', 'moderador', 'lider_ministerio', 'evangelista', 'missionario', 'secretario')
);

DROP POLICY IF EXISTS "Creators and leaders can update events" ON public.community_events;
CREATE POLICY "Creators and leaders can update events"
ON public.community_events FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

DROP POLICY IF EXISTS "Creators and leaders can delete events" ON public.community_events;
CREATE POLICY "Creators and leaders can delete events"
ON public.community_events FOR DELETE
USING (
  auth.uid() = created_by
  OR public.community_member_role(community_id, auth.uid())
     IN ('admin', 'pastor', 'pastora', 'lider_geral', 'moderador')
);

CREATE INDEX IF NOT EXISTS idx_community_events_community
ON public.community_events (community_id, is_active, start_at);

-- ---------------------------------------------
-- RSVP
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.community_event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view rsvps" ON public.community_event_rsvps;
CREATE POLICY "Members can view rsvps"
ON public.community_event_rsvps FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can set their own rsvp" ON public.community_event_rsvps;
CREATE POLICY "Users can set their own rsvp"
ON public.community_event_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rsvp" ON public.community_event_rsvps;
CREATE POLICY "Users can update their own rsvp"
ON public.community_event_rsvps FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own rsvp" ON public.community_event_rsvps;
CREATE POLICY "Users can remove their own rsvp"
ON public.community_event_rsvps FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON public.community_event_rsvps (event_id, status);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_event_rsvps;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'ok' as status;
