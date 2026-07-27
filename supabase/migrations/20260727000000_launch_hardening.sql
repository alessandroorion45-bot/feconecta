-- ============================================================
-- LANÇAMENTO: endurecimento pré-divulgação
-- ============================================================
-- 1) Colunas novas em profiles:
--    - terms_accepted_at: quando o usuário aceitou Termos + Privacidade (LGPD)
--    - referred_by: quem convidou este usuário (sistema de convite)
-- 2) handle_new_user() passa a COPIAR birth_date, terms e referred_by
--    do metadata do cadastro pro profile (antes birth_date só ficava
--    no auth.raw_user_meta_data e nunca chegava em profiles).
-- 3) Trava de idade NO SERVIDOR: enforce_profile_min_age() bloqueia
--    profile com idade abaixo do mínimo do país. Fecha a brecha de
--    quem burla a validação do navegador (inclui login Google).
-- ============================================================

-- 1) COLUNAS NOVAS ------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- 2) IDADE MÍNIMA POR PAÍS (espelha o front em LanguageContext) ---------
CREATE OR REPLACE FUNCTION public.min_age_for_country(p_country text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE upper(coalesce(p_country, ''))
    WHEN 'CL' THEN 14   -- Chile
    WHEN 'CO' THEN 14   -- Colômbia
    WHEN 'PE' THEN 14   -- Peru
    WHEN 'SR' THEN 16   -- Suriname
    ELSE 13             -- Brasil e demais (padrão)
  END;
$$;

-- 3) TRAVA DE IDADE NO SERVIDOR ----------------------------------------
-- Só valida quando birth_date E country estão presentes. Em UPDATE, só
-- reavalia se a data de nascimento realmente mudou — nunca bloqueia uma
-- edição de perfil comum (trocar avatar, bio, etc.).
CREATE OR REPLACE FUNCTION public.enforce_profile_min_age()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_age integer;
  v_min integer;
BEGIN
  IF NEW.birth_date IS NULL OR NEW.country IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.birth_date IS NOT DISTINCT FROM OLD.birth_date THEN
    RETURN NEW; -- data de nascimento não mudou: não reavalia
  END IF;

  v_age := date_part('year', age(current_date, NEW.birth_date::date));
  v_min := public.min_age_for_country(NEW.country);

  IF v_age < v_min THEN
    RAISE EXCEPTION 'Idade mínima não atingida: % anos (mínimo % para %)', v_age, v_min, NEW.country
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_min_age ON public.profiles;
CREATE TRIGGER trg_enforce_profile_min_age
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_min_age();

-- 4) handle_new_user(): copia birth_date / terms / referred_by ---------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_birth_date date;
  v_referred_by uuid;
  v_terms_at timestamptz;
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  -- Parse seguro dos campos opcionais vindos do cadastro
  BEGIN
    v_birth_date := NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date;
  EXCEPTION WHEN others THEN v_birth_date := NULL;
  END;

  BEGIN
    v_referred_by := NULLIF(NEW.raw_user_meta_data->>'referred_by', '')::uuid;
  EXCEPTION WHEN others THEN v_referred_by := NULL;
  END;

  -- Não deixa alguém se auto-convidar
  IF v_referred_by = NEW.id THEN
    v_referred_by := NULL;
  END IF;

  IF COALESCE(NEW.raw_user_meta_data->>'terms_accepted', 'false') = 'true' THEN
    v_terms_at := now();
  END IF;

  INSERT INTO public.profiles (id, username, full_name, avatar_url, country, preferred_language, birth_date, referred_by, terms_accepted_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      lower(regexp_replace(
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        '[^a-zA-Z0-9]+', '', 'g'
      )) || '_' || substr(NEW.id::text, 1, 6)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'pt-BR'),
    v_birth_date,
    v_referred_by,
    v_terms_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

SELECT 'ok' AS status,
  (SELECT count(*) FROM public.profiles WHERE terms_accepted_at IS NOT NULL) AS com_termos,
  (SELECT count(*) FROM public.profiles) AS total_profiles;
