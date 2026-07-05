-- =============================================
-- COMUNIDADE: fluxo de entrada inteligente
-- Colunas para participação na igreja, tempo e interesses
-- =============================================

ALTER TABLE public.church_community_members
  ADD COLUMN IF NOT EXISTS time_in_church TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[];
