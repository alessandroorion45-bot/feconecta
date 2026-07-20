-- ============================================================
-- FIX CRÍTICO: handle_new_user() nunca criava linha em public.profiles
-- ============================================================
-- Descoberto testando a Experiência Premium de Presentes: o
-- "Agradecer" falhava com violação de FK em notifications.user_id
-- porque o remetente (uma conta recém-criada) não tinha profile.
--
-- Causa raiz: o trigger on_auth_user_created só inseria em
-- public.users (tabela legada) — NUNCA em public.profiles, que é
-- a tabela que praticamente toda a plataforma usa (nome, avatar,
-- username, feed, perfil público, notificações...). Contas novas
-- (email/senha OU Google) ficavam com "Perfil não encontrado no
-- banco de dados" e apareciam como "Alguém" em toda a interface.
--
-- Fix: o trigger agora TAMBÉM insere em public.profiles, gerando
-- um username seguro quando não vem no cadastro (login Google não
-- fornece username). O insert em public.users é mantido intacto.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url, country, preferred_language)
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
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'pt-BR')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill: contas reais que já existiam sem profile (achadas via
-- LEFT JOIN antes deste fix). Contas de teste sintéticas NÃO
-- entram aqui — são removidas manualmente depois do teste.
INSERT INTO public.profiles (id, username, full_name, avatar_url, country, preferred_language)
SELECT
  u.id,
  lower(regexp_replace(
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    '[^a-zA-Z0-9]+', '', 'g'
  )) || '_' || substr(u.id::text, 1, 6),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'country',
  COALESCE(u.raw_user_meta_data->>'preferred_language', 'pt-BR')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email NOT LIKE '%+teste.%'
ON CONFLICT (id) DO NOTHING;

SELECT 'ok' AS status,
  (SELECT count(*) FROM public.profiles) AS profiles_count,
  (SELECT count(*) FROM auth.users) AS auth_users_count;
