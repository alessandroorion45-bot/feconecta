-- Table for reading sessions (time tracking)
CREATE TABLE public.bible_reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  book_abbrev TEXT,
  chapter INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for verse highlights/markings
CREATE TABLE public.bible_verse_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_abbrev TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  highlight_color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_abbrev, chapter, verse_number)
);

-- Table for spiritual campaigns
CREATE TABLE public.spiritual_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_type TEXT NOT NULL, -- 'sentimental', 'spiritual', 'financial', 'health', 'protection'
  duration_days INTEGER NOT NULL DEFAULT 7, -- 7, 21, or 40
  current_day INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for campaign daily progress
CREATE TABLE public.campaign_daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.spiritual_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reading_duration_seconds INTEGER DEFAULT 0,
  prayed BOOLEAN DEFAULT false,
  UNIQUE(campaign_id, day_number)
);

-- Table for total reading stats
CREATE TABLE public.bible_reading_stats (
  user_id UUID NOT NULL PRIMARY KEY,
  total_reading_seconds INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  last_reading_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bible_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verse_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_reading_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bible_reading_sessions
CREATE POLICY "Users can view their own sessions" ON public.bible_reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.bible_reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.bible_reading_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bible_verse_highlights
CREATE POLICY "Users can view their own highlights" ON public.bible_verse_highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own highlights" ON public.bible_verse_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own highlights" ON public.bible_verse_highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own highlights" ON public.bible_verse_highlights FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for spiritual_campaigns
CREATE POLICY "Users can view their own campaigns" ON public.spiritual_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own campaigns" ON public.spiritual_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON public.spiritual_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for campaign_daily_progress
CREATE POLICY "Users can view their own progress" ON public.campaign_daily_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.campaign_daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.campaign_daily_progress FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bible_reading_stats
CREATE POLICY "Users can view their own stats" ON public.bible_reading_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own stats" ON public.bible_reading_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.bible_reading_stats FOR UPDATE USING (auth.uid() = user_id);