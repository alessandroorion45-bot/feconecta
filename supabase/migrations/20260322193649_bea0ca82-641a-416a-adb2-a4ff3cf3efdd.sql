-- Attach ALL orphaned trigger functions to their respective tables

-- 1. Friend requests
DROP TRIGGER IF EXISTS on_friend_request_created ON public.friend_requests;
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_friendship_on_accept();

-- 2. Messages
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 3. Testimony interactions
DROP TRIGGER IF EXISTS on_testimony_like ON public.testimony_likes;
CREATE TRIGGER on_testimony_like
  AFTER INSERT ON public.testimony_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_like();

DROP TRIGGER IF EXISTS on_testimony_comment ON public.testimony_comments;
CREATE TRIGGER on_testimony_comment
  AFTER INSERT ON public.testimony_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_comment();

DROP TRIGGER IF EXISTS on_testimony_glory ON public.testimony_glories;
CREATE TRIGGER on_testimony_glory
  AFTER INSERT ON public.testimony_glories
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_glory();

-- 4. Post interactions
DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

DROP TRIGGER IF EXISTS on_post_comment ON public.post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- 5. Event participation
DROP TRIGGER IF EXISTS on_event_participation ON public.event_participants;
CREATE TRIGGER on_event_participation
  AFTER INSERT ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_participation();

-- 6. Achievements
DROP TRIGGER IF EXISTS on_achievement_earned ON public.user_achievements;
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.notify_achievement_earned();

-- 7. Photo interactions
DROP TRIGGER IF EXISTS on_photo_like ON public.photo_likes;
CREATE TRIGGER on_photo_like
  AFTER INSERT ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_like();

DROP TRIGGER IF EXISTS on_photo_comment ON public.photo_comments;
CREATE TRIGGER on_photo_comment
  AFTER INSERT ON public.photo_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_comment();

-- 8. Video interactions
DROP TRIGGER IF EXISTS on_video_like ON public.video_likes;
CREATE TRIGGER on_video_like
  AFTER INSERT ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_like();

DROP TRIGGER IF EXISTS on_video_comment ON public.video_comments;
CREATE TRIGGER on_video_comment
  AFTER INSERT ON public.video_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_comment();

-- 9. Friend testimonials
DROP TRIGGER IF EXISTS on_new_testimonial ON public.friend_testimonials;
CREATE TRIGGER on_new_testimonial
  AFTER INSERT ON public.friend_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_testimonial();

DROP TRIGGER IF EXISTS on_testimonial_status ON public.friend_testimonials;
CREATE TRIGGER on_testimonial_status
  AFTER UPDATE ON public.friend_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimonial_status();

-- 10. Block user cleanup
DROP TRIGGER IF EXISTS on_block_user ON public.blocked_users;
CREATE TRIGGER on_block_user
  AFTER INSERT ON public.blocked_users
  FOR EACH ROW EXECUTE FUNCTION public.remove_friendship_on_block();

-- 11. Faith posts
DROP TRIGGER IF EXISTS on_faith_post ON public.faith_posts;
CREATE TRIGGER on_faith_post
  AFTER INSERT ON public.faith_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_faith_post();

-- 12. Count-update triggers
DROP TRIGGER IF EXISTS on_photo_like_count ON public.photo_likes;
CREATE TRIGGER on_photo_like_count
  AFTER INSERT OR DELETE ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_photo_likes_count();

DROP TRIGGER IF EXISTS on_video_like_count ON public.video_likes;
CREATE TRIGGER on_video_like_count
  AFTER INSERT OR DELETE ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();

DROP TRIGGER IF EXISTS on_worship_like_count ON public.worship_likes;
CREATE TRIGGER on_worship_like_count
  AFTER INSERT OR DELETE ON public.worship_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_worship_likes_count();

DROP TRIGGER IF EXISTS on_worship_comment_count ON public.worship_comments;
CREATE TRIGGER on_worship_comment_count
  AFTER INSERT OR DELETE ON public.worship_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_worship_comments_count();

-- 13. Prayer group member count
DROP TRIGGER IF EXISTS on_prayer_group_member ON public.prayer_group_members;
CREATE TRIGGER on_prayer_group_member
  AFTER INSERT OR DELETE ON public.prayer_group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_prayer_group_member_count();

-- 14. Community member count
DROP TRIGGER IF EXISTS on_community_member_count ON public.church_community_members;
CREATE TRIGGER on_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.church_community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- 15. Admin transfer vote counts
DROP TRIGGER IF EXISTS on_admin_vote ON public.admin_transfer_votes;
CREATE TRIGGER on_admin_vote
  AFTER INSERT ON public.admin_transfer_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_transfer_vote_counts();

-- 16. User stats and achievements
DROP TRIGGER IF EXISTS on_user_activity ON public.user_activities;
CREATE TRIGGER on_user_activity
  AFTER INSERT ON public.user_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

DROP TRIGGER IF EXISTS on_check_achievements ON public.user_stats;
CREATE TRIGGER on_check_achievements
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.check_and_award_achievements();

DROP TRIGGER IF EXISTS on_challenge_progress ON public.user_stats;
CREATE TRIGGER on_challenge_progress
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_progress();

-- 17. Bible question answer count
DROP TRIGGER IF EXISTS on_question_answer ON public.bible_question_answers;
CREATE TRIGGER on_question_answer
  AFTER INSERT OR DELETE ON public.bible_question_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_question_answer_count();

-- 18. Prayer group invite code
DROP TRIGGER IF EXISTS on_prayer_group_invite ON public.prayer_groups;
CREATE TRIGGER on_prayer_group_invite
  BEFORE INSERT ON public.prayer_groups
  FOR EACH ROW EXECUTE FUNCTION public.generate_group_invite_code();