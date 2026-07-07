-- "Não foi possível enviar o comentário" + 403 ao comentar num pedido de oração.
-- Mesma causa raiz recorrente: prayer_comments existe no remoto (comentários
-- antigos aparecem) mas sem a política de INSERT, que só existia na migração local.

CREATE TABLE IF NOT EXISTS public.prayer_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_comments
  ADD COLUMN IF NOT EXISTS prayer_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view prayer comments" ON public.prayer_comments;
CREATE POLICY "Anyone can view prayer comments"
ON public.prayer_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.prayer_comments;
CREATE POLICY "Users can create comments"
ON public.prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.prayer_comments;
CREATE POLICY "Users can delete own comments"
ON public.prayer_comments FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_prayer_comment_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prayer_owner_id uuid;
BEGIN
  SELECT user_id INTO prayer_owner_id FROM public.prayers WHERE id = NEW.prayer_id;

  IF prayer_owner_id IS NOT NULL AND prayer_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, content, reference_id)
    VALUES (prayer_owner_id, NEW.user_id, 'prayer_comment', 'comentou no seu pedido de oração 💬', NEW.prayer_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_prayer_comment ON public.prayer_comments;
DROP TRIGGER IF EXISTS notify_prayer_comment_trigger ON public.prayer_comments;
CREATE TRIGGER on_prayer_comment
  AFTER INSERT ON public.prayer_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_prayer_comment_interaction();

CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_id ON public.prayer_comments(prayer_id);

NOTIFY pgrst, 'reload schema';
