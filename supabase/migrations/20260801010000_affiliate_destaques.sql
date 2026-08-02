-- ============================================================
-- Achados: "destaques" curtos (etiquetas escaneáveis no card)
-- substituem o parágrafo longo + o nome cru do marketplace.
-- ============================================================

ALTER TABLE public.affiliate_products
  ADD COLUMN IF NOT EXISTS destaques text[] NOT NULL DEFAULT '{}';

SELECT 'ok' AS status;
