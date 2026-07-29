-- ============================================================
-- AUDITORIA 2026-07-29 — Correções de privacidade e integridade
-- ============================================================
-- #3 PII: profiles era legível por ANÔNIMO (expunha birth_date de
--    menores). Fechado para authenticated. Criada função segura
--    username_available() para o cadastro (que roda como anon).
-- #4 Integridade: qualquer logado podia EDITAR bible_studies.
--    Restrito a admin + função increment_study_views para o contador.
-- #5 Integridade: daily_verse_history (global) editável por qualquer
--    logado. Restrito a admin (funções SECURITY DEFINER seguem escrevendo).
-- #6 Endurecimento leve: desafio diário só pode ser semeado para HOJE.
-- ============================================================

-- ---------- #3 profiles: só logados leem ----------
DROP POLICY IF EXISTS allow_public_select ON public.profiles;
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Cadastro roda como anônimo e precisa checar se o username existe.
-- Função segura devolve só true/false, sem expor nenhum dado de perfil.
CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username)
  );
$$;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

-- ---------- #4 bible_studies: edição só admin ----------
DROP POLICY IF EXISTS "Anyone can update study counters" ON public.bible_studies;

CREATE POLICY bible_studies_update_admin
  ON public.bible_studies FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Contador de visualizações via função segura (qualquer um pode somar +1,
-- mas ninguém edita o conteúdo do estudo).
CREATE OR REPLACE FUNCTION public.increment_study_views(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.bible_studies
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_study_views(uuid) TO anon, authenticated;

-- ---------- #5 daily_verse_history: escrita só admin ----------
-- (SELECT segue público; as funções record_daily_verse_* são SECURITY
--  DEFINER e continuam escrevendo normalmente.)
DROP POLICY IF EXISTS "Authenticated users can manage daily verse" ON public.daily_verse_history;

CREATE POLICY daily_verse_history_admin_write
  ON public.daily_verse_history FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------- #6 daily_biblical_challenges: só semear HOJE ----------
DROP POLICY IF EXISTS "Authenticated can seed daily challenge" ON public.daily_biblical_challenges;

CREATE POLICY daily_challenge_seed_today
  ON public.daily_biblical_challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND challenge_date = current_date);

SELECT 'ok' AS status;
