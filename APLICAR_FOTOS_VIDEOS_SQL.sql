-- =============================================
-- PERFIL: Fotos e Vídeos
-- 1) "new row violates row-level security policy for profile_photos"
--    -> política de INSERT nunca foi aplicada no remoto
-- 2) "Could not find the 'location' column of 'user_videos'"
--    -> tabela existe sem a coluna location (ou nem existe)
-- Cria as tabelas se faltarem, adiciona colunas ausentes e recria
-- todas as políticas de forma idempotente.
-- =============================================

-- Função utilitária de updated_at (idempotente)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------
-- 1. Álbuns de fotos (referenciado por profile_photos.album_id)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own albums" ON public.photo_albums;
CREATE POLICY "Users can view their own albums"
ON public.photo_albums FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view friends albums" ON public.photo_albums;
CREATE POLICY "Users can view friends albums"
ON public.photo_albums FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id_1 = auth.uid() AND user_id_2 = photo_albums.user_id)
       OR (user_id_2 = auth.uid() AND user_id_1 = photo_albums.user_id)
  )
);

DROP POLICY IF EXISTS "Users can create their own albums" ON public.photo_albums;
CREATE POLICY "Users can create their own albums"
ON public.photo_albums FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own albums" ON public.photo_albums;
CREATE POLICY "Users can update their own albums"
ON public.photo_albums FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own albums" ON public.photo_albums;
CREATE POLICY "Users can delete their own albums"
ON public.photo_albums FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_photo_albums_updated_at ON public.photo_albums;
CREATE TRIGGER update_photo_albums_updated_at
BEFORE UPDATE ON public.photo_albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_photo_albums_user_id ON public.photo_albums(user_id);

-- ---------------------------------------------
-- 2. Fotos do perfil
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  album_id UUID REFERENCES public.photo_albums(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends', 'custom')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante as colunas em bancos onde a tabela já existia parcialmente
ALTER TABLE public.profile_photos ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profile_photos ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.photo_albums(id) ON DELETE SET NULL;

-- Colunas de otimização de imagem (thumbnail/medium/compressão) usadas
-- pelo upload atual — garante mesmo se a migração de otimização não
-- tiver sido aplicada no remoto
ALTER TABLE public.profile_photos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS medium_url TEXT,
  ADD COLUMN IF NOT EXISTS original_size INTEGER,
  ADD COLUMN IF NOT EXISTS optimized_size INTEGER,
  ADD COLUMN IF NOT EXISTS compression_ratio INTEGER;

-- FK de photo_albums.cover_photo_id só pode ser criada depois de profile_photos existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'photo_albums_cover_photo_id_fkey'
  ) THEN
    ALTER TABLE public.photo_albums
      ADD CONSTRAINT photo_albums_cover_photo_id_fkey
      FOREIGN KEY (cover_photo_id) REFERENCES public.profile_photos(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public photos are visible to all" ON public.profile_photos;
CREATE POLICY "Public photos are visible to all"
ON public.profile_photos FOR SELECT
USING (visibility = 'public' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Friends can see friends-only photos" ON public.profile_photos;
CREATE POLICY "Friends can see friends-only photos"
ON public.profile_photos FOR SELECT
USING (
  visibility = 'friends' AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id_1 = auth.uid() AND user_id_2 = profile_photos.user_id)
         OR (user_id_2 = auth.uid() AND user_id_1 = profile_photos.user_id)
    )
  )
);

DROP POLICY IF EXISTS "Users can create their own photos" ON public.profile_photos;
CREATE POLICY "Users can create their own photos"
ON public.profile_photos FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own photos" ON public.profile_photos;
CREATE POLICY "Users can update their own photos"
ON public.profile_photos FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own photos" ON public.profile_photos;
CREATE POLICY "Users can delete their own photos"
ON public.profile_photos FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_profile_photos_updated_at ON public.profile_photos;
CREATE TRIGGER update_profile_photos_updated_at
BEFORE UPDATE ON public.profile_photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profile_photos_created_at ON public.profile_photos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_photos_album_id ON public.profile_photos(album_id);

-- ---------------------------------------------
-- 3. Vídeos do perfil
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends', 'custom')),
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante a coluna que causa o erro relatado, mesmo se a tabela já existia
ALTER TABLE public.user_videos ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.user_videos ADD COLUMN IF NOT EXISTS thumbnail_medium_url TEXT;

CREATE TABLE IF NOT EXISTS public.video_allowed_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_allowed_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_video(video_row public.user_videos)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF video_row.user_id = current_user_id THEN RETURN TRUE; END IF;
  IF video_row.visibility = 'public' THEN RETURN TRUE; END IF;
  IF video_row.visibility = 'private' THEN RETURN FALSE; END IF;
  IF video_row.visibility = 'friends' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id_1 = current_user_id AND user_id_2 = video_row.user_id)
         OR (user_id_2 = current_user_id AND user_id_1 = video_row.user_id)
    );
  END IF;
  IF video_row.visibility = 'custom' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.video_allowed_viewers
      WHERE video_id = video_row.id AND user_id = current_user_id
    );
  END IF;
  RETURN FALSE;
END;
$$;

DROP POLICY IF EXISTS "Usuários podem ver vídeos permitidos" ON public.user_videos;
CREATE POLICY "Usuários podem ver vídeos permitidos"
ON public.user_videos FOR SELECT USING (public.can_view_video(user_videos));

DROP POLICY IF EXISTS "Usuários podem criar seus vídeos" ON public.user_videos;
CREATE POLICY "Usuários podem criar seus vídeos"
ON public.user_videos FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus vídeos" ON public.user_videos;
CREATE POLICY "Usuários podem atualizar seus vídeos"
ON public.user_videos FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus vídeos" ON public.user_videos;
CREATE POLICY "Usuários podem deletar seus vídeos"
ON public.user_videos FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Donos podem gerenciar visualizadores" ON public.video_allowed_viewers;
CREATE POLICY "Donos podem gerenciar visualizadores"
ON public.video_allowed_viewers FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_videos WHERE id = video_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem ver se estão autorizados" ON public.video_allowed_viewers;
CREATE POLICY "Usuários podem ver se estão autorizados"
ON public.video_allowed_viewers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Likes visíveis para todos autenticados" ON public.video_likes;
CREATE POLICY "Likes visíveis para todos autenticados"
ON public.video_likes FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários podem dar like" ON public.video_likes;
CREATE POLICY "Usuários podem dar like"
ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem remover like" ON public.video_likes;
CREATE POLICY "Usuários podem remover like"
ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_videos_updated_at ON public.user_videos;
CREATE TRIGGER update_user_videos_updated_at
BEFORE UPDATE ON public.user_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_videos_created_at ON public.user_videos(user_id, created_at DESC);
