-- ============================================================
-- RECOMPENSA DE CONVITE (motor viral)
-- ============================================================
-- Quando alguém traz N amigos (profiles.referred_by), desbloqueia
-- um tema de graça. Protege os temas mais caros (Diamante R$25,
-- Dark Royal R$40) — só compra. Thresholds:
--   3 convites  -> Tema Clássico        (R$5)
--   7 convites  -> Tema Reino Celestial (R$12)
--  15 convites  -> Tema Trono da Glória (R$15)
-- Idempotente: nunca desbloqueia/notifica duas vezes o mesmo tema.
-- ============================================================

-- Contagem de convites do usuário logado (pra UI). SECURITY DEFINER
-- pra não depender da RLS de profiles.
CREATE OR REPLACE FUNCTION public.get_my_referral_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.profiles WHERE referred_by = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_count() TO authenticated;

-- Concede as recompensas atingidas ao convidador.
CREATE OR REPLACE FUNCTION public.award_referral_rewards(p_referrer uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_reward record;
  v_already boolean;
BEGIN
  IF p_referrer IS NULL THEN RETURN; END IF;

  SELECT count(*) INTO v_count FROM public.profiles WHERE referred_by = p_referrer;

  FOR v_reward IN
    SELECT * FROM (VALUES
      (3,  'classico'),
      (7,  'reino-celestial'),
      (15, 'trono-gloria')
    ) AS t(threshold, theme_key)
  LOOP
    IF v_count >= v_reward.threshold THEN
      SELECT EXISTS(
        SELECT 1 FROM public.user_themes
        WHERE user_id = p_referrer AND theme_key = v_reward.theme_key AND is_unlocked
      ) INTO v_already;

      IF NOT v_already THEN
        INSERT INTO public.user_themes (user_id, theme_key, is_unlocked, unlocked_at)
        VALUES (p_referrer, v_reward.theme_key, true, now())
        ON CONFLICT (user_id, theme_key) DO UPDATE SET is_unlocked = true, unlocked_at = now();

        INSERT INTO public.notifications (user_id, type, content)
        VALUES (
          p_referrer,
          'referral_reward',
          'Parabéns! Você já convidou ' || v_reward.threshold || ' pessoas e desbloqueou um tema novo de presente. 🎉 Ative em Personalizar Aparência.'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Dispara a avaliação quando um novo perfil chega com convidador.
CREATE OR REPLACE FUNCTION public.trg_award_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    PERFORM public.award_referral_rewards(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_award_referral ON public.profiles;
CREATE TRIGGER trg_profiles_award_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_award_referral();

-- Também reavalia quando referred_by é preenchido depois (caso Google,
-- que define referred_by no CountrySelectionModal via UPDATE).
DROP TRIGGER IF EXISTS trg_profiles_award_referral_upd ON public.profiles;
CREATE TRIGGER trg_profiles_award_referral_upd
  AFTER UPDATE OF referred_by ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL AND NEW.referred_by IS DISTINCT FROM OLD.referred_by)
  EXECUTE FUNCTION public.trg_award_referral();

SELECT 'ok' AS status;
