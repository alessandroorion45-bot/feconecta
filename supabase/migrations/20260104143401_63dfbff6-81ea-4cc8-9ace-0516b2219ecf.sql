-- Add answered prayer fields to prayers table
ALTER TABLE public.prayers 
ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS answer_testimony TEXT;

-- Create prayer_groups table
CREATE TABLE IF NOT EXISTS public.prayer_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  cover_image_url TEXT,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prayer_group_members table
CREATE TABLE IF NOT EXISTS public.prayer_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Add group_id to prayers table for group prayers
ALTER TABLE public.prayers 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.prayer_groups(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.prayer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_group_members ENABLE ROW LEVEL SECURITY;

-- Prayer groups policies
CREATE POLICY "Anyone can view public prayer groups" 
ON public.prayer_groups FOR SELECT 
USING (is_public = true OR created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM public.prayer_group_members WHERE group_id = id AND user_id = auth.uid()
));

CREATE POLICY "Authenticated users can create prayer groups" 
ON public.prayer_groups FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their groups" 
ON public.prayer_groups FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their groups" 
ON public.prayer_groups FOR DELETE 
USING (auth.uid() = created_by);

-- Prayer group members policies
CREATE POLICY "Anyone can view group members" 
ON public.prayer_group_members FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can join groups" 
ON public.prayer_group_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON public.prayer_group_members FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update member count
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

-- Trigger for member count
DROP TRIGGER IF EXISTS update_prayer_group_member_count_trigger ON public.prayer_group_members;
CREATE TRIGGER update_prayer_group_member_count_trigger
AFTER INSERT OR DELETE ON public.prayer_group_members
FOR EACH ROW EXECUTE FUNCTION public.update_prayer_group_member_count();

-- Create prayer_comments table if not exists
CREATE TABLE IF NOT EXISTS public.prayer_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prayer comments" ON public.prayer_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.prayer_comments FOR DELETE USING (auth.uid() = user_id);

-- Function to notify prayer interaction (using correct table names)
CREATE OR REPLACE FUNCTION public.notify_prayer_comment_interaction()
RETURNS TRIGGER AS $$
DECLARE
  prayer_owner_id UUID;
  interactor_name TEXT;
BEGIN
  -- Get prayer owner
  SELECT user_id INTO prayer_owner_id FROM public.prayers WHERE id = NEW.prayer_id;
  
  -- Don't notify if user is interacting with their own prayer
  IF prayer_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get interactor name
  SELECT COALESCE(display_name, full_name, username) INTO interactor_name 
  FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create in-app notification
  INSERT INTO public.notifications (user_id, actor_id, type, content, reference_id)
  VALUES (prayer_owner_id, NEW.user_id, 'prayer_comment', COALESCE(interactor_name, 'Alguém') || ' comentou no seu pedido de oração 💬', NEW.prayer_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for prayer comment notifications
DROP TRIGGER IF EXISTS notify_prayer_comment_trigger ON public.prayer_comments;
CREATE TRIGGER notify_prayer_comment_trigger
AFTER INSERT ON public.prayer_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_prayer_comment_interaction();

-- Enable realtime for prayer groups
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_group_members;