-- ============================================================
-- Selos Kingdom: estende o catálogo público.badges já existente
-- (não cria uma tabela nova — já tinha 4 tabelas de badge/achievement
-- concorrentes nesse banco, essa feature usa a mais completa: a que
-- já alimenta Perfil, Ranking e a aba de Conquistas do Gamification)
-- ============================================================

ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS verse_reference TEXT,
  ADD COLUMN IF NOT EXISTS unlock_story TEXT,
  ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evolution_tier INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS evolution_chain_key TEXT;

-- "early_adopter" já existia com o espírito certo (primeiros usuários,
-- nunca mais volta) — vira o selo-bandeira "Fundador Kingdom" em vez
-- de duplicar o conceito numa linha nova.
UPDATE public.badges SET
  name = 'Fundador Kingdom',
  description = 'Concedido apenas aos primeiros apoiadores do Aliança Kingdom. Este selo nunca mais poderá ser obtido.',
  rarity = 'kingdom_exclusive',
  verse_reference = 'Mateus 6:33',
  unlock_story = 'Antes de qualquer coisa, alguém precisou acreditar. Você esteve aqui desde o início, ajudando a construir algo maior que uma plataforma — uma comunidade.',
  is_exclusive = true
WHERE badge_key = 'early_adopter';

INSERT INTO public.badges (badge_key, name, description, icon, rarity, category, unlock_criteria, xp_reward, verse_reference, unlock_story, evolution_tier, evolution_chain_key)
VALUES
  (
    'semeador_da_palavra', 'Semeador da Palavra',
    'Representa quem ajuda a espalhar o Evangelho através do Aliança Kingdom.',
    '📖', 'epic', 'special', '{"type": "manual"}', 500,
    'Marcos 4:20',
    'Toda semente lançada em boa terra floresce em seu tempo. Cada estudo compartilhado, cada versículo enviado a um amigo, é uma semente que você planta sem saber onde vai florescer.',
    1, 'semeador'
  ),
  (
    'coracao_generoso', 'Coração Generoso',
    'Concedido a quem contribui com uma doação para manter o Aliança Kingdom gratuito para todos.',
    '❤️', 'special', 'donation', '{"type": "manual"}', 300,
    '2 Coríntios 9:7',
    'Você deu não por obrigação, mas com alegria — e é exatamente assim que Deus ama quem dá.',
    1, NULL
  )
ON CONFLICT (badge_key) DO NOTHING;

-- Defensivo: uma migration anterior já removeu o CHECK de notifications.type,
-- mas esse banco já teve objetos sumindo sem motivo aparente (ver memória) —
-- garante de novo antes de inserir um type novo ('badge_earned').
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Concede "Coração Generoso" automaticamente quando uma doação é aprovada
CREATE OR REPLACE FUNCTION public.grant_generous_heart_badge()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.user_id IS NOT NULL THEN
    SELECT id INTO v_badge_id FROM public.badges WHERE badge_key = 'coracao_generoso';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, v_badge_id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;

      INSERT INTO public.notifications (user_id, actor_id, type, content)
      VALUES (NEW.user_id, NEW.user_id, 'badge_earned', 'Você desbloqueou o selo Coração Generoso! 👑');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_donation_approved_grant_badge ON public.donations;
CREATE TRIGGER on_donation_approved_grant_badge
  AFTER UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_generous_heart_badge();

SELECT 'ok' as status;
