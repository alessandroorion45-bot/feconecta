-- ============================================================
-- FIX EM MASSA: 43 tabelas com RLS ativado e ZERO políticas
-- ============================================================
-- Descoberto ao investigar o bug do friend_requests (403 "new row
-- violates row-level security policy"). Uma auditoria completa achou
-- mais 42 tabelas no mesmo estado — RLS ligado, nenhuma política
-- anexada, ou seja, toda leitura/escrita client-side bloqueada.
--
-- 41 tabelas têm histórico de política completo nos arquivos de
-- migration (restauradas aqui exatamente como eram). 1 tabela
-- (message_reports) nunca teve política definida em lugar nenhum —
-- políticas novas e conservadoras foram desenhadas pra ela.
--
-- friend_requests já foi corrigida separadamente
-- (20260712010000_fix_friend_requests_rls.sql).
-- ============================================================

-- ---------------------------------------------
-- achievements
-- ---------------------------------------------
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Conquistas são visíveis para todos" ON public.achievements;
CREATE POLICY "Conquistas são visíveis para todos"
ON public.achievements FOR SELECT
USING (true);

-- ---------------------------------------------
-- banned_words (admin)
-- ---------------------------------------------
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage banned words" ON public.banned_words;
CREATE POLICY "Admins can manage banned words"
ON public.banned_words FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
  )
);

