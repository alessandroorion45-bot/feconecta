-- Migration to fix language for users with country VE who have incorrect preferred_language
-- This updates users who have Venezuela as country but pt (Portuguese) as language

UPDATE public.profiles
SET preferred_language = 'es'
WHERE country = 'VE' 
  AND (preferred_language = 'pt' OR preferred_language IS NULL);

-- Also fix any other Spanish-speaking countries that might have wrong language
UPDATE public.profiles
SET preferred_language = 'es'
WHERE country IN ('AR', 'CL', 'CO', 'PE', 'BO', 'PY', 'UY', 'EC')
  AND (preferred_language = 'pt' OR preferred_language IS NULL);

-- Fix Guyana (English)
UPDATE public.profiles
SET preferred_language = 'en'
WHERE country = 'GY'
  AND (preferred_language = 'pt' OR preferred_language IS NULL);

-- Fix Suriname (Dutch)
UPDATE public.profiles
SET preferred_language = 'nl'
WHERE country = 'SR'
  AND (preferred_language = 'pt' OR preferred_language IS NULL);