DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
DROP TRIGGER IF EXISTS on_friend_request_created ON public.friend_requests;
DROP TRIGGER IF EXISTS on_new_message ON public.messages;

CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friendship_on_accept();

CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();