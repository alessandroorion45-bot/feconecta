-- Add set_language_manually column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS set_language_manually BOOLEAN DEFAULT false;

-- Create index for faster language queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);

-- Fix existing users with wrong language based on their country
-- Users from Spanish-speaking countries should have 'es'
UPDATE public.profiles 
SET preferred_language = 'es', set_language_manually = false
WHERE country IN ('VE', 'AR', 'CL', 'CO', 'PE', 'BO', 'PY', 'UY', 'EC')
  AND (preferred_language IS NULL OR preferred_language != 'es')
  AND (set_language_manually IS NULL OR set_language_manually = false);

-- Users from Brazil should have 'pt'
UPDATE public.profiles 
SET preferred_language = 'pt', set_language_manually = false
WHERE country = 'BR'
  AND (preferred_language IS NULL OR preferred_language != 'pt')
  AND (set_language_manually IS NULL OR set_language_manually = false);

-- Users from Guyana should have 'en'
UPDATE public.profiles 
SET preferred_language = 'en', set_language_manually = false
WHERE country = 'GY'
  AND (preferred_language IS NULL OR preferred_language != 'en')
  AND (set_language_manually IS NULL OR set_language_manually = false);

-- Users from Suriname should have 'nl'
UPDATE public.profiles 
SET preferred_language = 'nl', set_language_manually = false
WHERE country = 'SR'
  AND (preferred_language IS NULL OR preferred_language != 'nl')
  AND (set_language_manually IS NULL OR set_language_manually = false);