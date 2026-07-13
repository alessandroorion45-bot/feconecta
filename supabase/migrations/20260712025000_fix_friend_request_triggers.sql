-- ============================================================
-- FIX: triggers de notificação de amizade estavam ausentes
-- ============================================================
-- friend_requests não tinha NENHUM trigger — nem o que notifica um
-- pedido novo, nem o que cria a amizade + notifica quando é aceito.
-- Mesma causa raiz identificada depois em mais 30 triggers (ver
-- 20260712030000_fix_missing_triggers_bulk.sql).
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, content)
  VALUES (
    NEW.receiver_id,
    NEW.sender_id,
    'friend_request',
    'enviou um pedido de amizade'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_friend_request_created ON public.friend_requests;
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

CREATE OR REPLACE FUNCTION public.create_friendship_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friendships (user_id_1, user_id_2)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.notifications (user_id, actor_id, type, content)
    VALUES (
      NEW.sender_id,
      NEW.receiver_id,
      'friend_accepted',
      'aceitou seu pedido de amizade! 🎉'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friendship_on_accept();

SELECT 'ok' as status;
