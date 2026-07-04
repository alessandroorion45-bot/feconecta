-- =============================================
-- LEITURA COMPARTILHADA — Realtime + intervalo de versículos
-- 1) Ativa Realtime nas tabelas da leitura (sincronização instantânea
--    entre participantes; sem isso o app usa polling de 7s)
-- 2) Colunas de intervalo de versículos (capítulo / versículo / intervalo)
-- =============================================

-- 1. Realtime (idempotente — ignora se a tabela já estiver na publicação)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_rooms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_participants;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_quiz_answers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_reading_reactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 2. Intervalo de versículos (NULL = capítulo completo; start = end = versículo único)
ALTER TABLE public.shared_reading_rooms
  ADD COLUMN IF NOT EXISTS verse_start INTEGER,
  ADD COLUMN IF NOT EXISTS verse_end INTEGER;
