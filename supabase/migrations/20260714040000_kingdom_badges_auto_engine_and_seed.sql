-- ============================================================
-- Selos Kingdom: motor de desbloqueio automático + os 9 selos
-- restantes da lista original (sem imagem — ficam pro admin
-- subir a arte pelo painel depois)
-- ============================================================

-- 1. Motor genérico: roda a cada atualização de user_stats e concede
-- automaticamente qualquer selo com automatico=true cujo critério bata.
-- Cobre os tipos mais comuns (total_xp, streak, action_count com ação
-- conhecida). Critérios não reconhecidos ficam só pra concessão manual
-- no painel — não há como isso ser 100% genérico sem mapear cada ação
-- possível do app, então documentamos exatamente o que é suportado.
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
          WHEN 'bible_study' THEN NEW.bible_chapters_read
          WHEN 'daily_devotional' THEN NEW.bible_chapters_read
          WHEN 'prayer_interceded' THEN NEW.prayers_interceded
          WHEN 'testimony_shared' THEN NEW.testimonies_shared
          WHEN 'event_participation' THEN NEW.events_participated
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

DROP TRIGGER IF EXISTS on_check_kingdom_badges ON public.user_stats;
CREATE TRIGGER on_check_kingdom_badges
  AFTER UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.check_and_award_kingdom_badges();

-- 2. Os 9 selos restantes da lista original — sem image_url (o admin
-- sobe a arte depois pelo painel /admin/badges).
INSERT INTO public.badges (badge_key, name, description, icon, rarity, category, unlock_criteria, xp_reward, verse_reference, unlock_story, status, automatico)
VALUES
  ('embaixador_do_reino', 'Embaixador do Reino',
   'Representa quem leva a mensagem do Reino com dignidade e amor, como um verdadeiro representante de Cristo.',
   '🕊️', 'legendary', 'Liderança', '{"type": "manual"}', 800,
   '2 Coríntios 5:20',
   'Um embaixador não fala por si — fala em nome de quem o enviou. Você carrega essa responsabilidade com honra.',
   'active', false),

  ('missionario_digital', 'Missionário Digital',
   'Concedido a quem usa a tecnologia para levar o Evangelho além das fronteiras.',
   '🌍', 'epic', 'Evangelismo', '{"type": "manual"}', 600,
   'Marcos 16:15',
   'O campo missionário de hoje também é digital — cada compartilhamento é uma porta que se abre em algum lugar do mundo.',
   'active', false),

  ('luz_do_mundo', 'Luz do Mundo',
   'Baseado em Mateus 5 — para quem vive de forma a iluminar o caminho de outros.',
   '✨', 'rare', 'Especiais', '{"type": "manual"}', 300,
   'Mateus 5:14',
   '"Vós sois a luz do mundo." Uma cidade edificada sobre um monte não se pode esconder — nem você.',
   'active', false),

  ('servo_fiel', 'Servo Fiel',
   'Reconhece a dedicação constante e discreta de quem serve sem esperar reconhecimento.',
   '🔥', 'rare', 'Comunidade', '{"type": "manual"}', 300,
   'Mateus 25:21',
   '"Muito bem, servo bom e fiel." A fidelidade no pequeno é o que constrói o grande.',
   'active', false),

  ('construtor_do_reino', 'Construtor do Reino',
   'Concedido a quem ajuda ativamente a edificar a comunidade Aliança Kingdom.',
   '🏛️', 'epic', 'Liderança', '{"type": "manual"}', 600,
   'Mateus 16:18',
   '"Sobre esta pedra edificarei a minha igreja." Toda construção começa com alguém disposto a colocar o primeiro tijolo.',
   'active', false),

  ('guardiao_da_comunhao', 'Guardião da Comunhão',
   'Para quem zela pela unidade e pela paz dentro da comunidade.',
   '🛡️', 'rare', 'Comunidade', '{"type": "manual"}', 300,
   'Atos 2:42',
   'A igreja primitiva perseverava na comunhão — você ajuda a manter viva essa mesma tradição aqui.',
   'active', false),

  ('coluna_da_igreja', 'Coluna da Igreja',
   'Reconhece quem sustenta e fortalece a comunidade com constância e exemplo.',
   '⭐', 'legendary', 'Liderança', '{"type": "manual"}', 800,
   'Gálatas 2:9',
   'Toda estrutura precisa de colunas — pessoas firmes que sustentam o que é construído ao redor delas.',
   'active', false),

  ('parceiro_kingdom', 'Parceiro Kingdom',
   'Representa quem mantém a plataforma funcionando através de apoio contínuo.',
   '👑', 'epic', 'Doações', '{"type": "manual"}', 600,
   'Filipenses 4:15',
   'Uma parceria de verdade se prova com o tempo, não com um único gesto.',
   'active', false),

  ('pioneiro', 'Pioneiro',
   'Concedido apenas aos primeiros usuários cadastrados na plataforma. Este selo nunca mais poderá ser obtido.',
   '💎', 'exclusive', 'Especiais', '{"type": "manual"}', 1000,
   'Josué 1:9',
   'Antes de qualquer trilha existir, alguém precisa dar o primeiro passo. Você foi um dos primeiros a chegar.',
   'active', false)
ON CONFLICT (badge_key) DO NOTHING;

UPDATE public.badges SET is_exclusive = true WHERE badge_key = 'pioneiro';

SELECT 'ok' as status;
