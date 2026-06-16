-- Add location fields to church_communities table
ALTER TABLE public.church_communities 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add ministry field to church_community_members
ALTER TABLE public.church_community_members 
ADD COLUMN IF NOT EXISTS ministries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS function_title TEXT;

-- Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_church_communities_location ON public.church_communities(country, state, city);
CREATE INDEX IF NOT EXISTS idx_church_communities_geo ON public.church_communities(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;