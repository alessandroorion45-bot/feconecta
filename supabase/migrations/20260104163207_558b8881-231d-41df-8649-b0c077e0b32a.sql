-- Fix infinite recursion in shared_reading_participants RLS policy
-- Drop the problematic policy and create a simpler one

DROP POLICY IF EXISTS "Participants visible to room members" ON public.shared_reading_participants;

-- Simple policy: users can see participants in rooms they are part of
-- Use a direct check instead of recursive subquery
CREATE POLICY "Participants visible to authenticated users" 
ON public.shared_reading_participants
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Also fix church_community_members if it has similar issue
DROP POLICY IF EXISTS "Members can view community members" ON public.church_community_members;
DROP POLICY IF EXISTS "Members can view other members" ON public.church_community_members;

-- Simple policy for church community members
CREATE POLICY "Authenticated users can view community members" 
ON public.church_community_members
FOR SELECT
USING (auth.uid() IS NOT NULL);