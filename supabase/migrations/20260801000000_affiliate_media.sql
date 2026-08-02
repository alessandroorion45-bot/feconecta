-- ============================================================
-- Achados: múltiplas mídias (carrossel) + vídeo + formato (9:16 / 16:9)
-- ============================================================

ALTER TABLE public.affiliate_products
  ADD COLUMN IF NOT EXISTS media  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS aspect text  NOT NULL DEFAULT '9:16';

ALTER TABLE public.affiliate_products DROP CONSTRAINT IF EXISTS affiliate_aspect_chk;
ALTER TABLE public.affiliate_products
  ADD CONSTRAINT affiliate_aspect_chk CHECK (aspect IN ('9:16', '16:9'));

-- Backfill: transforma a image_url existente na 1ª mídia do carrossel
UPDATE public.affiliate_products
  SET media = jsonb_build_array(jsonb_build_object('type', 'image', 'url', image_url))
  WHERE image_url IS NOT NULL AND (media IS NULL OR media = '[]'::jsonb);

SELECT 'ok' AS status;
