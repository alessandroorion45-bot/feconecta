-- ============================================================
-- LIMPEZA (não crítico): admin_transfer_votes/admin_transfer_votings
-- já estão protegidas por RLS real (aplicada em 04/07, confirmado
-- via pg_class.relrowsecurity = true + políticas presentes). O role
-- "anon" não consegue ler/escrever nada nelas na prática porque as
-- políticas usam auth.uid(), que é NULL para visitantes.
--
-- Mesmo assim, revoga o GRANT bruto de "anon" por defesa em
-- profundidade — não deveria ter a permissão de tabela mesmo que a
-- RLS já bloqueie, caso a RLS seja desativada por engano no futuro.
-- Idempotente: seguro rodar mais de uma vez.
-- ============================================================

REVOKE ALL ON public.admin_transfer_votes FROM anon, PUBLIC;
REVOKE ALL ON public.admin_transfer_votings FROM anon, PUBLIC;

SELECT 'ok' as status;
