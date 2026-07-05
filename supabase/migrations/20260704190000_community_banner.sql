-- =============================================
-- PAINEL DA COMUNIDADE: capa 16:9 e versículo principal
-- =============================================

ALTER TABLE public.church_communities
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS main_verse TEXT;
