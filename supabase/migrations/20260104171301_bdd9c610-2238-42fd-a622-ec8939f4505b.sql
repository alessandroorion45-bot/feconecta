-- Table for admin transfer votings
CREATE TABLE public.admin_transfer_votings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL,
  candidate_id UUID NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'approved', 'rejected', 'cancelled'
  total_members INTEGER NOT NULL DEFAULT 0,
  votes_yes INTEGER NOT NULL DEFAULT 0,
  votes_no INTEGER NOT NULL DEFAULT 0,
  approval_threshold DECIMAL(3,2) DEFAULT 0.80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(community_id, status) -- Only one active voting per community
);

-- Table for individual votes on admin transfer
CREATE TABLE public.admin_transfer_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voting_id UUID NOT NULL REFERENCES public.admin_transfer_votings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote BOOLEAN NOT NULL, -- true = yes, false = no
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(voting_id, user_id)
);

-- Table for community action history
CREATE TABLE public.community_action_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'admin_transfer', 'community_deleted', 'voting_started', etc.
  performed_by UUID NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_transfer_votings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_transfer_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_action_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_transfer_votings
CREATE POLICY "Members can view transfer votings"
ON public.admin_transfer_votings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM church_community_members 
    WHERE community_id = admin_transfer_votings.community_id 
    AND user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Admins can create transfer votings"
ON public.admin_transfer_votings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM church_community_members 
    WHERE community_id = admin_transfer_votings.community_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
    AND is_active = true
  )
);

CREATE POLICY "Admins can update transfer votings"
ON public.admin_transfer_votings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM church_community_members 
    WHERE community_id = admin_transfer_votings.community_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
    AND is_active = true
  )
);

-- RLS Policies for admin_transfer_votes
CREATE POLICY "Members can view votes"
ON public.admin_transfer_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_transfer_votings v
    JOIN church_community_members m ON m.community_id = v.community_id
    WHERE v.id = admin_transfer_votes.voting_id
    AND m.user_id = auth.uid()
    AND m.is_active = true
  )
);

CREATE POLICY "Members can vote"
ON public.admin_transfer_votes FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM admin_transfer_votings v
    JOIN church_community_members m ON m.community_id = v.community_id
    WHERE v.id = voting_id
    AND m.user_id = auth.uid()
    AND m.is_active = true
    AND v.status = 'active'
  )
);

-- RLS Policies for community_action_history
CREATE POLICY "Members can view action history"
ON public.community_action_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM church_community_members 
    WHERE community_id = community_action_history.community_id 
    AND user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "System can insert action history"
ON public.community_action_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Function to update vote counts
CREATE OR REPLACE FUNCTION public.update_admin_transfer_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = true THEN
      UPDATE admin_transfer_votings 
      SET votes_yes = votes_yes + 1 
      WHERE id = NEW.voting_id;
    ELSE
      UPDATE admin_transfer_votings 
      SET votes_no = votes_no + 1 
      WHERE id = NEW.voting_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_vote_counts_trigger
AFTER INSERT ON public.admin_transfer_votes
FOR EACH ROW EXECUTE FUNCTION public.update_admin_transfer_vote_counts();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_transfer_votings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_transfer_votes;