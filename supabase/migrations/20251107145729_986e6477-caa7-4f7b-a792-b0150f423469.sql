-- Create achievements system

-- Table for available achievements
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL, -- 'bible', 'prayer', 'event', 'testimony', 'social'
  requirement_type text NOT NULL, -- 'count', 'streak', 'milestone'
  requirement_value integer NOT NULL,
  points integer NOT NULL DEFAULT 10,
  level text NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for user achievements
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Table for activity tracking
CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_type text NOT NULL, -- 'bible_read', 'prayer_created', 'prayer_interceded', 'event_participated', 'testimony_shared', 'comment_posted'
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for user stats and levels
CREATE TABLE public.user_stats (
  user_id uuid NOT NULL PRIMARY KEY,
  total_points integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  bible_chapters_read integer NOT NULL DEFAULT 0,
  prayers_created integer NOT NULL DEFAULT 0,
  prayers_interceded integer NOT NULL DEFAULT 0,
  events_participated integer NOT NULL DEFAULT 0,
  testimonies_shared integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Conquistas são visíveis para todos"
ON public.achievements FOR SELECT
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Conquistas de usuários são visíveis para todos"
ON public.user_achievements FOR SELECT
USING (true);

CREATE POLICY "Sistema pode conceder conquistas"
ON public.user_achievements FOR INSERT
WITH CHECK (true);

-- RLS Policies for user_activities
CREATE POLICY "Usuários podem ver suas atividades"
ON public.user_activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem registrar atividades"
ON public.user_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Stats são visíveis para todos"
ON public.user_stats FOR SELECT
USING (true);

CREATE POLICY "Usuários podem atualizar suas stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar stats"
ON public.user_stats FOR INSERT
WITH CHECK (true);

-- Function to calculate level from points
CREATE OR REPLACE FUNCTION public.calculate_level(points integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  -- Level 1-10: every 100 points = 1 level
  IF points < 1000 THEN
    RETURN (points / 100) + 1;
  END IF;
  
  -- Level 11-20: every 200 points = 1 level
  IF points < 3000 THEN
    RETURN 10 + ((points - 1000) / 200) + 1;
  END IF;
  
  -- Level 21+: every 500 points = 1 level
  RETURN 20 + ((points - 3000) / 500) + 1;
END;
$$;

-- Function to update user stats and check achievements
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stat_column text;
  v_current_count integer;
  v_new_points integer := 0;
BEGIN
  -- Initialize stats if not exists
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Determine which stat to update and points to award
  CASE NEW.activity_type
    WHEN 'bible_read' THEN
      v_stat_column := 'bible_chapters_read';
      v_new_points := 10;
    WHEN 'prayer_created' THEN
      v_stat_column := 'prayers_created';
      v_new_points := 5;
    WHEN 'prayer_interceded' THEN
      v_stat_column := 'prayers_interceded';
      v_new_points := 3;
    WHEN 'event_participated' THEN
      v_stat_column := 'events_participated';
      v_new_points := 15;
    WHEN 'testimony_shared' THEN
      v_stat_column := 'testimonies_shared';
      v_new_points := 20;
    WHEN 'comment_posted' THEN
      v_new_points := 2;
    ELSE
      v_new_points := 1;
  END CASE;

  -- Update stats
  IF v_stat_column IS NOT NULL THEN
    EXECUTE format('UPDATE public.user_stats SET %I = %I + 1, total_points = total_points + $1, updated_at = now() WHERE user_id = $2', v_stat_column, v_stat_column)
    USING v_new_points, NEW.user_id;
  ELSE
    UPDATE public.user_stats 
    SET total_points = total_points + v_new_points, updated_at = now() 
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update level based on new points
  UPDATE public.user_stats
  SET level = public.calculate_level(total_points)
  WHERE user_id = NEW.user_id;

  -- Update streak
  UPDATE public.user_stats
  SET 
    current_streak = CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_activity_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN GREATEST(longest_streak, current_streak + 1)
      WHEN last_activity_date = CURRENT_DATE THEN longest_streak
      ELSE GREATEST(longest_streak, 1)
    END,
    last_activity_date = CURRENT_DATE
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Trigger to update stats when activity is logged
CREATE TRIGGER on_activity_logged
  AFTER INSERT ON public.user_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  current_value integer;
BEGIN
  -- Loop through all achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = NEW.user_id 
      AND achievement_id = achievement_record.id
    ) THEN
      -- Get current stat value based on achievement category
      CASE achievement_record.category
        WHEN 'bible' THEN
          current_value := NEW.bible_chapters_read;
        WHEN 'prayer' THEN
          IF achievement_record.requirement_type = 'count' THEN
            current_value := NEW.prayers_created + NEW.prayers_interceded;
          ELSE
            current_value := NEW.prayers_created;
          END IF;
        WHEN 'event' THEN
          current_value := NEW.events_participated;
        WHEN 'testimony' THEN
          current_value := NEW.testimonies_shared;
        WHEN 'social' THEN
          IF achievement_record.requirement_type = 'streak' THEN
            current_value := NEW.current_streak;
          ELSE
            current_value := NEW.total_points;
          END IF;
        ELSE
          current_value := 0;
      END CASE;

      -- Award achievement if requirement is met
      IF current_value >= achievement_record.requirement_value THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_record.id);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to check achievements when stats are updated
