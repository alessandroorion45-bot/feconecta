-- Create table for friend testimonials with approval system
CREATE TABLE public.friend_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT friend_testimonials_different_users CHECK (author_id != recipient_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_friend_testimonials_recipient_id ON public.friend_testimonials(recipient_id);
CREATE INDEX idx_friend_testimonials_author_id ON public.friend_testimonials(author_id);
CREATE INDEX idx_friend_testimonials_status ON public.friend_testimonials(status);

-- Enable Row Level Security
ALTER TABLE public.friend_testimonials ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved testimonials
CREATE POLICY "Approved testimonials are visible to everyone"
ON public.friend_testimonials
FOR SELECT
USING (status = 'approved');

-- Policy: Recipients can view all testimonials sent to them (including pending)
CREATE POLICY "Recipients can view all their testimonials"
ON public.friend_testimonials
FOR SELECT
USING (auth.uid() = recipient_id);

-- Policy: Authors can view their own testimonials
CREATE POLICY "Authors can view their own testimonials"
ON public.friend_testimonials
FOR SELECT
USING (auth.uid() = author_id);

-- Policy: Only friends can create testimonials
CREATE POLICY "Friends can create testimonials"
ON public.friend_testimonials
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM friendships
    WHERE (
      (friendships.user_id_1 = auth.uid() AND friendships.user_id_2 = recipient_id)
      OR (friendships.user_id_2 = auth.uid() AND friendships.user_id_1 = recipient_id)
    )
  )
);

-- Policy: Recipients can update testimonials (to approve/reject)
CREATE POLICY "Recipients can update testimonial status"
ON public.friend_testimonials
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Policy: Authors can delete their own testimonials
CREATE POLICY "Authors can delete their own testimonials"
ON public.friend_testimonials
FOR DELETE
USING (auth.uid() = author_id);

-- Policy: Recipients can delete testimonials on their profile
CREATE POLICY "Recipients can delete testimonials"
ON public.friend_testimonials
FOR DELETE
USING (auth.uid() = recipient_id);

-- Create trigger for updated_at
CREATE TRIGGER update_friend_testimonials_updated_at
BEFORE UPDATE ON public.friend_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification trigger for new testimonials
CREATE OR REPLACE FUNCTION public.notify_new_testimonial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
  VALUES (
    NEW.recipient_id,
    NEW.author_id,
    'friend_testimonial',
    'escreveu um depoimento sobre você! Aguardando sua aprovação ✨',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_testimonial
AFTER INSERT ON public.friend_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_testimonial();

-- Create notification trigger for testimonial approval/rejection
CREATE OR REPLACE FUNCTION public.notify_testimonial_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      NEW.author_id,
      NEW.recipient_id,
      'testimonial_approved',
      'aprovou seu depoimento! 🎉',
      NEW.id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, actor_id, type, content, reference_id)
    VALUES (
      NEW.author_id,
      NEW.recipient_id,
      'testimonial_rejected',
      'não aprovou seu depoimento',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_testimonial_status_change
AFTER UPDATE ON public.friend_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.notify_testimonial_status();