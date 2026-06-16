-- Enable RLS on verse_comments table
ALTER TABLE public.verse_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments
CREATE POLICY "Comments are visible to everyone" 
ON public.verse_comments 
FOR SELECT 
USING (true);

-- Allow authenticated users to create comments
CREATE POLICY "Users can create their own comments" 
ON public.verse_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.verse_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.verse_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for verse_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.verse_comments;