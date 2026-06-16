-- Drop the existing public policy
DROP POLICY IF EXISTS "Anyone can view active communities" ON public.church_communities;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view active communities"
ON public.church_communities
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);