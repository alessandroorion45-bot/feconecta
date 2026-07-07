-- A tabela user_videos já existia no remoto com estrutura legada
-- (CREATE TABLE IF NOT EXISTS anterior foi no-op) e não tinha as colunas
-- abaixo. Garante todas de forma defensiva, iguais à definição original.
ALTER TABLE public.user_videos
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Garante o CHECK de visibility (idempotente: remove se já existir e recria)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_videos_visibility_check'
  ) THEN
    ALTER TABLE public.user_videos
      ADD CONSTRAINT user_videos_visibility_check
      CHECK (visibility IN ('public', 'private', 'friends', 'custom'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
