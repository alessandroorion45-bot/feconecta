-- Criar tabela de vídeos com controle de privacidade
CREATE TABLE public.user_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends', 'custom')),
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para usuários autorizados (visibilidade personalizada)
CREATE TABLE public.video_allowed_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Tabela para likes de vídeos
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_allowed_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Função para verificar se pode visualizar vídeo
CREATE OR REPLACE FUNCTION public.can_view_video(video_row public.user_videos)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Próprio dono sempre pode ver
  IF video_row.user_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Vídeo público
  IF video_row.visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Vídeo privado (só o dono)
  IF video_row.visibility = 'private' THEN
    RETURN FALSE;
  END IF;
  
  -- Vídeo para amigos
  IF video_row.visibility = 'friends' THEN
    RETURN EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id_1 = current_user_id AND user_id_2 = video_row.user_id)
         OR (user_id_2 = current_user_id AND user_id_1 = video_row.user_id)
    );
  END IF;
  
  -- Visibilidade personalizada
  IF video_row.visibility = 'custom' THEN
    RETURN EXISTS (
      SELECT 1 FROM video_allowed_viewers
      WHERE video_id = video_row.id AND user_id = current_user_id
    );
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Políticas RLS para user_videos
CREATE POLICY "Usuários podem ver vídeos permitidos"
ON public.user_videos FOR SELECT
USING (public.can_view_video(user_videos));

CREATE POLICY "Usuários podem criar seus vídeos"
ON public.user_videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus vídeos"
ON public.user_videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus vídeos"
ON public.user_videos FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para video_allowed_viewers
CREATE POLICY "Donos podem gerenciar visualizadores"
ON public.video_allowed_viewers FOR ALL
USING (
  EXISTS (SELECT 1 FROM user_videos WHERE id = video_id AND user_id = auth.uid())
);

CREATE POLICY "Usuários podem ver se estão autorizados"
ON public.video_allowed_viewers FOR SELECT
USING (user_id = auth.uid());

-- Políticas RLS para video_likes
CREATE POLICY "Likes visíveis para todos autenticados"
ON public.video_likes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem dar like"
ON public.video_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover like"
ON public.video_likes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_videos_updated_at
BEFORE UPDATE ON public.user_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para vídeos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para vídeos
CREATE POLICY "Vídeos públicos visíveis para todos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Usuários podem fazer upload de vídeos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar seus vídeos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);