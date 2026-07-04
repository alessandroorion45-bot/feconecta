-- =============================================
-- LEITURA BÍBLICA COMPARTILHADA — Correções e expansão
-- 1) Corrige 403 ao criar sala (política INSERT ausente no remoto)
-- 2) Remove recursão na política de participantes
-- 3) Entrada por código (inclusive salas privadas) com limite de 7 no servidor
-- 4) Reflexões finais da leitura
-- =============================================

-- ---------------------------------------------
-- 1. Função auxiliar sem recursão (SECURITY DEFINER)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.is_reading_room_member(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_reading_participants
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_reading_room_member(UUID, UUID) TO authenticated;

-- ---------------------------------------------
-- 2. Políticas de shared_reading_rooms (recriadas de forma idempotente)
-- ---------------------------------------------
ALTER TABLE public.shared_reading_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public rooms are visible to all authenticated" ON public.shared_reading_rooms;
CREATE POLICY "Public rooms are visible to all authenticated"
ON public.shared_reading_rooms FOR SELECT
USING (is_public = true AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Participants can view their rooms" ON public.shared_reading_rooms;
CREATE POLICY "Participants can view their rooms"
ON public.shared_reading_rooms FOR SELECT
USING (public.is_reading_room_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create rooms" ON public.shared_reading_rooms;
DROP POLICY IF EXISTS "Users can create reading rooms" ON public.shared_reading_rooms;
CREATE POLICY "Users can create rooms"
ON public.shared_reading_rooms FOR INSERT
WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their rooms" ON public.shared_reading_rooms;
CREATE POLICY "Hosts can update their rooms"
ON public.shared_reading_rooms FOR UPDATE
USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their rooms" ON public.shared_reading_rooms;
CREATE POLICY "Hosts can delete their rooms"
ON public.shared_reading_rooms FOR DELETE
USING (auth.uid() = host_id);

-- ---------------------------------------------
-- 3. Políticas de shared_reading_participants (sem auto-referência)
-- ---------------------------------------------
ALTER TABLE public.shared_reading_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants visible to room members" ON public.shared_reading_participants;
CREATE POLICY "Participants visible to room members"
ON public.shared_reading_participants FOR SELECT
USING (public.is_reading_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can join rooms" ON public.shared_reading_participants;
CREATE POLICY "Users can join rooms"
ON public.shared_reading_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their participation" ON public.shared_reading_participants;
CREATE POLICY "Users can update their participation"
ON public.shared_reading_participants FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave rooms" ON public.shared_reading_participants;
CREATE POLICY "Users can leave rooms"
ON public.shared_reading_participants FOR DELETE
USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 4. Entrar na sala por código (funciona para salas privadas
--    e aplica o limite de 7 participantes no servidor)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.join_reading_room(p_code TEXT)
RETURNS SETOF public.shared_reading_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room public.shared_reading_rooms%ROWTYPE;
  v_count INTEGER;
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_room
  FROM public.shared_reading_rooms
  WHERE room_code = UPPER(p_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'room_not_found';
  END IF;

  -- Já é participante: apenas retorna a sala
  IF EXISTS (
    SELECT 1 FROM public.shared_reading_participants
    WHERE room_id = v_room.id AND user_id = v_user
  ) THEN
    RETURN NEXT v_room;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.shared_reading_participants
  WHERE room_id = v_room.id;

  IF v_count >= LEAST(COALESCE(v_room.max_participants, 7), 7) THEN
    RAISE EXCEPTION 'room_full';
  END IF;

  INSERT INTO public.shared_reading_participants (room_id, user_id, is_host)
  VALUES (v_room.id, v_user, false);

  RETURN NEXT v_room;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_reading_room(TEXT) TO authenticated;

-- ---------------------------------------------
-- 5. Limite máximo de 7 participantes por sala
-- ---------------------------------------------
ALTER TABLE public.shared_reading_rooms
  ALTER COLUMN max_participants SET DEFAULT 7;

UPDATE public.shared_reading_rooms SET max_participants = 7 WHERE max_participants > 7;

-- ---------------------------------------------
-- 6. Reflexões finais da leitura
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_reading_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.shared_reading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  reflection TEXT NOT NULL,
  favorite_verse TEXT,
  application TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, user_id, chapter)
);

ALTER TABLE public.shared_reading_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view room reflections" ON public.shared_reading_reflections;
CREATE POLICY "Members can view room reflections"
ON public.shared_reading_reflections FOR SELECT
USING (public.is_reading_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Users can write own reflections" ON public.shared_reading_reflections;
CREATE POLICY "Users can write own reflections"
ON public.shared_reading_reflections FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reflections" ON public.shared_reading_reflections;
CREATE POLICY "Users can update own reflections"
ON public.shared_reading_reflections FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_reflections_room ON public.shared_reading_reflections (room_id, chapter);
CREATE INDEX IF NOT EXISTS idx_reading_reflections_user ON public.shared_reading_reflections (user_id, created_at DESC);
