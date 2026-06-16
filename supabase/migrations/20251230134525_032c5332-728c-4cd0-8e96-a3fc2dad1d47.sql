-- Add profile_quote column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_quote text DEFAULT 'A fé é o caminho que ilumina minha jornada';