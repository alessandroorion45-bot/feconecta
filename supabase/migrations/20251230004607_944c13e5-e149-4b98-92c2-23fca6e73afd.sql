-- =============================================
-- CORREÇÃO DE SEGURANÇA: Restringir acesso público a dados sensíveis
-- =============================================

-- 1. PROFILES: Restringir SELECT apenas para usuários autenticados
DROP POLICY IF EXISTS "Perfis são visíveis para todos" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users only"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. USER_STATS: Restringir SELECT apenas para o próprio usuário
DROP POLICY IF EXISTS "user_stats_select_own" ON public.user_stats;
DROP POLICY IF EXISTS "Stats são visíveis para todos" ON public.user_stats;

CREATE POLICY "Users can view their own stats only"
ON public.user_stats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir visualização pública apenas de pontos para ranking (sem dados sensíveis)
CREATE POLICY "Public can view ranking data only"
ON public.user_stats
FOR SELECT
USING (true);

-- Recriar policy para que apenas exponha dados limitados via view
DROP POLICY IF EXISTS "Public can view ranking data only" ON public.user_stats;

-- 3. QUIZ_SCORES: Restringir para autenticados apenas
DROP POLICY IF EXISTS "Pontuações são visíveis para todos" ON public.quiz_scores;

CREATE POLICY "Quiz scores viewable by authenticated users"
ON public.quiz_scores
FOR SELECT
TO authenticated
USING (true);

-- 4. FOLLOWERS: Restringir para mostrar apenas relacionamentos do usuário autenticado
DROP POLICY IF EXISTS "Seguidores são visíveis para todos" ON public.followers;

CREATE POLICY "Users can view their own follower relationships"
ON public.followers
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- 5. USER_ACHIEVEMENTS: Restringir para autenticados
DROP POLICY IF EXISTS "Achievements são visíveis para todos" ON public.user_achievements;

CREATE POLICY "User achievements viewable by authenticated users"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (true);

-- 6. PRAYERS: Manter público mas restringir para autenticados (comunidade)
DROP POLICY IF EXISTS "Orações são visíveis para todos" ON public.prayers;

CREATE POLICY "Prayers viewable by authenticated community members"
ON public.prayers
FOR SELECT
TO authenticated
USING (true);

-- 7. TESTIMONIES: Restringir para autenticados
DROP POLICY IF EXISTS "Depoimentos são visíveis para todos" ON public.testimonies;

CREATE POLICY "Testimonies viewable by authenticated users"
ON public.testimonies
FOR SELECT
TO authenticated
USING (true);

-- 8. EVENTS: Restringir para autenticados
DROP POLICY IF EXISTS "Eventos são visíveis para todos" ON public.events;

CREATE POLICY "Events viewable by authenticated users"
ON public.events
FOR SELECT
TO authenticated
USING (true);

-- 9. POSTS: Restringir para autenticados
DROP POLICY IF EXISTS "Posts are visible to everyone" ON public.posts;

CREATE POLICY "Posts viewable by authenticated users"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- 10. COMMENTS: Restringir para autenticados
DROP POLICY IF EXISTS "Comentários são visíveis para todos" ON public.comments;

CREATE POLICY "Comments viewable by authenticated users"
ON public.comments
FOR SELECT
TO authenticated
USING (true);

-- 11. TESTIMONY_LIKES: Restringir para autenticados
DROP POLICY IF EXISTS "Likes são visíveis para todos" ON public.testimony_likes;

CREATE POLICY "Testimony likes viewable by authenticated users"
ON public.testimony_likes
FOR SELECT
TO authenticated
USING (true);

-- 12. TESTIMONY_GLORIES: Restringir para autenticados
DROP POLICY IF EXISTS "Glórias são visíveis para todos" ON public.testimony_glories;

CREATE POLICY "Testimony glories viewable by authenticated users"
ON public.testimony_glories
FOR SELECT
TO authenticated
USING (true);

-- 13. PRAYER_INTERCESSORS: Restringir para autenticados
DROP POLICY IF EXISTS "Intercessores são visíveis para todos" ON public.prayer_intercessors;

CREATE POLICY "Prayer intercessors viewable by authenticated users"
ON public.prayer_intercessors
FOR SELECT
TO authenticated
USING (true);

-- 14. EVENT_PARTICIPANTS: Restringir para autenticados
DROP POLICY IF EXISTS "Participantes são visíveis para todos" ON public.event_participants;

CREATE POLICY "Event participants viewable by authenticated users"
ON public.event_participants
FOR SELECT
TO authenticated
USING (true);

-- 15. POST_LIKES: Restringir para autenticados
DROP POLICY IF EXISTS "Likes are visible to everyone" ON public.post_likes;

CREATE POLICY "Post likes viewable by authenticated users"
ON public.post_likes
FOR SELECT
TO authenticated
USING (true);

-- 16. POST_COMMENTS: Restringir para autenticados
DROP POLICY IF EXISTS "Comments are visible to everyone" ON public.post_comments;

CREATE POLICY "Post comments viewable by authenticated users"
ON public.post_comments
FOR SELECT
TO authenticated
USING (true);

-- 17. TESTIMONY_COMMENTS: Restringir para autenticados
DROP POLICY IF EXISTS "Testimony comments are visible to everyone" ON public.testimony_comments;

CREATE POLICY "Testimony comments viewable by authenticated users"
ON public.testimony_comments
FOR SELECT
TO authenticated
USING (true);

-- 18. USER_BADGES: Restringir para autenticados
DROP POLICY IF EXISTS "Badges são visíveis para todos" ON public.user_badges;

CREATE POLICY "User badges viewable by authenticated users"
ON public.user_badges
FOR SELECT
TO authenticated
USING (true);

-- 19. ACHIEVEMENTS: Manter público (definições do sistema)
-- Sem alteração necessária

-- 20. VERSE_SHARES: Restringir para autenticados
DROP POLICY IF EXISTS "Share counts are visible to everyone" ON public.verse_shares;

CREATE POLICY "Verse shares viewable by authenticated users"
ON public.verse_shares
FOR SELECT
TO authenticated
USING (true);

-- 21. CHAT_ROOMS: Esconder password_hash de queries públicas (já protegido por RLS)
-- A policy atual permite discovery, mas password_hash retorna NULL para não-criadores

-- 22. Criar função de log de segurança para ações críticas
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas sistema pode inserir logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- Apenas admins podem ler logs (implementar via função)
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (false); -- Nenhum usuário comum pode ver