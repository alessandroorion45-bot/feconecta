
-- Re-attach ALL orphaned trigger functions to their tables

-- 1. Friend request accepted -> create friendship
DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_friendship_on_accept();

-- 2. Friend request created -> notify receiver
DROP TRIGGER IF EXISTS on_friend_request_created ON public.friend_requests;
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

-- 3. New message -> notify receiver
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 4. Testimony like
DROP TRIGGER IF EXISTS on_testimony_like ON public.testimony_likes;
CREATE TRIGGER on_testimony_like
  AFTER INSERT ON public.testimony_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_like();

-- 5. Testimony comment
DROP TRIGGER IF EXISTS on_testimony_comment ON public.testimony_comments;
CREATE TRIGGER on_testimony_comment
  AFTER INSERT ON public.testimony_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_comment();

-- 6. Testimony glory
DROP TRIGGER IF EXISTS on_testimony_glory ON public.testimony_glories;
CREATE TRIGGER on_testimony_glory
  AFTER INSERT ON public.testimony_glories
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_glory();

-- 7. Post like
DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

-- 8. Post comment
DROP TRIGGER IF EXISTS on_post_comment ON public.post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- 9. Prayer intercession (table is prayer_intercessors)
DROP TRIGGER IF EXISTS on_prayer_intercession ON public.prayer_intercessors;
CREATE TRIGGER on_prayer_intercession
  AFTER INSERT ON public.prayer_intercessors
  FOR EACH ROW EXECUTE FUNCTION public.notify_prayer_intercession();

-- 10. Event participation
DROP TRIGGER IF EXISTS on_event_participation ON public.event_participants;
CREATE TRIGGER on_event_participation
  AFTER INSERT ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_participation();

-- 11. Achievement earned
DROP TRIGGER IF EXISTS on_achievement_earned ON public.user_achievements;
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.notify_achievement_earned();

-- 12. Photo like
DROP TRIGGER IF EXISTS on_photo_like ON public.photo_likes;
CREATE TRIGGER on_photo_like
  AFTER INSERT ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_like();

-- 13. Photo comment
DROP TRIGGER IF EXISTS on_photo_comment ON public.photo_comments;
CREATE TRIGGER on_photo_comment
  AFTER INSERT ON public.photo_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_comment();

-- 14. Video like
DROP TRIGGER IF EXISTS on_video_like ON public.video_likes;
CREATE TRIGGER on_video_like
  AFTER INSERT ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_like();

-- 15. Video comment
DROP TRIGGER IF EXISTS on_video_comment ON public.video_comments;
CREATE TRIGGER on_video_comment
  AFTER INSERT ON public.video_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_comment();

-- 16. New testimonial
DROP TRIGGER IF EXISTS on_new_testimonial ON public.friend_testimonials;
CREATE TRIGGER on_new_testimonial
  AFTER INSERT ON public.friend_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_testimonial();

-- 17. Testimonial status change
DROP TRIGGER IF EXISTS on_testimonial_status ON public.friend_testimonials;
CREATE TRIGGER on_testimonial_status
  AFTER UPDATE ON public.friend_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimonial_status();

-- 18. Block user -> remove friendship
DROP TRIGGER IF EXISTS on_block_user ON public.blocked_users;
CREATE TRIGGER on_block_user
  AFTER INSERT ON public.blocked_users
  FOR EACH ROW EXECUTE FUNCTION public.remove_friendship_on_block();

-- 19. Faith post notification
DROP TRIGGER IF EXISTS on_faith_post ON public.faith_posts;
CREATE TRIGGER on_faith_post
  AFTER INSERT ON public.faith_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_faith_post();

-- 20. Photo likes count
DROP TRIGGER IF EXISTS on_photo_likes_count ON public.photo_likes;
CREATE TRIGGER on_photo_likes_count
  AFTER INSERT OR DELETE ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_photo_likes_count();

-- 21. Video likes count
DROP TRIGGER IF EXISTS on_video_likes_count ON public.video_likes;
CREATE TRIGGER on_video_likes_count
  AFTER INSERT OR DELETE ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();

