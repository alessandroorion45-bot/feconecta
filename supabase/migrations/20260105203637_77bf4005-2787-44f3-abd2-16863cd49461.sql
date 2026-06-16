-- Add country, language and birth_date columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'pt',
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create index for country-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- Add country column to events for event prioritization
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS country TEXT;

-- Create index for events country
CREATE INDEX IF NOT EXISTS idx_events_country ON public.events(country);

-- Update handle_new_user function to include country and birth_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url, country, preferred_language, birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Membro'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'pt'),
    (NEW.raw_user_meta_data->>'birth_date')::date
  );
  RETURN NEW;
END;
$$;