-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 1: endereço inteligente + Google Maps
-- ============================================================
-- church_communities só tinha um campo "address" de texto livre
-- (sem CEP, rua e número separados) e nenhum campo pra link do
-- Google Maps. Isso trava a integração com ViaCEP/IBGE no frontend
-- e o botão "Ver localização" / mini-mapa incorporado.
-- ============================================================

ALTER TABLE public.church_communities
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS maps_link TEXT;

SELECT 'ok' as status;
