-- ============================================================
-- HARDENING: search_path fixo em TODAS as funções SECURITY DEFINER
-- ============================================================
-- Auditoria de segurança 2026-07-29. Funções SECURITY DEFINER sem
-- search_path fixo são sinalizadas pela própria Supabase ("Function
-- Search Path Mutable") — risco teórico de resolução de nome ser
-- sequestrada. Fixamos search_path = public, extensions em todas.
-- Idempotente: só altera as que ainda não têm search_path.
-- (Aplicado ao vivo em 2026-07-29; arquivo mantido pro histórico.)
-- ============================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, extensions', r.proname, r.args);
  END LOOP;
END $$;
