
-- Tabela principal das comunidades de igreja
CREATE TABLE public.church_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  church_name TEXT NOT NULL,
  cover_image_url TEXT,
  created_by UUID NOT NULL,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Membros da comunidade
CREATE TABLE public.church_community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin', 'leader', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(community_id, user_id)
);

-- Líderes da comunidade (pastores, dirigentes)
CREATE TABLE public.church_leaders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'pastor', 'dirigente', 'líder de louvor', etc
  photo_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Avaliações de líderes
CREATE TABLE public.leader_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID NOT NULL REFERENCES public.church_leaders(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text_content TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Votações da comunidade
CREATE TABLE public.community_votings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  voting_type TEXT DEFAULT 'decision', -- 'decision', 'event', 'evaluation'
  is_anonymous_votes BOOLEAN DEFAULT false,
  options JSONB NOT NULL DEFAULT '[]', -- [{id, text, votes_count}]
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'cancelled'
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Votos individuais
CREATE TABLE public.community_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voting_id UUID NOT NULL REFERENCES public.community_votings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(voting_id, user_id)
);

-- Comentários em votações e avaliações
CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.church_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  voting_id UUID REFERENCES public.community_votings(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.leader_evaluations(id) ON DELETE CASCADE,
  text_content TEXT,
  audio_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reações em votações e avaliações
CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voting_id UUID REFERENCES public.community_votings(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.leader_evaluations(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'praise' (🙌), 'pray' (🙏), 'celebrate' (🎉)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, voting_id, reaction_type),
  UNIQUE(user_id, evaluation_id, reaction_type),
  UNIQUE(user_id, comment_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.church_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for church_communities
CREATE POLICY "Anyone can view active communities" ON public.church_communities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create communities" ON public.church_communities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their communities" ON public.church_communities
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for members
CREATE POLICY "Members can view community members" ON public.church_community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = church_community_members.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Users can join communities" ON public.church_community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.church_community_members
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for leaders
CREATE POLICY "Members can view leaders" ON public.church_leaders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = church_leaders.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Admins can manage leaders" ON public.church_leaders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = church_leaders.community_id 
      AND m.user_id = auth.uid() AND m.role = 'admin' AND m.is_active = true
    )
  );

-- RLS Policies for evaluations
CREATE POLICY "Members can view evaluations" ON public.leader_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = leader_evaluations.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Members can create evaluations" ON public.leader_evaluations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = leader_evaluations.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Users can update own evaluations" ON public.leader_evaluations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for votings
CREATE POLICY "Members can view votings" ON public.community_votings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = community_votings.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Members can create votings" ON public.community_votings
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = community_votings.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Creators can update votings" ON public.community_votings
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for votes
CREATE POLICY "Members can view public votes" ON public.community_votes
  FOR SELECT USING (
    is_public = true OR auth.uid() = user_id
  );

CREATE POLICY "Members can vote" ON public.community_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM community_votings v
      JOIN church_community_members m ON m.community_id = v.community_id
      WHERE v.id = community_votes.voting_id 
      AND m.user_id = auth.uid() AND m.is_active = true
      AND v.status = 'active'
    )
  );

-- RLS Policies for comments
CREATE POLICY "Members can view comments" ON public.community_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = community_comments.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Members can create comments" ON public.community_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM church_community_members m 
      WHERE m.community_id = community_comments.community_id 
      AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Users can delete own comments" ON public.community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reactions
CREATE POLICY "Anyone can view reactions" ON public.community_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can add reactions" ON public.community_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.community_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_community_members_community ON public.church_community_members(community_id);
CREATE INDEX idx_community_members_user ON public.church_community_members(user_id);
CREATE INDEX idx_leader_evaluations_leader ON public.leader_evaluations(leader_id);
CREATE INDEX idx_community_votings_community ON public.community_votings(community_id);
CREATE INDEX idx_community_votes_voting ON public.community_votes(voting_id);
CREATE INDEX idx_community_comments_voting ON public.community_comments(voting_id);
CREATE INDEX idx_community_reactions_voting ON public.community_reactions(voting_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_votings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_reactions;

-- Function to update member count
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

CREATE TRIGGER on_member_change
  AFTER INSERT OR UPDATE OR DELETE ON public.church_community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();
