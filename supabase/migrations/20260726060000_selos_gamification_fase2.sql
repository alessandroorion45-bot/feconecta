-- GAMIFICAÇÃO DOS SELOS — Fase 2
-- A engine dependia de contadores em user_stats (bible_chapters_read,
-- prayers_interceded, testimonies_shared...) que estavam ZERADOS pra todos
-- (nunca alimentados). Reescrevemos o ramo action_count pra CONTAR direto das
-- tabelas-fonte reais. A engine dispara em todo UPDATE de user_stats (e quase
-- toda ação gamificada dá XP -> atualiza user_stats), então re-avalia sozinha.
--
-- Fontes verificadas (têm dados):
--   testimony_shared  -> count(testimonies)
--   daily_devotional  -> count(devotional_completions)
--   prayer_interceded -> count(prayer_intercessors)
--   quiz_completed    -> max(quiz_scores.total_answered)
--   bible_study       -> count(bible_reading_progress)  (hoje 0; funciona quando a leitura for logada)
CREATE OR REPLACE FUNCTION public.check_and_award_kingdom_badges()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  current_value INTEGER;
  crit_type TEXT;
  crit_action TEXT;
  crit_value INTEGER;
BEGIN
  FOR badge_record IN
    SELECT * FROM public.badges WHERE automatico = true AND status = 'active'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_badges WHERE user_id = NEW.user_id AND badge_id = badge_record.id
    ) THEN
      crit_type := badge_record.unlock_criteria->>'type';
      crit_action := badge_record.unlock_criteria->>'action';
      crit_value := NULLIF(badge_record.unlock_criteria->>'value', '')::INTEGER;
      current_value := NULL;

      IF crit_type = 'total_xp' THEN
        current_value := NEW.total_points;
      ELSIF crit_type IN ('streak', 'streak_action') THEN
        current_value := NEW.current_streak;
      ELSIF crit_type = 'action_count' THEN
        current_value := CASE crit_action
          WHEN 'testimony_shared'  THEN (SELECT count(*)::int FROM public.testimonies WHERE user_id = NEW.user_id)
          WHEN 'daily_devotional'  THEN (SELECT count(*)::int FROM public.devotional_completions WHERE user_id = NEW.user_id)
          WHEN 'prayer_interceded' THEN (SELECT count(*)::int FROM public.prayer_intercessors WHERE user_id = NEW.user_id)
          WHEN 'quiz_completed'    THEN (SELECT coalesce(max(total_answered),0)::int FROM public.quiz_scores WHERE user_id = NEW.user_id)
          WHEN 'bible_study'       THEN (SELECT count(*)::int FROM public.bible_reading_progress WHERE user_id = NEW.user_id)
          ELSE NULL
        END;
      END IF;

      IF current_value IS NOT NULL AND crit_value IS NOT NULL AND current_value >= crit_value THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, badge_record.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;

        INSERT INTO public.notifications (user_id, actor_id, type, content)
        VALUES (NEW.user_id, NEW.user_id, 'badge_earned', 'Você desbloqueou o selo "' || badge_record.name || '"! 👑');
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Liga os selos cujas fontes têm dados reais (mantém total_xp/streak da Fase 1).
update public.badges
set automatico = true
where status = 'active'
  and unlock_criteria->>'type' = 'action_count'
  and unlock_criteria->>'action' in ('testimony_shared','daily_devotional','prayer_interceded','quiz_completed');
