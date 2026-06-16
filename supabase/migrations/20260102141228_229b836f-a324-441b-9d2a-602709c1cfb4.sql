-- Tabela para comentários de vídeos
CREATE TABLE public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para video_comments
CREATE POLICY "Comentários visíveis para quem pode ver o vídeo"
ON public.video_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_videos 
    WHERE id = video_id AND public.can_view_video(user_videos)
  )
);

CREATE POLICY "Usuários podem comentar em vídeos que podem ver"
ON public.video_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_videos 
    WHERE id = video_id AND public.can_view_video(user_videos)
  )
);

CREATE POLICY "Usuários podem deletar seus comentários"
ON public.video_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus comentários"
ON public.video_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_video_comments_updated_at
BEFORE UPDATE ON public.video_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para vídeos e comentários
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;