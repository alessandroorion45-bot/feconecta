-- Ensure all functions have proper search_path set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Membro'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_level(points integer)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
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
  INSERT INTO user_stats (user_id)
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
    EXECUTE format('UPDATE user_stats SET %I = %I + 1, total_points = total_points + $1, updated_at = now() WHERE user_id = $2', v_stat_column, v_stat_column)
    USING v_new_points, NEW.user_id;
  ELSE
    UPDATE user_stats 
    SET total_points = total_points + v_new_points, updated_at = now() 
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update level based on new points
  UPDATE user_stats
  SET level = calculate_level(total_points)
  WHERE user_id = NEW.user_id;

  -- Update streak
  UPDATE user_stats
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
    SELECT * FROM achievements
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
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
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_record.id);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;