-- ---------------------------------------------
-- bible_notes
-- ---------------------------------------------
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver suas anotações" ON public.bible_notes;
CREATE POLICY "Usuários podem ver suas anotações"
ON public.bible_notes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem criar anotações" ON public.bible_notes;
CREATE POLICY "Usuários podem criar anotações"
ON public.bible_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem atualizar suas anotações" ON public.bible_notes;
CREATE POLICY "Usuários podem atualizar suas anotações"
ON public.bible_notes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem deletar suas anotações" ON public.bible_notes;
CREATE POLICY "Usuários podem deletar suas anotações"
ON public.bible_notes FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- bible_reading_plans
-- ---------------------------------------------
ALTER TABLE public.bible_reading_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seus planos" ON public.bible_reading_plans;
CREATE POLICY "Usuários podem ver seus planos"
ON public.bible_reading_plans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem criar planos" ON public.bible_reading_plans;
CREATE POLICY "Usuários podem criar planos"
ON public.bible_reading_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem atualizar seus planos" ON public.bible_reading_plans;
CREATE POLICY "Usuários podem atualizar seus planos"
ON public.bible_reading_plans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem deletar seus planos" ON public.bible_reading_plans;
CREATE POLICY "Usuários podem deletar seus planos"
ON public.bible_reading_plans FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- bible_reading_position
-- ---------------------------------------------
ALTER TABLE public.bible_reading_position ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own reading position" ON public.bible_reading_position;
CREATE POLICY "Users can view their own reading position"
ON public.bible_reading_position FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their reading position" ON public.bible_reading_position;
CREATE POLICY "Users can create their reading position"
ON public.bible_reading_position FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their reading position" ON public.bible_reading_position;
CREATE POLICY "Users can update their reading position"
ON public.bible_reading_position FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their reading position" ON public.bible_reading_position;
CREATE POLICY "Users can delete their reading position"
ON public.bible_reading_position FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- bible_reading_progress (não usada pelo client hoje, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.bible_reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seu progresso" ON public.bible_reading_progress;
CREATE POLICY "Usuários podem ver seu progresso"
ON public.bible_reading_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem registrar progresso" ON public.bible_reading_progress;
CREATE POLICY "Usuários podem registrar progresso"
ON public.bible_reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem deletar progresso" ON public.bible_reading_progress;
CREATE POLICY "Usuários podem deletar progresso"
ON public.bible_reading_progress FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- bible_reading_sessions
-- ---------------------------------------------
ALTER TABLE public.bible_reading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.bible_reading_sessions;
CREATE POLICY "Users can view their own sessions"
ON public.bible_reading_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.bible_reading_sessions;
CREATE POLICY "Users can create their own sessions"
ON public.bible_reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.bible_reading_sessions;
CREATE POLICY "Users can update their own sessions"
ON public.bible_reading_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- bible_reading_stats
-- ---------------------------------------------
ALTER TABLE public.bible_reading_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.bible_reading_stats;
CREATE POLICY "Users can view their own stats"
ON public.bible_reading_stats FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own stats" ON public.bible_reading_stats;
CREATE POLICY "Users can create their own stats"
ON public.bible_reading_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own stats" ON public.bible_reading_stats;
CREATE POLICY "Users can update their own stats"
ON public.bible_reading_stats FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- bible_verse_highlights
-- ---------------------------------------------
ALTER TABLE public.bible_verse_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own highlights" ON public.bible_verse_highlights;
CREATE POLICY "Users can view their own highlights"
ON public.bible_verse_highlights FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own highlights" ON public.bible_verse_highlights;
CREATE POLICY "Users can create their own highlights"
ON public.bible_verse_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own highlights" ON public.bible_verse_highlights;
CREATE POLICY "Users can update their own highlights"
ON public.bible_verse_highlights FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own highlights" ON public.bible_verse_highlights;
CREATE POLICY "Users can delete their own highlights"
ON public.bible_verse_highlights FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- campaign_daily_progress
-- ---------------------------------------------
ALTER TABLE public.campaign_daily_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.campaign_daily_progress;
CREATE POLICY "Users can view their own progress"
ON public.campaign_daily_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own progress" ON public.campaign_daily_progress;
CREATE POLICY "Users can create their own progress"
ON public.campaign_daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own progress" ON public.campaign_daily_progress;
CREATE POLICY "Users can update their own progress"
ON public.campaign_daily_progress FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- chat_media (schema legado, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.chat_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view media in their conversations" ON public.chat_media;
CREATE POLICY "Users can view media in their conversations"
ON public.chat_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = chat_media.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);
DROP POLICY IF EXISTS "Users can upload media" ON public.chat_media;
CREATE POLICY "Users can upload media"
ON public.chat_media FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own media" ON public.chat_media;
CREATE POLICY "Users can delete their own media"
ON public.chat_media FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- chat_room_members (schema legado, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view room members" ON public.chat_room_members;
CREATE POLICY "Members can view room members"
ON public.chat_room_members FOR SELECT
USING (EXISTS (SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_room_members;
CREATE POLICY "Users can join rooms"
ON public.chat_room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave rooms" ON public.chat_room_members;
CREATE POLICY "Users can leave rooms"
ON public.chat_room_members FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- chat_room_messages (schema legado, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.chat_room_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view room messages" ON public.chat_room_messages;
CREATE POLICY "Members can view room messages"
ON public.chat_room_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_room_messages.room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_room_messages;
CREATE POLICY "Members can send messages"
ON public.chat_room_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_room_messages.room_id AND user_id = auth.uid())
);

-- ---------------------------------------------
-- chat_rooms (schema legado, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all rooms for discovery" ON public.chat_rooms;
CREATE POLICY "Users can view all rooms for discovery"
ON public.chat_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;
CREATE POLICY "Authenticated users can create rooms"
ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Room creators can update rooms" ON public.chat_rooms;
CREATE POLICY "Room creators can update rooms"
ON public.chat_rooms FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Room creators can delete rooms" ON public.chat_rooms;
CREATE POLICY "Room creators can delete rooms"
ON public.chat_rooms FOR DELETE USING (auth.uid() = created_by);

-- ---------------------------------------------
-- comments (tabela genérica não usada hoje, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments viewable by authenticated users" ON public.comments;
CREATE POLICY "Comments viewable by authenticated users"
ON public.comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Usuários podem criar comentários" ON public.comments;
CREATE POLICY "Usuários podem criar comentários"
ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem atualizar seus comentários" ON public.comments;
CREATE POLICY "Usuários podem atualizar seus comentários"
ON public.comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem deletar seus comentários" ON public.comments;
CREATE POLICY "Usuários podem deletar seus comentários"
ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- event_participants
-- ---------------------------------------------
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Event participants viewable by authenticated users" ON public.event_participants;
CREATE POLICY "Event participants viewable by authenticated users"
ON public.event_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Usuários podem participar de eventos" ON public.event_participants;
CREATE POLICY "Usuários podem participar de eventos"
ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem cancelar participação" ON public.event_participants;
CREATE POLICY "Usuários podem cancelar participação"
ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- events
-- ---------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events viewable by authenticated users" ON public.events;
CREATE POLICY "Events viewable by authenticated users"
ON public.events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Usuários podem criar seus eventos" ON public.events;
CREATE POLICY "Usuários podem criar seus eventos"
ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem atualizar seus eventos" ON public.events;
CREATE POLICY "Usuários podem atualizar seus eventos"
ON public.events FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem deletar seus eventos" ON public.events;
CREATE POLICY "Usuários podem deletar seus eventos"
ON public.events FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- faith_posts
-- ---------------------------------------------
ALTER TABLE public.faith_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view faith posts on their profile" ON public.faith_posts;
CREATE POLICY "Users can view faith posts on their profile"
ON public.faith_posts FOR SELECT
USING (
  auth.uid() = recipient_id OR
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id_1 = auth.uid() AND user_id_2 = recipient_id)
       OR (user_id_2 = auth.uid() AND user_id_1 = recipient_id)
  )
);
DROP POLICY IF EXISTS "Friends can create faith posts" ON public.faith_posts;
CREATE POLICY "Friends can create faith posts"
ON public.faith_posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id_1 = auth.uid() AND user_id_2 = recipient_id)
       OR (user_id_2 = auth.uid() AND user_id_1 = recipient_id)
  )
);
DROP POLICY IF EXISTS "Authors can delete their faith posts" ON public.faith_posts;
CREATE POLICY "Authors can delete their faith posts"
ON public.faith_posts FOR DELETE USING (auth.uid() = author_id);

