-- =====================================================
-- SECURITY FIX: Remove overly permissive INSERT policies
-- These policies with "WITH CHECK: true" allow any authenticated user to insert
-- The SECURITY DEFINER triggers will still work as they bypass RLS
-- =====================================================

-- Drop permissive system INSERT policies
DROP POLICY IF EXISTS "Sistema pode criar pontuações" ON public.quiz_scores;
DROP POLICY IF EXISTS "System can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Sistema pode conceder badges" ON public.user_badges;
DROP POLICY IF EXISTS "Sistema pode conceder conquistas" ON public.user_achievements;
DROP POLICY IF EXISTS "Sistema pode criar stats" ON public.user_stats;
DROP POLICY IF EXISTS "Sistema pode criar cache de versículos" ON public.versiculos;

-- Create secure policies that only allow service_role to insert system data
CREATE POLICY "Service role only - quiz_scores" ON public.quiz_scores
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only - friendships" ON public.friendships
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only - user_badges" ON public.user_badges
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only - user_achievements" ON public.user_achievements
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only - user_stats" ON public.user_stats
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only - versiculos" ON public.versiculos
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SECURITY FIX: Restrict profiles table to authenticated users only
-- Remove public access policy
-- =====================================================

DROP POLICY IF EXISTS "Profiles são visíveis para todos" ON public.profiles;

-- =====================================================
-- SECURITY FIX: Restrict user_achievements to owner only
-- Remove public access policies
-- =====================================================

DROP POLICY IF EXISTS "Conquistas de usuários são visíveis para todos" ON public.user_achievements;
DROP POLICY IF EXISTS "User achievements viewable by authenticated users" ON public.user_achievements;

-- Create policy that only allows users to view their own achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- SECURITY FIX: Restrict user_badges to owner only (for private view)
-- Keep public view for profile display but limit data
-- =====================================================

DROP POLICY IF EXISTS "User badges viewable by authenticated users" ON public.user_badges;

-- Users can see their own badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can see badges on profiles (needed for profile display)
CREATE POLICY "Authenticated users can view profile badges" ON public.user_badges
FOR SELECT
USING (auth.uid() IS NOT NULL);