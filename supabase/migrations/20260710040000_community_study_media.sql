-- ============================================================
-- COMUNIDADE DA IGREJA — FASE 4: Estudo da Semana estruturado
-- ============================================================
-- A "Palavra da Semana" (community_posts.type = 'word_of_week') já
-- existe e já fica fixada no topo do mural. Só faltava suporte a
-- mídia: PDF, imagem, vídeo, áudio, link do YouTube e anexos.
-- ============================================================

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

SELECT 'ok' as status;
