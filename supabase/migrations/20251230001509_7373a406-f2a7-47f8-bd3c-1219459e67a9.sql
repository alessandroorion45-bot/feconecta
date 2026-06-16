-- Create verse_shares table to track shares
CREATE TABLE public.verse_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_abbrev TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  share_channel TEXT NOT NULL DEFAULT 'whatsapp',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verse_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can view share counts (aggregate only)
CREATE POLICY "Share counts are visible to everyone" 
ON public.verse_shares 
FOR SELECT 
USING (true);

-- Users can create their own shares
CREATE POLICY "Users can create their own shares" 
ON public.verse_shares 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.verse_shares;

-- Create index for efficient counting
CREATE INDEX idx_verse_shares_verse ON public.verse_shares(book_abbrev, chapter, verse_number);