CREATE TRIGGER on_stats_updated
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_achievements();

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points, level) VALUES
-- Bible achievements
('Primeiro Passo', 'Leia seu primeiro capítulo da Bíblia', '📖', 'bible', 'count', 1, 10, 'bronze'),
('Estudante da Palavra', 'Leia 10 capítulos da Bíblia', '📚', 'bible', 'count', 10, 50, 'silver'),
('Conhecedor das Escrituras', 'Leia 50 capítulos da Bíblia', '✨', 'bible', 'count', 50, 200, 'gold'),
('Mestre Bíblico', 'Leia 100 capítulos da Bíblia', '👑', 'bible', 'count', 100, 500, 'platinum'),

-- Prayer achievements
('Primeira Oração', 'Crie seu primeiro pedido de oração', '🙏', 'prayer', 'count', 1, 5, 'bronze'),
('Intercessor', 'Interceda por 10 pedidos de oração', '💫', 'prayer', 'count', 10, 30, 'silver'),
('Guerreiro de Oração', 'Interceda por 50 pedidos de oração', '⚡', 'prayer', 'count', 50, 150, 'gold'),
('Altar de Oração', 'Interceda por 100 pedidos de oração', '🔥', 'prayer', 'count', 100, 400, 'platinum'),

-- Event achievements
('Participante', 'Participe do seu primeiro evento', '🎉', 'event', 'count', 1, 15, 'bronze'),
('Engajado', 'Participe de 5 eventos', '🌟', 'event', 'count', 5, 75, 'silver'),
('Ativo na Comunidade', 'Participe de 15 eventos', '💎', 'event', 'count', 15, 250, 'gold'),

-- Testimony achievements
('Primeira Glória', 'Compartilhe seu primeiro testemunho', '✝️', 'testimony', 'count', 1, 20, 'bronze'),
('Testemunhador', 'Compartilhe 5 testemunhos', '🕊️', 'testimony', 'count', 5, 100, 'silver'),
('Evangelista', 'Compartilhe 10 testemunhos', '🌈', 'testimony', 'count', 10, 300, 'gold'),

-- Social/Streak achievements
('Dedicação', 'Mantenha um streak de 3 dias', '📅', 'social', 'streak', 3, 30, 'bronze'),
('Constância', 'Mantenha um streak de 7 dias', '🗓️', 'social', 'streak', 7, 70, 'silver'),
('Fidelidade', 'Mantenha um streak de 30 dias', '📆', 'social', 'streak', 30, 300, 'gold'),
('Perseverança', 'Mantenha um streak de 100 dias', '⭐', 'social', 'streak', 100, 1000, 'platinum');