-- ---------------------------------------------
-- followers
-- ---------------------------------------------
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own follower relationships" ON public.followers;
CREATE POLICY "Users can view their own follower relationships"
ON public.followers FOR SELECT TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);
DROP POLICY IF EXISTS "Usuários podem seguir outros" ON public.followers;
CREATE POLICY "Usuários podem seguir outros"
ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Usuários podem deixar de seguir" ON public.followers;
CREATE POLICY "Usuários podem deixar de seguir"
ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- ---------------------------------------------
-- friend_testimonials
-- ---------------------------------------------
ALTER TABLE public.friend_testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approved testimonials are visible to everyone" ON public.friend_testimonials;
CREATE POLICY "Approved testimonials are visible to everyone"
ON public.friend_testimonials FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "Recipients can view all their testimonials" ON public.friend_testimonials;
CREATE POLICY "Recipients can view all their testimonials"
ON public.friend_testimonials FOR SELECT USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Authors can view their own testimonials" ON public.friend_testimonials;
CREATE POLICY "Authors can view their own testimonials"
ON public.friend_testimonials FOR SELECT USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Friends can create testimonials" ON public.friend_testimonials;
CREATE POLICY "Friends can create testimonials"
ON public.friend_testimonials FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (friendships.user_id_1 = auth.uid() AND friendships.user_id_2 = recipient_id)
       OR (friendships.user_id_2 = auth.uid() AND friendships.user_id_1 = recipient_id)
  )
);
DROP POLICY IF EXISTS "Recipients can update testimonial status" ON public.friend_testimonials;
CREATE POLICY "Recipients can update testimonial status"
ON public.friend_testimonials FOR UPDATE USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Authors can delete their own testimonials" ON public.friend_testimonials;
CREATE POLICY "Authors can delete their own testimonials"
ON public.friend_testimonials FOR DELETE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Recipients can delete testimonials" ON public.friend_testimonials;
CREATE POLICY "Recipients can delete testimonials"
ON public.friend_testimonials FOR DELETE USING (auth.uid() = recipient_id);

-- ---------------------------------------------
-- friendships
-- ---------------------------------------------
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
DROP POLICY IF EXISTS "Users can create friendships from accepted requests" ON public.friendships;
CREATE POLICY "Users can create friendships from accepted requests"
ON public.friendships FOR INSERT
WITH CHECK (
  (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  AND EXISTS (
    SELECT 1 FROM public.friend_requests fr
    WHERE (
      (fr.sender_id = user_id_1 AND fr.receiver_id = user_id_2) OR
      (fr.sender_id = user_id_2 AND fr.receiver_id = user_id_1)
    )
    AND fr.receiver_id = auth.uid()
    AND fr.status = 'accepted'
  )
);
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ---------------------------------------------
-- message_reports (SEM histórico — políticas novas e conservadoras)
-- ---------------------------------------------
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reporters can view their own reports" ON public.message_reports;
CREATE POLICY "Reporters can view their own reports"
ON public.message_reports FOR SELECT USING (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admins can view all message reports" ON public.message_reports;
CREATE POLICY "Admins can view all message reports"
ON public.message_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
  )
);
DROP POLICY IF EXISTS "Users can report messages" ON public.message_reports;
CREATE POLICY "Users can report messages"
ON public.message_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admins can review message reports" ON public.message_reports;
CREATE POLICY "Admins can review message reports"
ON public.message_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
  )
);

