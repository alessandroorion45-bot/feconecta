-- AUDITORIA: o app assina (postgres_changes) dezenas de tabelas, mas boa parte
-- NÃO estava na publicação supabase_realtime — o tempo-real delas nunca chegava
-- (falha silenciosa). Inclui notifications (o sino!), user_badges (unlock ao
-- vivo), friendships, church_community_members (árvore), reações, orações, etc.
-- Publica as que faltam. RLS continua valendo (cada cliente só recebe o que
-- tem permissão de ver). Idempotente.
DO $$
DECLARE
  t text;
  wanted text[] := ARRAY[
    'notifications','user_badges','user_stats','quiz_scores',
    'friend_requests','friendships',
    'church_communities','church_community_members','church_leaders',
    'community_comments','community_votings','community_weekly_challenges',
    'community_challenge_completions','daily_challenge_completions',
    'community_cell_prayer_intercessions','community_cell_prayer_requests',
    'admin_transfer_votes','admin_transfer_votings',
    'posts','favorite_verses','verse_comments',
    'bible_questions','bible_verse_highlights',
    'gift_reactions','message_reactions',
    'prayers','prayer_intercessors','prayer_comments','prayer_group_stats',
    'testimony_comments','testimony_glories','testimony_likes'
  ];
BEGIN
  FOREACH t IN ARRAY wanted LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t)
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
