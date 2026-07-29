-- ============================================================
-- SEGURANÇA DO PAINEL ADMIN: PIN do cofre + alerta de novo aparelho
-- ============================================================
-- Segunda senha (PIN) exigida ao entrar no /admin, ALÉM do login.
-- Guardada só como hash bcrypt (pgcrypto), nunca em texto. Bloqueia
-- após 5 erros por 15 min. E avisa (push) quando o painel é acessado
-- de um aparelho novo.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- PINs (hash) por admin — schema privado, inacessível a anon/authenticated
CREATE TABLE IF NOT EXISTS private.admin_pins (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash        text NOT NULL,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  updated_at      timestamptz DEFAULT now()
);
REVOKE ALL ON private.admin_pins FROM anon, authenticated, public;

-- Aparelhos já conhecidos (pra alertar quando for NOVO)
CREATE TABLE IF NOT EXISTS private.admin_known_devices (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  first_seen   timestamptz DEFAULT now(),
  last_seen    timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, device_token)
);
REVOKE ALL ON private.admin_known_devices FROM anon, authenticated, public;

-- Status do PIN (o front decide: criar ou digitar)
CREATE OR REPLACE FUNCTION public.admin_pin_status()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE r private.admin_pins;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_admin'; END IF;
  SELECT * INTO r FROM private.admin_pins WHERE user_id = auth.uid();
  RETURN jsonb_build_object(
    'has_pin', r.user_id IS NOT NULL,
    'locked', (r.locked_until IS NOT NULL AND r.locked_until > now()),
    'locked_until', r.locked_until
  );
END;
$$;

-- Cria ou troca o PIN. Pra trocar, exige o PIN atual.
CREATE OR REPLACE FUNCTION public.set_admin_pin(p_pin text, p_current text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE r private.admin_pins;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_admin'; END IF;
  IF length(coalesce(p_pin,'')) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'O PIN precisa ter pelo menos 4 dígitos.');
  END IF;

  SELECT * INTO r FROM private.admin_pins WHERE user_id = auth.uid();

  IF r.user_id IS NOT NULL THEN
    -- já existe: precisa validar o atual pra trocar
    IF p_current IS NULL OR r.pin_hash <> crypt(p_current, r.pin_hash) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'PIN atual incorreto.');
    END IF;
  END IF;

  INSERT INTO private.admin_pins (user_id, pin_hash, failed_attempts, locked_until, updated_at)
  VALUES (auth.uid(), crypt(p_pin, gen_salt('bf', 10)), 0, NULL, now())
  ON CONFLICT (user_id) DO UPDATE SET
    pin_hash = EXCLUDED.pin_hash, failed_attempts = 0, locked_until = NULL, updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Verifica o PIN (com rate-limit) e registra o aparelho; alerta se for novo.
CREATE OR REPLACE FUNCTION public.verify_admin_pin(p_pin text, p_device text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  r private.admin_pins;
  v_new_device boolean := false;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not_admin'; END IF;
  SELECT * INTO r FROM private.admin_pins WHERE user_id = auth.uid();

  IF r.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_pin');
  END IF;

  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'locked', true, 'locked_until', r.locked_until);
  END IF;

  IF r.pin_hash = crypt(p_pin, r.pin_hash) THEN
    UPDATE private.admin_pins SET failed_attempts = 0, locked_until = NULL WHERE user_id = auth.uid();

    -- registra aparelho / detecta se é novo
    IF p_device IS NOT NULL AND length(p_device) >= 8 THEN
      IF EXISTS (SELECT 1 FROM private.admin_known_devices WHERE user_id = auth.uid() AND device_token = p_device) THEN
        UPDATE private.admin_known_devices SET last_seen = now()
          WHERE user_id = auth.uid() AND device_token = p_device;
      ELSE
        v_new_device := true;
        INSERT INTO private.admin_known_devices (user_id, device_token) VALUES (auth.uid(), p_device)
          ON CONFLICT DO NOTHING;
        -- Alerta (vira push): só quando o aparelho é NOVO
        INSERT INTO public.notifications (user_id, type, content)
        VALUES (auth.uid(), 'admin_access',
          '🔐 Painel admin acessado de um novo aparelho em ' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI') || '. Se não foi você, troque sua senha agora.');
      END IF;
    END IF;

    RETURN jsonb_build_object('ok', true, 'new_device', v_new_device);
  ELSE
    -- erro: incrementa e bloqueia após 5
    UPDATE private.admin_pins
      SET failed_attempts = failed_attempts + 1,
          locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
      WHERE user_id = auth.uid();
    SELECT * INTO r FROM private.admin_pins WHERE user_id = auth.uid();
    RETURN jsonb_build_object('ok', false,
      'remaining', GREATEST(0, 5 - r.failed_attempts),
      'locked', (r.locked_until IS NOT NULL AND r.locked_until > now()),
      'locked_until', r.locked_until);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_pin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_pin(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(text, text) TO authenticated;

SELECT 'ok' AS status;