-- ---------------------------------------------
-- moderation_rules (admin)
-- ---------------------------------------------
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage moderation rules" ON public.moderation_rules;
CREATE POLICY "Admins can manage moderation rules"
ON public.moderation_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
  )
);

-- ---------------------------------------------
-- nearby_churches (UI removida, restaurada por consistência)
-- ---------------------------------------------
ALTER TABLE public.nearby_churches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view churches" ON public.nearby_churches;
CREATE POLICY "Authenticated users can view churches"
ON public.nearby_churches FOR SELECT TO authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Authenticated users can create churches" ON public.nearby_churches;
CREATE POLICY "Authenticated users can create churches"
ON public.nearby_churches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Creator can update own church" ON public.nearby_churches;
CREATE POLICY "Creator can update own church"
ON public.nearby_churches FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Creator can delete own church" ON public.nearby_churches;
CREATE POLICY "Creator can delete own church"
ON public.nearby_churches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------
-- notification_templates (admin)
-- ---------------------------------------------
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view templates" ON public.notification_templates;
CREATE POLICY "Admins can view templates"
ON public.notification_templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
  )
);
DROP POLICY IF EXISTS "Admins can manage templates" ON public.notification_templates;
CREATE POLICY "Admins can manage templates"
ON public.notification_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
);

-- ---------------------------------------------
-- photo_comments
-- ---------------------------------------------
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view photo comments" ON public.photo_comments;
CREATE POLICY "Anyone can view photo comments"
ON public.photo_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.photo_comments;
CREATE POLICY "Authenticated users can create comments"
ON public.photo_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.photo_comments;
CREATE POLICY "Users can delete their own comments"
ON public.photo_comments FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- photo_likes
-- ---------------------------------------------
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view photo likes" ON public.photo_likes;
CREATE POLICY "Anyone can view photo likes"
ON public.photo_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can like photos" ON public.photo_likes;
CREATE POLICY "Authenticated users can like photos"
ON public.photo_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.photo_likes;
CREATE POLICY "Users can unlike their own likes"
ON public.photo_likes FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- post_comments
-- ---------------------------------------------
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Post comments viewable by authenticated users" ON public.post_comments;
CREATE POLICY "Post comments viewable by authenticated users"
ON public.post_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments"
ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
CREATE POLICY "Users can update their own comments"
ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;
CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- post_likes
-- ---------------------------------------------
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Post likes viewable by authenticated users" ON public.post_likes;
CREATE POLICY "Post likes viewable by authenticated users"
ON public.post_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- prayer_group_member_stats
-- ---------------------------------------------
ALTER TABLE public.prayer_group_member_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members can view member stats" ON public.prayer_group_member_stats;
CREATE POLICY "Group members can view member stats"
ON public.prayer_group_member_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prayer_group_members
    WHERE prayer_group_members.group_id = prayer_group_member_stats.group_id
    AND prayer_group_members.user_id = auth.uid()
  )
);

-- ---------------------------------------------
-- prayer_group_members
-- ---------------------------------------------
ALTER TABLE public.prayer_group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view group members" ON public.prayer_group_members;
CREATE POLICY "Anyone can view group members"
ON public.prayer_group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can join groups" ON public.prayer_group_members;
CREATE POLICY "Authenticated users can join groups"
ON public.prayer_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave groups" ON public.prayer_group_members;
CREATE POLICY "Users can leave groups"
ON public.prayer_group_members FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- prayer_group_stats
-- ---------------------------------------------
ALTER TABLE public.prayer_group_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view group stats" ON public.prayer_group_stats;
CREATE POLICY "Anyone can view group stats"
ON public.prayer_group_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "System can update stats" ON public.prayer_group_stats;
CREATE POLICY "System can update stats"
ON public.prayer_group_stats FOR ALL USING (true);

