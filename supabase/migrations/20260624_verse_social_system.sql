-- =====================================================
-- SISTEMA SOCIAL DE VERSÍCULOS - MIGRAÇÃO COMPLETA
-- =====================================================
-- Tabelas para favoritos, reações, comentários e compartilhamentos
-- =====================================================

-- ===== VERSÍCULOS FAVORITOS =====
CREATE TABLE IF NOT EXISTS public.favorite_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  verse_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book, chapter, verse)
);

CREATE INDEX idx_favorite_verses_user ON public.favorite_verses(user_id);
CREATE INDEX idx_favorite_verses_book ON public.favorite_verses(book, chapter, verse);
CREATE INDEX idx_favorite_verses_created ON public.favorite_verses(created_at DESC);

-- ===== REAÇÕES NOS VERSÍCULOS =====
CREATE TABLE IF NOT EXISTS public.verse_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'amen', 'fire', 'sparkle', 'praise')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book, chapter, verse, reaction_type)
);

CREATE INDEX idx_verse_reactions_verse ON public.verse_reactions(book, chapter, verse);
CREATE INDEX idx_verse_reactions_user ON public.verse_reactions(user_id);
CREATE INDEX idx_verse_reactions_type ON public.verse_reactions(reaction_type);

-- ===== COMENTÁRIOS NOS VERSÍCULOS =====
CREATE TABLE IF NOT EXISTS public.verse_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  comment_text text NOT NULL,
  parent_comment_id uuid REFERENCES public.verse_comments(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  is_reported boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_verse_comments_verse ON public.verse_comments(book, chapter, verse);
CREATE INDEX idx_verse_comments_user ON public.verse_comments(user_id);
CREATE INDEX idx_verse_comments_parent ON public.verse_comments(parent_comment_id);
CREATE INDEX idx_verse_comments_created ON public.verse_comments(created_at DESC);

-- ===== CURTIDAS NOS COMENTÁRIOS =====
CREATE TABLE IF NOT EXISTS public.verse_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id uuid REFERENCES public.verse_comments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_likes_user ON public.verse_comment_likes(user_id);
CREATE INDEX idx_comment_likes_comment ON public.verse_comment_likes(comment_id);

-- ===== COMPARTILHAMENTOS =====
CREATE TABLE IF NOT EXISTS public.verse_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  verse_text text NOT NULL,
  platform text CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'telegram', 'twitter', 'download', 'copy')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_verse_shares_verse ON public.verse_shares(book, chapter, verse);
CREATE INDEX idx_verse_shares_user ON public.verse_shares(user_id);
CREATE INDEX idx_verse_shares_platform ON public.verse_shares(platform);

-- ===== DENÚNCIAS DE COMENTÁRIOS =====
CREATE TABLE IF NOT EXISTS public.verse_comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.verse_comments(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, reporter_id)
);

CREATE INDEX idx_comment_reports_comment ON public.verse_comment_reports(comment_id);

-- ===== RLS POLICIES =====

-- Favorite verses
ALTER TABLE public.favorite_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all favorite verses" ON public.favorite_verses FOR SELECT USING (true);
CREATE POLICY "Users can insert their own favorites" ON public.favorite_verses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorite_verses FOR DELETE USING (auth.uid() = user_id);

-- Verse reactions
ALTER TABLE public.verse_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all reactions" ON public.verse_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add their own reactions" ON public.verse_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.verse_reactions FOR DELETE USING (auth.uid() = user_id);

-- Verse comments
ALTER TABLE public.verse_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view non-hidden comments" ON public.verse_comments FOR SELECT USING (is_hidden = false OR user_id = auth.uid());
CREATE POLICY "Users can insert their own comments" ON public.verse_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.verse_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.verse_comments FOR DELETE USING (auth.uid() = user_id);

-- Comment likes
ALTER TABLE public.verse_comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all comment likes" ON public.verse_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can add their own likes" ON public.verse_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.verse_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Verse shares
ALTER TABLE public.verse_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all shares" ON public.verse_shares FOR SELECT USING (true);
CREATE POLICY "Users can record their own shares" ON public.verse_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comment reports
ALTER TABLE public.verse_comment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports" ON public.verse_comment_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can report comments" ON public.verse_comment_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ===== FUNCTIONS =====

