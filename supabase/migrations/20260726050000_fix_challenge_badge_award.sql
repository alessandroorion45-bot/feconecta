-- BUG CRÍTICO: update_challenge_progress() (trigger AFTER UPDATE em user_stats)
-- concedia selo usando o ESQUEMA ANTIGO de user_badges
-- (badge_type/badge_name/badge_icon/badge_color). A tabela hoje usa badge_id
-- (FK -> badges). Resultado: sempre que um usuário CRUZAVA o requisito de um
-- desafio, o UPDATE de user_stats FALHAVA ("column badge_name does not exist"),
-- revertendo tudo — o usuário perdia XP e não ganhava o selo. Isso travava a
-- gamificação inteira (qualquer update que cruzasse um desafio quebrava).
--
-- Correção: concede via badge_id, mapeando o badge_reward (key/slug/nome) pro
-- selo real. Se não achar selo correspondente, apenas não concede (sem erro).
-- Resto da função (progresso do desafio) preservado.
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  challenge_record RECORD;
  progress_value INTEGER;
BEGIN
  FOR challenge_record IN
    SELECT c.*, uc.id as user_challenge_id, uc.current_progress
    FROM challenges c
    LEFT JOIN user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = NEW.user_id
    WHERE c.is_active = true
    AND now() BETWEEN c.start_date AND c.end_date
    AND (uc.is_completed IS NULL OR uc.is_completed = false)
  LOOP
    CASE challenge_record.challenge_type
      WHEN 'bible_read' THEN
        SELECT bible_chapters_read INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'prayer' THEN
        SELECT prayers_created + prayers_interceded INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'streak' THEN
        SELECT current_streak INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      WHEN 'social' THEN
        SELECT testimonies_shared + events_participated INTO progress_value FROM user_stats WHERE user_id = NEW.user_id;
      ELSE
        progress_value := 0;
    END CASE;

    IF challenge_record.user_challenge_id IS NULL THEN
      INSERT INTO user_challenges (user_id, challenge_id, current_progress)
      VALUES (NEW.user_id, challenge_record.id, progress_value);
    ELSE
      UPDATE user_challenges
      SET
        current_progress = progress_value,
        is_completed = (progress_value >= challenge_record.requirement_value),
        completed_at = CASE
          WHEN progress_value >= challenge_record.requirement_value THEN now()
          ELSE completed_at
        END
      WHERE id = challenge_record.user_challenge_id;

      IF progress_value >= challenge_record.requirement_value
         AND challenge_record.badge_reward IS NOT NULL THEN
        -- Concede o selo do desafio via badge_id (esquema atual).
        INSERT INTO user_badges (user_id, badge_id)
        SELECT NEW.user_id, b.id
        FROM badges b
        WHERE b.badge_key = challenge_record.badge_reward
           OR b.slug = challenge_record.badge_reward
           OR b.name = challenge_record.badge_reward
        LIMIT 1
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
