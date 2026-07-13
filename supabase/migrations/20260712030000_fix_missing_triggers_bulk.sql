-- ============================================================
-- FIX EM MASSA: 30 triggers ausentes (notificações + contadores)
-- ============================================================
-- Mesma causa raiz do bug de RLS já corrigido: 32 dos 36 triggers
-- esperados no banco simplesmente não existiam (2 corrigidos à parte
-- em friend_requests, 2 eram de tabelas que não existem mais —
-- worship_likes/worship_comments, funcionalidade removida).
--
-- Isso derrubava silenciosamente: notificações de curtida/comentário
-- em posts, fotos, vídeos e testemunhos; notificação de depoimento de
-- amigo (criado/aprovado/rejeitado); notificação de participação em
-- evento e palavra de fé; remoção de amizade ao bloquear; contadores
-- de curtidas em fotos/vídeos; contador de membros da comunidade;
-- estatísticas de grupos de oração; XP/nível/streak/conquistas;
-- progresso de desafios; código de convite de grupo de oração.
-- ============================================================

-- ---------------------------------------------
-- 1. admin_transfer_votes.on_admin_transfer_vote
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_admin_transfer_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = true THEN
      UPDATE admin_transfer_votings SET votes_yes = votes_yes + 1 WHERE id = NEW.voting_id;
    ELSE
      UPDATE admin_transfer_votings SET votes_no = votes_no + 1 WHERE id = NEW.voting_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_admin_transfer_vote ON public.admin_transfer_votes;
CREATE TRIGGER on_admin_transfer_vote
  AFTER INSERT ON public.admin_transfer_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_transfer_vote_counts();

-- ---------------------------------------------
-- 2. bible_question_answers.on_question_answer_count
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_question_answer_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE bible_questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bible_questions SET answers_count = GREATEST(0, answers_count - 1) WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_question_answer_count ON public.bible_question_answers;
CREATE TRIGGER on_question_answer_count
  AFTER INSERT OR DELETE ON public.bible_question_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_question_answer_count();

-- ---------------------------------------------
-- 3. blocked_users.on_block_user
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_friendship_on_block()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM friendships
  WHERE (user_id_1 = LEAST(NEW.blocker_id, NEW.blocked_id)
    AND user_id_2 = GREATEST(NEW.blocker_id, NEW.blocked_id));

  DELETE FROM friend_requests
  WHERE (sender_id = NEW.blocker_id AND receiver_id = NEW.blocked_id)
     OR (sender_id = NEW.blocked_id AND receiver_id = NEW.blocker_id);

  DELETE FROM followers
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_block_user ON public.blocked_users;
CREATE TRIGGER on_block_user
  AFTER INSERT ON public.blocked_users
  FOR EACH ROW EXECUTE FUNCTION public.remove_friendship_on_block();

-- ---------------------------------------------
-- 4. church_community_members.on_community_member_count
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    UPDATE church_communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true) THEN
    UPDATE church_communities SET member_count = GREATEST(0, member_count - 1) WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_community_member_count ON public.church_community_members;
