-- Create triggers for additional notification types

-- Trigger for testimony likes
CREATE OR REPLACE FUNCTION public.notify_testimony_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  testimony_owner_id uuid;
BEGIN
  -- Get the testimony owner
  SELECT user_id INTO testimony_owner_id
  FROM testimonies WHERE id = NEW.testimony_id;
  
  -- Don't notify if user likes their own testimony
  IF testimony_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      testimony_owner_id,
      NEW.user_id,
      'testimony_like',
      'curtiu seu testemunho ❤️',
      NEW.testimony_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_testimony_like ON testimony_likes;
CREATE TRIGGER on_testimony_like
  AFTER INSERT ON testimony_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_testimony_like();

-- Trigger for testimony comments
CREATE OR REPLACE FUNCTION public.notify_testimony_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  testimony_owner_id uuid;
BEGIN
  -- Get the testimony owner
  SELECT user_id INTO testimony_owner_id
  FROM testimonies WHERE id = NEW.testimony_id;
  
  -- Don't notify if user comments on their own testimony
  IF testimony_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      testimony_owner_id,
      NEW.user_id,
      'testimony_comment',
      'comentou em seu testemunho 💬',
      NEW.testimony_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_testimony_comment ON testimony_comments;
CREATE TRIGGER on_testimony_comment
  AFTER INSERT ON testimony_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_testimony_comment();

-- Trigger for prayer intercessors
CREATE OR REPLACE FUNCTION public.notify_prayer_intercession()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  prayer_owner_id uuid;
BEGIN
  -- Get the prayer owner
  SELECT user_id INTO prayer_owner_id
  FROM prayers WHERE id = NEW.prayer_id;
  
  -- Don't notify if user intercedes for their own prayer
  IF prayer_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      prayer_owner_id,
      NEW.user_id,
      'prayer_intercession',
      'está orando por você 🙏',
      NEW.prayer_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_prayer_intercession ON prayer_intercessors;
CREATE TRIGGER on_prayer_intercession
  AFTER INSERT ON prayer_intercessors
  FOR EACH ROW
  EXECUTE FUNCTION notify_prayer_intercession();

-- Trigger for event participation
CREATE OR REPLACE FUNCTION public.notify_event_participation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_owner_id uuid;
BEGIN
  -- Get the event owner
  SELECT user_id INTO event_owner_id
  FROM events WHERE id = NEW.event_id;
  
  -- Don't notify if user joins their own event
  IF event_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      event_owner_id,
      NEW.user_id,
      'event_join',
      'confirmou presença no seu evento 📅',
      NEW.event_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_event_participation ON event_participants;
CREATE TRIGGER on_event_participation
  AFTER INSERT ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_participation();

-- Trigger for post likes
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      post_owner_id,
      NEW.user_id,
      'post_like',
      'curtiu sua publicação ❤️',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_post_like ON post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- Trigger for post comments
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      post_owner_id,
      NEW.user_id,
      'post_comment',
      'comentou na sua publicação 💬',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_post_comment ON post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- Trigger for new achievements
CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  achievement_name text;
BEGIN
  -- Get the achievement name
  SELECT name INTO achievement_name
  FROM achievements WHERE id = NEW.achievement_id;
  
  INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
  VALUES (
    NEW.user_id,
    NEW.user_id,
    'achievement',
    'Você desbloqueou a conquista "' || achievement_name || '" 🏆',
    NEW.achievement_id
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_achievement_earned ON user_achievements;
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_earned();

-- Trigger for testimony glories
CREATE OR REPLACE FUNCTION public.notify_testimony_glory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  testimony_owner_id uuid;
BEGIN
  -- Get the testimony owner
  SELECT user_id INTO testimony_owner_id
  FROM testimonies WHERE id = NEW.testimony_id;
  
  -- Don't notify if user glories their own testimony
  IF testimony_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      testimony_owner_id,
      NEW.user_id,
      'testimony_glory',
      'glorificou a Deus pelo seu testemunho 🙌',
      NEW.testimony_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_testimony_glory ON testimony_glories;
CREATE TRIGGER on_testimony_glory
  AFTER INSERT ON testimony_glories
  FOR EACH ROW
  EXECUTE FUNCTION notify_testimony_glory();