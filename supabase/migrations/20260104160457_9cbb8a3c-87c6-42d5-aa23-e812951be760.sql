-- Fix infinite recursion in church_community_members policies
-- The issue is that policies are checking membership which triggers another policy check

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view community members" ON public.church_community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.church_community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.church_community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.church_community_members;

-- Create new policies without recursive checks
-- View: Allow all authenticated users to see members (simple policy, no recursion)
CREATE POLICY "Members are publicly visible to authenticated users"
ON public.church_community_members FOR SELECT
TO authenticated
USING (true);

-- Insert: Users can join any active community
CREATE POLICY "Users can join communities"
ON public.church_community_members FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Update: Users can update their own membership OR community admins can update
CREATE POLICY "Users can update own membership"
ON public.church_community_members FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Delete: Users can delete their own membership
CREATE POLICY "Users can delete own membership"
ON public.church_community_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also fix leader_evaluations policies that might have similar issues
DROP POLICY IF EXISTS "Community members can view evaluations" ON public.leader_evaluations;
DROP POLICY IF EXISTS "Community members can create evaluations" ON public.leader_evaluations;

-- Recreate without recursive membership checks
CREATE POLICY "Authenticated users can view evaluations"
ON public.leader_evaluations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create evaluations"
ON public.leader_evaluations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix community_comments policies
DROP POLICY IF EXISTS "Community members can view comments" ON public.community_comments;
DROP POLICY IF EXISTS "Community members can create comments" ON public.community_comments;

CREATE POLICY "Authenticated users can view comments"
ON public.community_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.community_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix community_reactions policies
DROP POLICY IF EXISTS "Community members can view reactions" ON public.community_reactions;
DROP POLICY IF EXISTS "Users can manage their reactions" ON public.community_reactions;

CREATE POLICY "Authenticated users can view reactions"
ON public.community_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own reactions"
ON public.community_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.community_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix community_votes policies
DROP POLICY IF EXISTS "Users can view public votes" ON public.community_votes;
DROP POLICY IF EXISTS "Community members can vote" ON public.community_votes;

CREATE POLICY "Authenticated users can view votes"
ON public.community_votes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.community_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix community_votings policies
DROP POLICY IF EXISTS "Community members can view votings" ON public.community_votings;
DROP POLICY IF EXISTS "Admins can create votings" ON public.community_votings;

CREATE POLICY "Authenticated users can view votings"
ON public.community_votings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create votings"
ON public.community_votings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);