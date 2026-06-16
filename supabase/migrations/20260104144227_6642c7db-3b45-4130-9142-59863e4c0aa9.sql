-- Add invite code to prayer_groups
ALTER TABLE public.prayer_groups 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8);

-- Create scheduled_prayers table for group prayer schedules
CREATE TABLE IF NOT EXISTS public.scheduled_prayers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.prayer_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_minutes INTEGER DEFAULT 15,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track who confirmed attendance
CREATE TABLE IF NOT EXISTS public.scheduled_prayer_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_prayer_id UUID NOT NULL REFERENCES public.scheduled_prayers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(scheduled_prayer_id, user_id)
);

-- Enable RLS
ALTER TABLE public.scheduled_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_prayer_attendees ENABLE ROW LEVEL SECURITY;

-- Scheduled prayers policies
CREATE POLICY "Group members can view scheduled prayers" 
ON public.scheduled_prayers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.prayer_group_members 
  WHERE group_id = scheduled_prayers.group_id AND user_id = auth.uid()
));

CREATE POLICY "Group members can create scheduled prayers" 
ON public.scheduled_prayers FOR INSERT 
WITH CHECK (auth.uid() = created_by AND EXISTS (
  SELECT 1 FROM public.prayer_group_members 
  WHERE group_id = scheduled_prayers.group_id AND user_id = auth.uid()
));

CREATE POLICY "Creators can update scheduled prayers" 
ON public.scheduled_prayers FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete scheduled prayers" 
ON public.scheduled_prayers FOR DELETE 
USING (auth.uid() = created_by);

-- Attendees policies
CREATE POLICY "Anyone can view attendees" 
ON public.scheduled_prayer_attendees FOR SELECT 
USING (true);

CREATE POLICY "Users can confirm attendance" 
ON public.scheduled_prayer_attendees FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel attendance" 
ON public.scheduled_prayer_attendees FOR DELETE 
USING (auth.uid() = user_id);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for invite code
DROP TRIGGER IF EXISTS generate_invite_code_trigger ON public.prayer_groups;
CREATE TRIGGER generate_invite_code_trigger
BEFORE INSERT ON public.prayer_groups
FOR EACH ROW EXECUTE FUNCTION public.generate_group_invite_code();

-- Update existing groups with invite codes
UPDATE public.prayer_groups 
SET invite_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE invite_code IS NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_prayers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_prayer_attendees;