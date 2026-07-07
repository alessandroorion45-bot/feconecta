-- Tabela video_comments nunca existiu no banco remoto (404 ao carregar/enviar
-- comentários de vídeo). Cria a tabela + RLS coerente com a regra já
-- implementada no VideoComments.tsx: público = qualquer um comenta,
-- amigos = só amigos, privado = ninguém além do dono, custom = lista de
-- visualizadores permitidos (video_allowed_viewers).

CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_comments_select" ON public.video_comments;
DROP POLICY IF EXISTS "Anyone can view video comments" ON public.video_comments;
CREATE POLICY "video_comments_select" ON public.video_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_videos v
    WHERE v.id = video_id
    AND (
      v.visibility = 'public'
      OR v.user_id = auth.uid()
      OR (v.visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = v.user_id)
           OR (f.user_id_2 = auth.uid() AND f.user_id_1 = v.user_id)
      ))
      OR (v.visibility = 'custom' AND EXISTS (
        SELECT 1 FROM public.video_allowed_viewers vw
        WHERE vw.video_id = v.id AND vw.user_id = auth.uid()
      ))
    )
  )
);

DROP POLICY IF EXISTS "video_comments_insert" ON public.video_comments;
DROP POLICY IF EXISTS "Authenticated users can comment on videos" ON public.video_comments;
CREATE POLICY "video_comments_insert" ON public.video_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.user_videos v
    WHERE v.id = video_id
    AND (
      v.visibility = 'public'
      OR v.user_id = auth.uid()
      OR (v.visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = v.user_id)
           OR (f.user_id_2 = auth.uid() AND f.user_id_1 = v.user_id)
      ))
      OR (v.visibility = 'custom' AND EXISTS (
        SELECT 1 FROM public.video_allowed_viewers vw
        WHERE vw.video_id = v.id AND vw.user_id = auth.uid()
      ))
    )
  )
);

DROP POLICY IF EXISTS "video_comments_delete" ON public.video_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.video_comments;
CREATE POLICY "video_comments_delete" ON public.video_comments
FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.user_videos v
    WHERE v.id = video_id AND v.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.notify_video_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  SELECT user_id INTO video_owner_id FROM public.user_videos WHERE id = NEW.video_id;

  IF video_owner_id IS NOT NULL AND video_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, content, reference_id)
    VALUES (video_owner_id, NEW.user_id, 'video_comment', 'comentou no seu vídeo 💬', NEW.video_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_video_comment_trigger ON public.video_comments;
CREATE TRIGGER notify_video_comment_trigger
AFTER INSERT ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_video_comment();

CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON public.video_comments(user_id);

NOTIFY pgrst, 'reload schema';