CREATE TRIGGER on_community_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.church_community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- ---------------------------------------------
-- 5. event_participants.on_event_participation
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_event_participation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  event_owner_id uuid;
BEGIN
  SELECT user_id INTO event_owner_id FROM events WHERE id = NEW.event_id;

  IF event_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (event_owner_id, NEW.user_id, 'event_join', 'confirmou presença no seu evento 📅', NEW.event_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_event_participation ON public.event_participants;
CREATE TRIGGER on_event_participation
  AFTER INSERT ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_participation();

-- ---------------------------------------------
-- 6. faith_posts.on_faith_post
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_faith_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
  VALUES (NEW.recipient_id, NEW.author_id, 'faith_post', 'enviou uma palavra de fé para você ✨', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_faith_post ON public.faith_posts;
CREATE TRIGGER on_faith_post
  AFTER INSERT ON public.faith_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_faith_post();

-- ---------------------------------------------
-- 7-8. friend_testimonials.on_new_testimonial / on_testimonial_status
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_testimonial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
  VALUES (NEW.recipient_id, NEW.author_id, 'friend_testimonial', 'escreveu um depoimento sobre você! Aguardando sua aprovação ✨', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_testimonial ON public.friend_testimonials;
CREATE TRIGGER on_new_testimonial
  AFTER INSERT ON public.friend_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_testimonial();

CREATE OR REPLACE FUNCTION public.notify_testimonial_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (NEW.author_id, NEW.recipient_id, 'testimonial_approved', 'aprovou seu depoimento! 🎉', NEW.id);
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (NEW.author_id, NEW.recipient_id, 'testimonial_rejected', 'não aprovou seu depoimento', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_testimonial_status ON public.friend_testimonials;
CREATE TRIGGER on_testimonial_status
  AFTER UPDATE ON public.friend_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimonial_status();

-- ---------------------------------------------
-- 9. messages.on_new_message
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
  VALUES (NEW.receiver_id, NEW.sender_id, 'message', 'enviou uma mensagem', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ---------------------------------------------
-- 10-12. photo_comments / photo_likes
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_photo_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  photo_owner_id uuid;
BEGIN
  SELECT user_id INTO photo_owner_id FROM profile_photos WHERE id = NEW.photo_id;
  IF photo_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (photo_owner_id, NEW.user_id, 'photo_comment', 'comentou na sua foto 💬', NEW.photo_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_photo_comment ON public.photo_comments;
CREATE TRIGGER on_photo_comment
  AFTER INSERT ON public.photo_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_comment();

CREATE OR REPLACE FUNCTION public.notify_photo_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  photo_owner_id uuid;
BEGIN
  SELECT user_id INTO photo_owner_id FROM profile_photos WHERE id = NEW.photo_id;
  IF photo_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (photo_owner_id, NEW.user_id, 'photo_like', 'curtiu sua foto 📸', NEW.photo_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_photo_like ON public.photo_likes;
CREATE TRIGGER on_photo_like
  AFTER INSERT ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_photo_like();

CREATE OR REPLACE FUNCTION public.update_photo_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profile_photos SET likes_count = likes_count + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profile_photos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_photo_likes_count ON public.photo_likes;
CREATE TRIGGER on_photo_likes_count
  AFTER INSERT OR DELETE ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_photo_likes_count();

-- ---------------------------------------------
-- 13-14. post_comments.on_post_comment / post_likes.on_post_like
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (post_owner_id, NEW.user_id, 'post_comment', 'comentou na sua publicação 💬', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_post_comment ON public.post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (post_owner_id, NEW.user_id, 'post_like', 'curtiu sua publicação ❤️', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

-- ---------------------------------------------
-- 15-16. prayer_group_members / prayer_groups
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_prayer_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.prayer_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.prayer_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_prayer_group_member_count ON public.prayer_group_members;
CREATE TRIGGER on_prayer_group_member_count
  AFTER INSERT OR DELETE ON public.prayer_group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_prayer_group_member_count();

CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS on_prayer_group_invite_code ON public.prayer_groups;
CREATE TRIGGER on_prayer_group_invite_code
  BEFORE INSERT ON public.prayer_groups
  FOR EACH ROW EXECUTE FUNCTION public.generate_group_invite_code();

-- ---------------------------------------------
-- 17-19. prayer_intercessors / prayers / scheduled_prayer_attendees
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_group_intercessor_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id UUID;
BEGIN
    SELECT group_id INTO v_group_id FROM public.prayers WHERE id = COALESCE(NEW.prayer_id, OLD.prayer_id);

    IF v_group_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.prayer_group_member_stats (group_id, user_id, prayers_interceded)
            VALUES (v_group_id, NEW.user_id, 1)
            ON CONFLICT (group_id, user_id) DO UPDATE
            SET prayers_interceded = prayer_group_member_stats.prayers_interceded + 1,
                updated_at = now();
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.prayer_group_member_stats
            SET prayers_interceded = GREATEST(0, prayers_interceded - 1), updated_at = now()
            WHERE group_id = v_group_id AND user_id = OLD.user_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_group_intercessor_stats ON public.prayer_intercessors;
CREATE TRIGGER on_group_intercessor_stats
  AFTER INSERT OR DELETE ON public.prayer_intercessors
  FOR EACH ROW EXECUTE FUNCTION public.update_group_intercessor_stats();

CREATE OR REPLACE FUNCTION public.update_group_prayer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
        INSERT INTO public.prayer_group_stats (group_id, total_prayers)
        VALUES (NEW.group_id, 1)
        ON CONFLICT (group_id) DO UPDATE
        SET total_prayers = prayer_group_stats.total_prayers + 1,
            updated_at = now();

        INSERT INTO public.prayer_group_member_stats (group_id, user_id, prayers_created)
        VALUES (NEW.group_id, NEW.user_id, 1)
        ON CONFLICT (group_id, user_id) DO UPDATE
        SET prayers_created = prayer_group_member_stats.prayers_created + 1,
            updated_at = now();
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NOT NULL AND NEW.is_answered = true AND OLD.is_answered = false THEN
        UPDATE public.prayer_group_stats
        SET answered_prayers = answered_prayers + 1, updated_at = now()
        WHERE group_id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
        UPDATE public.prayer_group_stats
        SET total_prayers = GREATEST(0, total_prayers - 1),
            answered_prayers = CASE WHEN OLD.is_answered THEN GREATEST(0, answered_prayers - 1) ELSE answered_prayers END,
            updated_at = now()
        WHERE group_id = OLD.group_id;

        UPDATE public.prayer_group_member_stats
        SET prayers_created = GREATEST(0, prayers_created - 1), updated_at = now()
        WHERE group_id = OLD.group_id AND user_id = OLD.user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_group_prayer_stats ON public.prayers;
CREATE TRIGGER on_group_prayer_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.update_group_prayer_stats();

CREATE OR REPLACE FUNCTION public.update_scheduled_attendance_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id UUID;
BEGIN
    SELECT group_id INTO v_group_id FROM public.scheduled_prayers WHERE id = COALESCE(NEW.scheduled_prayer_id, OLD.scheduled_prayer_id);

    IF v_group_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.prayer_group_member_stats (group_id, user_id, scheduled_prayers_attended)
            VALUES (v_group_id, NEW.user_id, 1)
            ON CONFLICT (group_id, user_id) DO UPDATE
            SET scheduled_prayers_attended = prayer_group_member_stats.scheduled_prayers_attended + 1,
                updated_at = now();
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.prayer_group_member_stats
            SET scheduled_prayers_attended = GREATEST(0, scheduled_prayers_attended - 1), updated_at = now()
            WHERE group_id = v_group_id AND user_id = OLD.user_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_scheduled_attendance ON public.scheduled_prayer_attendees;
CREATE TRIGGER on_scheduled_attendance
  AFTER INSERT OR DELETE ON public.scheduled_prayer_attendees
  FOR EACH ROW EXECUTE FUNCTION public.update_scheduled_attendance_stats();

-- ---------------------------------------------
-- 20. shared_reading_quiz_answers.on_shared_reading_stats
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_shared_reading_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO shared_reading_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF TG_TABLE_NAME = 'shared_reading_quiz_answers' THEN
    IF NEW.is_correct THEN
      UPDATE shared_reading_stats
      SET total_correct_answers = total_correct_answers + 1, updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSE
      UPDATE shared_reading_stats
      SET total_wrong_answers = total_wrong_answers + 1, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_shared_reading_stats ON public.shared_reading_quiz_answers;
CREATE TRIGGER on_shared_reading_stats
  AFTER INSERT ON public.shared_reading_quiz_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_shared_reading_stats();

-- ---------------------------------------------
-- 21-23. testimony_comments / testimony_glories / testimony_likes
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_testimony_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  testimony_owner_id uuid;
BEGIN
  SELECT user_id INTO testimony_owner_id FROM testimonies WHERE id = NEW.testimony_id;
  IF testimony_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (testimony_owner_id, NEW.user_id, 'testimony_comment', 'comentou em seu testemunho 💬', NEW.testimony_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_testimony_comment ON public.testimony_comments;
CREATE TRIGGER on_testimony_comment
  AFTER INSERT ON public.testimony_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_comment();

CREATE OR REPLACE FUNCTION public.notify_testimony_glory()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  testimony_owner_id uuid;
BEGIN
  SELECT user_id INTO testimony_owner_id FROM testimonies WHERE id = NEW.testimony_id;
  IF testimony_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (testimony_owner_id, NEW.user_id, 'testimony_glory', 'glorificou a Deus pelo seu testemunho 🙌', NEW.testimony_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_testimony_glory ON public.testimony_glories;
CREATE TRIGGER on_testimony_glory
  AFTER INSERT ON public.testimony_glories
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_glory();

CREATE OR REPLACE FUNCTION public.notify_testimony_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  testimony_owner_id uuid;
BEGIN
  SELECT user_id INTO testimony_owner_id FROM testimonies WHERE id = NEW.testimony_id;
  IF testimony_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (testimony_owner_id, NEW.user_id, 'testimony_like', 'curtiu seu testemunho ❤️', NEW.testimony_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_testimony_like ON public.testimony_likes;
CREATE TRIGGER on_testimony_like
  AFTER INSERT ON public.testimony_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_testimony_like();

-- ---------------------------------------------
-- 24. user_achievements.on_achievement_earned
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_achievement_earned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  achievement_name text;
BEGIN
  SELECT name INTO achievement_name FROM achievements WHERE id = NEW.achievement_id;

  INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
  VALUES (NEW.user_id, NEW.user_id, 'achievement', 'Você desbloqueou a conquista "' || achievement_name || '" 🏆', NEW.achievement_id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_achievement_earned ON public.user_achievements;
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.notify_achievement_earned();

-- ---------------------------------------------
-- 25. user_activities.on_user_stats_update
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_stat_column text;
  v_current_count integer;
  v_new_points integer := 0;
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

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

  IF v_stat_column IS NOT NULL THEN
    EXECUTE format('UPDATE user_stats SET %I = %I + 1, total_points = total_points + $1, updated_at = now() WHERE user_id = $2', v_stat_column, v_stat_column)
    USING v_new_points, NEW.user_id;
  ELSE
    UPDATE user_stats
    SET total_points = total_points + v_new_points, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  UPDATE user_stats
  SET level = calculate_level(total_points)
  WHERE user_id = NEW.user_id;

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

DROP TRIGGER IF EXISTS on_user_stats_update ON public.user_activities;
CREATE TRIGGER on_user_stats_update
  AFTER INSERT ON public.user_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- ---------------------------------------------
-- 26. user_stats.on_challenge_progress
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  challenge_record RECORD;
  progress_value INTEGER;
BEGIN
  FOR challenge_record IN
    SELECT c.*, uc.id as user_challenge_id, uc.current_progress
    FROM challenges c
    LEFT JOIN user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = NEW.user_id
    WHERE c.is_active = true
    AND now() BETWEEN c.start_date AND c.end_date
    AND (uc.is_completed IS NULL OR uc.is_completed = false)
  LOOP
    CASE challenge_record.challenge_type
      WHEN 'bible_read' THEN
        SELECT bible_chapters_read INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'prayer' THEN
        SELECT prayers_created + prayers_interceded INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'streak' THEN
        SELECT current_streak INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'social' THEN
        SELECT testimonies_shared + events_participated INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      ELSE
        progress_value := 0;
    END CASE;

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

DROP TRIGGER IF EXISTS on_challenge_progress ON public.user_stats;
CREATE TRIGGER on_challenge_progress
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_progress();

-- ---------------------------------------------
-- 27. user_stats.on_check_achievements
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  achievement_record RECORD;
  current_value integer;
BEGIN
  FOR achievement_record IN
    SELECT * FROM achievements
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements
      WHERE user_id = NEW.user_id
      AND achievement_id = achievement_record.id
    ) THEN
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

      IF current_value >= achievement_record.requirement_value THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_record.id);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_check_achievements ON public.user_stats;
CREATE TRIGGER on_check_achievements
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.check_and_award_achievements();

-- ---------------------------------------------
-- 28-30. video_comments / video_likes
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_video_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  SELECT user_id INTO video_owner_id FROM user_videos WHERE id = NEW.video_id;
  IF video_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (video_owner_id, NEW.user_id, 'video_comment', 'comentou no seu vídeo 💬', NEW.video_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_video_comment ON public.video_comments;
CREATE TRIGGER on_video_comment
  AFTER INSERT ON public.video_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_comment();

CREATE OR REPLACE FUNCTION public.notify_video_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  SELECT user_id INTO video_owner_id FROM user_videos WHERE id = NEW.video_id;
  IF video_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (video_owner_id, NEW.user_id, 'video_like', 'curtiu seu vídeo ❤️', NEW.video_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_video_like ON public.video_likes;
CREATE TRIGGER on_video_like
  AFTER INSERT ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_like();

CREATE OR REPLACE FUNCTION public.update_video_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_video_likes_count ON public.video_likes;
CREATE TRIGGER on_video_likes_count
  AFTER INSERT OR DELETE ON public.video_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();

-- ============================================================
SELECT 'ok' as status;
