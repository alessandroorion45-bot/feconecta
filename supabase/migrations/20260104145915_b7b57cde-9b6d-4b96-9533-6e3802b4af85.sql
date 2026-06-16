-- Create table for group statistics
CREATE TABLE IF NOT EXISTS public.prayer_group_stats (
    group_id UUID NOT NULL PRIMARY KEY REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
    total_prayers INTEGER DEFAULT 0,
    answered_prayers INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    active_members_count INTEGER DEFAULT 0,
    scheduled_prayers_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_group_stats ENABLE ROW LEVEL SECURITY;

-- Policy for viewing stats (anyone can see group stats)
CREATE POLICY "Anyone can view group stats" 
ON public.prayer_group_stats 
FOR SELECT 
USING (true);

-- Policy for updating stats (system only via triggers)
CREATE POLICY "System can update stats"
ON public.prayer_group_stats
FOR ALL
USING (true);

-- Create table for member activity tracking within groups
CREATE TABLE IF NOT EXISTS public.prayer_group_member_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    prayers_created INTEGER DEFAULT 0,
    prayers_interceded INTEGER DEFAULT 0,
    scheduled_prayers_attended INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.prayer_group_member_stats ENABLE ROW LEVEL SECURITY;

-- Policy for viewing member stats
CREATE POLICY "Group members can view member stats" 
ON public.prayer_group_member_stats 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.prayer_group_members
        WHERE prayer_group_members.group_id = prayer_group_member_stats.group_id
        AND prayer_group_members.user_id = auth.uid()
    )
);

-- Function to update group stats when prayers change
CREATE OR REPLACE FUNCTION public.update_group_prayer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
        INSERT INTO public.prayer_group_stats (group_id, total_prayers)
        VALUES (NEW.group_id, 1)
        ON CONFLICT (group_id) DO UPDATE 
        SET total_prayers = prayer_group_stats.total_prayers + 1,
            updated_at = now();
        
        -- Update member stats
        INSERT INTO public.prayer_group_member_stats (group_id, user_id, prayers_created)
        VALUES (NEW.group_id, NEW.user_id, 1)
        ON CONFLICT (group_id, user_id) DO UPDATE 
        SET prayers_created = prayer_group_member_stats.prayers_created + 1,
            updated_at = now();
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NOT NULL AND NEW.is_answered = true AND OLD.is_answered = false THEN
        UPDATE public.prayer_group_stats 
        SET answered_prayers = answered_prayers + 1, updated_at = now()
        WHERE group_id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
        UPDATE public.prayer_group_stats 
        SET total_prayers = GREATEST(0, total_prayers - 1),
            answered_prayers = CASE WHEN OLD.is_answered THEN GREATEST(0, answered_prayers - 1) ELSE answered_prayers END,
            updated_at = now()
        WHERE group_id = OLD.group_id;
        
        -- Update member stats
        UPDATE public.prayer_group_member_stats
        SET prayers_created = GREATEST(0, prayers_created - 1), updated_at = now()
        WHERE group_id = OLD.group_id AND user_id = OLD.user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for prayer stats (separate for each operation)
DROP TRIGGER IF EXISTS update_group_prayer_stats_insert ON public.prayers;
CREATE TRIGGER update_group_prayer_stats_insert
AFTER INSERT ON public.prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_group_prayer_stats();

DROP TRIGGER IF EXISTS update_group_prayer_stats_update ON public.prayers;
CREATE TRIGGER update_group_prayer_stats_update
AFTER UPDATE ON public.prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_group_prayer_stats();

DROP TRIGGER IF EXISTS update_group_prayer_stats_delete ON public.prayers;
CREATE TRIGGER update_group_prayer_stats_delete
AFTER DELETE ON public.prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_group_prayer_stats();

-- Function to update member stats when intercessors change
CREATE OR REPLACE FUNCTION public.update_group_intercessor_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id UUID;
BEGIN
    -- Get group_id from prayer
    SELECT group_id INTO v_group_id FROM public.prayers WHERE id = COALESCE(NEW.prayer_id, OLD.prayer_id);
    
    IF v_group_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.prayer_group_member_stats (group_id, user_id, prayers_interceded)
            VALUES (v_group_id, NEW.user_id, 1)
            ON CONFLICT (group_id, user_id) DO UPDATE 
            SET prayers_interceded = prayer_group_member_stats.prayers_interceded + 1,
                updated_at = now();
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.prayer_group_member_stats
            SET prayers_interceded = GREATEST(0, prayers_interceded - 1), updated_at = now()
            WHERE group_id = v_group_id AND user_id = OLD.user_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for intercessor stats
DROP TRIGGER IF EXISTS update_group_intercessor_stats_trigger ON public.prayer_intercessors;
CREATE TRIGGER update_group_intercessor_stats_trigger
AFTER INSERT OR DELETE ON public.prayer_intercessors
FOR EACH ROW
EXECUTE FUNCTION public.update_group_intercessor_stats();

-- Function to update scheduled prayer attendance stats
CREATE OR REPLACE FUNCTION public.update_scheduled_attendance_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id UUID;
BEGIN
    -- Get group_id from scheduled prayer
    SELECT group_id INTO v_group_id FROM public.scheduled_prayers WHERE id = COALESCE(NEW.scheduled_prayer_id, OLD.scheduled_prayer_id);
    
    IF v_group_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.prayer_group_member_stats (group_id, user_id, scheduled_prayers_attended)
            VALUES (v_group_id, NEW.user_id, 1)
            ON CONFLICT (group_id, user_id) DO UPDATE 
            SET scheduled_prayers_attended = prayer_group_member_stats.scheduled_prayers_attended + 1,
                updated_at = now();
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.prayer_group_member_stats
            SET scheduled_prayers_attended = GREATEST(0, scheduled_prayers_attended - 1), updated_at = now()
            WHERE group_id = v_group_id AND user_id = OLD.user_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for attendance stats
DROP TRIGGER IF EXISTS update_scheduled_attendance_stats_trigger ON public.scheduled_prayer_attendees;
CREATE TRIGGER update_scheduled_attendance_stats_trigger
AFTER INSERT OR DELETE ON public.scheduled_prayer_attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_scheduled_attendance_stats();

-- Initialize stats for existing groups
INSERT INTO public.prayer_group_stats (group_id, total_prayers, answered_prayers, total_members)
SELECT 
    pg.id,
    COALESCE((SELECT COUNT(*) FROM public.prayers WHERE group_id = pg.id), 0),
    COALESCE((SELECT COUNT(*) FROM public.prayers WHERE group_id = pg.id AND is_answered = true), 0),
    COALESCE(pg.member_count, 0)
FROM public.prayer_groups pg
ON CONFLICT (group_id) DO UPDATE
SET 
    total_prayers = EXCLUDED.total_prayers,
    answered_prayers = EXCLUDED.answered_prayers,
    total_members = EXCLUDED.total_members,
    updated_at = now();

-- Enable realtime for stats tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_group_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_group_member_stats;