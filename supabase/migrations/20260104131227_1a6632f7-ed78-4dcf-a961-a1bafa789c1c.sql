-- =====================================================
-- SHARED BIBLE READING ROOMS SYSTEM
-- =====================================================

-- Main rooms table
CREATE TABLE public.shared_reading_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  current_book_abbrev TEXT NOT NULL DEFAULT 'gn',
  current_chapter INTEGER NOT NULL DEFAULT 1,
  max_participants INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, reading, quiz, results
  quiz_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participants in each room
CREATE TABLE public.shared_reading_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.shared_reading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  finished_reading BOOLEAN NOT NULL DEFAULT false,
  total_points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Quiz answers for each participant
CREATE TABLE public.shared_reading_quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.shared_reading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  chapter INTEGER NOT NULL,
  question_index INTEGER NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id, chapter, question_index)
);

-- Reactions during sessions
CREATE TABLE public.shared_reading_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.shared_reading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL, -- 🙌, 🙏, 🎉
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Badges earned in shared reading
CREATE TABLE public.shared_reading_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL, -- discipulo_atento, guardiao_palavra, mestre_colaborativo, etc
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- User stats for shared reading
CREATE TABLE public.shared_reading_stats (
  user_id UUID NOT NULL PRIMARY KEY,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_chapters_completed INTEGER NOT NULL DEFAULT 0,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  total_wrong_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_reading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reading_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reading_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reading_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reading_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reading_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_reading_rooms
CREATE POLICY "Public rooms are visible to all authenticated" ON public.shared_reading_rooms
FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Participants can view their rooms" ON public.shared_reading_rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shared_reading_participants 
    WHERE room_id = shared_reading_rooms.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create rooms" ON public.shared_reading_rooms
FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their rooms" ON public.shared_reading_rooms
FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their rooms" ON public.shared_reading_rooms
FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for shared_reading_participants
CREATE POLICY "Participants visible to room members" ON public.shared_reading_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shared_reading_participants p2 
    WHERE p2.room_id = shared_reading_participants.room_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join rooms" ON public.shared_reading_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" ON public.shared_reading_participants
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.shared_reading_participants
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quiz_answers
CREATE POLICY "Quiz answers visible to room members" ON public.shared_reading_quiz_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shared_reading_participants 
    WHERE room_id = shared_reading_quiz_answers.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can submit answers" ON public.shared_reading_quiz_answers
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reactions
CREATE POLICY "Reactions visible to room members" ON public.shared_reading_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shared_reading_participants 
    WHERE room_id = shared_reading_reactions.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can add reactions" ON public.shared_reading_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Users can view their own badges" ON public.shared_reading_badges
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view badges on profiles" ON public.shared_reading_badges
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role only - shared_reading_badges" ON public.shared_reading_badges
FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for stats
CREATE POLICY "Users can view their own stats" ON public.shared_reading_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view stats on profiles" ON public.shared_reading_stats
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their stats" ON public.shared_reading_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their stats" ON public.shared_reading_stats
FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for rooms, participants, answers and reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_quiz_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_reactions;

-- Function to generate room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;