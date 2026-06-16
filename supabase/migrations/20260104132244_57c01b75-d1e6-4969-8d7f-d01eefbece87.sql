-- =====================================================
-- SHARED READING MEDALS/BADGES DEFINITIONS
-- =====================================================

-- Insert shared reading achievement badges
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, level, points)
VALUES 
  -- Reading badges
  ('Discípulo Atento', 'Complete 5 capítulos em leitura compartilhada', '📖', 'shared_reading', 'chapters_completed', 5, 'bronze', 50),
  ('Guardião da Palavra', 'Complete 15 capítulos em leitura compartilhada', '🛡️', 'shared_reading', 'chapters_completed', 15, 'silver', 100),
  ('Mestre das Escrituras', 'Complete 30 capítulos em leitura compartilhada', '👑', 'shared_reading', 'chapters_completed', 30, 'gold', 200),
  ('Apóstolo da Leitura', 'Complete 50 capítulos em leitura compartilhada', '✨', 'shared_reading', 'chapters_completed', 50, 'platinum', 500),
  
  -- Quiz accuracy badges
  ('Estudante Dedicado', 'Acerte 25 questões no quiz em grupo', '🎯', 'shared_reading', 'quiz_correct', 25, 'bronze', 50),
  ('Sábio Bíblico', 'Acerte 50 questões no quiz em grupo', '📚', 'shared_reading', 'quiz_correct', 50, 'silver', 100),
  ('Mestre do Quiz', 'Acerte 100 questões no quiz em grupo', '🧠', 'shared_reading', 'quiz_correct', 100, 'gold', 200),
  
  -- Session badges
  ('Companheiro de Jornada', 'Participe de 3 sessões de leitura', '🤝', 'shared_reading', 'sessions', 3, 'bronze', 30),
  ('Líder Espiritual', 'Seja anfitrião de 5 sessões de leitura', '🌟', 'shared_reading', 'sessions_hosted', 5, 'silver', 75),
  ('Pastor Digital', 'Seja anfitrião de 15 sessões de leitura', '⛪', 'shared_reading', 'sessions_hosted', 15, 'gold', 150),
  
  -- Streak badges
  ('Fiel na Comunhão', 'Complete 3 dias seguidos de leitura em grupo', '🔥', 'shared_reading', 'streak', 3, 'bronze', 40),
  ('Perseverante', 'Complete 7 dias seguidos de leitura em grupo', '💪', 'shared_reading', 'streak', 7, 'silver', 100),
  ('Inabalável', 'Complete 14 dias seguidos de leitura em grupo', '🏆', 'shared_reading', 'streak', 14, 'gold', 250)
ON CONFLICT DO NOTHING;

-- Add sessions_hosted column to shared_reading_stats if needed
ALTER TABLE public.shared_reading_stats 
ADD COLUMN IF NOT EXISTS sessions_hosted INTEGER NOT NULL DEFAULT 0;

-- Function to update shared reading stats and check achievements
CREATE OR REPLACE FUNCTION public.update_shared_reading_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
  v_current_value INTEGER;
BEGIN
  -- Initialize stats if not exists
  INSERT INTO shared_reading_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the appropriate stat
  IF TG_TABLE_NAME = 'shared_reading_quiz_answers' THEN
    IF NEW.is_correct THEN
      UPDATE shared_reading_stats 
      SET total_correct_answers = total_correct_answers + 1,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSE
      UPDATE shared_reading_stats 
      SET total_wrong_answers = total_wrong_answers + 1,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to increment chapters completed
CREATE OR REPLACE FUNCTION public.increment_chapters_completed(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
  v_stats shared_reading_stats%ROWTYPE;
BEGIN
  -- Initialize stats if not exists
  INSERT INTO shared_reading_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update chapters completed
  UPDATE shared_reading_stats 
  SET total_chapters_completed = total_chapters_completed + 1,
      total_sessions = total_sessions + 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Get updated stats
  SELECT * INTO v_stats FROM shared_reading_stats WHERE user_id = p_user_id;

  -- Check and award achievements
  FOR v_achievement IN 
    SELECT * FROM achievements 
    WHERE category = 'shared_reading' 
    AND id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = p_user_id)
  LOOP
    CASE v_achievement.requirement_type
      WHEN 'chapters_completed' THEN
        IF v_stats.total_chapters_completed >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          
          -- Update user_stats total_points
          UPDATE user_stats 
          SET total_points = total_points + v_achievement.points
          WHERE user_id = p_user_id;
        END IF;
      WHEN 'quiz_correct' THEN
        IF v_stats.total_correct_answers >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          
          UPDATE user_stats 
          SET total_points = total_points + v_achievement.points
          WHERE user_id = p_user_id;
        END IF;
      WHEN 'sessions' THEN
        IF v_stats.total_sessions >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          
          UPDATE user_stats 
          SET total_points = total_points + v_achievement.points
          WHERE user_id = p_user_id;
        END IF;
      WHEN 'sessions_hosted' THEN
        IF v_stats.sessions_hosted >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          
          UPDATE user_stats 
          SET total_points = total_points + v_achievement.points
          WHERE user_id = p_user_id;
        END IF;
      WHEN 'streak' THEN
        IF v_stats.current_streak >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (p_user_id, v_achievement.id)
          ON CONFLICT DO NOTHING;
          
          UPDATE user_stats 
          SET total_points = total_points + v_achievement.points
          WHERE user_id = p_user_id;
        END IF;
      ELSE
        NULL;
    END CASE;
  END LOOP;
END;
$$;

-- Function to increment sessions hosted
CREATE OR REPLACE FUNCTION public.increment_sessions_hosted(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialize stats if not exists
  INSERT INTO shared_reading_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE shared_reading_stats 
  SET sessions_hosted = sessions_hosted + 1,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Trigger for quiz answers
DROP TRIGGER IF EXISTS update_shared_reading_stats_trigger ON shared_reading_quiz_answers;
CREATE TRIGGER update_shared_reading_stats_trigger
AFTER INSERT ON shared_reading_quiz_answers
FOR EACH ROW
EXECUTE FUNCTION update_shared_reading_stats();