-- ---------------------------------------------
-- prayer_groups
-- ---------------------------------------------
ALTER TABLE public.prayer_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view public prayer groups" ON public.prayer_groups;
CREATE POLICY "Anyone can view public prayer groups"
ON public.prayer_groups FOR SELECT
USING (
  is_public = true OR created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.prayer_group_members WHERE group_id = id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Authenticated users can create prayer groups" ON public.prayer_groups;
CREATE POLICY "Authenticated users can create prayer groups"
ON public.prayer_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can update their groups" ON public.prayer_groups;
CREATE POLICY "Creators can update their groups"
ON public.prayer_groups FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can delete their groups" ON public.prayer_groups;
CREATE POLICY "Creators can delete their groups"
ON public.prayer_groups FOR DELETE USING (auth.uid() = created_by);

-- ---------------------------------------------
-- push_subscriptions
-- ---------------------------------------------
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create their own subscriptions"
ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- scheduled_prayer_attendees
-- ---------------------------------------------
ALTER TABLE public.scheduled_prayer_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view attendees" ON public.scheduled_prayer_attendees;
CREATE POLICY "Anyone can view attendees"
ON public.scheduled_prayer_attendees FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can confirm attendance" ON public.scheduled_prayer_attendees;
CREATE POLICY "Users can confirm attendance"
ON public.scheduled_prayer_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can cancel attendance" ON public.scheduled_prayer_attendees;
CREATE POLICY "Users can cancel attendance"
ON public.scheduled_prayer_attendees FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- scheduled_prayers
-- ---------------------------------------------
ALTER TABLE public.scheduled_prayers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members can view scheduled prayers" ON public.scheduled_prayers;
CREATE POLICY "Group members can view scheduled prayers"
ON public.scheduled_prayers FOR SELECT
USING (EXISTS (SELECT 1 FROM public.prayer_group_members WHERE group_id = scheduled_prayers.group_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Group members can create scheduled prayers" ON public.scheduled_prayers;
CREATE POLICY "Group members can create scheduled prayers"
ON public.scheduled_prayers FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.prayer_group_members WHERE group_id = scheduled_prayers.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Creators can update scheduled prayers" ON public.scheduled_prayers;
CREATE POLICY "Creators can update scheduled prayers"
ON public.scheduled_prayers FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can delete scheduled prayers" ON public.scheduled_prayers;
CREATE POLICY "Creators can delete scheduled prayers"
ON public.scheduled_prayers FOR DELETE USING (auth.uid() = created_by);

-- ---------------------------------------------
-- security_audit_logs (admin, SELECT fechado por design)
-- ---------------------------------------------
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;
CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_logs;
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs FOR SELECT TO authenticated USING (false);

-- ---------------------------------------------
-- shared_reading_badges
-- ---------------------------------------------
ALTER TABLE public.shared_reading_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.shared_reading_badges;
CREATE POLICY "Users can view their own badges"
ON public.shared_reading_badges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view badges on profiles" ON public.shared_reading_badges;
CREATE POLICY "Users can view badges on profiles"
ON public.shared_reading_badges FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Service role only - shared_reading_badges" ON public.shared_reading_badges;
CREATE POLICY "Service role only - shared_reading_badges"
ON public.shared_reading_badges FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ---------------------------------------------
-- shared_reading_stats
-- ---------------------------------------------
ALTER TABLE public.shared_reading_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.shared_reading_stats;
CREATE POLICY "Users can view their own stats"
ON public.shared_reading_stats FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view stats on profiles" ON public.shared_reading_stats;
CREATE POLICY "Users can view stats on profiles"
ON public.shared_reading_stats FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can create their stats" ON public.shared_reading_stats;
CREATE POLICY "Users can create their stats"
ON public.shared_reading_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their stats" ON public.shared_reading_stats;
CREATE POLICY "Users can update their stats"
ON public.shared_reading_stats FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- spiritual_campaigns
-- ---------------------------------------------
ALTER TABLE public.spiritual_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.spiritual_campaigns;
CREATE POLICY "Users can view their own campaigns"
ON public.spiritual_campaigns FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.spiritual_campaigns;
CREATE POLICY "Users can create their own campaigns"
ON public.spiritual_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.spiritual_campaigns;
CREATE POLICY "Users can update their own campaigns"
ON public.spiritual_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- user_achievements
-- ---------------------------------------------
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role only - user_achievements" ON public.user_achievements;
CREATE POLICY "Service role only - user_achievements"
ON public.user_achievements FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ---------------------------------------------
-- user_activities
-- ---------------------------------------------
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver suas atividades" ON public.user_activities;
CREATE POLICY "Usuários podem ver suas atividades"
ON public.user_activities FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuários podem registrar atividades" ON public.user_activities;
CREATE POLICY "Usuários podem registrar atividades"
ON public.user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- user_punishments (admin)
-- ---------------------------------------------
ALTER TABLE public.user_punishments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view punishments" ON public.user_punishments;
CREATE POLICY "Admins can view punishments"
ON public.user_punishments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
  )
);
DROP POLICY IF EXISTS "Admins can create punishments" ON public.user_punishments;
CREATE POLICY "Admins can create punishments"
ON public.user_punishments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'moderator') AND is_active = true
  )
);

-- ============================================================
SELECT 'ok' as status;
