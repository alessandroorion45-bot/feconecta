-- Create trigger function for photo like notifications
CREATE OR REPLACE FUNCTION public.notify_photo_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_owner_id uuid;
BEGIN
  -- Get the photo owner
  SELECT user_id INTO photo_owner_id
  FROM profile_photos WHERE id = NEW.photo_id;
  
  -- Don't notify if user likes their own photo
  IF photo_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      photo_owner_id,
      NEW.user_id,
      'photo_like',
      'curtiu sua foto 📸',
      NEW.photo_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER notify_photo_like_trigger
AFTER INSERT ON public.photo_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_photo_like();