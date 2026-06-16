-- Remove the existing check constraint to allow all notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;