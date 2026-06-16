-- Fix search_path for update_challenge_progress function
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
    FROM challenges c
    LEFT JOIN user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = NEW.user_id
    WHERE c.is_active = true 
    AND now() BETWEEN c.start_date AND c.end_date
    AND (uc.is_completed IS NULL OR uc.is_completed = false)
  LOOP
    -- Calculate progress based on challenge type
    CASE challenge_record.challenge_type
      WHEN 'bible_read' THEN
        SELECT bible_chapters_read INTO progress_value
        FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'prayer' THEN
        SELECT prayers_created + prayers_interceded INTO progress_value
        FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'streak' THEN
        SELECT current_streak INTO progress_value
        FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'social' THEN
        SELECT testimonies_shared + events_participated INTO progress_value
        FROM user_stats WHERE user_id = NEW.user_id;
      ELSE
        progress_value := 0;
    END CASE;

    -- Insert or update challenge progress
    IF challenge_record.user_challenge_id IS NULL THEN
      INSERT INTO user_challenges (user_id, challenge_id, current_progress)
      VALUES (NEW.user_id, challenge_record.id, progress_value);
    ELSE
      UPDATE user_challenges
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
           SELECT 1 FROM user_badges 
           WHERE user_id = NEW.user_id 
           AND badge_name = challenge_record.badge_reward
         ) THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon, badge_color)
        VALUES (NEW.user_id, 'challenge', challenge_record.badge_reward, challenge_record.icon, 'from-purple-500 to-pink-500');
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;