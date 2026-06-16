-- Drop existing policies if any
DROP POLICY IF EXISTS "video_comments_select" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_insert" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_delete" ON public.video_comments;
DROP POLICY IF EXISTS "Users can view video comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can insert video comments" ON public.video_comments;
DROP POLICY IF EXISTS "Users can delete their own video comments" ON public.video_comments;

-- Enable RLS
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view comments on public videos or videos they own or are friends with owner
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
    )
  )
);

-- Policy: Authenticated users can insert comments if video is public or they are friends with owner
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
    )
  )
);

-- Policy: Users can delete their own comments OR video owner can delete any comment
CREATE POLICY "video_comments_delete" ON public.video_comments
FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.user_videos v
    WHERE v.id = video_id AND v.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON public.video_comments(user_id);