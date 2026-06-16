-- Create table for Bible reading progress (last read position)
CREATE TABLE public.bible_reading_position (
  user_id UUID NOT NULL PRIMARY KEY,
  book_abbrev TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bible_reading_position ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own reading position"
ON public.bible_reading_position
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can create their reading position"
ON public.bible_reading_position
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their reading position"
ON public.bible_reading_position
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their reading position"
ON public.bible_reading_position
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_bible_reading_position_updated_at
BEFORE UPDATE ON public.bible_reading_position
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();