-- Função para obter estatísticas de um versículo
CREATE OR REPLACE FUNCTION public.get_verse_stats(
  p_book text,
  p_chapter integer,
  p_verse integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'favorites', (SELECT COUNT(*) FROM public.favorite_verses WHERE book = p_book AND chapter = p_chapter AND verse = p_verse),
    'comments', (SELECT COUNT(*) FROM public.verse_comments WHERE book = p_book AND chapter = p_chapter AND verse = p_verse AND is_hidden = false),
    'shares', (SELECT COUNT(*) FROM public.verse_shares WHERE book = p_book AND chapter = p_chapter AND verse = p_verse),
    'reactions', (
      SELECT jsonb_object_agg(reaction_type, count)
      FROM (
        SELECT reaction_type, COUNT(*)::integer as count
        FROM public.verse_reactions
        WHERE book = p_book AND chapter = p_chapter AND verse = p_verse
        GROUP BY reaction_type
      ) reactions
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- Função para obter versículos em alta (trending)
CREATE OR REPLACE FUNCTION public.get_trending_verses(
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  book text,
  chapter integer,
  verse integer,
  verse_text text,
  score bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH verse_scores AS (
    SELECT
      COALESCE(fv.book, vr.book, vc.book, vs.book) as book,
      COALESCE(fv.chapter, vr.chapter, vc.chapter, vs.chapter) as chapter,
      COALESCE(fv.verse, vr.verse, vc.verse, vs.verse) as verse,
      COALESCE(fv.verse_text, vs.verse_text, '') as verse_text,
      (
        COALESCE((SELECT COUNT(*) FROM public.favorite_verses fv2 WHERE fv2.book = COALESCE(fv.book, vr.book, vc.book, vs.book) AND fv2.chapter = COALESCE(fv.chapter, vr.chapter, vc.chapter, vs.chapter) AND fv2.verse = COALESCE(fv.verse, vr.verse, vc.verse, vs.verse)), 0) * 2 +
        COALESCE((SELECT COUNT(*) FROM public.verse_reactions vr2 WHERE vr2.book = COALESCE(fv.book, vr.book, vc.book, vs.book) AND vr2.chapter = COALESCE(fv.chapter, vr.chapter, vc.chapter, vs.chapter) AND vr2.verse = COALESCE(fv.verse, vr.verse, vc.verse, vs.verse)), 0) * 1 +
        COALESCE((SELECT COUNT(*) FROM public.verse_comments vc2 WHERE vc2.book = COALESCE(fv.book, vr.book, vc.book, vs.book) AND vc2.chapter = COALESCE(fv.chapter, vr.chapter, vc.chapter, vs.chapter) AND vc2.verse = COALESCE(fv.verse, vr.verse, vc.verse, vs.verse) AND vc2.is_hidden = false), 0) * 3 +
        COALESCE((SELECT COUNT(*) FROM public.verse_shares vs2 WHERE vs2.book = COALESCE(fv.book, vr.book, vc.book, vs.book) AND vs2.chapter = COALESCE(fv.chapter, vr.chapter, vc.chapter, vs.chapter) AND vs2.verse = COALESCE(fv.verse, vr.verse, vc.verse, vs.verse)), 0) * 5
      ) as score
    FROM public.favorite_verses fv
    FULL OUTER JOIN public.verse_reactions vr ON fv.book = vr.book AND fv.chapter = vr.chapter AND fv.verse = vr.verse
    FULL OUTER JOIN public.verse_comments vc ON COALESCE(fv.book, vr.book) = vc.book AND COALESCE(fv.chapter, vr.chapter) = vc.chapter AND COALESCE(fv.verse, vr.verse) = vc.verse
    FULL OUTER JOIN public.verse_shares vs ON COALESCE(fv.book, vr.book, vc.book) = vs.book AND COALESCE(fv.chapter, vr.chapter, vc.chapter) = vs.chapter AND COALESCE(fv.verse, vr.verse, vc.verse) = vs.verse
  )
  SELECT DISTINCT ON (book, chapter, verse)
    book,
    chapter,
    verse,
    verse_text,
    score
  FROM verse_scores
  WHERE score > 0
  ORDER BY score DESC, book, chapter, verse
  LIMIT p_limit;
END;
$$;

-- Trigger para atualizar likes_count em comentários
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.verse_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.verse_comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON public.verse_comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_likes_count();

-- ===== SUCCESS =====
SELECT 'Sistema Social de Versículos criado com sucesso!' as message;
