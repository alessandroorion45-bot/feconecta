-- Create user_badges table for custom badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Badges são visíveis para todos"
ON public.user_badges
FOR SELECT
USING (true);

CREATE POLICY "Sistema pode conceder badges"
ON public.user_badges
FOR INSERT
WITH CHECK (true);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 50,
  badge_reward TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Desafios ativos são visíveis para todos"
ON public.challenges
FOR SELECT
USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- Create user_challenges table
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuários podem ver seu progresso"
ON public.user_challenges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem iniciar desafios"
ON public.user_challenges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu progresso"
ON public.user_challenges
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to update challenge progress
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_record RECORD;
  progress_value INTEGER;
BEGIN
  -- Loop through active challenges for this user
  FOR challenge_record IN 
    SELECT c.*, uc.id as user_challenge_id, uc.current_progress
    FROM public.challenges c
    LEFT JOIN public.user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = NEW.user_id
    WHERE c.is_active = true 
    AND now() BETWEEN c.start_date AND c.end_date
    AND (uc.is_completed IS NULL OR uc.is_completed = false)
  LOOP
    -- Calculate progress based on challenge type
    CASE challenge_record.challenge_type
      WHEN 'bible_read' THEN
        SELECT bible_chapters_read INTO progress_value
        FROM public.user_stats WHERE user_id = NEW.user_id;
      WHEN 'prayer' THEN
        SELECT prayers_created + prayers_interceded INTO progress_value
        FROM public.user_stats WHERE user_id = NEW.user_id;
      WHEN 'streak' THEN
        SELECT current_streak INTO progress_value
        FROM public.user_stats WHERE user_id = NEW.user_id;
      WHEN 'social' THEN
        SELECT testimonies_shared + events_participated INTO progress_value
        FROM public.user_stats WHERE user_id = NEW.user_id;
      ELSE
        progress_value := 0;
    END CASE;

    -- Insert or update challenge progress
    IF challenge_record.user_challenge_id IS NULL THEN
      INSERT INTO public.user_challenges (user_id, challenge_id, current_progress)
      VALUES (NEW.user_id, challenge_record.id, progress_value);
    ELSE
      UPDATE public.user_challenges
      SET 
        current_progress = progress_value,
        is_completed = (progress_value >= challenge_record.requirement_value),
        completed_at = CASE 
          WHEN progress_value >= challenge_record.requirement_value THEN now()
          ELSE completed_at
        END
      WHERE id = challenge_record.user_challenge_id;

      -- Award badge if challenge completed
      IF progress_value >= challenge_record.requirement_value 
         AND challenge_record.badge_reward IS NOT NULL 
         AND NOT EXISTS (
           SELECT 1 FROM public.user_badges 
           WHERE user_id = NEW.user_id 
           AND badge_name = challenge_record.badge_reward
         ) THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_color)
        VALUES (NEW.user_id, 'challenge', challenge_record.badge_reward, challenge_record.icon, 'from-purple-500 to-pink-500');
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to update challenge progress
CREATE TRIGGER update_challenges_on_stats_change
AFTER UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_challenge_progress();

-- Insert some initial challenges
INSERT INTO public.challenges (title, description, icon, challenge_type, requirement_type, requirement_value, points_reward, badge_reward, start_date, end_date)
VALUES
  ('Maratona Bíblica', 'Leia 10 capítulos da Bíblia esta semana', '📖', 'bible_read', 'count', 10, 100, 'Leitor Dedicado', now(), now() + interval '7 days'),
  ('Guerreiro da Oração', 'Ore ou interceda 20 vezes este mês', '🙏', 'prayer', 'count', 20, 150, 'Guerreiro de Oração', now(), now() + interval '30 days'),
  ('Streak de Fogo', 'Mantenha uma sequência de 7 dias', '🔥', 'streak', 'streak', 7, 200, 'Fogo Constante', now(), now() + interval '30 days'),
  ('Embaixador da Fé', 'Participe de 5 eventos ou compartilhe 3 testemunhos', '✨', 'social', 'count', 5, 120, 'Embaixador da Fé', now(), now() + interval '14 days');

-- Award initial badges based on achievements
INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_color, display_order)
SELECT DISTINCT 
  ua.user_id,
  'achievement',
  CASE 
    WHEN a.level = 'platinum' THEN 'Platina'
    WHEN a.level = 'gold' THEN 'Ouro'
    WHEN a.level = 'silver' THEN 'Prata'
    ELSE 'Bronze'
  END,
  '🏆',
  CASE 
    WHEN a.level = 'platinum' THEN 'from-cyan-400 to-blue-600'
    WHEN a.level = 'gold' THEN 'from-yellow-400 to-yellow-600'
    WHEN a.level = 'silver' THEN 'from-gray-400 to-gray-600'
    ELSE 'from-amber-600 to-amber-800'
  END,
  CASE 
    WHEN a.level = 'platinum' THEN 1
    WHEN a.level = 'gold' THEN 2
    WHEN a.level = 'silver' THEN 3
    ELSE 4
  END
FROM public.user_achievements ua
JOIN public.achievements a ON a.id = ua.achievement_id
WHERE a.level IN ('platinum', 'gold')
ON CONFLICT DO NOTHING;