-- 22. Worship likes count
DROP TRIGGER IF EXISTS on_worship_likes_count ON public.worship_likes;
CREATE TRIGGER on_worship_likes_count
  AFTER INSERT OR DELETE ON public.worship_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_worship_likes_count();

-- 23. Worship comments count
DROP TRIGGER IF EXISTS on_worship_comments_count ON public.worship_comments;
CREATE TRIGGER on_worship_comments_count
  AFTER INSERT OR DELETE ON public.worship_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_worship_comments_count();

-- 24. Community member count
DROP TRIGGER IF EXISTS on_community_member_count ON public.church_community_members;
CREATE TRIGGER on_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.church_community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- 25. Prayer group member count
DROP TRIGGER IF EXISTS on_prayer_group_member_count ON public.prayer_group_members;
CREATE TRIGGER on_prayer_group_member_count
  AFTER INSERT OR DELETE ON public.prayer_group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_prayer_group_member_count();

-- 26. Group prayer stats
DROP TRIGGER IF EXISTS on_group_prayer_stats ON public.prayers;
CREATE TRIGGER on_group_prayer_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.update_group_prayer_stats();

-- 27. Admin transfer vote counts
DROP TRIGGER IF EXISTS on_admin_transfer_vote ON public.admin_transfer_votes;
CREATE TRIGGER on_admin_transfer_vote
  AFTER INSERT ON public.admin_transfer_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_transfer_vote_counts();

-- 28. Question answer count
DROP TRIGGER IF EXISTS on_question_answer_count ON public.bible_question_answers;
CREATE TRIGGER on_question_answer_count
  AFTER INSERT OR DELETE ON public.bible_question_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_question_answer_count();

-- 29. Prayer group invite code
DROP TRIGGER IF EXISTS on_prayer_group_invite_code ON public.prayer_groups;
CREATE TRIGGER on_prayer_group_invite_code
  BEFORE INSERT ON public.prayer_groups
  FOR EACH ROW EXECUTE FUNCTION public.generate_group_invite_code();

-- 30. Group intercessor stats (table is prayer_intercessors)
DROP TRIGGER IF EXISTS on_group_intercessor_stats ON public.prayer_intercessors;
CREATE TRIGGER on_group_intercessor_stats
  AFTER INSERT OR DELETE ON public.prayer_intercessors
  FOR EACH ROW EXECUTE FUNCTION public.update_group_intercessor_stats();

-- 31. User stats update
DROP TRIGGER IF EXISTS on_user_stats_update ON public.user_activities;
CREATE TRIGGER on_user_stats_update
  AFTER INSERT ON public.user_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- 32. Check and award achievements
DROP TRIGGER IF EXISTS on_check_achievements ON public.user_stats;
CREATE TRIGGER on_check_achievements
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.check_and_award_achievements();

-- 33. Challenge progress
DROP TRIGGER IF EXISTS on_challenge_progress ON public.user_stats;
CREATE TRIGGER on_challenge_progress
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_progress();

-- 34. Prayer comment notification
DROP TRIGGER IF EXISTS on_prayer_comment ON public.prayer_comments;
CREATE TRIGGER on_prayer_comment
  AFTER INSERT ON public.prayer_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_prayer_comment_interaction();

-- 35. Shared reading stats
DROP TRIGGER IF EXISTS on_shared_reading_stats ON public.shared_reading_quiz_answers;
CREATE TRIGGER on_shared_reading_stats
  AFTER INSERT ON public.shared_reading_quiz_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_shared_reading_stats();

-- 36. Scheduled prayer attendance (table is scheduled_prayer_attendees)
DROP TRIGGER IF EXISTS on_scheduled_attendance ON public.scheduled_prayer_attendees;
CREATE TRIGGER on_scheduled_attendance
  AFTER INSERT OR DELETE ON public.scheduled_prayer_attendees
  FOR EACH ROW EXECUTE FUNCTION public.update_scheduled_attendance_stats();
