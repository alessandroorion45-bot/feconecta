-- =============================================
-- FEED SOCIAL UNIFICADO
-- Reações exclusivas, favoritos, respostas em comentários e índices
-- =============================================

-- 1. Reações exclusivas da plataforma (funciona para qualquer tipo de item do feed)
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view feed reactions" ON public.feed_reactions;
CREATE POLICY "Anyone can view feed reactions"
ON public.feed_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can react" ON public.feed_reactions;
CREATE POLICY "Users can react"
ON public.feed_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can change own reaction" ON public.feed_reactions;
CREATE POLICY "Users can change own reaction"
ON public.feed_reactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reaction" ON public.feed_reactions;
CREATE POLICY "Users can remove own reaction"
ON public.feed_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_item ON public.feed_reactions (item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON public.feed_reactions (user_id);

-- 2. Favoritos do feed (salvar qualquer item)
CREATE TABLE IF NOT EXISTS public.feed_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE public.feed_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.feed_favorites;
CREATE POLICY "Users can view own favorites"
ON public.feed_favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save favorites" ON public.feed_favorites;
CREATE POLICY "Users can save favorites"
ON public.feed_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own favorites" ON public.feed_favorites;
CREATE POLICY "Users can remove own favorites"
ON public.feed_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feed_favorites_user ON public.feed_favorites (user_id, created_at DESC);

-- 3. Respostas em comentários de posts (threads)
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments (post_id, created_at);

-- 4. Índices para o feed unificado (paginação por data)
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_created ON public.prayers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonies_created ON public.testimonies (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bible_questions_created ON public.bible_questions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nearby_churches_created ON public.nearby_churches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_church_communities_created ON public.church_communities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_reading_rooms_created ON public.shared_reading_rooms (created_at DESC);
