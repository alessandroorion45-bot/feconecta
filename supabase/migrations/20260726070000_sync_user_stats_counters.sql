-- AUDITORIA: os contadores de atividade do user_stats (testimonies_shared,
-- prayers_created, prayers_interceded, events_participated, bible_chapters_read)
-- nunca eram atualizados — ficavam ZERADOS pra todos, mesmo com atividade real
-- nas tabelas-fonte. Isso quebrava silenciosamente:
--   - Desafios social/oração/leitura (progresso lido do user_stats = sempre 0);
--   - Estatísticas do perfil que leem esses contadores.
--
-- Correção: função reutilizável que RECALCULA o contador a partir da fonte real
-- em todo INSERT/DELETE, mantendo o user_stats sincronizado (e disparando as
-- engines de selo/desafio quando muda). + backfill do estado atual.

CREATE OR REPLACE FUNCTION public.sync_user_stat_counter()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := COALESCE(NEW.user_id, OLD.user_id);
  col text := TG_ARGV[0];   -- coluna alvo no user_stats
  src text := TG_ARGV[1];   -- tabela-fonte (conta linhas por user_id)
BEGIN
  IF uid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  EXECUTE format(
    'UPDATE public.user_stats SET %I = (SELECT count(*) FROM public.%I WHERE user_id = $1), updated_at = now() WHERE user_id = $1',
    col, src
  ) USING uid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers de sincronização nas fontes com dados/relevantes
DROP TRIGGER IF EXISTS sync_testimonies_shared ON public.testimonies;
CREATE TRIGGER sync_testimonies_shared AFTER INSERT OR DELETE ON public.testimonies
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_stat_counter('testimonies_shared', 'testimonies');

DROP TRIGGER IF EXISTS sync_prayers_created ON public.prayers;
CREATE TRIGGER sync_prayers_created AFTER INSERT OR DELETE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_stat_counter('prayers_created', 'prayers');

DROP TRIGGER IF EXISTS sync_prayers_interceded ON public.prayer_intercessors;
CREATE TRIGGER sync_prayers_interceded AFTER INSERT OR DELETE ON public.prayer_intercessors
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_stat_counter('prayers_interceded', 'prayer_intercessors');

DROP TRIGGER IF EXISTS sync_events_participated ON public.event_participants;
CREATE TRIGGER sync_events_participated AFTER INSERT OR DELETE ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_stat_counter('events_participated', 'event_participants');

DROP TRIGGER IF EXISTS sync_bible_chapters_read ON public.bible_reading_progress;
CREATE TRIGGER sync_bible_chapters_read AFTER INSERT OR DELETE ON public.bible_reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_stat_counter('bible_chapters_read', 'bible_reading_progress');

-- Backfill do estado atual
UPDATE public.user_stats us SET
  testimonies_shared = (SELECT count(*) FROM public.testimonies WHERE user_id = us.user_id),
  prayers_created = (SELECT count(*) FROM public.prayers WHERE user_id = us.user_id),
  prayers_interceded = (SELECT count(*) FROM public.prayer_intercessors WHERE user_id = us.user_id),
  events_participated = (SELECT count(*) FROM public.event_participants WHERE user_id = us.user_id),
  bible_chapters_read = (SELECT count(*) FROM public.bible_reading_progress WHERE user_id = us.user_id),
  updated_at = now();
