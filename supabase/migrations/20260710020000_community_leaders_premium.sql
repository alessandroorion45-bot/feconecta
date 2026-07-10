-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 2: Líderes premium + organograma
-- ============================================================
-- church_leaders só tinha name/role/bio/photo_url. A aba "Líderes"
-- premium precisa de ministério, data que assumiu, contatos,
-- versículo favorito, área de atuação e um nível hierárquico pra
-- montar o organograma real (Pastor Presidente > ... > Vice-líderes).
-- ============================================================

ALTER TABLE public.church_leaders
  ADD COLUMN IF NOT EXISTS ministry TEXT,
  ADD COLUMN IF NOT EXISTS assumed_date DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS favorite_verse TEXT,
  ADD COLUMN IF NOT EXISTS area_of_activity TEXT,
  ADD COLUMN IF NOT EXISTS hierarchy_level SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.church_leaders
  DROP CONSTRAINT IF EXISTS church_leaders_hierarchy_level_check;
ALTER TABLE public.church_leaders
  ADD CONSTRAINT church_leaders_hierarchy_level_check CHECK (hierarchy_level BETWEEN 1 AND 6);

CREATE INDEX IF NOT EXISTS idx_church_leaders_community_level
  ON public.church_leaders (community_id, hierarchy_level, display_order);

SELECT 'ok' as status;
